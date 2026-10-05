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

// Safari limits the canvas area to 16,777,216 pixels.
// TODO: from iOS 18, it changed to 67,108,864 pixels.
// Other browsers limit each side to around 16384/32767 pixels.
const MAX_CANVAS_AREA = 16777216;
const MAX_CANVAS_SIDE = 16384;

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
 * Compute the pixel ratio for the requested scale, reduced if
 * the output would exceed browser canvas limits.
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
      Math.sqrt(MAX_CANVAS_AREA / (width * height)),
    );
  }
  ratio = Math.max(1, Math.floor(ratio * 100) / 100);
  return { pixelRatio: ratio, clamped: ratio < requested };
};

/**
 * Get the expected output size in pixels, used by the UI for preview.
 */
export const getOutputSize = (el, scale) => {
  if (!el) return { width: 0, height: 0 };
  const { width, height } = el.getBoundingClientRect();
  const { pixelRatio, clamped } = getEffectivePixelRatio(width, height, scale);
  return {
    width: Math.round(width * pixelRatio),
    height: Math.round(height * pixelRatio),
    clamped,
  };
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

/**
 * Capture `el` and download it as PNG.
 *
 * @param {HTMLElement} el - Element to capture.
 * @param {Object} options
 * @param {Number} options.scale - Multiplier on top of the device pixel ratio.
 * @param {String} options.filename - Optional filename.
 * @param {Array} options.viewers - ContentVuer instances inside `el`
 *   providing `getScreenshotSources(pixelRatio)`.
 * @param {Array} options.hideSelectors - Selectors of nodes to exclude.
 * @returns {Object} { width, height, pixelRatio, clamped }
 */
export const captureElement = async (el, options = {}) => {
  const { scale = 1, filename, viewers = [], hideSelectors = SCREENSHOT_HIDE_SELECTORS } = options;
  if (!el) throw new Error('Nothing to capture');

  await waitForRender();

  const { width, height } = el.getBoundingClientRect();
  const { pixelRatio, clamped } = getEffectivePixelRatio(width, height, scale);

  const sources = [];
  for (const viewer of viewers) {
    const viewerSources = await viewer?.getScreenshotSources?.(pixelRatio);
    if (viewerSources) sources.push(...viewerSources);
  }

  const { toCanvas } = await import('html-to-image');
  const { excluded, cleanup } = await prepareOverlays(el, sources);
  const hideSelector = hideSelectors.join(',');

  let canvas;
  try {
    canvas = await toCanvas(el, {
      pixelRatio,
      backgroundColor: '#ffffff',
      // The root clone keeps its computed position (e.g. `top: 32px` on the
      // pane container), reset it so the content starts at the origin.
      style: {
        margin: '0',
        top: '0',
        left: '0',
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
      },
      // Transparent pixel for images that fail to load (e.g. CORS).
      imagePlaceholder:
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      filter: (node) => {
        if (excluded.has(node)) return false;
        if (node.nodeType === Node.ELEMENT_NODE && hideSelector && node.matches(hideSelector)) {
          return false;
        }
        return true;
      },
    });
  } finally {
    cleanup();
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  downloadBlob(blob, filename || getScreenshotFilename());

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
