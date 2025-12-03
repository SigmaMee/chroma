const primaryInput = document.getElementById("primaryColor");
const primarySwatch = document.getElementById("primarySwatch");
const primaryColorPicker = document.getElementById("primaryColorPicker");
const satInput = document.getElementById("greyscaleSaturationValue");
const formatSelect = document.getElementById("format");

// Tint amount switch variables
let tintAmounts = {
  low: 0,
  mid: 0,
  high: 0,
};
let currentTintLevel = "low";
let currentTintColorMode = "primary";

function generateRandomTintAmounts() {
  tintAmounts.low = 1 + Math.random() * 0.4;
  tintAmounts.mid = 9 + Math.random() * 0.5;
  tintAmounts.high = 16 + Math.random() * 0.65;
}

const prefixInput = document.getElementById("prefix");
const derivedHexInput = document.getElementById("derivedHex");
const derivedSwatch = document.getElementById("derivedSwatch");
const derivedLabel = document.getElementById("derivedLabel");
const scaleGrid = document.getElementById("scale-grid");
const scaleCount = document.getElementById("scale-count");
const primaryScaleGrid = document.getElementById("primary-scale-grid");
const primaryScaleCount = document.getElementById("primary-scale-count");
const matrixGrid = document.getElementById("matrix-grid");
const matrixPassCount = document.getElementById("matrix-pass-count");
const matrixNote = document.getElementById("matrix-note");
const primaryMatrixGrid = document.getElementById("primary-matrix-grid");
const primaryMatrixPassCount = document.getElementById("primary-matrix-pass-count");
const primaryMatrixNote = document.getElementById("primary-matrix-note");
const complianceLevel = document.getElementById("complianceLevel");
const output = document.getElementById("output");
const generateBtn = document.getElementById("generate");
const copyBtn = document.getElementById("copy");
const resetBtn = document.getElementById("reset");
const tokenCount = document.getElementById("token-count");

// Tab switching
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;
    
    // Remove active class from all buttons and contents
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));
    
    // Add active class to clicked button and corresponding content
    button.classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
  });
});

function clamp(value, min, max) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return min;
  }
  return Math.min(Math.max(num, min), max);
}

function normalizeHex(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed
      .split("")
      .map((char) => char + char)
      .join("")
      .toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  return null;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r, g, b) {
  const toHex = (value) =>
    Math.round(value).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    s = delta / (1 - Math.abs(2 * l - 1));
  }

  return {
    h: Math.round((h * 60 + 360) % 360),
    s: clamp(s, 0, 1),
    l: clamp(l, 0, 1),
  };
}

function hslToRgb(h, s, l) {
  const normalizedH = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((normalizedH / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (normalizedH < 60) {
    rp = c;
    gp = x;
  } else if (normalizedH < 120) {
    rp = x;
    gp = c;
  } else if (normalizedH < 180) {
    gp = c;
    bp = x;
  } else if (normalizedH < 240) {
    gp = x;
    bp = c;
  } else if (normalizedH < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function deriveGreyscaleColor(primaryHex, saturationPercent, tintMode = "primary") {
  const normalized = normalizeHex(primaryHex);
  if (!normalized) {
    return null;
  }
  const rgb = hexToRgb(normalized);
  if (!rgb) {
    return null;
  }
  let hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // If complimentary mode, shift hue by 180 degrees
  if (tintMode === "complimentary") {
    hsl = { ...hsl, h: (hsl.h - 180 + 360) % 360 };
  }
  
  const saturation = clamp(Number(saturationPercent) / 100 || 0, 0, 0.3);
  const derivedRgb = hslToRgb(hsl.h, saturation, hsl.l);
  return {
    hex: rgbToHex(derivedRgb.r, derivedRgb.g, derivedRgb.b),
    hsl,
    saturation,
  };
}

function generateGreyscaleScale(data) {
  if (!data || !data.hsl) {
    return [];
  }

  const { hsl, saturation } = data;
  let lighterSteps = 4;
  let darkerSteps = 5;

  if (hsl.l > 0.6) {
    lighterSteps = 0;
    darkerSteps = 9;
  } else if (hsl.l < 0.2) {
    lighterSteps = 9;
    darkerSteps = 0;
  }

  const lighten = [];
  for (let i = 1; i <= lighterSteps; i += 1) {
    const ratio = i / (lighterSteps + 1);
    const lightness = clamp(hsl.l + (1 - hsl.l) * ratio, 0, 1);
    const rgb = hslToRgb(hsl.h, saturation, lightness);
    lighten.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
    });
  }

  const darken = [];
  for (let i = 1; i <= darkerSteps; i += 1) {
    const ratio = i / (darkerSteps + 1);
    const lightness = clamp(hsl.l - hsl.l * ratio, 0, 1);
    const rgb = hslToRgb(hsl.h, saturation, lightness);
    darken.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
    });
  }

  const ordered = []
    .concat(lighten.sort((a, b) => b.lightness - a.lightness))
    .concat([{ hex: data.hex, lightness: hsl.l }])
    .concat(darken.sort((a, b) => b.lightness - a.lightness));

  const scaleLabels = [
    "50",
    "100",
    "200",
    "300",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
  ];

  return ordered.slice(0, 10).map((entry, index) => ({
    name: `greyscale.scale.${scaleLabels[index]}`,
    hex: entry.hex,
    isSeed: entry.hex === data.hex,
  }));
}

function generatePrimaryScale(data) {
  if (!data || !data.hsl) {
    return [];
  }

  const { hsl } = data;
  let lighterSteps = 4;
  let darkerSteps = 5;

  if (hsl.l > 0.6) {
    lighterSteps = 0;
    darkerSteps = 9;
  } else if (hsl.l < 0.2) {
    lighterSteps = 9;
    darkerSteps = 0;
  }

  const lighten = [];
  for (let i = 1; i <= lighterSteps; i += 1) {
    const ratio = i / (lighterSteps + 1);
    const lightness = clamp(hsl.l + (1 - hsl.l) * ratio, 0, 1);
    const rgb = hslToRgb(hsl.h, hsl.s, lightness);
    lighten.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
    });
  }

  const darken = [];
  for (let i = 1; i <= darkerSteps; i += 1) {
    const ratio = i / (darkerSteps + 1);
    const lightness = clamp(hsl.l - hsl.l * ratio, 0, 1);
    const rgb = hslToRgb(hsl.h, hsl.s, lightness);
    darken.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
    });
  }

  const ordered = []
    .concat(lighten.sort((a, b) => b.lightness - a.lightness))
    .concat([{ hex: data.hex, lightness: hsl.l }])
    .concat(darken.sort((a, b) => b.lightness - a.lightness));

  const scaleLabels = [
    "50",
    "100",
    "200",
    "300",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
  ];

  return ordered.slice(0, 10).map((entry, index) => ({
    name: `color.primary.${scaleLabels[index]}`,
    hex: entry.hex,
    isSeed: entry.hex === data.hex,
  }));
}

function relativeLuminance(rgb) {
  if (!rgb) return null;
  const transform = (value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * transform(rgb.r) +
    0.7152 * transform(rgb.g) +
    0.0722 * transform(rgb.b)
  );
}

function getContrastRatio(bgHex, fgHex) {
  const bg = hexToRgb(bgHex);
  const fg = hexToRgb(fgHex);
  if (!bg || !fg) return null;
  const l1 = relativeLuminance(bg);
  const l2 = relativeLuminance(fg);
  if (l1 === null || l2 === null) return null;
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function formatTokens(tokens, format) {
  // Accept either a nested W3C tokens object or a flattened array/map
  // Helper: flatten nested token object into map of dot-keys -> leaf
  function flatten(obj, parent = "") {
    const map = {};
    Object.keys(obj || {}).forEach((key) => {
      const val = obj[key];
      const path = parent ? `${parent}.${key}` : key;
      if (val && typeof val === "object" && (Object.prototype.hasOwnProperty.call(val, "$value") || Object.prototype.hasOwnProperty.call(val, "value"))) {
        map[path] = val;
      } else if (val && typeof val === "object") {
        Object.assign(map, flatten(val, path));
      }
    });
    return map;
  }

  let tokenMap = {};
  if (Array.isArray(tokens)) {
    // legacy array of { name, hex }
    tokens.forEach((t) => {
      tokenMap[t.name] = { value: t.hex, type: "color" };
    });
  } else if (tokens && typeof tokens === "object") {
    tokenMap = flatten(tokens);
  }

  if (format === "css") {
    const lines = Object.keys(tokenMap).map((name) => {
      const safeName = name.replace(/\./g, "-").replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
      const tokenValue = tokenMap[name].$value || tokenMap[name].value;
      return `  --${safeName}: ${tokenValue};`;
    });
    return `:root {\n${lines.join("\n")}\n}`;
  }

  // Default: W3C-style nested JSON (already provided by createTokens), but
  // if we received a flattened map, reconstruct a nested object for output.
  if (tokens && typeof tokens === "object" && !Array.isArray(tokens)) {
    return JSON.stringify(tokens, null, 2);
  }

  // Fallback: return flattened JSON
  const flatJson = Object.keys(tokenMap).reduce((acc, name) => {
    acc[name] = tokenMap[name].$value || tokenMap[name].value;
    return acc;
  }, {});
  return JSON.stringify(flatJson, null, 2);
}

function renderScale(scale) {
  const list = Array.isArray(scale) ? scale : [];
  scaleGrid.innerHTML = "";
  scaleCount.textContent = list.length.toString();

  if (!list.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "helper";
    placeholder.textContent = "Generate tokens to preview the scale.";
    scaleGrid.appendChild(placeholder);
    return;
  }

  list.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "scale-item";
    const swatch = document.createElement("span");
    swatch.className = "swatch small";
    swatch.style.background = entry.hex;

    const meta = document.createElement("div");
    meta.className = "scale-meta";
    const title = document.createElement("span");
    // For greyscale preview, show the short numeric label (e.g. "100")
    title.textContent = entry.name.replace("greyscale.scale.", "");
    const hex = document.createElement("code");
    hex.textContent = entry.hex;
    meta.appendChild(title);
    meta.appendChild(hex);

    item.appendChild(swatch);
    item.appendChild(meta);
    scaleGrid.appendChild(item);
  });
}

function renderPrimaryScale(scale) {
  const list = Array.isArray(scale) ? scale : [];
  if (!primaryScaleGrid) return;
  primaryScaleGrid.innerHTML = "";
  if (primaryScaleCount) primaryScaleCount.textContent = list.length.toString();

  if (!list.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "helper";
    placeholder.textContent = "Generate tokens to preview the primary color scale.";
    primaryScaleGrid.appendChild(placeholder);
    return;
  }

  list.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "scale-item";
    const swatch = document.createElement("span");
    swatch.className = "swatch small";
    swatch.style.background = entry.hex;

    const meta = document.createElement("div");
    meta.className = "scale-meta";
    const title = document.createElement("span");
    // show the short numeric label for primary e.g. "100"
    title.textContent = entry.name.replace("color.primary.", "");
    const hex = document.createElement("code");
    hex.textContent = entry.hex;
    meta.appendChild(title);
    meta.appendChild(hex);

    item.appendChild(swatch);
    item.appendChild(meta);
    primaryScaleGrid.appendChild(item);
  });
}

function renderMatrix(scale) {
  const colors = Array.isArray(scale) ? scale : [];
  
  // Add white at the beginning of the test colors
  const testColors = [
    { name: "white", hex: "#FFFFFF" },
    ...colors
  ];
  
  matrixGrid.innerHTML = "";
  matrixPassCount.textContent = "0";

  if (!testColors.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "helper";
    placeholder.textContent = "Generate tokens to evaluate combinations.";
    matrixGrid.appendChild(placeholder);
    matrixGrid.style.gridTemplateColumns = "1fr";
    return;
  }

  const level = complianceLevel.value;
  const normalThreshold = level === "AAA" ? 7 : 4.5;
  const largeThreshold = level === "AAA" ? 4.5 : 3;

  matrixNote.textContent = `Rows are backgrounds, columns are foregrounds. Green = passes ${normalThreshold}:1 (normal text), Blue = passes ${largeThreshold}:1 (large text only), Red = fails.`;

  matrixGrid.style.gridTemplateColumns = `repeat(${
    testColors.length + 1
  }, minmax(70px, 1fr))`;

  const headerCell = document.createElement("div");
  headerCell.className = "matrix-cell header";
  matrixGrid.appendChild(headerCell);

  testColors.forEach((color) => {
    const cell = document.createElement("div");
    cell.className = "matrix-cell header";
    cell.textContent = color.name.replace("greyscale.scale.", "neutral.");
    matrixGrid.appendChild(cell);
  });

  let passStrongCount = 0;
  let passWeakCount = 0;

  testColors.forEach((bg) => {
    const rowHeader = document.createElement("div");
    rowHeader.className = "matrix-cell header";
    rowHeader.textContent = bg.name.replace("greyscale.scale.", "neutral.");
    matrixGrid.appendChild(rowHeader);

    testColors.forEach((fg) => {
      const ratio = getContrastRatio(bg.hex, fg.hex);
      let cellClass = "fail";
      if (typeof ratio === "number") {
        if (ratio >= normalThreshold) {
          cellClass = "pass-strong";
          passStrongCount += 1;
        } else if (ratio >= largeThreshold) {
          cellClass = "pass-weak";
          passWeakCount += 1;
        }
      }

      const cell = document.createElement("div");
      cell.className = `matrix-cell ${cellClass}`;
      cell.textContent = typeof ratio === "number" ? `${ratio.toFixed(1)}×` : "—";
      matrixGrid.appendChild(cell);
    });
  });

  matrixPassCount.textContent = `${passStrongCount} strong / ${passWeakCount} weak`;
}

function renderPrimaryColorMatrix(primaryScale, neutralScale) {
  // Primary colors as backgrounds, neutral + white as foregrounds
  const backgrounds = Array.isArray(primaryScale) ? primaryScale : [];
  const foregrounds = [
    { name: "white", hex: "#FFFFFF" },
    ...(Array.isArray(neutralScale) ? neutralScale : [])
  ];
  
  primaryMatrixGrid.innerHTML = "";
  primaryMatrixPassCount.textContent = "0";

  if (!backgrounds.length || !foregrounds.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "helper";
    placeholder.textContent = "Generate tokens to evaluate combinations.";
    primaryMatrixGrid.appendChild(placeholder);
    primaryMatrixGrid.style.gridTemplateColumns = "1fr";
    return;
  }

  const level = complianceLevel.value;
  const normalThreshold = level === "AAA" ? 7 : 4.5;
  const largeThreshold = level === "AAA" ? 4.5 : 3;

  primaryMatrixNote.textContent = `Rows are primary backgrounds, columns are neutral + white foregrounds. Green = passes ${normalThreshold}:1 (normal text), Blue = passes ${largeThreshold}:1 (large text only), Red = fails.`;

  primaryMatrixGrid.style.gridTemplateColumns = `repeat(${
    foregrounds.length + 1
  }, minmax(70px, 1fr))`;

  const headerCell = document.createElement("div");
  headerCell.className = "matrix-cell header";
  primaryMatrixGrid.appendChild(headerCell);

  foregrounds.forEach((color) => {
    const cell = document.createElement("div");
    cell.className = "matrix-cell header";
    cell.textContent = color.name.replace("greyscale.scale.", "neutral.");
    primaryMatrixGrid.appendChild(cell);
  });

  let passStrongCount = 0;
  let passWeakCount = 0;

  backgrounds.forEach((bg) => {
    const rowHeader = document.createElement("div");
    rowHeader.className = "matrix-cell header";
    rowHeader.textContent = bg.name.replace("color.primary.", "primary.");
    primaryMatrixGrid.appendChild(rowHeader);

    foregrounds.forEach((fg) => {
      const ratio = getContrastRatio(bg.hex, fg.hex);
      let cellClass = "fail";
      if (typeof ratio === "number") {
        if (ratio >= normalThreshold) {
          cellClass = "pass-strong";
          passStrongCount += 1;
        } else if (ratio >= largeThreshold) {
          cellClass = "pass-weak";
          passWeakCount += 1;
        }
      }

      const cell = document.createElement("div");
      cell.className = `matrix-cell ${cellClass}`;
      cell.textContent = typeof ratio === "number" ? `${ratio.toFixed(1)}×` : "—";
      primaryMatrixGrid.appendChild(cell);
    });
  });

  primaryMatrixPassCount.textContent = `${passStrongCount} strong / ${passWeakCount} weak`;
}

function renderSemanticMatrix(tokens, complianceMode) {
  const semanticMatrixGrid = document.getElementById("semantic-matrix-grid");
  const semanticMatrixPassCount = document.getElementById("semantic-matrix-pass-count");
  
  if (!semanticMatrixGrid || !semanticMatrixPassCount || !tokens || !tokens.color || !tokens.color.semantic) {
    return;
  }

  semanticMatrixGrid.innerHTML = "";
  semanticMatrixPassCount.textContent = "0";

  // Extract semantic tokens from tokens object
  const semantic = tokens.color.semantic;
  
  // Helper to resolve hex value from $value reference or direct hex
  function resolveHex(obj) {
    if (!obj) return null;
    if (obj.$value && obj.$value.startsWith("#")) return obj.$value;
    if (obj.$value && obj.$value.startsWith("{")) {
      // Resolve reference like "{color.seed.white}"
      const path = obj.$value.replace(/[{}]/g, "").split(".");
      let current = tokens;
      for (const key of path) {
        current = current[key];
        if (!current) return null;
      }
      return current.$value;
    }
    return null;
  }

  // Build separate surface arrays
  const neutralSurfaces = [];
  const invertedSurfaces = [];
  
  if (semantic.surface && semantic.surface.neutral) {
    if (semantic.surface.neutral.base) neutralSurfaces.push({ name: "base", hex: resolveHex(semantic.surface.neutral.base) });
    if (semantic.surface.neutral.surface) neutralSurfaces.push({ name: "surface", hex: resolveHex(semantic.surface.neutral.surface) });
    if (semantic.surface.neutral.surfaceVariant) neutralSurfaces.push({ name: "surfaceVariant", hex: resolveHex(semantic.surface.neutral.surfaceVariant) });
    if (semantic.surface.neutral.surfaceInverted) invertedSurfaces.push({ name: "surfaceInverted", hex: resolveHex(semantic.surface.neutral.surfaceInverted) });
    if (semantic.surface.neutral.surfaceInvertedVariant) invertedSurfaces.push({ name: "surfaceInvertedVariant", hex: resolveHex(semantic.surface.neutral.surfaceInvertedVariant) });
  }
  if (semantic.surface && semantic.surface.primary) {
    if (semantic.surface.primary.surfacePrimary) neutralSurfaces.push({ name: "surfacePrimary", hex: resolveHex(semantic.surface.primary.surfacePrimary) });
    if (semantic.surface.primary.surfacePrimarySubtle) neutralSurfaces.push({ name: "surfacePrimarySubtle", hex: resolveHex(semantic.surface.primary.surfacePrimarySubtle) });
    if (semantic.surface.primary.primarySurfaceIntense) neutralSurfaces.push({ name: "primarySurfaceIntense", hex: resolveHex(semantic.surface.primary.primarySurfaceIntense) });
  }

  // Build separate foreground arrays
  const neutralText = [];
  const invertedText = [];
  
  if (semantic.text && semantic.text.neutral) {
    if (semantic.text.neutral.primary) neutralText.push({ name: "text.primary", hex: resolveHex(semantic.text.neutral.primary) });
    if (semantic.text.neutral.secondary) neutralText.push({ name: "text.secondary", hex: resolveHex(semantic.text.neutral.secondary) });
    if (semantic.text.neutral.tertiary) neutralText.push({ name: "text.tertiary", hex: resolveHex(semantic.text.neutral.tertiary) });
  }
  if (semantic.text && semantic.text.neutral && semantic.text.neutral.inverted) {
    if (semantic.text.neutral.inverted.primary) invertedText.push({ name: "text.inverted.primary", hex: resolveHex(semantic.text.neutral.inverted.primary) });
    if (semantic.text.neutral.inverted.secondary) invertedText.push({ name: "text.inverted.secondary", hex: resolveHex(semantic.text.neutral.inverted.secondary) });
    if (semantic.text.neutral.inverted.tertiary) invertedText.push({ name: "text.inverted.tertiary", hex: resolveHex(semantic.text.neutral.inverted.tertiary) });
  }
  if (semantic.text && semantic.text.onPrimary) {
    if (semantic.text.onPrimary.default) neutralText.push({ name: "text.onPrimary", hex: resolveHex(semantic.text.onPrimary.default) });
  }
  if (semantic.outline && semantic.outline.neutral) {
    if (semantic.outline.neutral.default) neutralText.push({ name: "outline.default", hex: resolveHex(semantic.outline.neutral.default) });
    if (semantic.outline.neutral.variant) neutralText.push({ name: "outline.variant", hex: resolveHex(semantic.outline.neutral.variant) });
  }
  if (semantic.outline && semantic.outline.neutral && semantic.outline.neutral.inverted) {
    if (semantic.outline.neutral.inverted.default) invertedText.push({ name: "outline.inverted.default", hex: resolveHex(semantic.outline.neutral.inverted.default) });
    if (semantic.outline.neutral.inverted.variant) invertedText.push({ name: "outline.inverted.variant", hex: resolveHex(semantic.outline.neutral.inverted.variant) });
  }
  if (semantic.outline && semantic.outline.primary) {
    if (semantic.outline.primary.outlinePrimary) neutralText.push({ name: "outline.primary", hex: resolveHex(semantic.outline.primary.outlinePrimary) });
    if (semantic.outline.primary.outlinePrimarySubtle) neutralText.push({ name: "outline.primarySubtle", hex: resolveHex(semantic.outline.primary.outlinePrimarySubtle) });
    if (semantic.outline.primary.primaryOutlineIntense) neutralText.push({ name: "outline.primaryIntense", hex: resolveHex(semantic.outline.primary.primaryOutlineIntense) });
  }

  // Filter out any null hex values
  const validNeutralSurfaces = neutralSurfaces.filter(s => s.hex);
  const validInvertedSurfaces = invertedSurfaces.filter(s => s.hex);
  const validNeutralText = neutralText.filter(f => f.hex);
  const validInvertedText = invertedText.filter(f => f.hex);

  if ((!validNeutralSurfaces.length && !validInvertedSurfaces.length) || (!validNeutralText.length && !validInvertedText.length)) {
    const placeholder = document.createElement("p");
    placeholder.className = "helper";
    placeholder.textContent = "Generate tokens to validate semantic combinations.";
    semanticMatrixGrid.appendChild(placeholder);
    return;
  }

  const level = complianceMode || "AA";
  const normalThreshold = level === "AAA" ? 7 : 4.5;
  const largeThreshold = level === "AAA" ? 4.5 : 3;
  const outlineThreshold = level === "AAA" ? 4.5 : 3;

  let totalPassStrong = 0;
  let totalPassWeak = 0;

  // Helper function to render a matrix (foregrounds as rows, surfaces as columns)
  function renderMatrix(surfaces, foregrounds, titleText) {
    if (!surfaces.length || !foregrounds.length) return;

    const title = document.createElement("h4");
    title.textContent = titleText;
    title.style.marginTop = surfaces === validNeutralSurfaces ? "0" : "24px";
    title.style.marginBottom = "8px";
    title.style.fontSize = "13px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text)";
    semanticMatrixGrid.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "matrix-grid";
    grid.style.gridTemplateColumns = `repeat(${surfaces.length + 1}, minmax(90px, 1fr))`;

    // Header row - surfaces as columns
    const headerCell = document.createElement("div");
    headerCell.className = "matrix-cell header";
    grid.appendChild(headerCell);

    surfaces.forEach((bg) => {
      const cell = document.createElement("div");
      cell.className = "matrix-cell header";
      cell.textContent = bg.name;
      grid.appendChild(cell);
    });

    let passStrongCount = 0;
    let passWeakCount = 0;

    // Foregrounds as rows
    foregrounds.forEach((fg) => {
      const rowHeader = document.createElement("div");
      rowHeader.className = "matrix-cell header";
      rowHeader.textContent = fg.name;
      grid.appendChild(rowHeader);

      surfaces.forEach((bg) => {
        const ratio = getContrastRatio(bg.hex, fg.hex);
        let cellClass = "fail";
        
        // Determine threshold based on whether this is text or outline
        const isOutline = fg.name.startsWith("outline.");
        const threshold = isOutline ? outlineThreshold : normalThreshold;
        const largeTxtThreshold = isOutline ? outlineThreshold : largeThreshold;

        if (typeof ratio === "number") {
          if (ratio >= threshold) {
            cellClass = "pass-strong";
            passStrongCount += 1;
          } else if (ratio >= largeTxtThreshold) {
            cellClass = "pass-weak";
            passWeakCount += 1;
          }
        }

        const cell = document.createElement("div");
        cell.className = `matrix-cell ${cellClass}`;
        cell.textContent = typeof ratio === "number" ? `${ratio.toFixed(1)}×` : "—";
        grid.appendChild(cell);
      });
    });

    semanticMatrixGrid.appendChild(grid);
    
    totalPassStrong += passStrongCount;
    totalPassWeak += passWeakCount;
  }

  // Render both matrices
  renderMatrix(validNeutralSurfaces, validNeutralText, "Text & Outlines on Neutral Surfaces");
  renderMatrix(validInvertedSurfaces, validInvertedText, "Inverted Text & Outlines on Inverted Surfaces");

  semanticMatrixPassCount.textContent = `${totalPassStrong} strong / ${totalPassWeak} weak`;
}

function renderSemanticPreview(semantic, complianceMode, tokens, scale) {
  const previewContainer = document.getElementById("semantic-preview-container");
  if (!previewContainer || !semantic) {
    return;
  }

  // Build CSS variables from semantic tokens for the template
  const cssVars = {};
  
  // Map neutral tokens to CSS variables
  if (semantic.surface) cssVars['--semantic-surface-neutral-surface'] = semantic.surface.hex;
  if (semantic.surfaceVariant) cssVars['--semantic-surface-neutral-surfaceVariant'] = semantic.surfaceVariant.hex;
  if (semantic.surfaceInverted) cssVars['--semantic-surface-neutral-surfaceInverted'] = semantic.surfaceInverted.hex;
  if (semantic.surfaceInvertedVariant) cssVars['--semantic-surface-neutral-surfaceInvertedVariant'] = semantic.surfaceInvertedVariant.hex;
  
  // Map text tokens
  if (semantic.text) {
    if (semantic.text.primary) cssVars['--semantic-text-primary'] = semantic.text.primary.hex;
    if (semantic.text.secondary) cssVars['--semantic-text-secondary'] = semantic.text.secondary.hex;
    if (semantic.text.tertiary) cssVars['--semantic-text-tertiary'] = semantic.text.tertiary.hex;
  }
  
  if (semantic.textInverted) {
    if (semantic.textInverted.primary) cssVars['--semantic-text-onSurfaceInverted'] = semantic.textInverted.primary.hex;
  }
  
  // Map outline tokens
  if (semantic.outline) {
    if (semantic.outline.default) cssVars['--semantic-outline-neutral-default'] = semantic.outline.default.hex;
    if (semantic.outline.variant) cssVars['--semantic-outline-neutral-variant'] = semantic.outline.variant.hex;
  }

  // Extract primary surface hex values from tokens (not scale)
  if (tokens && tokens.color && tokens.color.semantic && tokens.color.semantic.surface && tokens.color.semantic.surface.primary) {
    const primarySurface = tokens.color.semantic.surface.primary;
    
    // surfacePrimary - resolve from seed
    if (primarySurface.surfacePrimary && primarySurface.surfacePrimary.$value === "{color.seed.primary}") {
      if (tokens.color.seed && tokens.color.seed.primary) {
        cssVars['--semantic-surface-primary-surface'] = tokens.color.seed.primary.$value;
      }
    }
    
    // surfacePrimarySubtle - resolve from palette reference
    if (primarySurface.surfacePrimarySubtle && primarySurface.surfacePrimarySubtle.$value) {
      const ref = primarySurface.surfacePrimarySubtle.$value;
      const refMatch = ref.match(/\{color\.palettes\.primary\.(\d+)\}/);
      if (refMatch) {
        const label = refMatch[1];
        const entry = scale.find((item) => item.name === `color.primary.${label}`);
        if (entry) cssVars['--semantic-surface-primary-subtle'] = entry.hex;
      }
    }
    
    // primarySurfaceIntense - resolve from palette reference
    if (primarySurface.primarySurfaceIntense && primarySurface.primarySurfaceIntense.$value) {
      const ref = primarySurface.primarySurfaceIntense.$value;
      const refMatch = ref.match(/\{color\.palettes\.primary\.(\d+)\}/);
      if (refMatch) {
        const label = refMatch[1];
        const entry = scale.find((item) => item.name === `color.primary.${label}`);
        if (entry) cssVars['--semantic-surface-primary-intense'] = entry.hex;
      }
    }
  }

  // Extract textOnPrimary from tokens object
  if (tokens && tokens.color && tokens.color.semantic && tokens.color.semantic.text && tokens.color.semantic.text.onPrimary) {
    const textOnPrimaryToken = tokens.color.semantic.text.onPrimary.default;
    if (textOnPrimaryToken && textOnPrimaryToken.$value) {
      const ref = textOnPrimaryToken.$value;
      
      // Resolve the reference to actual hex value
      if (ref === "{color.seed.white}") {
        cssVars['--semantic-text-onPrimary'] = "#FFFFFF";
      } else {
        // Extract from reference like "{color.palettes.neutral.950}"
        const refMatch = ref.match(/\{color\.palettes\.(neutral|primary)\.(\d+)\}/);
        if (refMatch) {
          const palette = refMatch[1];
          const label = refMatch[2];
          const scalePrefix = palette === "neutral" ? "greyscale.scale" : "color.primary";
          const entry = scale.find((item) => item.name === `${scalePrefix}.${label}`);
          if (entry) {
            cssVars['--semantic-text-onPrimary'] = entry.hex;
          } else {
            cssVars['--semantic-text-onPrimary'] = "#FFFFFF";
          }
        } else {
          cssVars['--semantic-text-onPrimary'] = "#FFFFFF";
        }
      }
    }
  }


  // Template HTML from preview-template
  const templateHTML = `
    <div class="surface">
      <div class="baseSurface">
        <p class="preview-heading">This is Alchemy</p>
        <p class="primaryText"> Alchemy (from the Arabic word al-kīmīā, الكیمیاء) Alchemy is an ancient branch of natural philosophy, a philosophical and protoscientific tradition that was historically practised in China, India, the Muslim world, and Europe.[1] In its Western form, alchemy is first attested in a number of pseudepigraphical texts written in Greco-Roman Egypt during the first few centuries AD.[2] Greek-speaking alchemists often referred to their craft as "the Art" (τέχνη) or "Knowledge" (ἐπιστήμη), and it was often characterised as mystic (μυστική), sacred (ἱɛρά), or divine (θɛíα).[3]
        </p>
        <p class="secondaryText"> The defining objectives of alchemy are varied and include the creation of the philosopher's stone, the transmutation of base metals into noble metals (particularly gold); and the creation of an elixir of immortality; the perfection of the human body and soul. In Europe, these ideas were first connected
        </p>
        <p class="tertiaryText"> You are now a color alchemist</p>
      </div>
      <div class="row">
        <div class="box surfaceVariant">Ingredients</div>
        <div class="box surfaceInverted">
          Instructions
          <div class="box surfaceInvertedVariant">luck</div>
        </div>
        <div class="box primarySurface"><span class="onPrimary">Magic</span></div>
      </div>
    </div>
  `;

  previewContainer.innerHTML = templateHTML;

  // Apply CSS variables as inline styles on the preview container
  Object.entries(cssVars).forEach(([key, value]) => {
    previewContainer.style.setProperty(key, value);
  });

  // Add inline styles for the template
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    #semantic-preview-container .surfaceInvertedVariant {
      background-color: var(--semantic-surface-neutral-surfaceInvertedVariant);
      color: var(--semantic-text-onSurfaceInverted);
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
    }

    #semantic-preview-container .surface {
      background-color: var(--semantic-surface-neutral-surface);
      padding: 16px;
      border-radius: 8px;
    }

    #semantic-preview-container .baseSurface {
      background-color: var(--semantic-surface-neutral-base);
      padding: 16px;
      border-radius: 8px;
    }

    #semantic-preview-container .primaryText {
      color: var(--semantic-text-primary);
      font-size: 1rem;
    }

    #semantic-preview-container .secondaryText {
      color: var(--semantic-text-secondary);
      font-size: 0.875rem;
    }

    #semantic-preview-container .tertiaryText {
      color: var(--semantic-text-tertiary);
      font-size: 0.75rem;
    }

    #semantic-preview-container .preview-heading {
      color: var(--semantic-text-primary);
      font-weight: bold;
      font-size: 1.25rem;
    }

    #semantic-preview-container .row {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    #semantic-preview-container .box {
      flex: 1;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
    }

    #semantic-preview-container .surfaceVariant {
      background-color: var(--semantic-surface-neutral-surfaceVariant);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .surfaceInverted {
      background-color: var(--semantic-surface-neutral-surfaceInverted);
      color: var(--semantic-text-onSurfaceInverted);
    }

    #semantic-preview-container .primarySurface {
      background-color: var(--semantic-surface-primary-surface);
    }

    #semantic-preview-container .primarySurface:hover {
      background-color: var(--semantic-surface-primary-intense);
    }

    #semantic-preview-container .onPrimary {
      color: var(--semantic-text-onPrimary);
    }
  `;
  previewContainer.appendChild(styleEl);
}


function updateDerivedPreview() {
  const normalized = normalizeHex(primaryInput.value);
  primarySwatch.style.background = normalized || "#222";
  const derived = deriveGreyscaleColor(primaryInput.value, satInput.value, currentTintColorMode);
  if (!derived) {
    derivedHexInput.value = "";
    derivedSwatch.style.background = "#222";
    derivedLabel.textContent = "invalid";
    return null;
  }
  derivedHexInput.value = derived.hex;
  derivedSwatch.style.background = derived.hex;
  derivedLabel.textContent = derived.hex;
  return derived;
}

function createTokens(scale, prefix, primaryData, derivedData, semanticNeutral) {
  const safePrefix = (prefix || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/^\.+|\.+$/g, "");

  // Build a nested W3C design tokens object following template structure:
  // color.seed.primary, color.seed.neutral, color.palettes.primary.*, color.palettes.neutral.*
  const root = {};
  const colorGroup = safePrefix ? { [safePrefix]: {} } : { color: {} };
  const colorKey = safePrefix ? safePrefix : "color";

  // Initialize structure
  if (!root[colorKey]) root[colorKey] = {};
  if (!root[colorKey].seed) root[colorKey].seed = {};
  if (!root[colorKey].palettes) root[colorKey].palettes = {};

  // Add seed colors
  if (primaryData && primaryData.hex) {
    root[colorKey].seed.primary = {
      $value: primaryData.hex,
      $type: "color",
      $description: "Primary seed color",
    };
  }

  if (derivedData && derivedData.hex) {
    root[colorKey].seed.neutral = {
      $value: derivedData.hex,
      $type: "color",
      $description: "Neutral seed color",
    };
  }

  // Add white seed color
  root[colorKey].seed.white = {
    $value: "#FFFFFF",
    $type: "color",
    $description: "White seed color",
  };

  // Add palettes (primary and neutral scales)
  root[colorKey].palettes = root[colorKey].palettes || {};
  root[colorKey].palettes.primary = {};
  root[colorKey].palettes.neutral = {};

  scale.forEach((item) => {
    // Determine if this is a primary or neutral entry and extract the label
    let isPrimary = false;
    let label = null;

    if (item.name.includes("color.primary")) {
      isPrimary = true;
      label = item.name.replace("color.primary.", "");
    } else if (item.name.includes("greyscale.scale")) {
      isPrimary = false;
      label = item.name.replace("greyscale.scale.", "");
    }

    if (label) {
      const tokenObj = {
        $value: item.hex,
        $type: "color",
      };

      // Use reference for seed colors (500)
      if (label === "500") {
        if (isPrimary && item.isSeed) {
          tokenObj.$value = "{color.seed.primary}";
        } else if (!isPrimary && item.isSeed) {
          tokenObj.$value = "{color.seed.neutral}";
        }
      }

      if (isPrimary) {
        root[colorKey].palettes.primary[label] = tokenObj;
      } else {
        root[colorKey].palettes.neutral[label] = tokenObj;
      }
    }
  });

  // Initialize semantic structure: semantic { surface { neutral, primary }, outline { neutral, primary }, text { neutral, primary }, ... }
  root[colorKey].semantic = {
    surface: {},
    outline: {},
    text: {},
  };

  // Add semantic tokens from pre-generated neutral semantic (passed as parameter)
  if (semanticNeutral) {
    // Add neutral surface tokens under semantic.surface.neutral
    root[colorKey].semantic.surface.neutral = {};
    root[colorKey].semantic.surface.neutral.base = { $value: "{color.seed.white}", $type: "color" };
    if (semanticNeutral.surface) root[colorKey].semantic.surface.neutral.surface = { $value: semanticNeutral.surface.ref, $type: "color" };
    if (semanticNeutral.surfaceVariant) root[colorKey].semantic.surface.neutral.surfaceVariant = { $value: semanticNeutral.surfaceVariant.ref, $type: "color" };
    if (semanticNeutral.surfaceInverted) root[colorKey].semantic.surface.neutral.surfaceInverted = { $value: semanticNeutral.surfaceInverted.ref, $type: "color" };
    if (semanticNeutral.surfaceInvertedVariant) root[colorKey].semantic.surface.neutral.surfaceInvertedVariant = { $value: semanticNeutral.surfaceInvertedVariant.ref, $type: "color" };

    // Add neutral text tokens under semantic.text.neutral
    root[colorKey].semantic.text.neutral = {};
    if (semanticNeutral.text) {
      if (semanticNeutral.text.primary) root[colorKey].semantic.text.neutral.primary = { $value: semanticNeutral.text.primary.ref, $type: "color" };
      if (semanticNeutral.text.secondary) root[colorKey].semantic.text.neutral.secondary = { $value: semanticNeutral.text.secondary.ref, $type: "color" };
      if (semanticNeutral.text.tertiary) root[colorKey].semantic.text.neutral.tertiary = { $value: semanticNeutral.text.tertiary.ref, $type: "color" };
    }

    // Add neutral text inverted tokens under semantic.text.neutral.inverted
    if (!root[colorKey].semantic.text.neutral.inverted) root[colorKey].semantic.text.neutral.inverted = {};
    if (semanticNeutral.textInverted) {
      if (semanticNeutral.textInverted.primary) root[colorKey].semantic.text.neutral.inverted.primary = { $value: semanticNeutral.textInverted.primary.ref, $type: "color" };
      if (semanticNeutral.textInverted.secondary) root[colorKey].semantic.text.neutral.inverted.secondary = { $value: semanticNeutral.textInverted.secondary.ref, $type: "color" };
      if (semanticNeutral.textInverted.tertiary) root[colorKey].semantic.text.neutral.inverted.tertiary = { $value: semanticNeutral.textInverted.tertiary.ref, $type: "color" };
    }

    // Add neutral outline tokens under semantic.outline.neutral
    root[colorKey].semantic.outline.neutral = {};
    if (semanticNeutral.outline) {
      if (semanticNeutral.outline.default) root[colorKey].semantic.outline.neutral.default = { $value: semanticNeutral.outline.default.ref, $type: "color" };
      if (semanticNeutral.outline.variant) root[colorKey].semantic.outline.neutral.variant = { $value: semanticNeutral.outline.variant.ref, $type: "color" };
    }

    // Add neutral outline inverted tokens under semantic.outline.neutral.inverted
    if (!root[colorKey].semantic.outline.neutral.inverted) root[colorKey].semantic.outline.neutral.inverted = {};
    if (semanticNeutral.outlineInverted) {
      if (semanticNeutral.outlineInverted.default) root[colorKey].semantic.outline.neutral.inverted.default = { $value: semanticNeutral.outlineInverted.default.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.variant) root[colorKey].semantic.outline.neutral.inverted.variant = { $value: semanticNeutral.outlineInverted.variant.ref, $type: "color" };
    }
  }

  // Add semantic tokens for primary scale (primary surfaces & outlines)
  // Always use primaryData (seed) for surfacePrimary, then calculate subtle/intense from it
  if (primaryData && primaryData.hex && primaryData.hsl) {
    // Initialize primary sub-objects if they don't exist
    if (!root[colorKey].semantic.surface.primary) root[colorKey].semantic.surface.primary = {};
    if (!root[colorKey].semantic.outline.primary) root[colorKey].semantic.outline.primary = {};

    // surfacePrimary & outlinePrimary -> always use seed
    root[colorKey].semantic.surface.primary.surfacePrimary = { $value: "{color.seed.primary}", $type: "color" };
    root[colorKey].semantic.outline.primary.outlinePrimary = { $value: "{color.seed.primary}", $type: "color" };

    // Calculate subtle (lighter) and intense (darker) from seed using HSL
    const { h, s, l } = primaryData.hsl;
    
    // Subtle: lighten by 15%
    const subtleLightness = Math.min(l + 0.15, 0.95);
    const subtleRgb = hslToRgb(h, s, subtleLightness);
    const subtleHex = rgbToHex(subtleRgb.r, subtleRgb.g, subtleRgb.b);
    
    // Intense: darken by 15%
    const intenseLightness = Math.max(l - 0.15, 0.05);
    const intenseRgb = hslToRgb(h, s, intenseLightness);
    const intenseHex = rgbToHex(intenseRgb.r, intenseRgb.g, intenseRgb.b);
    
    // Find or create palette entries for subtle and intense
    const primaryScaleEntries = scale.filter((item) => item.name.includes("color.primary"));
    
    // Find closest match in scale for subtle
    let closestSubtle = primaryScaleEntries[0];
    let minSubtleDiff = Infinity;
    for (const entry of primaryScaleEntries) {
      const entryRgb = hexToRgb(entry.hex);
      if (entryRgb) {
        const entryHsl = rgbToHsl(entryRgb.r, entryRgb.g, entryRgb.b);
        const diff = Math.abs(entryHsl.l - subtleLightness);
        if (diff < minSubtleDiff) {
          minSubtleDiff = diff;
          closestSubtle = entry;
        }
      }
    }
    
    // Find closest match in scale for intense
    let closestIntense = primaryScaleEntries[primaryScaleEntries.length - 1];
    let minIntenseDiff = Infinity;
    for (const entry of primaryScaleEntries) {
      const entryRgb = hexToRgb(entry.hex);
      if (entryRgb) {
        const entryHsl = rgbToHsl(entryRgb.r, entryRgb.g, entryRgb.b);
        const diff = Math.abs(entryHsl.l - intenseLightness);
        if (diff < minIntenseDiff) {
          minIntenseDiff = diff;
          closestIntense = entry;
        }
      }
    }
    
    // Extract label helper
    function getPrimaryLabel(item) {
      if (!item || !item.name) return null;
      const m = item.name.match(/(\d+)/);
      return m ? m[0] : null;
    }
    
    const subtleLabel = getPrimaryLabel(closestSubtle);
    const intenseLabel = getPrimaryLabel(closestIntense);
    
    if (subtleLabel) {
      root[colorKey].semantic.surface.primary.surfacePrimarySubtle = { $value: `{color.palettes.primary.${subtleLabel}}`, $type: "color" };
      root[colorKey].semantic.outline.primary.outlinePrimarySubtle = { $value: `{color.palettes.primary.${subtleLabel}}`, $type: "color" };
    }
    
    if (intenseLabel) {
      root[colorKey].semantic.surface.primary.primarySurfaceIntense = { $value: `{color.palettes.primary.${intenseLabel}}`, $type: "color" };
      root[colorKey].semantic.outline.primary.primaryOutlineIntense = { $value: `{color.palettes.primary.${intenseLabel}}`, $type: "color" };
    }

    // textOnPrimary: check contrast between primary surface (seed) and textPrimary from neutral scale
    // If contrast >= 4.5:1, use textPrimary, else use white
    if (!root[colorKey].semantic.text.onPrimary) root[colorKey].semantic.text.onPrimary = {};

    if (semanticNeutral && semanticNeutral.text && semanticNeutral.text.primary) {
      // Use the hex value directly from the semantic object
      const textPrimaryHex = semanticNeutral.text.primary.hex;
      const contrastOnPrimary = getContrastRatio(primaryData.hex, textPrimaryHex);
      
      if (typeof contrastOnPrimary === "number" && contrastOnPrimary >= 4.5) {
        // Use neutral text.primary as textOnPrimary
        root[colorKey].semantic.text.onPrimary.default = { $value: semanticNeutral.text.primary.ref, $type: "color" };
      } else {
        // Use white
        root[colorKey].semantic.text.onPrimary.default = { $value: "{color.seed.white}", $type: "color" };
      }
    } else {
      // Fallback to white if semantic text is not available
      root[colorKey].semantic.text.onPrimary.default = { $value: "{color.seed.white}", $type: "color" };
    }
  }

  return root;
}

function generateSemanticFromNeutral(neutralScale, complianceMode = "AA") {
  // neutralScale: array of {name, hex} from light to dark (50 to 950)
  // Thresholds based on compliance mode
  const textThreshold = complianceMode === "AAA" ? 7 : 4.5;
  const outlineThreshold = complianceMode === "AAA" ? 4.5 : 3;
  
  if (!Array.isArray(neutralScale) || neutralScale.length === 0) {
    return null;
  }

  // Helper: extract label from name (e.g., "greyscale.scale.950" -> "950")
  function getLabel(item) {
    if (!item || !item.name) return null;
    const match = item.name.match(/(50|100|200|300|500|600|700|800|900|950)/);
    return match ? match[0] : null;
  }

  // Helper: create token reference
  function makeRef(label) {
    return `{color.palettes.neutral.${label}}`;
  }

  // Surfaces: least contrast with white (#FFFFFF) = surface, next = surfaceVariant
  //           least contrast with black (#000000) = surfaceInverted, previous = surfaceInvertedVariant
  let minContrastWhite = Infinity;
  let minContrastBlack = Infinity;
  let surfaceIdx = 0;
  let surfaceInvertedIdx = neutralScale.length - 1;

  for (let i = 0; i < neutralScale.length; i++) {
    const contrastW = getContrastRatio(neutralScale[i].hex, "#FFFFFF");
    const contrastB = getContrastRatio(neutralScale[i].hex, "#000000");
    
    if (typeof contrastW === "number" && contrastW < minContrastWhite) {
      minContrastWhite = contrastW;
      surfaceIdx = i;
    }
    if (typeof contrastB === "number" && contrastB < minContrastBlack) {
      minContrastBlack = contrastB;
      surfaceInvertedIdx = i;
    }
  }

  const surface = neutralScale[surfaceIdx];
  const surfaceVariant = neutralScale[Math.min(surfaceIdx + 1, neutralScale.length - 1)];
  const surfaceInverted = neutralScale[surfaceInvertedIdx];
  const surfaceInvertedVariant = neutralScale[Math.max(surfaceInvertedIdx - 1, 0)];

  // Text tokens: scan from light to dark, collect first 3 that meet threshold.
  // This ensures tertiary is the LIGHTEST passing, then darker for secondary, darkest for primary.
  const textTokens = { primary: null, secondary: null, tertiary: null };
  const passingText = [];
  for (let i = 0; i < neutralScale.length && passingText.length < 3; i++) {
    const ratio = getContrastRatio(surfaceVariant.hex, neutralScale[i].hex);
    if (typeof ratio === "number" && ratio >= textThreshold) {
      passingText.push(neutralScale[i]);
    }
  }
  // Fallback assignments to guarantee all three text tokens exist
  if (passingText.length === 1) {
    textTokens.tertiary = passingText[0];
    textTokens.secondary = passingText[0];
    textTokens.primary = passingText[0];
  } else if (passingText.length === 2) {
    textTokens.tertiary = passingText[0];
    textTokens.secondary = passingText[0]; // duplicate to preserve hierarchy
    textTokens.primary = passingText[1];
  } else if (passingText.length >= 3) {
    textTokens.tertiary = passingText[0];
    textTokens.secondary = passingText[1];
    textTokens.primary = passingText[2];
  }

  // Text inverted: scan from light to dark (since background is dark) collecting first 3 passing.
  // For inverted (light text on dark bg), primary should be LIGHTEST, tertiary should be DARKEST
  const textInvertedTokens = { primary: null, secondary: null, tertiary: null };
  const passingInverted = [];
  for (let i = 0; i < neutralScale.length && passingInverted.length < 3; i++) {
    const ratio = getContrastRatio(surfaceInvertedVariant.hex, neutralScale[i].hex);
    if (typeof ratio === "number" && ratio >= textThreshold) {
      passingInverted.push(neutralScale[i]);
    }
  }
  if (passingInverted.length === 1) {
    textInvertedTokens.tertiary = passingInverted[0];
    textInvertedTokens.secondary = passingInverted[0];
    textInvertedTokens.primary = passingInverted[0];
  } else if (passingInverted.length === 2) {
    textInvertedTokens.primary = passingInverted[0];   // lightest
    textInvertedTokens.secondary = passingInverted[0]; // duplicate
    textInvertedTokens.tertiary = passingInverted[1];  // darker
  } else if (passingInverted.length >= 3) {
    textInvertedTokens.primary = passingInverted[0];   // lightest
    textInvertedTokens.secondary = passingInverted[1]; // middle
    textInvertedTokens.tertiary = passingInverted[2];  // darkest
  }

  // Outline tokens: search forward from darkest until passing threshold with surface
  // outline (first to pass), outlineVariant (next)
  const outlineTokens = { default: null, variant: null };
  let foundCount = 0;

  for (let i = neutralScale.length - 1; i >= 0 && foundCount < 2; i--) {
    const ratio = getContrastRatio(surfaceVariant.hex, neutralScale[i].hex);
    if (typeof ratio === "number" && ratio >= outlineThreshold) {
      if (foundCount === 0) outlineTokens.default = neutralScale[i];
      else if (foundCount === 1) outlineTokens.variant = neutralScale[i];
      foundCount++;
    }
  }

  // Outline inverted: search forward from lighter colors
  const outlineInvertedTokens = { default: null, variant: null };
  let foundCountInverted = 0;

  for (let i = 0; i < neutralScale.length && foundCountInverted < 2; i++) {
    const ratio = getContrastRatio(surfaceInvertedVariant.hex, neutralScale[i].hex);
    if (typeof ratio === "number" && ratio >= outlineThreshold) {
      if (foundCountInverted === 0) outlineInvertedTokens.default = neutralScale[i];
      else if (foundCountInverted === 1) outlineInvertedTokens.variant = neutralScale[i];
      foundCountInverted++;
    }
  }

  return {
    surface: { hex: surface.hex, ref: makeRef(getLabel(surface)) },
    surfaceVariant: { hex: surfaceVariant.hex, ref: makeRef(getLabel(surfaceVariant)) },
    surfaceInverted: { hex: surfaceInverted.hex, ref: makeRef(getLabel(surfaceInverted)) },
    surfaceInvertedVariant: { hex: surfaceInvertedVariant.hex, ref: makeRef(getLabel(surfaceInvertedVariant)) },
    text: {
      primary: textTokens.primary ? { hex: textTokens.primary.hex, ref: makeRef(getLabel(textTokens.primary)) } : null,
      secondary: textTokens.secondary ? { hex: textTokens.secondary.hex, ref: makeRef(getLabel(textTokens.secondary)) } : null,
      tertiary: textTokens.tertiary ? { hex: textTokens.tertiary.hex, ref: makeRef(getLabel(textTokens.tertiary)) } : null,
    },
    textInverted: {
      primary: textInvertedTokens.primary ? { hex: textInvertedTokens.primary.hex, ref: makeRef(getLabel(textInvertedTokens.primary)) } : null,
      secondary: textInvertedTokens.secondary ? { hex: textInvertedTokens.secondary.hex, ref: makeRef(getLabel(textInvertedTokens.secondary)) } : null,
      tertiary: textInvertedTokens.tertiary ? { hex: textInvertedTokens.tertiary.hex, ref: makeRef(getLabel(textInvertedTokens.tertiary)) } : null,
    },
    outline: {
      default: outlineTokens.default ? { hex: outlineTokens.default.hex, ref: makeRef(getLabel(outlineTokens.default)) } : null,
      variant: outlineTokens.variant ? { hex: outlineTokens.variant.hex, ref: makeRef(getLabel(outlineTokens.variant)) } : null,
    },
    outlineInverted: {
      default: outlineInvertedTokens.default ? { hex: outlineInvertedTokens.default.hex, ref: makeRef(getLabel(outlineInvertedTokens.default)) } : null,
      variant: outlineInvertedTokens.variant ? { hex: outlineInvertedTokens.variant.hex, ref: makeRef(getLabel(outlineInvertedTokens.variant)) } : null,
    },
  };
}

function generateTokens() {
  try {
    const derived = updateDerivedPreview();
    if (!derived) {
      output.value = "Invalid primary colour.";
      copyBtn.disabled = true;
      tokenCount.textContent = "0";
      renderScale();
      renderMatrix();
      return;
    }

    const scale = generateGreyscaleScale(derived);
    // Build primaryData from the user's primary input so the primary scale uses the actual primary seed
    const primaryHex = normalizeHex(primaryInput.value);
    let primaryData = null;
    if (primaryHex) {
      const prgb = hexToRgb(primaryHex);
      if (prgb) {
        primaryData = { hex: primaryHex, hsl: rgbToHsl(prgb.r, prgb.g, prgb.b) };
      }
    }
    const primaryScale = generatePrimaryScale(primaryData);
    // Render greyscale and primary scales in separate preview sections
    renderScale(scale);
    renderPrimaryScale(primaryScale);
    // Matrix should only use the greyscale combinations
    renderMatrix(scale);
    // Render primary color matrix with neutral + white as foregrounds
    renderPrimaryColorMatrix(primaryScale, scale);

    // Generate semantic tokens from neutral scale FIRST
    const neutralScale = scale.filter((item) => item.name.includes("greyscale.scale"));
    let semantic = null;
    if (neutralScale.length > 0) {
      const complianceMode = complianceLevel ? complianceLevel.value : "AA";
      semantic = generateSemanticFromNeutral(neutralScale, complianceMode);
    }

    // Pass primaryData, derived, and semantic to createTokens so it can use semantic.text.primary
    const tokens = createTokens(scale.concat(primaryScale), prefixInput ? prefixInput.value : "", primaryData, derived, semantic);

    // Render semantic tokens preview
    if (semantic) {
      const complianceMode = complianceLevel ? complianceLevel.value : "AA";
      // Pass combined scale (neutral + primary) so preview can extract primary values
      renderSemanticPreview(semantic, complianceMode, tokens, scale.concat(primaryScale));
      // Render semantic contrast matrix
      renderSemanticMatrix(tokens, complianceMode);
    }

    // Count leaves in the nested W3C tokens object
    function countLeaves(obj) {
      let count = 0;
      Object.keys(obj || {}).forEach((key) => {
        const val = obj[key];
        if (val && typeof val === "object" && (Object.prototype.hasOwnProperty.call(val, "$value") || Object.prototype.hasOwnProperty.call(val, "value"))) {
          count += 1;
        } else if (val && typeof val === "object") {
          count += countLeaves(val);
        }
      });
      return count;
    }

    const total = countLeaves(tokens);
    tokenCount.textContent = total.toString();
    const format = formatSelect ? formatSelect.value : "json";
    output.value = formatTokens(tokens, format);
    copyBtn.disabled = total === 0;
  } catch (err) {
    console.error("generateTokens error", err);
    output.value = `Error generating tokens: ${err.message}`;
    copyBtn.disabled = true;
  }
}

// Color picker functionality for primary color
if (primaryColorPicker) {
  // Open color picker when swatch is clicked
  primarySwatch.addEventListener("click", () => {
    primaryColorPicker.click();
  });

  // Update text input and swatch when color picker changes
  primaryColorPicker.addEventListener("input", (e) => {
    const color = e.target.value.toUpperCase();
    primaryInput.value = color;
    generateTokens();
  });
}

primaryInput.addEventListener("input", () => {
  const normalized = normalizeHex(primaryInput.value);
  if (normalized && primaryColorPicker) {
    primaryColorPicker.value = normalized;
  }
  generateTokens();
});

// Tint amount switch listeners
const tintAmountSwitches = document.querySelectorAll("#tintAmountSwitch-low, #tintAmountSwitch-mid, #tintAmountSwitch-high");
tintAmountSwitches.forEach((button) => {
  button.addEventListener("click", (event) => {
    // Remove active class from all amount buttons
    tintAmountSwitches.forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    event.target.classList.add("active");
    // Update current tint level
    currentTintLevel = event.target.dataset.value;
    // Update hidden saturation input with calculated value
    satInput.value = Math.round(tintAmounts[currentTintLevel] * 100) / 100;
    // Generate tokens
    generateTokens();
  });
});

// Tint color switch listeners
const tintColorSwitches = document.querySelectorAll("#tintColorSwitch-primary, #tintColorSwitch-complimentary");
tintColorSwitches.forEach((button) => {
  button.addEventListener("click", (event) => {
    // Remove active class from all color buttons
    tintColorSwitches.forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    event.target.classList.add("active");
    // Update current tint color mode
    currentTintColorMode = event.target.dataset.value;
    // Generate tokens
    generateTokens();
  });
});

generateBtn.addEventListener("click", generateTokens);

complianceLevel.addEventListener("change", () => {
  const primary = normalizeHex(primaryInput.value);
  const saturation = clamp(Number(satInput.value) || 0, 0, 30);
  const derived = deriveGreyscaleColor(primary, saturation, currentTintColorMode);
  if (derived) {
    const gScale = generateGreyscaleScale(derived);
    renderMatrix(gScale);
    // Also render primary color matrix
    const primaryData = { hex: primary, hsl: rgbToHsl(...Object.values(hexToRgb(primary) || {})), saturation: 1 };
    const primaryScale = generatePrimaryScale(primaryData);
    renderPrimaryColorMatrix(primaryScale, gScale);
  } else {
    renderMatrix();
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy output";
    }, 1500);
  } catch (error) {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy output";
    }, 1500);
  }
});

resetBtn.addEventListener("click", () => {
  primaryInput.value = "#3366FF";
  if (primaryColorPicker) {
    primaryColorPicker.value = "#3366FF";
  }
  currentTintLevel = "low";
  currentTintColorMode = "primary";
  satInput.value = Math.round(tintAmounts.low * 100) / 100;
  if (prefixInput) prefixInput.value = "";
  if (formatSelect) formatSelect.value = "json";
  complianceLevel.value = "AA";
  output.value = "";
  copyBtn.disabled = true;
  tokenCount.textContent = "0";
  derivedHexInput.value = "";
  derivedSwatch.style.background = "#222";
  derivedLabel.textContent = "—";
  // Update tint amount switch UI
  tintAmountSwitches.forEach((btn) => btn.classList.remove("active"));
  document.getElementById("tintAmountSwitch-low").classList.add("active");
  // Update tint color switch UI
  tintColorSwitches.forEach((btn) => btn.classList.remove("active"));
  document.getElementById("tintColorSwitch-primary").classList.add("active");
  renderScale();
  renderPrimaryScale();
  renderMatrix();
});

// Generate random tint amounts on app load
generateRandomTintAmounts();
satInput.value = Math.round(tintAmounts.low * 100) / 100;

// Ensure the primary input and color picker are synchronized on load
const _initialPrimary = normalizeHex(primaryInput && primaryInput.value ? primaryInput.value : "");
if (_initialPrimary) {
  if (primaryInput) primaryInput.value = _initialPrimary;
  if (primaryColorPicker) primaryColorPicker.value = _initialPrimary;
}
updateDerivedPreview();
renderScale();
renderMatrix();
renderPrimaryScale();