const primaryInput = document.getElementById("primaryColor");
const primarySwatch = document.getElementById("primarySwatch");
const satRange = document.getElementById("greyscaleSaturation");
const satInput = document.getElementById("greyscaleSaturationValue");
const formatSelect = document.getElementById("format");
const prefixInput = document.getElementById("prefix");
const derivedHexInput = document.getElementById("derivedHex");
const derivedSwatch = document.getElementById("derivedSwatch");
const derivedLabel = document.getElementById("derivedLabel");
const scaleGrid = document.getElementById("scale-grid");
const scaleCount = document.getElementById("scale-count");
const matrixGrid = document.getElementById("matrix-grid");
const matrixPassCount = document.getElementById("matrix-pass-count");
const matrixNote = document.getElementById("matrix-note");
const complianceLevel = document.getElementById("complianceLevel");
const output = document.getElementById("output");
const generateBtn = document.getElementById("generate");
const copyBtn = document.getElementById("copy");
const resetBtn = document.getElementById("reset");
const tokenCount = document.getElementById("token-count");

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

function deriveGreyscaleColor(primaryHex, saturationPercent) {
  const normalized = normalizeHex(primaryHex);
  if (!normalized) {
    return null;
  }
  const rgb = hexToRgb(normalized);
  if (!rgb) {
    return null;
  }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
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
  let darkerSteps = 4;

  if (hsl.l > 0.6) {
    lighterSteps = 0;
    darkerSteps = 8;
  } else if (hsl.l < 0.2) {
    lighterSteps = 8;
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
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ];

  return ordered.slice(0, 9).map((entry, index) => ({
    name: `greyscale.scale.${scaleLabels[index]}`,
    hex: entry.hex,
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
  if (format === "css") {
    const lines = tokens.map((token) => `  --${token.name}: ${token.hex};`);
    return `:root {\n${lines.join("\n")}\n}`;
  }
  const json = tokens.reduce((acc, token) => {
    acc[token.name] = token.hex;
    return acc;
  }, {});
  return JSON.stringify(json, null, 2);
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

function renderMatrix(scale) {
  const colors = Array.isArray(scale) ? scale : [];
  matrixGrid.innerHTML = "";
  matrixPassCount.textContent = "0";

  if (!colors.length) {
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
    colors.length + 1
  }, minmax(70px, 1fr))`;

  const headerCell = document.createElement("div");
  headerCell.className = "matrix-cell header";
  matrixGrid.appendChild(headerCell);

  colors.forEach((color) => {
    const cell = document.createElement("div");
    cell.className = "matrix-cell header";
    cell.textContent = color.name.replace("greyscale.scale.", "");
    matrixGrid.appendChild(cell);
  });

  let passStrongCount = 0;
  let passWeakCount = 0;

  colors.forEach((bg) => {
    const rowHeader = document.createElement("div");
    rowHeader.className = "matrix-cell header";
    rowHeader.textContent = bg.name.replace("greyscale.scale.", "");
    matrixGrid.appendChild(rowHeader);

    colors.forEach((fg) => {
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

function updateDerivedPreview() {
  const normalized = normalizeHex(primaryInput.value);
  primarySwatch.style.background = normalized || "#222";
  const derived = deriveGreyscaleColor(primaryInput.value, satInput.value);
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

function createTokens(scale, prefix) {
  const safePrefix = (prefix || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/^\.+|\.+$/g, "");
  return scale.map((item) => ({
    name: safePrefix ? `${safePrefix}.${item.name}` : item.name,
    hex: item.hex,
  }));
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
  renderScale(scale);
  renderMatrix(scale);

  const tokens = createTokens(scale, prefixInput.value);
  tokenCount.textContent = tokens.length.toString();
  output.value = formatTokens(tokens, formatSelect.value);
  copyBtn.disabled = tokens.length === 0;
}

primaryInput.addEventListener("input", () => {
  updateDerivedPreview();
});

satRange.addEventListener("input", (event) => {
  satInput.value = event.target.value;
  updateDerivedPreview();
});

satInput.addEventListener("input", (event) => {
  const clamped = clamp(event.target.value, 0, 30);
  satInput.value = clamped;
  satRange.value = clamped;
  updateDerivedPreview();
});

generateBtn.addEventListener("click", generateTokens);

complianceLevel.addEventListener("change", () => {
  const derived = deriveGreyscaleColor(primaryInput.value, satInput.value);
  if (derived) {
    const scale = generateGreyscaleScale(derived);
    renderMatrix(scale);
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
  satRange.value = "8";
  satInput.value = "8";
  prefixInput.value = "";
  formatSelect.value = "json";
  complianceLevel.value = "AA";
  output.value = "";
  copyBtn.disabled = true;
  tokenCount.textContent = "0";
  derivedHexInput.value = "";
  derivedSwatch.style.background = "#222";
  derivedLabel.textContent = "—";
  renderScale();
  renderMatrix();
});

updateDerivedPreview();
renderScale();
renderMatrix();

