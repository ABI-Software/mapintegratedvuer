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

// ContentBar header of each pane, hidden unless the `toolbar` option is set.
export const SCREENSHOT_TOOLBAR_SELECTORS = ['.content-container > .toolbar'];

// UI controls that should not appear in the screenshot.
export const SCREENSHOT_HIDE_SELECTORS = [
  '[data-screenshot-ignore]',
  // flatmapvuer
  '.bottom-right-control',
  '.settings-group',
  '.beta-popovers',
  '.drawer-button',
  '.minimap-resize',
  '.maplibregl-ctrl-minimap',
  // scaffoldvuer, the tree controls also have this class but are a legend panel
  '.control-layer:not(.tree-controls)',
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

// Border drawn around view captures to match the frame around the app in the UI.
const SCREENSHOT_BORDER = { width: 1, color: '#dcdfe6' };

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

const isClipped = (node) => {
  const { overflowX, overflowY } = getComputedStyle(node);
  return (
    (overflowX !== 'visible' && node.scrollWidth > node.clientWidth) ||
    (overflowY !== 'visible' && node.scrollHeight > node.clientHeight)
  );
};

/**
 * Some panels scroll inside (e.g. the scaffoldvuer region tree),
 * which `getLegendSize` and the root style of `renderToCanvas` cannot expand.
 * In that case, return an off-screen copy of `legend` with those scroll containers
 * and their ancestors grown to fit their content.
 * The copy is placed next to the original so the same styles apply,
 * and the panel on screen is left untouched.
 * @returns {Object} { node, cleanup } where `node` is the element to capture.
 */
const expandLegend = (legend) => {
  const nodes = [...legend.querySelectorAll('*')];
  const expand = new Set();
  nodes.filter(isClipped).forEach((node) => {
    for (let n = node; n && n !== legend; n = n.parentElement) expand.add(n);
  });
  if (!expand.size) return { node: legend, cleanup: () => {} };

  const copy = legend.cloneNode(true);
  const copies = [...copy.querySelectorAll('*')];
  nodes.forEach((node, index) => {
    if (!expand.has(node)) return;
    Object.assign(copies[index].style, {
      width: 'max-content',
      minWidth: getComputedStyle(node).width,
      maxWidth: 'none',
      height: 'auto',
      maxHeight: 'none',
      overflow: 'visible',
    });
  });
  // Overridden by the root style in `captureLegends`.
  Object.assign(copy.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  copy.setAttribute(SCREENSHOT_OVERLAY_ATTR, '');
  legend.after(copy);
  return { node: copy, cleanup: () => copy.remove() };
};

/**
 * Find the legend panels inside `el` that have content.
 * Panels in a closed drawer are included, panels in inactive panes are not.
 * @returns {Array} the content elements of the panels.
 */
export const findLegends = (el) => {
  if (!el) return [];
  const wrapperSelector = SCREENSHOT_LEGEND_SELECTORS.join(',');
  const legends = [];
  el.querySelectorAll(wrapperSelector).forEach((wrapper) => {
    // Skip panels hidden with `display: none` or nested in another panel
    if (!wrapper.getClientRects().length) return;
    // Skip panels in inactive panes, which SplitDialog hides with `visibility: hidden`.
    // Closed drawers only use opacity/transform so they are still found.
    if (getComputedStyle(wrapper).visibility !== 'visible') return;
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
 * With `legend` set to `only`, `count` is the number of images
 * and the size is the largest one.
 */
export const getOutputSize = (el, scale, legend = 'exclude') => {
  if (!el) return { width: 0, height: 0, clamped: false, count: 0 };
  const sizes =
    legend === 'only'
      ? findLegends(el).map((legendNode) => {
          const { node, cleanup } = expandLegend(legendNode);
          const size = getLegendSize(node);
          cleanup();
          return size;
        })
      : [getBorderedSize(el.getBoundingClientRect())];
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
 * Size of a view capture including `SCREENSHOT_BORDER`.
 */
const getBorderedSize = ({ width, height }) => ({
  width: width + SCREENSHOT_BORDER.width * 2,
  height: height + SCREENSHOT_BORDER.width * 2,
});

/**
 * Return a copy of `canvas` framed with `SCREENSHOT_BORDER`.
 */
const addBorder = (canvas, pixelRatio) => {
  const border = Math.max(1, Math.round(SCREENSHOT_BORDER.width * pixelRatio));
  const framed = document.createElement('canvas');
  framed.width = canvas.width + border * 2;
  framed.height = canvas.height + border * 2;
  const ctx = framed.getContext('2d');
  ctx.fillStyle = SCREENSHOT_BORDER.color;
  ctx.fillRect(0, 0, framed.width, framed.height);
  ctx.drawImage(canvas, border, border);
  return framed;
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

// Safari and every iOS browser use WebKit.
const isWebKit = () => navigator.vendor === 'Apple Computer, Inc.';

// WebKit decodes images nested in an SVG `<foreignObject>` asynchronously,
// per drawn size, and draws them blank until they are ready,
// so the snapshot overlays would be missing.
// The SVG is redrawn until the result stops changing.
const WEBKIT_MIN_DRAWS = 3;
const WEBKIT_MAX_DRAWS = 10;
const WEBKIT_DRAW_INTERVAL = 100;
const FINGERPRINT_WIDTH = 128;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Return a function giving a downscaled copy of `canvas` pixels as a string.
 */
const createFingerprint = (canvas) => {
  const probe = document.createElement('canvas');
  probe.width = Math.min(FINGERPRINT_WIDTH, canvas.width);
  probe.height = Math.max(1, Math.round((probe.width * canvas.height) / canvas.width));
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  return () => {
    ctx.clearRect(0, 0, probe.width, probe.height);
    ctx.drawImage(canvas, 0, 0, probe.width, probe.height);
    try {
      return ctx.getImageData(0, 0, probe.width, probe.height).data.join();
    } catch {
      // Unreadable, fall back to the minimum number of draws
      return '';
    }
  };
};

const redrawUntilStable = async (canvas, draw) => {
  const fingerprint = createFingerprint(canvas);
  let previous = fingerprint();
  for (let count = 2; count <= WEBKIT_MAX_DRAWS; count++) {
    await delay(WEBKIT_DRAW_INTERVAL * (count - 1));
    await nextFrame();
    draw();
    const current = fingerprint();
    if (count >= WEBKIT_MIN_DRAWS && current === previous) return;
    previous = current;
  }
};

/**
 * Serialise a computed style the same way html-to-image copies it property by property.
 */
const formatComputedStyle = (node, style) => {
  let text = '';
  for (let i = 0; i < style.length; i++) {
    const name = style[i];
    let value = style.getPropertyValue(name);
    if (name === 'font-size' && value.endsWith('px')) {
      value = `${Math.floor(parseFloat(value)) - 0.1}px`;
    }
    if (name === 'display' && value === 'inline' && node instanceof HTMLIFrameElement) {
      value = 'block';
    }
    if (name === 'd' && node.getAttribute?.('d')) {
      value = `path(${node.getAttribute('d')})`;
    }
    text += `${name}: ${value}; `;
  }
  return text;
};

/**
 * When the computed `cssText` is empty (Safari, Firefox),
 * html-to-image copies each of the ~500 properties with `setProperty`,
 * which takes tens of seconds in Safari on a flatmap and freezes the page.
 * While `callback` runs, provide `cssText` so each style is assigned at once.
 */
const withComputedCssText = async (callback) => {
  const getComputedStyle = window.getComputedStyle;
  if (getComputedStyle(document.documentElement).cssText) return callback();
  window.getComputedStyle = function (node, pseudo) {
    const style = getComputedStyle.call(window, node, pseudo);
    if (!pseudo && !style.cssText) {
      let text;
      try {
        Object.defineProperty(style, 'cssText', {
          configurable: true,
          get: () => (text ??= formatComputedStyle(node, style)),
        });
      } catch {
        // Keep the per-property copy
      }
    }
    return style;
  };
  try {
    return await callback();
  } finally {
    window.getComputedStyle = getComputedStyle;
  }
};

/**
 * Rasterise `el` with html-to-image, skipping `excluded` nodes
 * and nodes matching `hideSelectors`.
 */
const renderToCanvas = async (el, options) => {
  const { pixelRatio, width, height, style, excluded = new Set(), hideSelectors = [] } = options;
  const { toSvg } = await import('html-to-image');
  const hideSelector = hideSelectors.join(',');
  const backgroundColor = '#ffffff';
  // Draw the SVG ourselves rather than with `toCanvas`, to handle WebKit.
  const svg = await withComputedCssText(() =>
    toSvg(el, {
      width,
      height,
      backgroundColor,
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
    }),
  );

  const img = await loadImage(svg);
  await img.decode?.();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const ctx = canvas.getContext('2d');
  const draw = () => {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  draw();
  if (isWebKit()) {
    await redrawUntilStable(canvas, draw);
  }
  return canvas;
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
    const { node, cleanup } = expandLegend(legend);
    let canvas, pixelRatio, clamped;
    try {
      const { width, height } = getLegendSize(node);
      ({ pixelRatio, clamped } = fitCanvasSize(width, height, scale));
      canvas = await renderToCanvas(node, {
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
    } finally {
      cleanup();
    }
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
 * @param {Boolean} options.toolbar - Include the header bar of each pane.
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
    toolbar = false,
    viewers = [],
    hideSelectors = SCREENSHOT_HIDE_SELECTORS,
  } = options;
  if (!el) throw new Error('Nothing to capture');

  await waitForRender();

  if (legend === 'only') {
    return captureLegends(el, { scale, filename, hideSelectors });
  }

  const rect = el.getBoundingClientRect();
  const { width, height } = getBorderedSize(rect);
  const { pixelRatio, clamped } = fitCanvasSize(width, height, scale);

  const sources = [];
  for (const viewer of viewers) {
    const viewerSources = await viewer?.getScreenshotSources?.(pixelRatio);
    if (viewerSources) sources.push(...viewerSources);
  }

  const { excluded, cleanup } = await prepareOverlays(el, sources);

  const hidden = [...hideSelectors];
  if (legend !== 'include') hidden.push(...SCREENSHOT_LEGEND_SELECTORS);
  if (!toolbar) hidden.push(...SCREENSHOT_TOOLBAR_SELECTORS);

  let canvas;
  try {
    canvas = await renderToCanvas(el, {
      pixelRatio,
      width: rect.width,
      height: rect.height,
      excluded,
      hideSelectors: hidden,
    });
  } finally {
    cleanup();
  }

  canvas = addBorder(canvas, pixelRatio);
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
