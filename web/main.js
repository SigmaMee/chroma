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

function createTokens(scale, prefix, primaryData, derivedData) {
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

  return root;
}

function generateTokens() {
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

  // Pass primaryData and derived (greyscale) so aliases and scales use correct seeds
  const tokens = createTokens(scale.concat(primaryScale), prefixInput ? prefixInput.value : "", primaryData, derived);

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