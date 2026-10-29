/**
 * Screenshot capture for ContentVuer panes and the whole split view.
 *
 * Most viewers render into WebGL canvases without `preserveDrawingBuffer`,
 * so a plain DOM-to-image capture would produce blank maps.
 * Each viewer therefore provides `getScreenshotSources(pixelRatio)`
 * which re-renders its canvas and reads it back in the same tick.
 * The canvases are temporarily covered with placeholders while the DOM is rasterised
 * with html-to-image, then the snapshots are composited into the result
 * under anything drawn on top of them (see `compositeLayers`).
 */

// Legend/checkbox panels drawn over the viewers. `wrapper` is the whole
// panel including its drawer button, `content` is what `only` captures.
const LEGEND_PANELS = [
  // flatmapvuer
  { wrapper: '.pathway-location', content: '.pathway-container' },
  // scaffoldvuer
  { wrapper: '.tree-controls', content: '.tree-controls-container' },
];

// Dividers between panes, which may cross a header row that is removed.
const TOOLBAR_ROW_DIVIDER_SELECTORS = ['.splitpanes__splitter'];

// Spacing in CSS pixels between the points checked along a header row.
const TOOLBAR_ROW_SAMPLE_STEP = 4;

const BLOB_URL_LIFETIME = 60000;

// Transparent pixel for images that fail to load (e.g. CORS).
const IMAGE_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// WebKit decodes images nested in an SVG `<foreignObject>` asynchronously,
// per drawn size, and draws them blank until they are ready,
// so images such as icons would be missing.
// The SVG is redrawn until the result stops changing.
const WEBKIT_MIN_DRAWS = 3;
const WEBKIT_MAX_DRAWS = 10;
const WEBKIT_DRAW_INTERVAL = 100;
const FINGERPRINT_WIDTH = 128;

// Canvas limits vary by browser and version, e.g. Safari before iOS 18
// allowed 16,777,216 pixels (4096²), later versions 67,108,864 (8192²),
// Chrome/Firefox about 268,435,456 (16384²). Rather than hard-coding one
// value, the output size is verified at capture time (see `fitCanvasSize`),
// falling back through these areas when the browser cannot allocate it.
const CANVAS_AREA_FALLBACKS = [268435456, 67108864, 16777216];
const MAX_CANVAS_SIDE = 16384;

// Border drawn around view captures to match the frame around the app in the UI.
const SCREENSHOT_BORDER = { width: 1, color: '#dcdfe6' };

// Fraction of the pixel area kept when retrying a failed capture.
const RETRY_AREA_FACTOR = 0.5;

const SCREENSHOT_OVERLAY_ATTR = 'data-screenshot-overlay';
const SCREENSHOT_PLACEHOLDER_ATTR = 'data-screenshot-placeholder';

// WebGL snapshots are not embedded in the SVG, WebKit draws large images nested
// in an SVG `<foreignObject>` blank. Instead the canvases are covered with placeholders,
// rendered once dark and once light, and the difference between the two tells how much
// of each snapshot pixel shows through whatever is drawn on top (see `compositeLayers`).
// Unusual values so they can be swapped in the SVG source without affecting anything else.
const LAYER_KEY_COLOR = 'rgb(0, 0, 1)';
const LAYER_FILL_COLOR = 'rgb(255, 255, 254)';

// Largest canvas area known to work, lowered when a probe fails.
let maxCanvasArea = CANVAS_AREA_FALLBACKS[0];

export const SCREENSHOT_SCALES = [1, 2, 3, 4];

/**
 * How legend panels are handled:
 * - `exclude`: hide them (default)
 * - `include`: keep them as they appear on screen
 * - `only`: capture only the legend panels, each as a separate image
 */
export const SCREENSHOT_LEGEND_MODES = ['exclude', 'include', 'only'];

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
  // scaffoldvuer, the tree controls also have this class but are a legend panel,
  // as do the primitive controls (opacity, transformation) placed inside it
  '.control-layer:not(.tree-controls, .tree-controls *)',
  // map-side-bar drawer tabs
  '.open-tab',
  '.close-tab',
  // element-plus tooltips / loading masks
  '.el-popper.header-popper',
  '.el-loading-mask',
];

/**
 * Reasons a capture can fail, used by the UI to explain what to do:
 * - `no-legend`: legend only capture without a legend
 * - `failed`: the browser could not create the image, even at the lowest resolution,
 *   usually because the view is too large or complex for its memory limits
 * - `context-lost`: a viewer lost its WebGL context (out of graphics memory)
 *   and stays blank until the page is reloaded
 */
export class ScreenshotError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'ScreenshotError';
    this.code = code;
  }
}

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
 * Find the rows of `el` that only show hidden header bars, which would be left blank.
 * A row is kept if anything else is on top at that height,
 * e.g. the open sidebar or a pane with its header elsewhere.
 * @param {HTMLElement} el - Element to capture.
 * @param {Array} hideSelectors - Selectors of nodes excluded from the capture,
 *   ignored when checking what is on top (e.g. the screenshot popover).
 * @returns {Array} { top, bottom } in CSS pixels relative to `el`, sorted and merged.
 */
const getToolbarRows = (el, hideSelectors = SCREENSHOT_HIDE_SELECTORS) => {
  const rect = el.getBoundingClientRect();
  const toolbarSelector = SCREENSHOT_TOOLBAR_SELECTORS.join(',');
  const allowedSelector = [...SCREENSHOT_TOOLBAR_SELECTORS, ...TOOLBAR_ROW_DIVIDER_SELECTORS].join(
    ',',
  );
  const ignoredSelector = hideSelectors.join(',');

  const edges = new Set();
  el.querySelectorAll(toolbarSelector).forEach((toolbar) => {
    if (getComputedStyle(toolbar).visibility !== 'visible') return;
    const { top, bottom } = toolbar.getBoundingClientRect();
    const rowTop = Math.max(top, rect.top) - rect.top;
    const rowBottom = Math.min(bottom, rect.bottom) - rect.top;
    if (rowBottom > rowTop) {
      edges.add(rowTop);
      edges.add(rowBottom);
    }
  });

  const isToolbarOnly = (y) => {
    for (let x = rect.left + 0.5; x < rect.right; x += TOOLBAR_ROW_SAMPLE_STEP) {
      const node = document
        .elementsFromPoint(x, y)
        .find((n) => !ignoredSelector || !n.closest(ignoredSelector));
      if (!node || !el.contains(node) || !node.closest(allowedSelector)) return false;
    }
    return true;
  };

  // Check each strip between consecutive edges,
  // as headers of side by side panes may not line up exactly.
  const sorted = [...edges].sort((a, b) => a - b);
  const rows = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const top = sorted[i];
    const bottom = sorted[i + 1];
    if (!isToolbarOnly(rect.top + (top + bottom) / 2)) continue;
    const last = rows[rows.length - 1];
    if (last && last.bottom === top) {
      last.bottom = bottom;
    } else {
      rows.push({ top, bottom });
    }
  }
  return rows;
};

/**
 * Convert `rows` from `getToolbarRows` to canvas pixels.
 */
const toCanvasRows = (rows, pixelRatio) =>
  rows
    .map(({ top, bottom }) => ({
      top: Math.round(top * pixelRatio),
      bottom: Math.round(bottom * pixelRatio),
    }))
    .filter(({ top, bottom }) => bottom > top);

/**
 * Return a copy of `canvas` without `rows` (in canvas pixels),
 * framed with `SCREENSHOT_BORDER`, in a single copy to limit memory use.
 */
const frameCanvas = (canvas, rows, pixelRatio) => {
  const border = Math.max(1, Math.round(SCREENSHOT_BORDER.width * pixelRatio));
  const removed = rows.reduce((sum, { top, bottom }) => sum + bottom - top, 0);
  const framed = document.createElement('canvas');
  framed.width = canvas.width + border * 2;
  framed.height = canvas.height - removed + border * 2;
  const ctx = framed.getContext('2d');
  if (!ctx) {
    releaseCanvas(canvas);
    throw new Error('Failed to allocate canvas');
  }
  ctx.fillStyle = SCREENSHOT_BORDER.color;
  ctx.fillRect(0, 0, framed.width, framed.height);
  let source = 0;
  let target = border;
  [...rows, { top: canvas.height, bottom: canvas.height }].forEach(({ top, bottom }) => {
    const height = top - source;
    if (height > 0) {
      ctx.drawImage(canvas, 0, source, canvas.width, height, border, target, canvas.width, height);
      target += height;
    }
    source = bottom;
  });
  releaseCanvas(canvas);
  return framed;
};

/**
 * Free the memory of a canvas that is no longer needed.
 * WebKit limits the total memory of all canvases and keeps it until garbage collection,
 * so large captures fail otherwise.
 */
const releaseCanvas = (canvas) => {
  canvas.width = 0;
  canvas.height = 0;
};

/**
 * Get the expected output size in pixels, used by the UI for preview.
 * With `legend` set to `only`, `count` is the number of images
 * and the size is the largest one.
 */
export const getOutputSize = (el, scale, legend = 'exclude', toolbar = false) => {
  if (!el) return { width: 0, height: 0, clamped: false, count: 0 };
  const sizes =
    legend === 'only'
      ? findLegends(el).map((legendNode) => {
          const { node, cleanup } = expandLegend(legendNode);
          const size = getLegendSize(node);
          cleanup();
          return size;
        })
      : [
          {
            ...getBorderedSize(el.getBoundingClientRect()),
            rows: toolbar ? [] : getToolbarRows(el),
          },
        ];
  const result = { width: 0, height: 0, clamped: false, count: sizes.length };
  sizes.forEach(({ width, height, rows = [] }) => {
    const { pixelRatio, clamped } = getEffectivePixelRatio(width, height, scale);
    const removed = toCanvasRows(rows, pixelRatio).reduce(
      (sum, { top, bottom }) => sum + bottom - top,
      0,
    );
    const outWidth = Math.round(width * pixelRatio);
    const outHeight = Math.round(height * pixelRatio) - removed;
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
 * Place `overlay` exactly on top of `target` without affecting layout.
 * It is transparent on screen and only shows in the capture (see `withComputedCssText`).
 */
const placeOverlay = (target, overlay) => {
  overlay.setAttribute(SCREENSHOT_OVERLAY_ATTR, '');
  overlay.setAttribute(SCREENSHOT_PLACEHOLDER_ATTR, '');
  Object.assign(overlay.style, {
    position: 'absolute',
    left: '0px',
    top: '0px',
    margin: '0',
    pointerEvents: 'none',
    opacity: '0',
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
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });

/**
 * Background colour showing through transparent pixels of `node`,
 * from the closest ancestor with an opaque background.
 */
const getBackdropColor = (node) => {
  for (let n = node.parentElement; n; n = n.parentElement) {
    const color = getComputedStyle(n).backgroundColor;
    const alpha = color.match(/rgba\(.*,\s*([\d.]+)\)/)?.[1];
    if (color !== 'transparent' && (alpha === undefined || parseFloat(alpha) > 0)) return color;
  }
  return '#ffffff';
};

/**
 * Place placeholders on WebGL canvases and iframes.
 * The snapshots of the WebGL canvases are composited later (see `compositeLayers`).
 * @returns {Object} { excluded, layers, cleanup } where `excluded` is the set of nodes
 *   to be excluded and `layers` the snapshots with their position relative to `el`.
 */
const prepareOverlays = (el, sources) => {
  const excluded = new Set();
  const overlays = [];
  const layers = [];
  const cleanup = () => overlays.forEach((overlay) => overlay.remove());
  const elRect = el.getBoundingClientRect();

  sources.forEach(({ canvas, image }) => {
    if (!canvas || !image || !el.contains(canvas)) return;
    const placeholder = document.createElement('div');
    placeholder.style.background = LAYER_KEY_COLOR;
    placeOverlay(canvas, placeholder);
    overlays.push(placeholder);
    excluded.add(canvas);
    const rect = canvas.getBoundingClientRect();
    layers.push({
      image,
      backdrop: getBackdropColor(canvas),
      x: rect.left - elRect.left,
      y: rect.top - elRect.top,
      width: rect.width,
      height: rect.height,
    });
  });

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

  return { excluded, layers, cleanup };
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
  // Safari reads the blob after `click` returns, and fails the download
  // ("WebKitBlobResource error 1") if the URL is revoked too early,
  // which happens with large images.
  setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_LIFETIME);
};

const pad = (n) => String(n).padStart(2, '0');

/**
 * Build a filename describing the capture,
 * e.g. `Rat-flatmap_2x_with-header-and-legend_2400x1800_261021143005.png`.
 * Parts are separated by `_`, words within a part by `-`.
 * The size is the actual output, which may be smaller than requested when clamped.
 * The timestamp comes last and keeps repeated captures with the same options apart.
 * @param {String} title - Name of the captured content.
 * @param {Object} options - { scale, legend, toolbar, width, height, index }
 *   where `index` numbers the images of a multi-image capture.
 */
export const getScreenshotFilename = (title, options = {}) => {
  const { scale, legend, toolbar, width, height, index } = options;
  const now = new Date();
  const stamp =
    `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const name = (title || 'screenshot')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  const parts = [name || 'screenshot'];
  if (legend === 'only') {
    parts.push(index > 0 ? `legend-${index + 1}` : 'legend');
  }
  if (scale) parts.push(`${scale}x`);
  if (legend !== 'only') {
    const extras = [];
    if (toolbar) extras.push('header');
    if (legend === 'include') extras.push('legend');
    if (extras.length) parts.push(`with-${extras.join('-and-')}`);
  }
  if (width && height) parts.push(`${width}x${height}`);
  parts.push(stamp);
  return `${parts.join('_')}.png`;
};

// Safari and every iOS browser use WebKit.
const isWebKit = () => navigator.vendor === 'Apple Computer, Inc.';

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

/**
 * Whether a fingerprint only contains white opaque pixels, i.e. only the background
 * was drawn. Browsers fail silently when the SVG is too large to rasterise.
 */
const isBlankFingerprint = (fingerprint) =>
  fingerprint !== '' && fingerprint.split(',').every((value) => value === '255');

const redrawUntilStable = async (fingerprint, draw, isBlank) => {
  let previous = fingerprint();
  for (let count = 2; count <= WEBKIT_MAX_DRAWS; count++) {
    await delay(WEBKIT_DRAW_INTERVAL * (count - 1));
    await nextFrame();
    draw();
    const current = fingerprint();
    // A blank result may still be decoding, keep waiting.
    if (count >= WEBKIT_MIN_DRAWS && current === previous && !isBlank(current)) return;
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
 * Placeholders, transparent on screen so the viewers stay visible during the capture,
 * are also made opaque in the copy.
 */
const withComputedCssText = async (callback) => {
  const getComputedStyle = window.getComputedStyle;
  const hasCssText = !!getComputedStyle(document.documentElement).cssText;
  window.getComputedStyle = function (node, pseudo) {
    const style = getComputedStyle.call(window, node, pseudo);
    const isPlaceholder = !pseudo && node?.hasAttribute?.(SCREENSHOT_PLACEHOLDER_ATTR);
    if (isPlaceholder || (!hasCssText && !pseudo && !style.cssText)) {
      const cssText = style.cssText;
      let text;
      try {
        Object.defineProperty(style, 'cssText', {
          configurable: true,
          // The last declaration wins
          get: () =>
            (text ??=
              (cssText || formatComputedStyle(node, style)) +
              (isPlaceholder ? ' opacity: 1;' : '')),
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
 * Composite the WebGL snapshots of `layers` into `canvas`,
 * which was drawn from `svg` with the placeholders in `LAYER_KEY_COLOR`.
 * The area of each layer is drawn again with the placeholders in `LAYER_FILL_COLOR`.
 * The two match where something opaque covers the placeholder, differ by about 255
 * where nothing does, and are in between for semi-transparent or anti-aliased content
 * on top (e.g. markers, tooltips, legends). Adding `snapshot × (light − dark) / 255`
 * to the dark render therefore draws the snapshot under that content, as the browser does.
 * Each area only needs a canvas of its own size, and each snapshot is drawn only once.
 */
const compositeLayers = async (canvas, svg, size, layers) => {
  const key = encodeURIComponent(LAYER_KEY_COLOR);
  if (!svg.includes(key)) throw new Error('Placeholders are missing from the capture');
  const light = await loadImage(svg.replaceAll(key, encodeURIComponent(LAYER_FILL_COLOR)));
  const ctx = canvas.getContext('2d');
  // From CSS pixels to canvas pixels
  const scaleX = canvas.width / size.width;
  const scaleY = canvas.height / size.height;
  try {
    await light.decode?.();
    for (const layer of layers) {
      const left = Math.max(0, Math.round(layer.x * scaleX));
      const top = Math.max(0, Math.round(layer.y * scaleY));
      const width = Math.min(canvas.width, Math.round((layer.x + layer.width) * scaleX)) - left;
      const height = Math.min(canvas.height, Math.round((layer.y + layer.height) * scaleY)) - top;
      if (width <= 0 || height <= 0) continue;

      const { image } = layer;
      // Fill transparent pixels with what is behind the WebGL canvas,
      // as the snapshot must be opaque to be multiplied.
      const imageCtx = image.getContext('2d');
      imageCtx.globalCompositeOperation = 'destination-over';
      imageCtx.fillStyle = layer.backdrop;
      imageCtx.fillRect(0, 0, image.width, image.height);

      const area = document.createElement('canvas');
      try {
        area.width = width;
        area.height = height;
        const areaCtx = area.getContext('2d');
        if (!areaCtx) throw new Error('Failed to allocate canvas');
        const drawLight = () => {
          areaCtx.fillStyle = '#ffffff';
          areaCtx.fillRect(0, 0, width, height);
          areaCtx.drawImage(
            light,
            left / scaleX,
            top / scaleY,
            width / scaleX,
            height / scaleY,
            0,
            0,
            width,
            height,
          );
        };
        drawLight();
        if (isWebKit()) {
          await redrawUntilStable(createFingerprint(area), drawLight, isBlankFingerprint);
        }
        areaCtx.globalCompositeOperation = 'difference';
        areaCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);
        const imageScaleX = image.width / layer.width;
        const imageScaleY = image.height / layer.height;
        areaCtx.globalCompositeOperation = 'multiply';
        areaCtx.drawImage(
          image,
          (left / scaleX - layer.x) * imageScaleX,
          (top / scaleY - layer.y) * imageScaleY,
          (width / scaleX) * imageScaleX,
          (height / scaleY) * imageScaleY,
          0,
          0,
          width,
          height,
        );
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(area, left, top);
      } finally {
        ctx.globalCompositeOperation = 'source-over';
        releaseCanvas(area);
      }
    }
  } finally {
    light.removeAttribute('src');
  }
};

/**
 * Rasterise `el` with html-to-image, skipping `excluded` nodes
 * and nodes matching `hideSelectors`, then composite `layers` (see `compositeLayers`).
 */
const renderToCanvas = async (el, options) => {
  const {
    pixelRatio,
    width,
    height,
    style,
    excluded = new Set(),
    hideSelectors = [],
    layers = [],
  } = options;
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
  try {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to allocate canvas');
    const draw = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    draw();
    const fingerprint = createFingerprint(canvas);
    if (isWebKit()) {
      await redrawUntilStable(fingerprint, draw, isBlankFingerprint);
    }
    // The captured views always have content, a blank image means drawing failed.
    if (isBlankFingerprint(fingerprint())) throw new Error('Captured image is blank');
    if (layers.length) await compositeLayers(canvas, svg, { width, height }, layers);
    return canvas;
  } catch (error) {
    releaseCanvas(canvas);
    throw error;
  } finally {
    img.removeAttribute('src');
  }
};

/**
 * Run `attempt(pixelRatio)` at the ratio from `fitCanvasSize`.
 * Browsers often fail silently (blank image, null blob, image load error)
 * when the output is too large for their memory limits, even though the
 * canvas size probe passed, so retry at lower ratios until the ratio reaches 1.
 * The lowered area limit is kept for later captures and size previews.
 * @returns {Object} the result of `attempt` with `pixelRatio`, `clamped`,
 *   and `reduced` when a retry lowered the ratio.
 * @throws {ScreenshotError} `failed` when the attempt at ratio 1 also fails.
 */
const withSizeFallback = async (width, height, scale, attempt) => {
  let { pixelRatio, clamped } = fitCanvasSize(width, height, scale);
  let reduced = false;
  for (;;) {
    try {
      const result = await attempt(pixelRatio);
      return { ...result, pixelRatio, clamped, reduced };
    } catch (error) {
      // Retrying does not help, the viewer is blank until the page is reloaded.
      if (error instanceof ScreenshotError) throw error;
      if (pixelRatio <= 1) {
        throw new ScreenshotError('failed', 'Failed to create the screenshot', { cause: error });
      }
      console.warn(`Screenshot failed at pixel ratio ${pixelRatio}, retrying smaller`, error);
      maxCanvasArea = Math.floor(width * height * pixelRatio ** 2 * RETRY_AREA_FACTOR);
      ({ pixelRatio } = getEffectivePixelRatio(width, height, scale));
      clamped = true;
      reduced = true;
      await nextFrame();
    }
  }
};

/**
 * Encode `canvas` as PNG and release it.
 */
const encodeCanvas = async (canvas) => {
  try {
    return await canvasToBlob(canvas, 'image/png');
  } finally {
    releaseCanvas(canvas);
  }
};

/**
 * Capture each legend panel inside `el` as a separate PNG,
 * expanded to show all its content and visible even when the drawer is closed.
 */
const captureLegends = async (el, options) => {
  const { scale, title, hideSelectors } = options;
  const legends = findLegends(el);
  if (!legends.length) throw new ScreenshotError('no-legend', 'No legend to capture');

  const results = [];
  for (const [index, legend] of legends.entries()) {
    const { node, cleanup } = expandLegend(legend);
    let result;
    try {
      const { width, height } = getLegendSize(node);
      result = await withSizeFallback(width, height, scale, async (pixelRatio) => {
        const canvas = await renderToCanvas(node, {
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
        const size = { width: canvas.width, height: canvas.height };
        return { ...size, blob: await encodeCanvas(canvas) };
      });
    } finally {
      cleanup();
    }
    const { blob, ...info } = result;
    const filename = getScreenshotFilename(title, {
      scale,
      legend: 'only',
      width: info.width,
      height: info.height,
      index,
    });
    downloadBlob(blob, filename);
    results.push(info);
  }
  return results;
};

/**
 * Capture `el` and download it as PNG.
 *
 * @param {HTMLElement} el - Element to capture.
 * @param {Object} options
 * @param {Number} options.scale - Multiplier on top of the device pixel ratio.
 * @param {String} options.title - Name of the content, used in the filename
 *   along with the options and output size.
 * @param {String} options.legend - One of `SCREENSHOT_LEGEND_MODES`.
 * @param {Boolean} options.toolbar - Include the header bar of each pane.
 * @param {Array} options.viewers - ContentVuer instances inside `el`
 *   providing `getScreenshotSources(pixelRatio)`.
 * @param {Array} options.hideSelectors - Selectors of nodes to exclude.
 * @returns {Object} { width, height, pixelRatio, clamped, reduced },
 *   or an array of these when `legend` is `only`.
 *   `reduced` is set when the size was lowered after a failed attempt.
 * @throws {ScreenshotError} see `ScreenshotError` for the codes.
 */
export const captureElement = async (el, options = {}) => {
  const {
    scale = 1,
    title,
    legend = 'exclude',
    toolbar = false,
    viewers = [],
    hideSelectors = SCREENSHOT_HIDE_SELECTORS,
  } = options;
  if (!el) throw new Error('Nothing to capture');

  await waitForRender();

  if (legend === 'only') {
    return captureLegends(el, { scale, title, hideSelectors });
  }

  const rect = el.getBoundingClientRect();
  const { width, height } = getBorderedSize(rect);

  // Find the blank header rows before the overlays are added.
  const toolbarRows = toolbar ? [] : getToolbarRows(el, hideSelectors);

  const hidden = [...hideSelectors];
  if (legend !== 'include') hidden.push(...SCREENSHOT_LEGEND_SELECTORS);
  if (!toolbar) hidden.push(...SCREENSHOT_TOOLBAR_SELECTORS);

  const { blob, ...info } = await withSizeFallback(width, height, scale, async (pixelRatio) => {
    const sources = [];
    let canvas;
    try {
      for (const viewer of viewers) {
        const viewerSources = await viewer?.getScreenshotSources?.(pixelRatio);
        if (viewerSources) sources.push(...viewerSources);
      }

      const { excluded, layers, cleanup } = prepareOverlays(el, sources);
      try {
        canvas = await renderToCanvas(el, {
          pixelRatio,
          width: rect.width,
          height: rect.height,
          excluded,
          hideSelectors: hidden,
          layers,
        });
      } finally {
        cleanup();
      }
    } finally {
      sources.forEach(({ image }) => image && releaseCanvas(image));
    }

    canvas = frameCanvas(canvas, toCanvasRows(toolbarRows, pixelRatio), pixelRatio);
    const size = { width: canvas.width, height: canvas.height };
    return { ...size, blob: await encodeCanvas(canvas) };
  });

  const filename = getScreenshotFilename(title, {
    scale,
    legend,
    toolbar,
    width: info.width,
    height: info.height,
  });
  downloadBlob(blob, filename);

  return info;
};

const assertContext = (gl) => {
  if (gl?.isContextLost?.()) {
    throw new ScreenshotError('context-lost', 'The WebGL context of the viewer was lost');
  }
};

/**
 * Copy a WebGL canvas just rendered at the requested size into a 2D canvas.
 * Must be called in the same tick as the render, as the drawing buffer is not preserved.
 * A copy is used rather than a data URL, which takes tens of MB at high resolutions.
 * Throws if the browser could not provide a drawing buffer that large
 * (it is then silently clamped), so the capture is retried smaller.
 */
const readWebGLCanvas = (canvas, gl) => {
  assertContext(gl);
  if (gl && (gl.drawingBufferWidth < canvas.width || gl.drawingBufferHeight < canvas.height)) {
    throw new Error('WebGL drawing buffer is smaller than requested');
  }
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  const ctx = copy.getContext('2d');
  if (!ctx) {
    releaseCanvas(copy);
    throw new Error('Failed to read WebGL canvas');
  }
  ctx.drawImage(canvas, 0, 0);
  return copy;
};

/**
 * Snapshot a three.js renderer at the given pixel ratio.
 * `render` must draw the scene synchronously.
 */
export const snapshotThreeRenderer = (zincRenderer, pixelRatio) => {
  const renderer = zincRenderer?.getThreeJSRenderer();
  const canvas = renderer.domElement;
  const gl = renderer.getContext?.();
  assertContext(gl);
  const originalPixelRatio = renderer.getPixelRatio();
  try {
    renderer.setPixelRatio(pixelRatio);
    zincRenderer.invalidate?.();
    zincRenderer.render();
    return { canvas, image: readWebGLCanvas(canvas, gl) };
  } finally {
    renderer.setPixelRatio(originalPixelRatio);
    zincRenderer.invalidate?.();
    zincRenderer.render();
  }
};

/**
 * Snapshot a maplibre map at the given pixel ratio.
 */
export const snapshotMaplibre = async (map, pixelRatio) => {
  const canvas = map.getCanvas();
  const gl = map.painter?.context?.gl;
  // Checked first, as `render` never fires once the context is lost.
  assertContext(gl);
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
      const image = readWebGLCanvas(canvas, gl);
      restore();
      return { canvas, image };
    }
    const image = await new Promise((resolve, reject) => {
      map.once('render', () => {
        try {
          resolve(readWebGLCanvas(canvas, gl));
        } catch (error) {
          reject(error);
        }
      });
      map.triggerRepaint();
    });
    restore();
    return { canvas, image };
  } catch (error) {
    restore();
    throw error;
  }
};
