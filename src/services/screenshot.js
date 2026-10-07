/**
 * Screenshot capture for ContentVuer panes and the whole split view.
 *
 * Most viewers render into WebGL canvases without `preserveDrawingBuffer`,
 * so a plain DOM-to-image capture would produce blank maps.
 * Each viewer therefore provides `getScreenshotSources(pixelRatio)`
 * which re-renders its canvas and reads it back in the same tick.
 * The resulting images are temporarily overlaid on top of the canvases
 * before the DOM is rasterised with html-to-image.
 */

export const SCREENSHOT_SCALES = [1, 2, 3, 4];

/**
 * How legend panels are handled:
 * - `exclude`: hide them (default)
 * - `include`: keep them as they appear on screen
 * - `only`: capture only the legend panels, each as a separate image
 */
export const SCREENSHOT_LEGEND_MODES = ['exclude', 'include', 'only'];

// Legend/checkbox panels drawn over the viewers. `wrapper` is the whole
// panel including its drawer button, `content` is what `only` captures.
const LEGEND_PANELS = [
  // flatmapvuer
  { wrapper: '.pathway-location', content: '.pathway-container' },
  // scaffoldvuer
  { wrapper: '.tree-controls', content: '.tree-controls-container' },
];

export const SCREENSHOT_LEGEND_SELECTORS = LEGEND_PANELS.map((panel) => panel.wrapper);

// UI controls that should not appear in the screenshot.
export const SCREENSHOT_HIDE_SELECTORS = [
  '[data-screenshot-ignore]',
  // ContentBar header of each pane
  '.content-container > .toolbar',
  // flatmapvuer
  '.bottom-right-control',
  '.settings-group',
  '.beta-popovers',
  '.drawer-button',
  '.minimap-resize',
  '.maplibregl-ctrl-minimap',
  // scaffoldvuer
  '.control-layer',
  // map-side-bar drawer tabs
  '.open-tab',
  '.close-tab',
  // element-plus tooltips / loading masks
  '.el-popper.header-popper',
  '.el-loading-mask',
];

// Canvas limits vary by browser and version, e.g. Safari before iOS 18
// allowed 16,777,216 pixels (4096²), later versions 67,108,864 (8192²),
// Chrome/Firefox about 268,435,456 (16384²). Rather than hard-coding one
// value, the output size is verified at capture time (see `fitCanvasSize`),
// falling back through these areas when the browser cannot allocate it.
const CANVAS_AREA_FALLBACKS = [268435456, 67108864, 16777216];
const MAX_CANVAS_SIDE = 16384;

// Largest canvas area known to work, lowered when a probe fails.
let maxCanvasArea = CANVAS_AREA_FALLBACKS[0];

const SCREENSHOT_OVERLAY_ATTR = 'data-screenshot-overlay';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Wait until fonts and pending layout/paint have settled.
 */
const waitForRender = async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await nextFrame();
  await nextFrame();
};

const getMaxRenderbufferSize = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const size = gl?.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return size || MAX_CANVAS_SIDE;
  } catch {
    return MAX_CANVAS_SIDE;
  }
};

/**
 * Check whether the browser can allocate and draw to a canvas of this size.
 * Oversized canvases fail silently (null context or blank pixels).
 */
const canvasSupportsSize = (width, height) => {
  const canvas = document.createElement('canvas');
  try {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#000';
    ctx.fillRect(width - 1, height - 1, 1, 1);
    return ctx.getImageData(width - 1, height - 1, 1, 1).data[3] !== 0;
  } catch {
    return false;
  } finally {
    // Release the memory immediately, Safari keeps it otherwise.
    canvas.width = 0;
    canvas.height = 0;
  }
};

/**
 * Compute the pixel ratio for the requested scale, reduced if
 * the output would exceed known browser canvas limits.
 */
export const getEffectivePixelRatio = (width, height, scale) => {
  const requested = (window.devicePixelRatio || 1) * scale;
  const maxSide = Math.min(MAX_CANVAS_SIDE, getMaxRenderbufferSize());
  let ratio = requested;
  if (width > 0 && height > 0) {
    ratio = Math.min(
      ratio,
      maxSide / width,
      maxSide / height,
      Math.sqrt(maxCanvasArea / (width * height)),
    );
  }
  ratio = Math.max(1, Math.floor(ratio * 100) / 100);
  return { pixelRatio: ratio, clamped: ratio < requested };
};

/**
 * Like `getEffectivePixelRatio`, but verifies the browser can allocate the
 * output canvas, stepping down through `CANVAS_AREA_FALLBACKS` if not.
 */
const fitCanvasSize = (width, height, scale) => {
  let result = getEffectivePixelRatio(width, height, scale);
  while (
    !canvasSupportsSize(
      Math.round(width * result.pixelRatio),
      Math.round(height * result.pixelRatio),
    )
  ) {
    const area = width * height * result.pixelRatio ** 2;
    const nextArea = CANVAS_AREA_FALLBACKS.find((a) => a < area);
    if (!nextArea || result.pixelRatio <= 1) break;
    maxCanvasArea = nextArea;
    result = { ...getEffectivePixelRatio(width, height, scale), clamped: true };
  }
  return result;
};

/**
 * Full size of a legend panel, including the part scrolled out of view.
 */
const getLegendSize = (node) => {
  const style = getComputedStyle(node);
  const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  return { width: node.offsetWidth, height: node.scrollHeight + borders };
};

/**
 * Find the legend panels inside `el` that have content.
 * Panels in a closed drawer are included.
 * @returns {Array} the content elements of the panels.
 */
export const findLegends = (el) => {
  if (!el) return [];
  const wrapperSelector = SCREENSHOT_LEGEND_SELECTORS.join(',');
  const legends = [];
  el.querySelectorAll(wrapperSelector).forEach((wrapper) => {
    // Skip panels hidden with `display: none` or nested in another panel
    if (!wrapper.getClientRects().length) return;
    if (wrapper.parentElement?.closest(wrapperSelector)) return;
    const { content } = LEGEND_PANELS.find((panel) => wrapper.matches(panel.wrapper));
    const node = wrapper.querySelector(content) || wrapper;
    const { width, height } = getLegendSize(node);
    if (width > 0 && height > 0 && node.textContent.trim()) {
      legends.push(node);
    }
  });
  return legends;
};

/**
 * Get the expected output size in pixels, used by the UI for preview.
 * With `legend` set to `only`, `count` is the number of images and
 * the size is the largest one.
 */
export const getOutputSize = (el, scale, legend = 'exclude') => {
  if (!el) return { width: 0, height: 0, clamped: false, count: 0 };
  const sizes =
    legend === 'only' ? findLegends(el).map(getLegendSize) : [el.getBoundingClientRect()];
  const result = { width: 0, height: 0, clamped: false, count: sizes.length };
  sizes.forEach(({ width, height }) => {
    const { pixelRatio, clamped } = getEffectivePixelRatio(width, height, scale);
    const outWidth = Math.round(width * pixelRatio);
    const outHeight = Math.round(height * pixelRatio);
    if (outWidth * outHeight > result.width * result.height) {
      result.width = outWidth;
      result.height = outHeight;
    }
    result.clamped = result.clamped || clamped;
  });
  return result;
};

/**
 * Place `overlay` exactly on top of `target` without affecting layout.
 */
const placeOverlay = (target, overlay) => {
  overlay.setAttribute(SCREENSHOT_OVERLAY_ATTR, '');
  Object.assign(overlay.style, {
    position: 'absolute',
    left: '0px',
    top: '0px',
    margin: '0',
    pointerEvents: 'none',
  });
  target.after(overlay);
  const targetRect = target.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  Object.assign(overlay.style, {
    left: `${targetRect.left - overlayRect.left}px`,
    top: `${targetRect.top - overlayRect.top}px`,
    width: `${targetRect.width}px`,
    height: `${targetRect.height}px`,
  });
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/**
 * Overlay snapshot images on WebGL canvases and placeholders on iframes.
 * Returns the set of nodes to be excluded and a cleanup function.
 */
const prepareOverlays = async (el, sources) => {
  const excluded = new Set();
  const overlays = [];

  for (const { canvas, dataUrl } of sources) {
    if (!canvas || !dataUrl || !el.contains(canvas)) continue;
    const img = await loadImage(dataUrl);
    placeOverlay(canvas, img);
    overlays.push(img);
    excluded.add(canvas);
  }

  // Cross-origin iframes cannot be captured.
  el.querySelectorAll('iframe').forEach((iframe) => {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'Embedded content cannot be captured';
    Object.assign(placeholder.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f7fa',
      color: '#606266',
      font: '14px Asap, Arial, sans-serif',
    });
    placeOverlay(iframe, placeholder);
    overlays.push(placeholder);
    excluded.add(iframe);
  });

  const cleanup = () => overlays.forEach((overlay) => overlay.remove());
  return { excluded, cleanup };
};

const canvasToBlob = (canvas, type) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      type,
    );
  });

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const pad = (n) => String(n).padStart(2, '0');

export const getScreenshotFilename = (title) => {
  const now = new Date();
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const name = (title || 'screenshot')
    .replace(/[^a-z0-9_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${name || 'screenshot'}-${stamp}.png`;
};

// Transparent pixel for images that fail to load (e.g. CORS).
const IMAGE_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Rasterise `el` with html-to-image, skipping `excluded` nodes
 * and nodes matching `hideSelectors`.
 */
const renderToCanvas = async (el, options) => {
  const { pixelRatio, width, height, style, excluded = new Set(), hideSelectors = [] } = options;
  const { toCanvas } = await import('html-to-image');
  const hideSelector = hideSelectors.join(',');
  return toCanvas(el, {
    pixelRatio,
    width,
    height,
    backgroundColor: '#ffffff',
    // The root clone keeps its computed position (e.g. `top: 32px` on the pane container),
    // reset it so the content starts at the origin.
    style: {
      margin: '0',
      top: '0',
      left: '0',
      right: 'auto',
      bottom: 'auto',
      transform: 'none',
      ...style,
    },
    imagePlaceholder: IMAGE_PLACEHOLDER,
    filter: (node) => {
      if (excluded.has(node)) return false;
      if (node.nodeType === Node.ELEMENT_NODE && hideSelector && node.matches(hideSelector)) {
        return false;
      }
      return true;
    },
  });
};

/**
 * Capture each legend panel inside `el` as a separate PNG,
 * expanded to show all its content and visible even when the drawer is closed.
 */
const captureLegends = async (el, options) => {
  const { scale, filename, hideSelectors } = options;
  const legends = findLegends(el);
  if (!legends.length) throw new Error('No legend to capture');

  const results = [];
  for (const [index, legend] of legends.entries()) {
    const { width, height } = getLegendSize(legend);
    const { pixelRatio, clamped } = fitCanvasSize(width, height, scale);
    const canvas = await renderToCanvas(legend, {
      pixelRatio,
      width,
      height,
      hideSelectors,
      style: {
        position: 'relative',
        maxHeight: 'none',
        height: 'auto',
        overflow: 'visible',
        opacity: '1',
      },
    });
    const blob = await canvasToBlob(canvas, 'image/png');
    const name = index > 0 ? filename.replace(/\.png$/, `-${index + 1}.png`) : filename;
    downloadBlob(blob, name);
    results.push({ width: canvas.width, height: canvas.height, pixelRatio, clamped });
  }
  return results;
};

/**
 * Capture `el` and download it as PNG.
 *
 * @param {HTMLElement} el - Element to capture.
 * @param {Object} options
 * @param {Number} options.scale - Multiplier on top of the device pixel ratio.
 * @param {String} options.filename - Optional filename.
 * @param {String} options.legend - One of `SCREENSHOT_LEGEND_MODES`.
 * @param {Array} options.viewers - ContentVuer instances inside `el`
 *   providing `getScreenshotSources(pixelRatio)`.
 * @param {Array} options.hideSelectors - Selectors of nodes to exclude.
 * @returns {Object} { width, height, pixelRatio, clamped },
 *   or an array of these when `legend` is `only`.
 */
export const captureElement = async (el, options = {}) => {
  const {
    scale = 1,
    filename = getScreenshotFilename(),
    legend = 'exclude',
    viewers = [],
    hideSelectors = SCREENSHOT_HIDE_SELECTORS,
  } = options;
  if (!el) throw new Error('Nothing to capture');

  await waitForRender();

  if (legend === 'only') {
    return captureLegends(el, { scale, filename, hideSelectors });
  }

  const { width, height } = el.getBoundingClientRect();
  const { pixelRatio, clamped } = fitCanvasSize(width, height, scale);

  const sources = [];
  for (const viewer of viewers) {
    const viewerSources = await viewer?.getScreenshotSources?.(pixelRatio);
    if (viewerSources) sources.push(...viewerSources);
  }

  const { excluded, cleanup } = await prepareOverlays(el, sources);

  let canvas;
  try {
    canvas = await renderToCanvas(el, {
      pixelRatio,
      excluded,
      hideSelectors:
        legend === 'include' ? hideSelectors : [...hideSelectors, ...SCREENSHOT_LEGEND_SELECTORS],
    });
  } finally {
    cleanup();
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  downloadBlob(blob, filename);

  return { width: canvas.width, height: canvas.height, pixelRatio, clamped };
};

/**
 * Snapshot a three.js renderer at the given pixel ratio.
 * `render` must draw the scene synchronously.
 */
export const snapshotThreeRenderer = (renderer, render, pixelRatio) => {
  const canvas = renderer.domElement;
  const originalPixelRatio = renderer.getPixelRatio();
  try {
    renderer.setPixelRatio(pixelRatio);
    render();
    return { canvas, dataUrl: canvas.toDataURL('image/png') };
  } finally {
    renderer.setPixelRatio(originalPixelRatio);
    render();
  }
};

/**
 * Snapshot a maplibre map at the given pixel ratio.
 */
export const snapshotMaplibre = async (map, pixelRatio) => {
  const canvas = map.getCanvas();
  const originalPixelRatio = map.getPixelRatio?.();
  // maplibre caps the drawing buffer (default 4096px), raise it temporarily.
  const originalMaxCanvasSize = map._maxCanvasSize;
  const restore = () => {
    if (originalMaxCanvasSize) map._maxCanvasSize = originalMaxCanvasSize;
    if (originalPixelRatio !== undefined) map.setPixelRatio(originalPixelRatio);
  };
  try {
    if (originalMaxCanvasSize) {
      map._maxCanvasSize = [MAX_CANVAS_SIDE, MAX_CANVAS_SIDE];
    }
    if (originalPixelRatio !== undefined) map.setPixelRatio(pixelRatio);
    if (typeof map.redraw === 'function') {
      map.redraw();
      const dataUrl = canvas.toDataURL('image/png');
      restore();
      return { canvas, dataUrl };
    }
    const dataUrl = await new Promise((resolve) => {
      map.once('render', () => resolve(canvas.toDataURL('image/png')));
      map.triggerRepaint();
    });
    restore();
    return { canvas, dataUrl };
  } catch (error) {
    restore();
    throw error;
  }
};
