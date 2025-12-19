// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

// Performance utilities
const Performance = {
  // Debounce function to limit rapid function calls
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Cache for contrast ratio calculations
  contrastCache: new Map(),
  
  getContrastCached(bgHex, fgHex) {
    const key = `${bgHex}:${fgHex}`;
    if (this.contrastCache.has(key)) {
      return this.contrastCache.get(key);
    }
    const ratio = getContrastRatio(bgHex, fgHex);
    this.contrastCache.set(key, ratio);
    // Limit cache size to prevent memory issues
    if (this.contrastCache.size > 1000) {
      const firstKey = this.contrastCache.keys().next().value;
      this.contrastCache.delete(firstKey);
    }
    return ratio;
  },

  clearCache() {
    this.contrastCache.clear();
  }
};

// Validation utilities
const Validator = {
  isValidHex(hex) {
    if (!hex || typeof hex !== 'string') return false;
    const cleaned = hex.trim();
    return /^#[0-9A-Fa-f]{6}$/.test(cleaned);
  },

  normalizeHex(hex) {
    if (!hex) return null;
    let cleaned = hex.trim().toUpperCase();
    if (!cleaned.startsWith('#')) cleaned = '#' + cleaned;
    return this.isValidHex(cleaned) ? cleaned : null;
  },

  isValidNumber(value, min = -Infinity, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // Check for edge case colors that might cause issues
  isExtremeColor(hex) {
    if (!this.isValidHex(hex)) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Pure black, pure white, or very close to them
    const sum = r + g + b;
    return sum < 10 || sum > 755;
  }
};

// Error notification system
const ErrorHandler = {
  showError(message, duration = 5000) {
    console.error(message);
    this.showNotification(message, 'error', duration);
  },
  
  showSuccess(message, duration = 3000) {
    this.showNotification(message, 'success', duration);
  },
  
  showInfo(message, duration = 4000) {
    this.showNotification(message, 'info', duration);
  },
  
  showNotification(message, type = 'info', duration = 4000) {
    const colors = {
      error: { bg: '#dc2626', icon: 'alert-circle-outline' },
      success: { bg: '#16a34a', icon: 'checkmark-circle-outline' },
      info: { bg: '#2563eb', icon: 'information-circle-outline' }
    };
    
    const config = colors[type] || colors.info;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <ion-icon name="${config.icon}"></ion-icon>
      <span>${message}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${config.bg};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 400px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      font-size: 0.875rem;
    `;
    
    const icon = notification.querySelector('ion-icon');
    if (icon) {
      icon.style.fontSize = '1.25rem';
      icon.style.flexShrink = '0';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  handleGenerationError(error, context = 'Token generation') {
    console.error(`${context} error:`, error);
    this.showError(`${context} failed. Please try a different color or refresh the page.`);
  },
  
  show: function(message) {
    this.showError(message);
  }
};

// ============================================================================
// BROWSER COMPATIBILITY
// ============================================================================

// Check for color input support and add fallback class if needed
function checkColorInputSupport() {
  const input = document.createElement('input');
  input.setAttribute('type', 'color');
  const isSupported = input.type === 'color';
  
  if (!isSupported) {
    document.body.classList.add('no-color-input');
    console.warn('Color input not supported. Using text input fallback.');
  }
  
  return isSupported;
}

// Initialize browser compatibility checks
checkColorInputSupport();

const primaryInput = document.getElementById("primaryColor");
const primarySwatch = document.getElementById("primarySwatch");
const primaryColorPicker = document.getElementById("primaryColorPicker");
const satInput = document.getElementById("greyscaleSaturationValue");
const formatSelect = document.getElementById("format");

// Recently used colors
const recentColorsContainer = document.getElementById("recentColors");
const recentColorsGrid = document.getElementById("recentColorsGrid");
let recentColors = [];
const MAX_RECENT_COLORS = 8;

function addToRecentColors(hex) {
  if (!hex || !Validator.isValidHex(hex)) return;
  
  // Remove if already exists
  recentColors = recentColors.filter(c => c.toLowerCase() !== hex.toLowerCase());
  
  // Add to beginning
  recentColors.unshift(hex.toUpperCase());
  
  // Limit to max
  if (recentColors.length > MAX_RECENT_COLORS) {
    recentColors = recentColors.slice(0, MAX_RECENT_COLORS);
  }
  
  // Update UI
  renderRecentColors();
}

function renderRecentColors() {
  if (recentColors.length === 0) {
    if (recentColorsContainer) recentColorsContainer.style.display = 'none';
    return;
  }
  
  if (recentColorsContainer) recentColorsContainer.style.display = 'block';
  if (!recentColorsGrid) return;
  
  recentColorsGrid.innerHTML = '';
  
  recentColors.forEach(color => {
    const swatch = document.createElement('button');
    swatch.className = 'recent-color-swatch';
    swatch.style.background = color;
    swatch.title = color;
    swatch.setAttribute('aria-label', `Use color ${color}`);
    swatch.addEventListener('click', () => {
      if (welcomePrimaryHex) welcomePrimaryHex.value = color;
      if (welcomePrimaryColor) welcomePrimaryColor.value = color;
      if (welcomeSwatch) welcomeSwatch.style.background = color;
      updateWelcomePreview();
    });
    recentColorsGrid.appendChild(swatch);
  });
}

// Welcome page elements
const welcomePage = document.getElementById("welcomePage");
const mainApp = document.getElementById("mainApp");
const welcomePrimaryColor = document.getElementById("welcomePrimaryColor");
const welcomePrimaryHex = document.getElementById("welcomePrimaryHex");
const welcomeSwatch = document.getElementById("welcomeSwatch");
const welcomeGenerateBtn = document.getElementById("welcomeGenerateBtn");

// Initialize welcome page
function initWelcomePage() {
  if (!welcomeGenerateBtn) {
    return;
  }
  
  // Set initial swatch color
  welcomeSwatch.style.backgroundColor = welcomePrimaryColor.value;
  
  // Sync color picker and hex input (debounced)
  welcomePrimaryColor.addEventListener("input", Performance.debounce((e) => {
    welcomePrimaryHex.value = e.target.value;
    welcomeSwatch.style.backgroundColor = e.target.value;
  }, 100));

  welcomePrimaryHex.addEventListener("input", Performance.debounce((e) => {
    let value = e.target.value.toUpperCase();
    // Auto-add # if missing
    if (value && !value.startsWith("#")) {
      value = "#" + value;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      welcomePrimaryColor.value = value;
      welcomeSwatch.style.backgroundColor = value;
      e.target.value = value;
    }
  }, 100));

  // Make swatch clickable to open color picker (with keyboard support)
  welcomeSwatch.addEventListener("click", () => {
    welcomePrimaryColor.click();
  });
  
  welcomeSwatch.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      welcomePrimaryColor.click();
    }
  });

  welcomeGenerateBtn.addEventListener("click", () => {
    const hexValue = welcomePrimaryHex.value;
    const normalized = Validator.normalizeHex(hexValue);
    
    if (!normalized) {
      ErrorHandler.showError('Please enter a valid hex color (e.g., #3366FF)');
      welcomePrimaryHex.classList.add('error');
      setTimeout(() => welcomePrimaryHex.classList.remove('error'), 2000);
      return;
    }

    if (Validator.isExtremeColor(normalized)) {
      const proceed = confirm('This color is very close to pure black or white. Results may be limited. Continue anyway?');
      if (!proceed) return;
    }

    try {
      // Set the primary color in the main app
      primaryInput.value = normalized;
      primaryColorPicker.value = normalized;
      welcomePrimaryHex.value = normalized;
      
      if (typeof updateSwatch === 'function') {
        updateSwatch();
      }
      
      // Hide welcome page and show main app
      welcomePage.style.display = "none";
      mainApp.style.display = "grid";
      
      // Force a layout recalculation
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        
        // Auto-generate tokens
        if (typeof generateTokens === 'function') {
          generateTokens();
        }
      }, 100);
    } catch (error) {
      ErrorHandler.handleGenerationError(error, 'App initialization');
    }
  });

  // Allow Enter key to generate
  welcomePrimaryHex.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      welcomeGenerateBtn.click();
    }
  });
}

// Tint amount switch variables
let tintAmounts = {
  low: 0,
  mid: 0,
  high: 0,
};
let currentTintLevel = "low";
let currentTintColorMode = "primary";
const semanticOverrides = {};
let currentTheme = 'light'; // Track current theme for semantic preview
let currentOutputFormat = 'json'; // Track current output format

function generateRandomTintAmounts() {
  // Keep a non-zero floor so hue shifts stay visible and avoid rounding to 0
  tintAmounts.low = 5 + Math.random() * 5;    // 5-10%
  tintAmounts.mid = 12 + Math.random() * 6;   // 12-18%
  tintAmounts.high = 22 + Math.random() * 6;  // 22-28%
}

const prefixInput = document.getElementById("prefix");
const derivedHexInput = document.getElementById("derivedHex");
const derivedSwatch = document.getElementById("derivedSwatch");
const scaleGrid = document.getElementById("scale-grid");
const scaleCount = document.getElementById("scale-count");
const primaryScaleGrid = document.getElementById("primary-grid");
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
const downloadBtn = document.getElementById("download");
const resetBtn = document.getElementById("reset");
const tokenCount = document.getElementById("token-count");

// Tab switching
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;
    
    // Remove active class and ARIA states from all buttons and contents
    tabButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    });
    tabContents.forEach((content) => content.classList.remove("active"));
    
    // Add active class and ARIA states to clicked button and corresponding content
    button.classList.add("active");
    button.setAttribute("aria-selected", "true");
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
  // Validate and clamp RGB values
  const clampedR = Validator.clamp(Math.round(r), 0, 255);
  const clampedG = Validator.clamp(Math.round(g), 0, 255);
  const clampedB = Validator.clamp(Math.round(b), 0, 255);
  
  const toHex = (value) =>
    value.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(clampedR)}${toHex(clampedG)}${toHex(clampedB)}`;
}

function rgbToHsl(r, g, b) {
  // Clamp values to valid range
  r = Validator.clamp(r, 0, 255);
  g = Validator.clamp(g, 0, 255);
  b = Validator.clamp(b, 0, 255);
  
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
  
  // Apply hue shift based on harmony mode
  let hueShift = 0;
  if (tintMode === "complimentary") {
    hueShift = 180;
  } else if (tintMode === "analogous-plus") {
    hueShift = 30;
  } else if (tintMode === "analogous-minus") {
    hueShift = -30;
  } else if (tintMode === "triadic-plus") {
    hueShift = 120;
  } else if (tintMode === "triadic-minus") {
    hueShift = -120;
  }
  // primary mode has no shift (hueShift = 0)
  
  if (hueShift !== 0) {
    hsl = { ...hsl, h: (hsl.h + hueShift + 360) % 360 };
  }
  
  const saturation = clamp(Number(saturationPercent) / 100 || 0, 0, 0.3);
  const derivedRgb = hslToRgb(hsl.h, saturation, hsl.l);
  return {
    hex: rgbToHex(derivedRgb.r, derivedRgb.g, derivedRgb.b),
    hsl: { h: hsl.h, s: saturation, l: hsl.l },
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
    lighterSteps = 2;
    darkerSteps = 7;
  } else if (hsl.l < 0.2) {
    lighterSteps = 7;
    darkerSteps = 2;
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
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
  ];

  return ordered.slice(0, 11).map((entry, index) => ({
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
  // Validate hex inputs
  if (!Validator.isValidHex(bgHex) || !Validator.isValidHex(fgHex)) {
    return null;
  }
  
  const bg = hexToRgb(bgHex);
  const fg = hexToRgb(fgHex);
  if (!bg || !fg) return null;
  const l1 = relativeLuminance(bg);
  const l2 = relativeLuminance(fg);
  if (l1 === null || l2 === null || !isFinite(l1) || !isFinite(l2)) return null;
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  const ratio = (light + 0.05) / (dark + 0.05);
  return isFinite(ratio) ? ratio : null;
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
  if (scaleCount) scaleCount.textContent = list.length.toString();

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
  
  const level = complianceLevel.value;
  const normalThreshold = level === "AAA" ? 7 : 4.5;
  const largeThreshold = level === "AAA" ? 4.5 : 3;
  
  matrixGrid.innerHTML = "";
  if (matrixPassCount) matrixPassCount.textContent = "0";

  if (!testColors.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "helper";
    placeholder.textContent = "Generate tokens to evaluate combinations.";
    matrixGrid.appendChild(placeholder);
    return;
  }

  matrixGrid.style.gridTemplateColumns = `repeat(${ 
    testColors.length + 1
  }, minmax(70px, 1fr))`;

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
      const ratio = Performance.getContrastCached(bg.hex, fg.hex);
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

  if (matrixPassCount) matrixPassCount.textContent = `${passStrongCount} strong / ${passWeakCount} weak`;
}

function renderPrimaryColorMatrix(primaryScale, neutralScale) {
  // Primary colors as backgrounds, neutral + white as foregrounds
  const backgrounds = Array.isArray(primaryScale) ? primaryScale : [];
  const foregrounds = [
    { name: "white", hex: "#FFFFFF" },
    ...(Array.isArray(neutralScale) ? neutralScale : [])
  ];
  
  primaryMatrixGrid.innerHTML = "";
  if (primaryMatrixPassCount) primaryMatrixPassCount.textContent = "0";

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

  if (primaryMatrixNote) primaryMatrixNote.textContent = `Rows are primary backgrounds, columns are neutral + white foregrounds. Green = passes ${normalThreshold}:1 (normal text), Blue = passes ${largeThreshold}:1 (large text only), Red = fails.`;

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
      const ratio = Performance.getContrastCached(bg.hex, fg.hex);
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

  if (primaryMatrixPassCount) primaryMatrixPassCount.textContent = `${passStrongCount} strong / ${passWeakCount} weak`;
}

// Helper to convert camelCase to readable format (e.g., "textPrimary" -> "Text Primary")
function camelCaseToReadable(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function renderSemanticMatrix(tokens, complianceMode, theme = 'light') {
  const semanticMatrixGrid = document.getElementById("semantic-matrix-grid");
  const semanticMatrixPassCount = document.getElementById("semantic-matrix-pass-count");
  
  if (!semanticMatrixGrid || !semanticMatrixPassCount || !tokens || !tokens.color || !tokens.color.semantic || !tokens.color.semantic[theme]) {
    return;
  }

  semanticMatrixGrid.innerHTML = "";
  if (semanticMatrixPassCount) semanticMatrixPassCount.textContent = "0";

  // Extract semantic tokens from tokens object (using selected theme)
  const semantic = tokens.color.semantic[theme];
  
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
      if (!current.$value) return null;
      // Recursively resolve if the result is another reference
      if (current.$value.startsWith("{")) {
        return resolveHex(current);
      }
      return current.$value;
    }
    return null;
  }

  // Build separate surface arrays
  const neutralSurfaces = [];
  const invertedSurfaces = [];
  const primarySurfaces = [];
  
  if (semantic.surface && semantic.surface.neutral) {
    if (semantic.surface.neutral.surfaceBase) neutralSurfaces.push({ name: "surfaceBase", hex: resolveHex(semantic.surface.neutral.surfaceBase) });
    if (semantic.surface.neutral.surfaceDefault) neutralSurfaces.push({ name: "surfaceDefault", hex: resolveHex(semantic.surface.neutral.surfaceDefault) });
    if (semantic.surface.neutral.surfaceVariant) neutralSurfaces.push({ name: "surfaceVariant", hex: resolveHex(semantic.surface.neutral.surfaceVariant) });
    if (semantic.surface.neutral.surfaceInverted) invertedSurfaces.push({ name: "surfaceInverted", hex: resolveHex(semantic.surface.neutral.surfaceInverted) });
    if (semantic.surface.neutral.surfaceInvertedVariant) invertedSurfaces.push({ name: "surfaceInvertedVariant", hex: resolveHex(semantic.surface.neutral.surfaceInvertedVariant) });
  }
  if (semantic.surface && semantic.surface.primary) {
    if (semantic.surface.primary.surfacePrimary) primarySurfaces.push({ name: "surfacePrimary", hex: resolveHex(semantic.surface.primary.surfacePrimary) });
    if (semantic.surface.primary.surfacePrimarySubtle) primarySurfaces.push({ name: "surfacePrimarySubtle", hex: resolveHex(semantic.surface.primary.surfacePrimarySubtle) });
    if (semantic.surface.primary.surfacePrimaryIntense) primarySurfaces.push({ name: "surfacePrimaryIntense", hex: resolveHex(semantic.surface.primary.surfacePrimaryIntense) });
  }

  // Build separate foreground arrays
  const neutralText = [];
  const invertedText = [];
  const primaryText = [];
  
  if (semantic.text && semantic.text.neutral) {
    if (semantic.text.neutral.textPrimary) neutralText.push({ name: "textPrimary", hex: resolveHex(semantic.text.neutral.textPrimary) });
    if (semantic.text.neutral.textSecondary) neutralText.push({ name: "textSecondary", hex: resolveHex(semantic.text.neutral.textSecondary) });
    if (semantic.text.neutral.textTertiary) neutralText.push({ name: "textTertiary", hex: resolveHex(semantic.text.neutral.textTertiary) });
    if (semantic.text.neutral.textPrimaryInverse) invertedText.push({ name: "textPrimaryInverse", hex: resolveHex(semantic.text.neutral.textPrimaryInverse) });
    if (semantic.text.neutral.textSecondaryInverse) invertedText.push({ name: "textSecondaryInverse", hex: resolveHex(semantic.text.neutral.textSecondaryInverse) });
    if (semantic.text.neutral.textTertiaryInverse) invertedText.push({ name: "textTertiaryInverse", hex: resolveHex(semantic.text.neutral.textTertiaryInverse) });
  }
  if (semantic.text && semantic.text.onPrimary) {
    if (semantic.text.onPrimary.default) primaryText.push({ name: "textOnPrimary", hex: resolveHex(semantic.text.onPrimary.default) });
  }
  if (semantic.outline && semantic.outline.neutral) {
    if (semantic.outline.neutral.outlineDefault) neutralText.push({ name: "outlineDefault", hex: resolveHex(semantic.outline.neutral.outlineDefault) });
    if (semantic.outline.neutral.outlineSubtle) neutralText.push({ name: "outlineSubtle", hex: resolveHex(semantic.outline.neutral.outlineSubtle) });
    if (semantic.outline.neutral.outlineIntense) neutralText.push({ name: "outlineIntense", hex: resolveHex(semantic.outline.neutral.outlineIntense) });
    if (semantic.outline.neutral.outlineInverse) invertedText.push({ name: "outlineInverse", hex: resolveHex(semantic.outline.neutral.outlineInverse) });
    if (semantic.outline.neutral.outlineInverseSubtle) invertedText.push({ name: "outlineInverseSubtle", hex: resolveHex(semantic.outline.neutral.outlineInverseSubtle) });
    if (semantic.outline.neutral.outlineInverseIntense) invertedText.push({ name: "outlineInverseIntense", hex: resolveHex(semantic.outline.neutral.outlineInverseIntense) });
  }
  if (semantic.outline && semantic.outline.primary) {
    if (semantic.outline.primary.outlinePrimary) neutralText.push({ name: "outlinePrimary", hex: resolveHex(semantic.outline.primary.outlinePrimary) });
    if (semantic.outline.primary.outlinePrimarySubtle) neutralText.push({ name: "outlinePrimarySubtle", hex: resolveHex(semantic.outline.primary.outlinePrimarySubtle) });
    if (semantic.outline.primary.outlinePrimaryIntense) neutralText.push({ name: "outlinePrimaryIntense", hex: resolveHex(semantic.outline.primary.outlinePrimaryIntense) });
  }

  // Filter out any null hex values
  const validNeutralSurfaces = neutralSurfaces.filter(s => s.hex);
  const validInvertedSurfaces = invertedSurfaces.filter(s => s.hex);
  const validPrimarySurfaces = primarySurfaces.filter(s => s.hex);
  const validNeutralText = neutralText.filter(f => f.hex);
  const validInvertedText = invertedText.filter(f => f.hex);
  const validPrimaryText = primaryText.filter(f => f.hex);

  if ((!validNeutralSurfaces.length && !validInvertedSurfaces.length && !validPrimarySurfaces.length) || (!validNeutralText.length && !validInvertedText.length && !validPrimaryText.length)) {
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
      cell.textContent = camelCaseToReadable(bg.name);
      grid.appendChild(cell);
    });

    let passStrongCount = 0;
    let passWeakCount = 0;

    // Foregrounds as rows
    foregrounds.forEach((fg) => {
      const rowHeader = document.createElement("div");
      rowHeader.className = "matrix-cell header";
      rowHeader.textContent = camelCaseToReadable(fg.name);
      grid.appendChild(rowHeader);

      surfaces.forEach((bg) => {
        const ratio = Performance.getContrastCached(bg.hex, fg.hex);
        let cellClass = "fail";
        
        // Determine threshold based on whether this is text or outline
        const isOutline = fg.name.startsWith("outline");
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
        // Always show the ratio, even if below threshold
        cell.textContent = typeof ratio === "number" ? `${ratio.toFixed(1)}×` : "—";
        grid.appendChild(cell);
      });
    });

    semanticMatrixGrid.appendChild(grid);
    
    totalPassStrong += passStrongCount;
    totalPassWeak += passWeakCount;
  }

  // Render three matrices
  renderMatrix(validNeutralSurfaces, validNeutralText, "Neutral Text & Outlines on Neutral Surfaces");
  renderMatrix(validInvertedSurfaces, validInvertedText, "Inverted Text & Outlines on Inverted Surfaces");
  renderMatrix(validPrimarySurfaces, validPrimaryText, "Text & Outlines on Primary Surfaces");

  if (semanticMatrixPassCount) semanticMatrixPassCount.textContent = `${totalPassStrong} strong / ${totalPassWeak} weak`;
}

function renderSemanticPreview(semantic, complianceMode, tokens, scale, theme = 'light') {
  const previewContainer = document.getElementById("semantic-preview-container");
  if (!previewContainer || !tokens || !tokens.color || !tokens.color.semantic || !tokens.color.semantic[theme]) {
    return;
  }

  // Helper function to resolve token references to hex values
  function resolveTokenRef(ref, tokens, scale) {
    if (!ref) return null;
    
    if (ref === "{color.seed.white}") return "#FFFFFF";
    if (ref === "{color.seed.black}") return "#000000";
    
    // Resolve seed.primary
    if (ref === "{color.seed.primary}") {
      if (tokens.color.seed && tokens.color.seed.primary) {
        return tokens.color.seed.primary.$value;
      }
    }
    
    // Resolve palette references like {color.palettes.neutral.950}
    const paletteMatch = ref.match(/\{color\.palettes\.(neutral|primary)\.(\d+)\}/);
    if (paletteMatch) {
      const palette = paletteMatch[1];
      const label = paletteMatch[2];
      const scalePrefix = palette === "neutral" ? "greyscale.scale" : "color.primary";
      const entry = scale.find((item) => item.name === `${scalePrefix}.${label}`);
      if (entry) return entry.hex;
    }
    
    return null;
  }

  // Build CSS variables from tokens object
  const cssVars = {};
  const semanticTokens = tokens.color.semantic[theme];
  
  // Map neutral surface tokens
  if (semanticTokens.surface && semanticTokens.surface.neutral) {
    const surf = semanticTokens.surface.neutral;
    if (surf.surfaceBase) cssVars['--semantic-surface-neutral-surface'] = resolveTokenRef(surf.surfaceBase.$value, tokens, scale);
    if (surf.surfaceDefault) cssVars['--semantic-surface-neutral-surfaceDefault'] = resolveTokenRef(surf.surfaceDefault.$value, tokens, scale);
    if (surf.surfaceVariant) cssVars['--semantic-surface-neutral-surfaceVariant'] = resolveTokenRef(surf.surfaceVariant.$value, tokens, scale);
    if (surf.surfaceInverted) cssVars['--semantic-surface-neutral-surfaceInverted'] = resolveTokenRef(surf.surfaceInverted.$value, tokens, scale);
    if (surf.surfaceInvertedVariant) cssVars['--semantic-surface-neutral-surfaceInvertedVariant'] = resolveTokenRef(surf.surfaceInvertedVariant.$value, tokens, scale);
  }
  
  // Map text tokens
  if (semanticTokens.text && semanticTokens.text.neutral) {
    const txt = semanticTokens.text.neutral;
    if (txt.textPrimary) cssVars['--semantic-text-primary'] = resolveTokenRef(txt.textPrimary.$value, tokens, scale);
    if (txt.textSecondary) cssVars['--semantic-text-secondary'] = resolveTokenRef(txt.textSecondary.$value, tokens, scale);
    if (txt.textTertiary) cssVars['--semantic-text-tertiary'] = resolveTokenRef(txt.textTertiary.$value, tokens, scale);
    if (txt.textPrimaryInverse) cssVars['--semantic-text-onSurfaceInverted'] = resolveTokenRef(txt.textPrimaryInverse.$value, tokens, scale);
  }
  
  // Map outline tokens
  if (semanticTokens.outline && semanticTokens.outline.neutral) {
    const outl = semanticTokens.outline.neutral;
    if (outl.outlineDefault) cssVars['--semantic-outline-neutral-default'] = resolveTokenRef(outl.outlineDefault.$value, tokens, scale);
    if (outl.outlineVariant) cssVars['--semantic-outline-neutral-variant'] = resolveTokenRef(outl.outlineVariant.$value, tokens, scale);
  }

  // Map primary surface tokens
  if (semanticTokens.surface && semanticTokens.surface.primary) {
    const primSurf = semanticTokens.surface.primary;
    if (primSurf.surfacePrimary) cssVars['--semantic-surface-primary-surface'] = resolveTokenRef(primSurf.surfacePrimary.$value, tokens, scale);
    if (primSurf.surfacePrimarySubtle) cssVars['--semantic-surface-primary-subtle'] = resolveTokenRef(primSurf.surfacePrimarySubtle.$value, tokens, scale);
    if (primSurf.surfacePrimaryIntense) cssVars['--semantic-surface-primary-intense'] = resolveTokenRef(primSurf.surfacePrimaryIntense.$value, tokens, scale);
  }

  // Map textOnPrimary token
  if (semanticTokens.text && semanticTokens.text.onPrimary && semanticTokens.text.onPrimary.default) {
    cssVars['--semantic-text-onPrimary'] = resolveTokenRef(semanticTokens.text.onPrimary.default.$value, tokens, scale);
  }

  // Map outline tokens (fix variable names to match template)
  if (semanticTokens.outline && semanticTokens.outline.neutral) {
    const outl = semanticTokens.outline.neutral;
    if (outl.outlineSubtle) cssVars['--semantic-outline-neutral-outlineSubtle'] = resolveTokenRef(outl.outlineSubtle.$value, tokens, scale);
    if (outl.outlineDefault) cssVars['--semantic-outline-neutral-outlineDefault'] = resolveTokenRef(outl.outlineDefault.$value, tokens, scale);
    if (outl.outlineIntense) cssVars['--semantic-outline-neutral-outlineIntense'] = resolveTokenRef(outl.outlineIntense.$value, tokens, scale);
    if (outl.outlineInverseSubtle) cssVars['--semantic-outline-neutral-outlineInverseSubtle'] = resolveTokenRef(outl.outlineInverseSubtle.$value, tokens, scale);
    if (outl.outlineInverse) cssVars['--semantic-outline-neutral-outlineInverse'] = resolveTokenRef(outl.outlineInverse.$value, tokens, scale);
    if (outl.outlineInverseIntense) cssVars['--semantic-outline-neutral-outlineInverseIntense'] = resolveTokenRef(outl.outlineInverseIntense.$value, tokens, scale);
  }

  // Map primary outline tokens
  if (semanticTokens.outline && semanticTokens.outline.primary) {
    const primOutl = semanticTokens.outline.primary;
    if (primOutl.outlinePrimary) cssVars['--semantic-outline-primary-outlineDefault'] = resolveTokenRef(primOutl.outlinePrimary.$value, tokens, scale);
    if (primOutl.outlinePrimarySubtle) cssVars['--semantic-outline-primary-outlineSubtle'] = resolveTokenRef(primOutl.outlinePrimarySubtle.$value, tokens, scale);
    if (primOutl.outlinePrimaryIntense) cssVars['--semantic-outline-primary-outlineIntense'] = resolveTokenRef(primOutl.outlinePrimaryIntense.$value, tokens, scale);
  }


  // Template HTML from preview-template
  const templateHTML = `
    <div class="surface">
      <div class="surfaceVariant">
        <p class="preview-heading">This is Alchemy</p>
      </div>
      <div class="baseSurface">
        <p class="primaryText"> Alchemy (from the Arabic word al-kīmīā, الكیمیاء) Alchemy is an ancient branch of natural philosophy, a philosophical and protoscientific tradition that was historically practised in China, India, the Muslim world, and Europe.[1] In its Western form, alchemy is first attested in a number of pseudepigraphical texts written in Greco-Roman Egypt during the first few centuries AD.[2] Greek-speaking alchemists often referred to their craft as "the Art" (τέχνη) or "Knowledge" (ἐπιστήμη), and it was often characterised as mystic (μυστική), sacred (ἱɛρά), or divine (θɛíα).[3]
        </p>
        <p class="secondaryText"> The defining objectives of alchemy are varied and include the creation of the philosopher's stone, the transmutation of base metals into noble metals (particularly gold); and the creation of an elixir of immortality; the perfection of the human body and soul. In Europe, these ideas were first connected
        </p>
        <p class="tertiaryText"> You are now a color alchemist</p>
      
      <!-- Row 1: Neutral outlines (subtle, default, intense) -->
      <div class="row">
        <div class="box outlineSubtle">Elixir</div>
        <div class="box outlineDefault">Philosopher's Stone</div>
        <div class="box outlineIntense">Transmutation</div>
      </div>

      <!-- Row 2: Primary outlines (subtle, default, intense) -->
      <div class="row">
        <div class="outlinePrimarySubtle box">Athanor</div>
        <div class="outlinePrimaryDefault box">Prima Materia</div>
        <div class="outlinePrimaryIntense box">Chrysopoeia</div>
      </div>

      </div>

      <!-- Surfaces demo -->
      <div class="row">
        <div class="box surfacePrimarySubtle">Ingredients</div>
        <div class="box primarySurface"><span class="onPrimary">Magic</span></div>
        <div class="box surfacePrimaryIntense">Catalyst</div>
      </div>

      <!-- Inverse container with inverse outlines row -->
      <div class="box surfaceInverted">
        Instructions
        <div class="box surfaceInvertedVariant">luck</div>
        <div class="row">
          <div class="box outlineInverseSubtle">Arcana</div>
          <div class="box outlineInverse">Nigredo</div>
          <div class="box outlineInverseIntense">Albedo</div>
        </div>
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
    #semantic-preview-container .outlineSubtle {
      border: 2px solid var(--semantic-outline-neutral-outlineSubtle);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .outlineDefault {
      border: 2px solid var(--semantic-outline-neutral-outlineDefault);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .outlineIntense {
      border: 2px solid var(--semantic-outline-neutral-outlineIntense);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .outlineInverseSubtle {
      border: 2px solid var(--semantic-outline-neutral-outlineInverseSubtle);
      color: var(--semantic-text-onSurfaceInverted);
    }

    #semantic-preview-container .outlineInverse {
      border: 2px solid var(--semantic-outline-neutral-outlineInverse);
      color: var(--semantic-text-onSurfaceInverted);
    }

    #semantic-preview-container .outlineInverseIntense {
      border: 2px solid var(--semantic-outline-neutral-outlineInverseIntense);
      color: var(--semantic-text-onSurfaceInverted);
    }

    #semantic-preview-container .outlinePrimarySubtle {
      border: 2px solid var(--semantic-outline-primary-outlineSubtle);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .outlinePrimaryDefault {
      border: 2px solid var(--semantic-outline-primary-outlineDefault);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .outlinePrimaryIntense {
      border: 2px solid var(--semantic-outline-primary-outlineIntense);
      color: var(--semantic-text-primary);
    }

    #semantic-preview-container .surfaceVariant {
      background-color: var(--semantic-surface-neutral-surfaceVariant);
      color: var(--semantic-text-primary);
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    #semantic-preview-container .surfaceInvertedVariant {
      background-color: var(--semantic-surface-neutral-surfaceInvertedVariant);
      color: var(--semantic-text-onSurfaceInverted);
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
    }

    #semantic-preview-container .surface {
      background-color: var(--semantic-surface-neutral-surfaceDefault);
      padding: 16px;
      border-radius: 8px;
    }

    #semantic-preview-container .baseSurface {
      background-color: var(--semantic-surface-neutral-surface);
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
      margin-top: 1rem;
    }

    #semantic-preview-container .primarySurface {
      background-color: var(--semantic-surface-primary-surface);
    }

    /* Removed hover effect from primarySurface */

    #semantic-preview-container .surfacePrimarySubtle {
      background-color: var(--semantic-surface-primary-subtle);
      color: var(--semantic-text-onPrimary);
    }

    #semantic-preview-container .onPrimary {
      color: var(--semantic-text-onPrimary);
    }

    #semantic-preview-container .surfacePrimaryIntense {
      background-color: var(--semantic-surface-primary-intense);
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
    return null;
  }
  derivedHexInput.value = derived.hex;
  derivedSwatch.style.background = derived.hex;
  
  // Update harmony card swatches with current primary color
  updateHarmonySwatches();
  
  return derived;
}

function updateHarmonySwatches() {
  const primaryColor = primaryInput.value;
  
  // Define all harmony modes and their hue shifts
  const modes = [
    { selector: '[data-mode="complimentary"]', shift: 180 },
    { selector: '[data-mode="analogous"][data-variant="plus"]', shift: 30 },
    { selector: '[data-mode="analogous"][data-variant="minus"]', shift: -30 },
    { selector: '[data-mode="triadic"][data-variant="plus"]', shift: 120 },
    { selector: '[data-mode="triadic"][data-variant="minus"]', shift: -120 },
    { selector: '[data-mode="primary"]', shift: 0 },
  ];
  
  modes.forEach(({ selector, shift }) => {
    const swatch = document.querySelector(selector);
    if (swatch) {
      const normalized = normalizeHex(primaryColor);
      if (normalized) {
        const rgb = hexToRgb(normalized);
        if (rgb) {
          let hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          // Apply hue shift but keep original S and L from the seed color
          hsl = { ...hsl, h: (hsl.h + shift + 360) % 360 };
          // Use the seed's original saturation and lightness, not clamped
          const swatchRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
          const swatchHex = rgbToHex(swatchRgb.r, swatchRgb.g, swatchRgb.b);
          const swatchColor = swatch.querySelector('.swatch-color');
          if (swatchColor) {
            swatchColor.style.background = swatchHex;
          }
        }
      }
    }
  });
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

  // Add black seed color
  root[colorKey].seed.black = {
    $value: "#000000",
    $type: "color",
    $description: "Black seed color",
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

  // Initialize semantic structure with light and dark themes
  // semantic.light and semantic.dark will each contain { surface, outline, text }
  root[colorKey].semantic = {
    light: {
      surface: {},
      outline: {},
      text: {},
    },
    dark: {
      surface: {},
      outline: {},
      text: {},
    }
  };

  // Add semantic tokens from pre-generated neutral semantic (passed as parameter)
  if (semanticNeutral) {
    // === LIGHT THEME ===
    // Add neutral surface tokens under semantic.light.surface.neutral
    root[colorKey].semantic.light.surface.neutral = {};
    root[colorKey].semantic.light.surface.neutral.surfaceBase = { $value: semanticOverrides["surface.neutral.surfaceBase"] || "{color.seed.white}", $type: "color" };
    if (semanticNeutral.surface) root[colorKey].semantic.light.surface.neutral.surfaceDefault = { $value: semanticOverrides["surface.neutral.surfaceDefault"] || semanticNeutral.surface.ref, $type: "color" };
    if (semanticNeutral.surfaceVariant) root[colorKey].semantic.light.surface.neutral.surfaceVariant = { $value: semanticOverrides["surface.neutral.surfaceVariant"] || semanticNeutral.surfaceVariant.ref, $type: "color" };
    if (semanticNeutral.surfaceInverted) root[colorKey].semantic.light.surface.neutral.surfaceInverted = { $value: semanticOverrides["surface.neutral.surfaceInverted"] || semanticNeutral.surfaceInverted.ref, $type: "color" };
    if (semanticNeutral.surfaceInvertedVariant) root[colorKey].semantic.light.surface.neutral.surfaceInvertedVariant = { $value: semanticOverrides["surface.neutral.surfaceInvertedVariant"] || semanticNeutral.surfaceInvertedVariant.ref, $type: "color" };

    // Add neutral text tokens under semantic.light.text.neutral
    root[colorKey].semantic.light.text.neutral = {};
    if (semanticNeutral.text) {
      if (semanticNeutral.text.primary) root[colorKey].semantic.light.text.neutral.textPrimary = { $value: semanticOverrides["text.neutral.textPrimary"] || semanticNeutral.text.primary.ref, $type: "color" };
      if (semanticNeutral.text.secondary) root[colorKey].semantic.light.text.neutral.textSecondary = { $value: semanticOverrides["text.neutral.textSecondary"] || semanticNeutral.text.secondary.ref, $type: "color" };
      if (semanticNeutral.text.tertiary) root[colorKey].semantic.light.text.neutral.textTertiary = { $value: semanticOverrides["text.neutral.textTertiary"] || semanticNeutral.text.tertiary.ref, $type: "color" };
    }

    // Add neutral text inverted tokens directly under semantic.light.text.neutral (not nested in inverted)
    if (semanticNeutral.textInverted) {
      if (semanticNeutral.textInverted.primary) root[colorKey].semantic.light.text.neutral.textPrimaryInverse = { $value: semanticOverrides["text.neutral.textPrimaryInverse"] || semanticNeutral.textInverted.primary.ref, $type: "color" };
      if (semanticNeutral.textInverted.secondary) root[colorKey].semantic.light.text.neutral.textSecondaryInverse = { $value: semanticOverrides["text.neutral.textSecondaryInverse"] || semanticNeutral.textInverted.secondary.ref, $type: "color" };
      if (semanticNeutral.textInverted.tertiary) root[colorKey].semantic.light.text.neutral.textTertiaryInverse = { $value: semanticOverrides["text.neutral.textTertiaryInverse"] || semanticNeutral.textInverted.tertiary.ref, $type: "color" };
    }

    // Add neutral outline tokens under semantic.light.outline.neutral
    root[colorKey].semantic.light.outline.neutral = {};
    if (semanticNeutral.outline) {
      if (semanticNeutral.outline.subtle) root[colorKey].semantic.light.outline.neutral.outlineSubtle = { $value: semanticOverrides["outline.neutral.outlineSubtle"] || semanticNeutral.outline.subtle.ref, $type: "color" };
      if (semanticNeutral.outline.default) root[colorKey].semantic.light.outline.neutral.outlineDefault = { $value: semanticOverrides["outline.neutral.outlineDefault"] || semanticNeutral.outline.default.ref, $type: "color" };
      if (semanticNeutral.outline.intense) root[colorKey].semantic.light.outline.neutral.outlineIntense = { $value: semanticOverrides["outline.neutral.outlineIntense"] || semanticNeutral.outline.intense.ref, $type: "color" };
    }

    // Add neutral outline inverted tokens directly under semantic.light.outline.neutral (not nested in inverted)
    if (semanticNeutral.outlineInverted) {
      if (semanticNeutral.outlineInverted.subtle) root[colorKey].semantic.light.outline.neutral.outlineInverseSubtle = { $value: semanticOverrides["outline.neutral.outlineInverseSubtle"] || semanticNeutral.outlineInverted.subtle.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.default) root[colorKey].semantic.light.outline.neutral.outlineInverse = { $value: semanticOverrides["outline.neutral.outlineInverse"] || semanticNeutral.outlineInverted.default.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.intense) root[colorKey].semantic.light.outline.neutral.outlineInverseIntense = { $value: semanticOverrides["outline.neutral.outlineInverseIntense"] || semanticNeutral.outlineInverted.intense.ref, $type: "color" };
    }

    // === DARK THEME (inverted) ===
    // In dark theme, swap surface <-> surfaceInverted and text <-> textInverted
    root[colorKey].semantic.dark.surface.neutral = {};
    // Base uses black seed color in dark theme
    root[colorKey].semantic.dark.surface.neutral.surfaceBase = { $value: semanticOverrides["surface.neutral.surfaceBase"] || "{color.seed.black}", $type: "color" };
    if (semanticNeutral.surfaceInvertedVariant) root[colorKey].semantic.dark.surface.neutral.surfaceDefault = { $value: semanticOverrides["surface.neutral.surfaceInvertedVariant"] || semanticNeutral.surfaceInvertedVariant.ref, $type: "color" };
    if (semanticNeutral.surfaceInverted) root[colorKey].semantic.dark.surface.neutral.surfaceVariant = { $value: semanticOverrides["surface.neutral.surfaceInverted"] || semanticNeutral.surfaceInverted.ref, $type: "color" };
    // Inverted surfaces in dark theme are the light surfaces
    if (semanticNeutral.surface) root[colorKey].semantic.dark.surface.neutral.surfaceInverted = { $value: semanticOverrides["surface.neutral.surfaceDefault"] || semanticNeutral.surface.ref, $type: "color" };
    root[colorKey].semantic.dark.surface.neutral.surfaceInvertedVariant = { $value: semanticOverrides["surface.neutral.surfaceBase"] || "{color.seed.white}", $type: "color" };

    // Dark theme text: swap text <-> textInverted
    root[colorKey].semantic.dark.text.neutral = {};
    if (semanticNeutral.textInverted) {
      if (semanticNeutral.textInverted.primary) root[colorKey].semantic.dark.text.neutral.textPrimary = { $value: semanticOverrides["text.neutral.textPrimaryInverse"] || semanticNeutral.textInverted.primary.ref, $type: "color" };
      if (semanticNeutral.textInverted.secondary) root[colorKey].semantic.dark.text.neutral.textSecondary = { $value: semanticOverrides["text.neutral.textSecondaryInverse"] || semanticNeutral.textInverted.secondary.ref, $type: "color" };
      if (semanticNeutral.textInverted.tertiary) root[colorKey].semantic.dark.text.neutral.textTertiary = { $value: semanticOverrides["text.neutral.textTertiaryInverse"] || semanticNeutral.textInverted.tertiary.ref, $type: "color" };
    }
    if (semanticNeutral.text) {
      if (semanticNeutral.text.primary) root[colorKey].semantic.dark.text.neutral.textPrimaryInverse = { $value: semanticOverrides["text.neutral.textPrimary"] || semanticNeutral.text.primary.ref, $type: "color" };
      if (semanticNeutral.text.secondary) root[colorKey].semantic.dark.text.neutral.textSecondaryInverse = { $value: semanticOverrides["text.neutral.textSecondary"] || semanticNeutral.text.secondary.ref, $type: "color" };
      if (semanticNeutral.text.tertiary) root[colorKey].semantic.dark.text.neutral.textTertiaryInverse = { $value: semanticOverrides["text.neutral.textTertiary"] || semanticNeutral.text.tertiary.ref, $type: "color" };
    }

    // Dark theme outlines: swap outline <-> outlineInverted
    root[colorKey].semantic.dark.outline.neutral = {};
    if (semanticNeutral.outlineInverted) {
      if (semanticNeutral.outlineInverted.subtle) root[colorKey].semantic.dark.outline.neutral.outlineSubtle = { $value: semanticOverrides["outline.neutral.outlineInverseSubtle"] || semanticNeutral.outlineInverted.subtle.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.default) root[colorKey].semantic.dark.outline.neutral.outlineDefault = { $value: semanticOverrides["outline.neutral.outlineInverse"] || semanticNeutral.outlineInverted.default.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.intense) root[colorKey].semantic.dark.outline.neutral.outlineIntense = { $value: semanticOverrides["outline.neutral.outlineInverseIntense"] || semanticNeutral.outlineInverted.intense.ref, $type: "color" };
    }
    if (semanticNeutral.outline) {
      if (semanticNeutral.outline.subtle) root[colorKey].semantic.dark.outline.neutral.outlineInverseSubtle = { $value: semanticOverrides["outline.neutral.outlineSubtle"] || semanticNeutral.outline.subtle.ref, $type: "color" };
      if (semanticNeutral.outline.default) root[colorKey].semantic.dark.outline.neutral.outlineInverse = { $value: semanticOverrides["outline.neutral.outlineDefault"] || semanticNeutral.outline.default.ref, $type: "color" };
      if (semanticNeutral.outline.intense) root[colorKey].semantic.dark.outline.neutral.outlineInverseIntense = { $value: semanticOverrides["outline.neutral.outlineIntense"] || semanticNeutral.outline.intense.ref, $type: "color" };
    }
  }

  // Add semantic tokens for primary scale (primary surfaces & outlines)
  // Always use primaryData (seed) for surfacePrimary, then calculate subtle/intense from it
  if (primaryData && primaryData.hex && primaryData.hsl) {
    // Initialize primary sub-objects if they don't exist
    if (!root[colorKey].semantic.light.surface.primary) root[colorKey].semantic.light.surface.primary = {};
    if (!root[colorKey].semantic.light.outline.primary) root[colorKey].semantic.light.outline.primary = {};
    if (!root[colorKey].semantic.dark.surface.primary) root[colorKey].semantic.dark.surface.primary = {};
    if (!root[colorKey].semantic.dark.outline.primary) root[colorKey].semantic.dark.outline.primary = {};

    // surfacePrimary -> always use seed (same for light and dark)
    root[colorKey].semantic.light.surface.primary.surfacePrimary = { $value: semanticOverrides["surface.primary.surfacePrimary"] || "{color.seed.primary}", $type: "color" };
    root[colorKey].semantic.dark.surface.primary.surfacePrimary = { $value: semanticOverrides["surface.primary.surfacePrimary"] || "{color.seed.primary}", $type: "color" };

    // Find the primary seed in the scale and pick adjacent tokens
    const primaryScaleEntries = scale.filter((item) => item.name.includes("color.primary"));
    
    // Find the seed index
    let seedIndex = -1;
    for (let i = 0; i < primaryScaleEntries.length; i++) {
      if (primaryScaleEntries[i].isSeed) {
        seedIndex = i;
        break;
      }
    }
    
    // Extract label helper
    function getPrimaryLabel(item) {
      if (!item || !item.name) return null;
      const m = item.name.match(/(\d+)/);
      return m ? m[0] : null;
    }
    
    // Helper to find color that meets contrast threshold against surface variant
    function findOutlineColorFromPrimary(backgroundHex, startIdx, direction = 'darker') {
      const outlineThreshold = 3.0;
      
      if (direction === 'darker') {
        // Search toward darker colors (higher indices)
        for (let i = startIdx; i < primaryScaleEntries.length; i++) {
          const ratio = getContrastRatio(backgroundHex, primaryScaleEntries[i].hex);
          if (typeof ratio === "number" && ratio >= outlineThreshold) {
            return { index: i, color: primaryScaleEntries[i] };
          }
        }
      } else {
        // Search toward lighter colors (lower indices)
        for (let i = startIdx; i >= 0; i--) {
          const ratio = getContrastRatio(backgroundHex, primaryScaleEntries[i].hex);
          if (typeof ratio === "number" && ratio >= outlineThreshold) {
            return { index: i, color: primaryScaleEntries[i] };
          }
        }
      }
      
      // Fallback to seed if nothing found
      return seedIndex >= 0 ? { index: seedIndex, color: primaryScaleEntries[seedIndex] } : null;
    }
    
    // Check if seed primary meets 3:1 contrast with surface variant for outline
    let outlineDefaultIndex = seedIndex;
    let outlineDefaultColor = seedIndex >= 0 ? primaryScaleEntries[seedIndex] : null;
    
    if (semanticNeutral && semanticNeutral.surfaceVariant) {
      const surfaceVariantHex = semanticNeutral.surfaceVariant.hex;
      const contrastWithSeed = getContrastRatio(surfaceVariantHex, primaryData.hex);
      
      // If seed doesn't meet threshold, find a color that does
      if (typeof contrastWithSeed !== "number" || contrastWithSeed < 3.0) {
        // Try searching darker first (likely for light backgrounds)
        const result = findOutlineColorFromPrimary(surfaceVariantHex, seedIndex, 'darker');
        if (result) {
          outlineDefaultIndex = result.index;
          outlineDefaultColor = result.color;
        }
      }
    }
    
    // Set outline primary default from the validated color
    if (outlineDefaultColor) {
      const defaultLabel = getPrimaryLabel(outlineDefaultColor);
      const defaultRef = defaultLabel ? `{color.palettes.primary.${defaultLabel}}` : "{color.seed.primary}";
      root[colorKey].semantic.light.outline.primary.outlinePrimary = { $value: semanticOverrides["outline.primary.outlinePrimary"] || defaultRef, $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimary = { $value: semanticOverrides["outline.primary.outlinePrimary"] || defaultRef, $type: "color" };
    } else {
      // Fallback to seed
      root[colorKey].semantic.light.outline.primary.outlinePrimary = { $value: semanticOverrides["outline.primary.outlinePrimary"] || "{color.seed.primary}", $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimary = { $value: semanticOverrides["outline.primary.outlinePrimary"] || "{color.seed.primary}", $type: "color" };
    }
    
    let subtleLabel = null;
    let intenseLabel = null;
    
    // Derive subtle and intense outline from the validated default outline index
    let outlineSubtleLabel = null;
    let outlineIntenseLabel = null;
    
    if (outlineDefaultIndex !== -1) {
      // Subtle outline: 2-3 steps lighter (lower index) - can be below threshold
      if (outlineDefaultIndex >= 2) {
        outlineSubtleLabel = getPrimaryLabel(primaryScaleEntries[outlineDefaultIndex - 2]);
      } else if (outlineDefaultIndex >= 1) {
        outlineSubtleLabel = getPrimaryLabel(primaryScaleEntries[outlineDefaultIndex - 1]);
      } else {
        outlineSubtleLabel = getPrimaryLabel(primaryScaleEntries[outlineDefaultIndex]);
      }
      
      // Intense outline: 2 steps darker (higher index)
      if (outlineDefaultIndex + 2 < primaryScaleEntries.length) {
        outlineIntenseLabel = getPrimaryLabel(primaryScaleEntries[outlineDefaultIndex + 2]);
      } else if (outlineDefaultIndex + 1 < primaryScaleEntries.length) {
        outlineIntenseLabel = getPrimaryLabel(primaryScaleEntries[outlineDefaultIndex + 1]);
      } else {
        outlineIntenseLabel = getPrimaryLabel(primaryScaleEntries[outlineDefaultIndex]);
      }
    }
    
    if (outlineSubtleLabel) {
      root[colorKey].semantic.light.outline.primary.outlinePrimarySubtle = { $value: semanticOverrides["outline.primary.outlinePrimarySubtle"] || `{color.palettes.primary.${outlineSubtleLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimarySubtle = { $value: semanticOverrides["outline.primary.outlinePrimarySubtle"] || `{color.palettes.primary.${outlineSubtleLabel}}`, $type: "color" };
    } else {
      // Fallback to seed if no subtle variant found
      root[colorKey].semantic.light.outline.primary.outlinePrimarySubtle = { $value: semanticOverrides["outline.primary.outlinePrimarySubtle"] || "{color.seed.primary}", $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimarySubtle = { $value: semanticOverrides["outline.primary.outlinePrimarySubtle"] || "{color.seed.primary}", $type: "color" };
    }
    
    if (outlineIntenseLabel) {
      root[colorKey].semantic.light.outline.primary.outlinePrimaryIntense = { $value: semanticOverrides["outline.primary.outlinePrimaryIntense"] || `{color.palettes.primary.${outlineIntenseLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimaryIntense = { $value: semanticOverrides["outline.primary.outlinePrimaryIntense"] || `{color.palettes.primary.${outlineIntenseLabel}}`, $type: "color" };
    } else {
      // Fallback to seed if no intense variant found
      root[colorKey].semantic.light.outline.primary.outlinePrimaryIntense = { $value: semanticOverrides["outline.primary.outlinePrimaryIntense"] || "{color.seed.primary}", $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimaryIntense = { $value: semanticOverrides["outline.primary.outlinePrimaryIntense"] || "{color.seed.primary}", $type: "color" };
    }
    
    // Surface primary variants: use seed index for subtle/intense calculation
    if (seedIndex !== -1) {
      // Subtle: prefer three steps lighter (e.g., 500 -> 200)
      if (seedIndex >= 3) {
        subtleLabel = getPrimaryLabel(primaryScaleEntries[seedIndex - 3]);
      } else if (seedIndex >= 2) {
        subtleLabel = getPrimaryLabel(primaryScaleEntries[seedIndex - 2]);
      } else if (seedIndex > 0) {
        subtleLabel = getPrimaryLabel(primaryScaleEntries[seedIndex - 1]);
      }
      // Intense: token after seed (darker)
      if (seedIndex < primaryScaleEntries.length - 1) {
        intenseLabel = getPrimaryLabel(primaryScaleEntries[seedIndex + 1]);
      }
    }
    
    if (subtleLabel) {
      root[colorKey].semantic.light.surface.primary.surfacePrimarySubtle = { $value: semanticOverrides["surface.primary.surfacePrimarySubtle"] || `{color.palettes.primary.${subtleLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.surface.primary.surfacePrimarySubtle = { $value: semanticOverrides["surface.primary.surfacePrimarySubtle"] || `{color.palettes.primary.${subtleLabel}}`, $type: "color" };
    }
    
    if (intenseLabel) {
      root[colorKey].semantic.light.surface.primary.surfacePrimaryIntense = { $value: semanticOverrides["surface.primary.surfacePrimaryIntense"] || `{color.palettes.primary.${intenseLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.surface.primary.surfacePrimaryIntense = { $value: semanticOverrides["surface.primary.surfacePrimaryIntense"] || `{color.palettes.primary.${intenseLabel}}`, $type: "color" };
    }

    // textOnPrimary: check contrast between primary surface (seed) and textPrimary from neutral scale
    // If contrast >= 4.5:1, use textPrimary, else use white (same for both themes)
    if (!root[colorKey].semantic.light.text.onPrimary) root[colorKey].semantic.light.text.onPrimary = {};
    if (!root[colorKey].semantic.dark.text.onPrimary) root[colorKey].semantic.dark.text.onPrimary = {};

    if (semanticNeutral && semanticNeutral.text && semanticNeutral.text.primary) {
      // Use the hex value directly from the semantic object
      const textPrimaryHex = semanticNeutral.text.primary.hex;
      const contrastOnPrimary = getContrastRatio(primaryData.hex, textPrimaryHex);
      
      if (typeof contrastOnPrimary === "number" && contrastOnPrimary >= 4.5) {
        // Use neutral text.primary as textOnPrimary
        root[colorKey].semantic.light.text.onPrimary.default = { $value: semanticOverrides["text.onPrimary.default"] || semanticNeutral.text.primary.ref, $type: "color" };
        root[colorKey].semantic.dark.text.onPrimary.default = { $value: semanticOverrides["text.onPrimary.default"] || semanticNeutral.text.primary.ref, $type: "color" };
      } else {
        // Use white
        root[colorKey].semantic.light.text.onPrimary.default = { $value: semanticOverrides["text.onPrimary.default"] || "{color.seed.white}", $type: "color" };
        root[colorKey].semantic.dark.text.onPrimary.default = { $value: semanticOverrides["text.onPrimary.default"] || "{color.seed.white}", $type: "color" };
      }
    } else {
      // Fallback to white if semantic text is not available
      root[colorKey].semantic.light.text.onPrimary.default = { $value: "{color.seed.white}", $type: "color" };
      root[colorKey].semantic.dark.text.onPrimary.default = { $value: "{color.seed.white}", $type: "color" };
    }
  }

  return root;
}

function generateSemanticFromNeutral(neutralScale, complianceMode = "AA") {
  // neutralScale: array of {name, hex} from light to dark (50 to 950)
  // Thresholds based on compliance mode
  const textThreshold = complianceMode === "AAA" ? 7 : 4.5;
  const outlineThreshold = 3.1;
  
  if (!Array.isArray(neutralScale) || neutralScale.length === 0) {
    return null;
  }

  // Helper: extract label from name (e.g., "greyscale.scale.950" -> "950")
  function getLabel(item) {
    if (!item || !item.name) return null;
    // Match longest first: 950, 900, 800, etc. before 50
    const match = item.name.match(/(950|900|800|700|600|500|300|200|100|50)/);
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

  // Outline tokens: find the first color that passes threshold, then derive subtle/intense from it
  const outlineTokens = { subtle: null, default: null, intense: null };
  
  // Start searching from after surfaceVariant (which is surfaceIdx + 1)
  const startIdx = Math.min(surfaceIdx + 2, neutralScale.length - 1);

  // Find first color that passes threshold - this is the default
  let defaultIdx = -1;
  for (let i = startIdx; i < neutralScale.length; i++) {
    const ratio = getContrastRatio(surfaceVariant.hex, neutralScale[i].hex);
    if (typeof ratio === "number" && ratio >= outlineThreshold) {
      defaultIdx = i;
      outlineTokens.default = neutralScale[i];
      break;
    }
  }

  // If we found a default, derive subtle (2 steps lighter/earlier) and intense (2 steps darker/later)
  if (defaultIdx >= 0) {
    const subtleIdx = defaultIdx - 2;
    const intenseIdx = defaultIdx + 2;
    // Only assign if indices are valid
    if (subtleIdx >= 0 && subtleIdx < neutralScale.length) {
      outlineTokens.subtle = neutralScale[subtleIdx];
    } else {
      outlineTokens.subtle = neutralScale[defaultIdx]; // fallback to default
    }
    if (intenseIdx >= 0 && intenseIdx < neutralScale.length) {
      outlineTokens.intense = neutralScale[intenseIdx];
    } else {
      outlineTokens.intense = neutralScale[defaultIdx]; // fallback to default
    }
  } else {
    // If no default found, use fallback from the darkest available
    const fallbackIdx = neutralScale.length - 1;
    outlineTokens.default = neutralScale[fallbackIdx];
    outlineTokens.subtle = neutralScale[Math.max(0, fallbackIdx - 2)];
    outlineTokens.intense = neutralScale[fallbackIdx];
  }

  // Outline inverted: find the first light color that passes threshold, then derive subtle/intense from it
  const outlineInvertedTokens = { subtle: null, default: null, intense: null };
  
  // Start searching backward from before surfaceInvertedVariant (which is surfaceInvertedIdx - 1)
  const startIdxInverted = Math.max(surfaceInvertedIdx - 2, 0);

  // Find first light color that passes threshold - this is the default
  let defaultIdxInverted = -1;
  for (let i = startIdxInverted; i >= 0; i--) {
    const ratio = getContrastRatio(surfaceInvertedVariant.hex, neutralScale[i].hex);
    if (typeof ratio === "number" && ratio >= outlineThreshold) {
      defaultIdxInverted = i;
      outlineInvertedTokens.default = neutralScale[i];
      break;
    }
  }

  // If we found a default, derive subtle (2 steps darker/later) and intense (2 steps lighter/earlier)
  if (defaultIdxInverted >= 0) {
    const subtleIdx = defaultIdxInverted + 2;
    const intenseIdx = defaultIdxInverted - 2;
    // Only assign if indices are valid
    if (subtleIdx >= 0 && subtleIdx < neutralScale.length) {
      outlineInvertedTokens.subtle = neutralScale[subtleIdx];
    } else {
      outlineInvertedTokens.subtle = neutralScale[defaultIdxInverted]; // fallback
    }
    if (intenseIdx >= 0 && intenseIdx < neutralScale.length) {
      outlineInvertedTokens.intense = neutralScale[intenseIdx];
    } else {
      outlineInvertedTokens.intense = neutralScale[defaultIdxInverted]; // fallback
    }
  } else {
    // If no default found, use fallback from the lightest available
    const fallbackIdx = 0;
    outlineInvertedTokens.default = neutralScale[fallbackIdx];
    outlineInvertedTokens.subtle = neutralScale[Math.min(neutralScale.length - 1, fallbackIdx + 2)];
    outlineInvertedTokens.intense = neutralScale[fallbackIdx];
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
      subtle: outlineTokens.subtle ? { hex: outlineTokens.subtle.hex, ref: makeRef(getLabel(outlineTokens.subtle)) } : null,
      default: outlineTokens.default ? { hex: outlineTokens.default.hex, ref: makeRef(getLabel(outlineTokens.default)) } : null,
      intense: outlineTokens.intense ? { hex: outlineTokens.intense.hex, ref: makeRef(getLabel(outlineTokens.intense)) } : null,
    },
    outlineInverted: {
      subtle: outlineInvertedTokens.subtle ? { hex: outlineInvertedTokens.subtle.hex, ref: makeRef(getLabel(outlineInvertedTokens.subtle)) } : null,
      default: outlineInvertedTokens.default ? { hex: outlineInvertedTokens.default.hex, ref: makeRef(getLabel(outlineInvertedTokens.default)) } : null,
      intense: outlineInvertedTokens.intense ? { hex: outlineInvertedTokens.intense.hex, ref: makeRef(getLabel(outlineInvertedTokens.intense)) } : null,
    },
  };
}

function renderSemanticMapping(tokens, scale, theme = 'light') {
  const container = document.getElementById("semantic-mapping-container");
  if (!container || !tokens || !tokens.color || !tokens.color.semantic) {
    return;
  }

  container.innerHTML = "";

  // Show both light and dark themes
  const lightSemantic = tokens.color.semantic.light;
  const darkSemantic = tokens.color.semantic.dark;
  
  // Helper to extract palette reference from $value
  function extractPaletteRef(value) {
    if (!value || !value.startsWith("{")) return null;
    const match = value.match(/\{color\.(seed\.\w+|palettes\.(neutral|primary)\.(\d+))\}/);
    return match ? match[0] : null;
  }

  // Build palette options for dropdowns
  const neutralOptions = scale.filter(item => item.name.includes("greyscale.scale"))
    .map(item => {
      const label = item.name.replace("greyscale.scale.", "");
      return { value: `{color.palettes.neutral.${label}}`, label: `neutral.${label}`, hex: item.hex };
    });
  
  const primaryOptions = scale.filter(item => item.name.includes("color.primary"))
    .map(item => {
      const label = item.name.replace("color.primary.", "");
      return { value: `{color.palettes.primary.${label}}`, label: `primary.${label}`, hex: item.hex };
    });

  const seedOptions = [
    { value: "{color.seed.white}", label: "white", hex: "#FFFFFF" },
    { value: "{color.seed.black}", label: "black", hex: "#000000" },
    { value: "{color.seed.primary}", label: "primary seed", hex: tokens.color.seed.primary.$value }
  ];

  const allOptions = [...seedOptions, ...neutralOptions, ...primaryOptions];

  // Helper to create a dropdown for a semantic token
  function createMapping(label, currentValue, tokenPath) {
    const row = document.createElement("div");
    row.className = "mapping-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.marginBottom = "8px";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.style.flex = "0 0 140px";
    labelEl.style.fontSize = "12px";

    const select = document.createElement("select");
    select.style.flex = "1";
    select.style.fontSize = "12px";
    select.dataset.tokenPath = tokenPath;

    allOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === currentValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    const swatch = document.createElement("span");
    swatch.className = "swatch small";
    const selectedOpt = allOptions.find(o => o.value === currentValue);
    swatch.style.background = selectedOpt ? selectedOpt.hex : "#222";

    select.addEventListener("change", () => {
      const newOpt = allOptions.find(o => o.value === select.value);
      if (newOpt) {
        swatch.style.background = newOpt.hex;
      }
      // Store the override
      semanticOverrides[tokenPath] = select.value;
      // Re-generate tokens with new mapping
      generateTokens();
    });

    row.appendChild(labelEl);
    row.appendChild(select);
    row.appendChild(swatch);
    return row;
  }

  // Create sections for different semantic token groups
  // LIGHT THEME
  const lightThemeSection = document.createElement("div");
  lightThemeSection.style.marginBottom = "24px";
  const lightThemeTitle = document.createElement("h3");
  lightThemeTitle.textContent = "Light Theme";
  lightThemeTitle.style.fontSize = "14px";
  lightThemeTitle.style.fontWeight = "700";
  lightThemeTitle.style.marginBottom = "12px";
  lightThemeTitle.style.color = "var(--accent)";
  lightThemeSection.appendChild(lightThemeTitle);

  const lightSurfaceGroup = document.createElement("div");
  lightSurfaceGroup.style.marginBottom = "16px";
  const lightSurfaceTitle = document.createElement("h4");
  lightSurfaceTitle.textContent = "Surfaces";
  lightSurfaceTitle.style.fontSize = "13px";
  lightSurfaceTitle.style.fontWeight = "600";
  lightSurfaceTitle.style.marginBottom = "8px";
  lightSurfaceGroup.appendChild(lightSurfaceTitle);

  if (lightSemantic && lightSemantic.surface && lightSemantic.surface.neutral) {
    if (lightSemantic.surface.neutral.surfaceBase) {
      lightSurfaceGroup.appendChild(createMapping("base", lightSemantic.surface.neutral.surfaceBase.$value, "surface.neutral.surfaceBase"));
    }
    if (lightSemantic.surface.neutral.surfaceDefault) {
      lightSurfaceGroup.appendChild(createMapping("default", lightSemantic.surface.neutral.surfaceDefault.$value, "surface.neutral.surfaceDefault"));
    }
    if (lightSemantic.surface.neutral.surfaceVariant) {
      lightSurfaceGroup.appendChild(createMapping("variant", lightSemantic.surface.neutral.surfaceVariant.$value, "surface.neutral.surfaceVariant"));
    }
    if (lightSemantic.surface.neutral.surfaceInverted) {
      lightSurfaceGroup.appendChild(createMapping("inverted", lightSemantic.surface.neutral.surfaceInverted.$value, "surface.neutral.surfaceInverted"));
    }
    if (lightSemantic.surface.neutral.surfaceInvertedVariant) {
      lightSurfaceGroup.appendChild(createMapping("inverted variant", lightSemantic.surface.neutral.surfaceInvertedVariant.$value, "surface.neutral.surfaceInvertedVariant"));
    }
  }

  if (lightSemantic && lightSemantic.surface && lightSemantic.surface.primary) {
    if (lightSemantic.surface.primary.surfacePrimary) {
      lightSurfaceGroup.appendChild(createMapping("primary", lightSemantic.surface.primary.surfacePrimary.$value, "surface.primary.surfacePrimary"));
    }
    if (lightSemantic.surface.primary.surfacePrimarySubtle) {
      lightSurfaceGroup.appendChild(createMapping("primary subtle", lightSemantic.surface.primary.surfacePrimarySubtle.$value, "surface.primary.surfacePrimarySubtle"));
    }
    if (lightSemantic.surface.primary.surfacePrimaryIntense) {
      lightSurfaceGroup.appendChild(createMapping("primary intense", lightSemantic.surface.primary.surfacePrimaryIntense.$value, "surface.primary.surfacePrimaryIntense"));
    }
  }

  lightThemeSection.appendChild(lightSurfaceGroup);

  // Light theme text tokens
  const lightTextGroup = document.createElement("div");
  lightTextGroup.style.marginBottom = "16px";
  const lightTextTitle = document.createElement("h4");
  lightTextTitle.textContent = "Text";
  lightTextTitle.style.fontSize = "13px";
  lightTextTitle.style.fontWeight = "600";
  lightTextTitle.style.marginBottom = "8px";
  lightTextGroup.appendChild(lightTextTitle);

  if (lightSemantic && lightSemantic.text && lightSemantic.text.neutral) {
    if (lightSemantic.text.neutral.textPrimary) {
      lightTextGroup.appendChild(createMapping("primary", lightSemantic.text.neutral.textPrimary.$value, "text.neutral.textPrimary"));
    }
    if (lightSemantic.text.neutral.textSecondary) {
      lightTextGroup.appendChild(createMapping("secondary", lightSemantic.text.neutral.textSecondary.$value, "text.neutral.textSecondary"));
    }
    if (lightSemantic.text.neutral.textTertiary) {
      lightTextGroup.appendChild(createMapping("tertiary", lightSemantic.text.neutral.textTertiary.$value, "text.neutral.textTertiary"));
    }
    if (lightSemantic.text.neutral.textPrimaryInverse) {
      lightTextGroup.appendChild(createMapping("primary inverse", lightSemantic.text.neutral.textPrimaryInverse.$value, "text.neutral.textPrimaryInverse"));
    }
    if (lightSemantic.text.neutral.textSecondaryInverse) {
      lightTextGroup.appendChild(createMapping("secondary inverse", lightSemantic.text.neutral.textSecondaryInverse.$value, "text.neutral.textSecondaryInverse"));
    }
    if (lightSemantic.text.neutral.textTertiaryInverse) {
      lightTextGroup.appendChild(createMapping("tertiary inverse", lightSemantic.text.neutral.textTertiaryInverse.$value, "text.neutral.textTertiaryInverse"));
    }
  }

  if (lightSemantic && lightSemantic.text && lightSemantic.text.onPrimary && lightSemantic.text.onPrimary.default) {
    lightTextGroup.appendChild(createMapping("on primary", lightSemantic.text.onPrimary.default.$value, "text.onPrimary.default"));
  }

  lightThemeSection.appendChild(lightTextGroup);

  // Light theme outline tokens
  const lightOutlineGroup = document.createElement("div");
  const lightOutlineTitle = document.createElement("h4");
  lightOutlineTitle.textContent = "Outlines";
  lightOutlineTitle.style.fontSize = "13px";
  lightOutlineTitle.style.fontWeight = "600";
  lightOutlineTitle.style.marginBottom = "8px";
  lightOutlineGroup.appendChild(lightOutlineTitle);

  if (lightSemantic && lightSemantic.outline && lightSemantic.outline.neutral) {
    if (lightSemantic.outline.neutral.outlineSubtle) {
      lightOutlineGroup.appendChild(createMapping("subtle", lightSemantic.outline.neutral.outlineSubtle.$value, "outline.neutral.outlineSubtle"));
    }
    if (lightSemantic.outline.neutral.outlineDefault) {
      lightOutlineGroup.appendChild(createMapping("default", lightSemantic.outline.neutral.outlineDefault.$value, "outline.neutral.outlineDefault"));
    }
    if (lightSemantic.outline.neutral.outlineIntense) {
      lightOutlineGroup.appendChild(createMapping("intense", lightSemantic.outline.neutral.outlineIntense.$value, "outline.neutral.outlineIntense"));
    }
    if (lightSemantic.outline.neutral.outlineInverseSubtle) {
      lightOutlineGroup.appendChild(createMapping("inverse subtle", lightSemantic.outline.neutral.outlineInverseSubtle.$value, "outline.neutral.outlineInverseSubtle"));
    }
    if (lightSemantic.outline.neutral.outlineInverse) {
      lightOutlineGroup.appendChild(createMapping("inverse", lightSemantic.outline.neutral.outlineInverse.$value, "outline.neutral.outlineInverse"));
    }
    if (lightSemantic.outline.neutral.outlineInverseIntense) {
      lightOutlineGroup.appendChild(createMapping("inverse intense", lightSemantic.outline.neutral.outlineInverseIntense.$value, "outline.neutral.outlineInverseIntense"));
    }
  }

  if (lightSemantic && lightSemantic.outline && lightSemantic.outline.primary) {
    if (lightSemantic.outline.primary.outlinePrimary) {
      lightOutlineGroup.appendChild(createMapping("primary", lightSemantic.outline.primary.outlinePrimary.$value, "outline.primary.outlinePrimary"));
    }
    if (lightSemantic.outline.primary.outlinePrimarySubtle) {
      lightOutlineGroup.appendChild(createMapping("primary subtle", lightSemantic.outline.primary.outlinePrimarySubtle.$value, "outline.primary.outlinePrimarySubtle"));
    }
    if (lightSemantic.outline.primary.outlinePrimaryIntense) {
      lightOutlineGroup.appendChild(createMapping("primary intense", lightSemantic.outline.primary.outlinePrimaryIntense.$value, "outline.primary.outlinePrimaryIntense"));
    }
  }

  lightThemeSection.appendChild(lightOutlineGroup);
  container.appendChild(lightThemeSection);

  // DARK THEME
  const darkThemeSection = document.createElement("div");
  darkThemeSection.style.marginBottom = "24px";
  const darkThemeTitle = document.createElement("h3");
  darkThemeTitle.textContent = "Dark Theme";
  darkThemeTitle.style.fontSize = "14px";
  darkThemeTitle.style.fontWeight = "700";
  darkThemeTitle.style.marginBottom = "12px";
  darkThemeTitle.style.color = "var(--accent)";
  darkThemeSection.appendChild(darkThemeTitle);

  const darkSurfaceGroup = document.createElement("div");
  darkSurfaceGroup.style.marginBottom = "16px";
  const darkSurfaceTitle = document.createElement("h4");
  darkSurfaceTitle.textContent = "Surfaces";
  darkSurfaceTitle.style.fontSize = "13px";
  darkSurfaceTitle.style.fontWeight = "600";
  darkSurfaceTitle.style.marginBottom = "8px";
  darkSurfaceGroup.appendChild(darkSurfaceTitle);

  if (darkSemantic && darkSemantic.surface && darkSemantic.surface.neutral) {
    if (darkSemantic.surface.neutral.surfaceBase) {
      darkSurfaceGroup.appendChild(createMapping("base", darkSemantic.surface.neutral.surfaceBase.$value, "surface.neutral.surfaceBase"));
    }
    if (darkSemantic.surface.neutral.surfaceDefault) {
      darkSurfaceGroup.appendChild(createMapping("default", darkSemantic.surface.neutral.surfaceDefault.$value, "surface.neutral.surfaceDefault"));
    }
    if (darkSemantic.surface.neutral.surfaceVariant) {
      darkSurfaceGroup.appendChild(createMapping("variant", darkSemantic.surface.neutral.surfaceVariant.$value, "surface.neutral.surfaceVariant"));
    }
    if (darkSemantic.surface.neutral.surfaceInverted) {
      darkSurfaceGroup.appendChild(createMapping("inverted", darkSemantic.surface.neutral.surfaceInverted.$value, "surface.neutral.surfaceInverted"));
    }
    if (darkSemantic.surface.neutral.surfaceInvertedVariant) {
      darkSurfaceGroup.appendChild(createMapping("inverted variant", darkSemantic.surface.neutral.surfaceInvertedVariant.$value, "surface.neutral.surfaceInvertedVariant"));
    }
  }

  if (darkSemantic && darkSemantic.surface && darkSemantic.surface.primary) {
    if (darkSemantic.surface.primary.surfacePrimary) {
      darkSurfaceGroup.appendChild(createMapping("primary", darkSemantic.surface.primary.surfacePrimary.$value, "surface.primary.surfacePrimary"));
    }
    if (darkSemantic.surface.primary.surfacePrimarySubtle) {
      darkSurfaceGroup.appendChild(createMapping("primary subtle", darkSemantic.surface.primary.surfacePrimarySubtle.$value, "surface.primary.surfacePrimarySubtle"));
    }
    if (darkSemantic.surface.primary.surfacePrimaryIntense) {
      darkSurfaceGroup.appendChild(createMapping("primary intense", darkSemantic.surface.primary.surfacePrimaryIntense.$value, "surface.primary.surfacePrimaryIntense"));
    }
  }

  darkThemeSection.appendChild(darkSurfaceGroup);

  // Dark theme text tokens
  const darkTextGroup = document.createElement("div");
  darkTextGroup.style.marginBottom = "16px";
  const darkTextTitle = document.createElement("h4");
  darkTextTitle.textContent = "Text";
  darkTextTitle.style.fontSize = "13px";
  darkTextTitle.style.fontWeight = "600";
  darkTextTitle.style.marginBottom = "8px";
  darkTextGroup.appendChild(darkTextTitle);

  if (darkSemantic && darkSemantic.text && darkSemantic.text.neutral) {
    if (darkSemantic.text.neutral.textPrimary) {
      darkTextGroup.appendChild(createMapping("primary", darkSemantic.text.neutral.textPrimary.$value, "text.neutral.textPrimary"));
    }
    if (darkSemantic.text.neutral.textSecondary) {
      darkTextGroup.appendChild(createMapping("secondary", darkSemantic.text.neutral.textSecondary.$value, "text.neutral.textSecondary"));
    }
    if (darkSemantic.text.neutral.textTertiary) {
      darkTextGroup.appendChild(createMapping("tertiary", darkSemantic.text.neutral.textTertiary.$value, "text.neutral.textTertiary"));
    }
    if (darkSemantic.text.neutral.textPrimaryInverse) {
      darkTextGroup.appendChild(createMapping("primary inverse", darkSemantic.text.neutral.textPrimaryInverse.$value, "text.neutral.textPrimaryInverse"));
    }
    if (darkSemantic.text.neutral.textSecondaryInverse) {
      darkTextGroup.appendChild(createMapping("secondary inverse", darkSemantic.text.neutral.textSecondaryInverse.$value, "text.neutral.textSecondaryInverse"));
    }
    if (darkSemantic.text.neutral.textTertiaryInverse) {
      darkTextGroup.appendChild(createMapping("tertiary inverse", darkSemantic.text.neutral.textTertiaryInverse.$value, "text.neutral.textTertiaryInverse"));
    }
  }

  if (darkSemantic && darkSemantic.text && darkSemantic.text.onPrimary && darkSemantic.text.onPrimary.default) {
    darkTextGroup.appendChild(createMapping("on primary", darkSemantic.text.onPrimary.default.$value, "text.onPrimary.default"));
  }

  darkThemeSection.appendChild(darkTextGroup);

  // Dark theme outline tokens
  const darkOutlineGroup = document.createElement("div");
  const darkOutlineTitle = document.createElement("h4");
  darkOutlineTitle.textContent = "Outlines";
  darkOutlineTitle.style.fontSize = "13px";
  darkOutlineTitle.style.fontWeight = "600";
  darkOutlineTitle.style.marginBottom = "8px";
  darkOutlineGroup.appendChild(darkOutlineTitle);

  if (darkSemantic && darkSemantic.outline && darkSemantic.outline.neutral) {
    if (darkSemantic.outline.neutral.outlineSubtle) {
      darkOutlineGroup.appendChild(createMapping("subtle", darkSemantic.outline.neutral.outlineSubtle.$value, "outline.neutral.outlineSubtle"));
    }
    if (darkSemantic.outline.neutral.outlineDefault) {
      darkOutlineGroup.appendChild(createMapping("default", darkSemantic.outline.neutral.outlineDefault.$value, "outline.neutral.outlineDefault"));
    }
    if (darkSemantic.outline.neutral.outlineIntense) {
      darkOutlineGroup.appendChild(createMapping("intense", darkSemantic.outline.neutral.outlineIntense.$value, "outline.neutral.outlineIntense"));
    }
    if (darkSemantic.outline.neutral.outlineInverseSubtle) {
      darkOutlineGroup.appendChild(createMapping("inverse subtle", darkSemantic.outline.neutral.outlineInverseSubtle.$value, "outline.neutral.outlineInverseSubtle"));
    }
    if (darkSemantic.outline.neutral.outlineInverse) {
      darkOutlineGroup.appendChild(createMapping("inverse", darkSemantic.outline.neutral.outlineInverse.$value, "outline.neutral.outlineInverse"));
    }
    if (darkSemantic.outline.neutral.outlineInverseIntense) {
      darkOutlineGroup.appendChild(createMapping("inverse intense", darkSemantic.outline.neutral.outlineInverseIntense.$value, "outline.neutral.outlineInverseIntense"));
    }
  }

  if (darkSemantic && darkSemantic.outline && darkSemantic.outline.primary) {
    if (darkSemantic.outline.primary.outlinePrimary) {
      darkOutlineGroup.appendChild(createMapping("primary", darkSemantic.outline.primary.outlinePrimary.$value, "outline.primary.outlinePrimary"));
    }
    if (darkSemantic.outline.primary.outlinePrimarySubtle) {
      darkOutlineGroup.appendChild(createMapping("primary subtle", darkSemantic.outline.primary.outlinePrimarySubtle.$value, "outline.primary.outlinePrimarySubtle"));
    }
    if (darkSemantic.outline.primary.outlinePrimaryIntense) {
      darkOutlineGroup.appendChild(createMapping("primary intense", darkSemantic.outline.primary.outlinePrimaryIntense.$value, "outline.primary.outlinePrimaryIntense"));
    }
  }

  darkThemeSection.appendChild(darkOutlineGroup);
  container.appendChild(darkThemeSection);
}

function generateTokens() {
  if (!generateBtn) return;
  
  // Show loading state
  const btnText = generateBtn.querySelector('.btn-text');
  const btnSpinner = generateBtn.querySelector('.btn-spinner');
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline-flex';
  generateBtn.disabled = true;
  
  // Use setTimeout to allow UI to update
  setTimeout(() => {
    try {
      const derived = updateDerivedPreview();
      if (!derived) {
        if (output) output.value = "Invalid primary colour.";
        if (copyBtn) copyBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
        if (tokenCount) tokenCount.textContent = "0";
        renderScale();
        renderMatrix();
        // Hide loading state before returning
        if (btnText) btnText.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
        if (generateBtn) generateBtn.disabled = false;
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
        renderSemanticPreview(semantic, complianceMode, tokens, scale.concat(primaryScale), currentTheme);
        // Render semantic contrast matrix
        renderSemanticMatrix(tokens, complianceMode, currentTheme);
        // Render semantic mapping UI
        renderSemanticMapping(tokens, scale.concat(primaryScale), currentTheme);
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
      if (tokenCount) tokenCount.textContent = total.toString();
      if (output) output.value = formatTokens(tokens, currentOutputFormat);
      if (copyBtn) copyBtn.disabled = total === 0;
      if (downloadBtn) downloadBtn.disabled = total === 0;
      
      // Add to recent colors
      if (primaryHex && total > 0) {
        addToRecentColors(primaryHex);
      }
    } catch (err) {
      console.error("generateTokens error:", err);
      console.error("Stack trace:", err.stack);
      ErrorHandler.handleGenerationError(err);
      if (output) output.value = `Error generating tokens: ${err.message}\n\nPlease try a different color or check the browser console for details.`;
      if (copyBtn) copyBtn.disabled = true;
      if (downloadBtn) downloadBtn.disabled = true;
      if (tokenCount) tokenCount.textContent = "0";
    } finally {
      // Hide loading state
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
      if (generateBtn) generateBtn.disabled = false;
    }
  }, 50);
}

// Color picker functionality for primary color
if (primaryColorPicker && primarySwatch) {
  // Open color picker when swatch is clicked
  primarySwatch.addEventListener("click", () => {
    primaryColorPicker.click();
  });

  // Update text input and swatch when color picker changes
  primaryColorPicker.addEventListener("input", (e) => {
    const color = e.target.value.toUpperCase();
    if (primaryInput) primaryInput.value = color;
    generateTokens();
  });
}

if (primaryInput) {
  primaryInput.addEventListener("input", Performance.debounce(() => {
    const normalized = normalizeHex(primaryInput.value);
    if (!normalized) {
      primaryInput.classList.add('error');
      setTimeout(() => primaryInput.classList.remove('error'), 2000);
      return;
    }
    
    if (primaryColorPicker) {
      primaryColorPicker.value = normalized;
    }
    primaryInput.value = normalized;
    
    // Clear contrast cache when color changes
    Performance.clearCache();
    
    try {
      generateTokens();
    } catch (error) {
      ErrorHandler.handleGenerationError(error);
    }
  }, 300));
}

// Harmony mode swatch listeners
function initHarmonySwatches() {
  const harmonySwatches = document.querySelectorAll(".harmony-swatch");
  harmonySwatches.forEach((swatch) => {
    swatch.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      // Remove active class from all swatches
      harmonySwatches.forEach((s) => s.classList.remove("active"));
      // Add active class to clicked swatch
      event.currentTarget.classList.add("active");
      
      // Update current tint color mode based on data attributes
      const mode = event.currentTarget.dataset.mode;
      const variant = event.currentTarget.dataset.variant;
      
      // Map mode + variant to tintMode string
      if (mode === "primary") {
        currentTintColorMode = "primary";
      } else if (mode === "complimentary") {
        currentTintColorMode = "complimentary";
      } else if (mode === "analogous") {
        currentTintColorMode = variant === "plus" ? "analogous-plus" : "analogous-minus";
      } else if (mode === "triadic") {
        currentTintColorMode = variant === "plus" ? "triadic-plus" : "triadic-minus";
      }
      
      // Generate tokens
      generateTokens();
    });
  });
}

// Tint amount switch listeners
function initTintAmountSwitches() {
  const tintAmountSwitches = document.querySelectorAll("#tintAmountSwitch-low, #tintAmountSwitch-mid, #tintAmountSwitch-high");
  tintAmountSwitches.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      // Remove active class from all amount buttons
      tintAmountSwitches.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      event.target.classList.add("active");
      // Update current tint level
      currentTintLevel = event.target.dataset.value;
      // Update hidden saturation input with calculated value
      if (satInput) {
        satInput.value = Math.round(tintAmounts[currentTintLevel] * 100) / 100;
      }
      // Generate tokens
      generateTokens();
    });
  });
}

// Event listeners will be initialized after config loads

if (generateBtn) {
  generateBtn.addEventListener("click", generateTokens);
}

// Theme toggle event listeners
const themeButtons = document.querySelectorAll(".theme-btn");
themeButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    // Remove active class and update ARIA for all theme buttons
    themeButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });
    // Add active class and ARIA to clicked button
    event.target.classList.add("active");
    event.target.setAttribute("aria-pressed", "true");
    // Update current theme
    currentTheme = event.target.dataset.theme;
    // Re-generate tokens with new theme
    generateTokens();
  });
});

// Output format toggle event listeners
const formatButtons = document.querySelectorAll(".format-btn");
formatButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    // Remove active class from all format buttons
    formatButtons.forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    event.target.classList.add("active");
    // Update current output format
    currentOutputFormat = event.target.dataset.format;
    // Re-generate tokens with new format
    generateTokens();
  });
});

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
    ErrorHandler.showSuccess("Tokens copied to clipboard");
    setTimeout(() => {
      copyBtn.textContent = "Copy output";
    }, 1500);
  } catch (error) {
    copyBtn.textContent = "Copy failed";
    ErrorHandler.showError("Failed to copy to clipboard");
    setTimeout(() => {
      copyBtn.textContent = "Copy output";
    }, 1500);
  }
});

downloadBtn.addEventListener("click", () => {
  try {
    const tokensData = output.value;
    if (!tokensData) {
      ErrorHandler.show("No tokens to download");
      return;
    }

    // Create blob from JSON data
    const blob = new Blob([tokensData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const a = document.createElement("a");
    a.href = url;
    a.download = "colour-tokens.json";
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update button text briefly
    const originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<ion-icon name="checkmark-outline" aria-hidden="true"></ion-icon>Downloaded';
    ErrorHandler.showSuccess("Tokens downloaded successfully");
    setTimeout(() => {
      downloadBtn.innerHTML = originalHTML;
    }, 1500);
  } catch (error) {
    ErrorHandler.show("Download failed: " + error.message);
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
  if (complianceLevel) complianceLevel.value = "AA";
  output.value = "";
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  tokenCount.textContent = "0";
  derivedHexInput.value = "";
  derivedSwatch.style.background = "#222";
  // Update tint amount switch UI
  const tintAmountSwitches = document.querySelectorAll("#tintAmountSwitch-low, #tintAmountSwitch-mid, #tintAmountSwitch-high");
  tintAmountSwitches.forEach((btn) => btn.classList.remove("active"));
  const lowSwitch = document.getElementById("tintAmountSwitch-low");
  if (lowSwitch) lowSwitch.classList.add("active");
  // Update harmony mode UI
  const harmonySwatches = document.querySelectorAll(".harmony-swatch");
  harmonySwatches.forEach((btn) => btn.classList.remove("active"));
  const primarySwatch = document.querySelector('[data-mode="primary"]');
  if (primarySwatch) primarySwatch.classList.add("active");
  renderScale();
  renderPrimaryScale();
  renderMatrix();
});

// Initialize welcome page
initWelcomePage();

// Load configuration and apply to UI
if (typeof initConfig === 'function') {
  initConfig().then(() => {
    // Config has loaded and rebuilt the buttons, now attach event listeners
    initHarmonySwatches();
    initTintAmountSwitches();
  });
} else {
  // If no config-loader, just initialize normally
  initHarmonySwatches();
  initTintAmountSwitches();
}

// Generate random tint amounts on app load
generateRandomTintAmounts();
if (satInput) {
  // Use low by default (now floored above 0 to avoid grey collisions)
  satInput.value = Math.round(tintAmounts.low * 100) / 100;
}

// Ensure the primary input and color picker are synchronized on load
const _initialPrimary = normalizeHex(primaryInput && primaryInput.value ? primaryInput.value : "");
if (_initialPrimary) {
  if (primaryInput) primaryInput.value = _initialPrimary;
  if (primaryColorPicker) primaryColorPicker.value = _initialPrimary;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? e.metaKey : e.ctrlKey;
  
  // Don't trigger if user is typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Cmd/Ctrl + G: Generate tokens
  if (modKey && e.key.toLowerCase() === 'g') {
    e.preventDefault();
    if (generateBtn && !generateBtn.disabled) {
      generateTokens();
    }
  }
  
  // Cmd/Ctrl + K: Copy output
  if (modKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (copyBtn && !copyBtn.disabled) {
      copyBtn.click();
    }
  }
});

// Palette Settings Modal
const paletteSettingsBtn = document.getElementById('palette-settings-btn');
const paletteSettingsModal = document.getElementById('palette-settings-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalApplyBtn = document.getElementById('modal-apply-btn');
const modalOverlay = document.querySelector('.modal-overlay');

if (paletteSettingsBtn) {
  paletteSettingsBtn.addEventListener('click', () => {
    paletteSettingsModal.classList.remove('hidden');
  });
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    paletteSettingsModal.classList.add('hidden');
  });
}

if (modalCancelBtn) {
  modalCancelBtn.addEventListener('click', () => {
    paletteSettingsModal.classList.add('hidden');
  });
}

if (modalApplyBtn) {
  modalApplyBtn.addEventListener('click', () => {
    // Apply settings logic will go here
    paletteSettingsModal.classList.add('hidden');
    generateTokens();
  });
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', () => {
    paletteSettingsModal.classList.add('hidden');
  });
}

updateDerivedPreview();
renderScale();
renderMatrix();
renderPrimaryScale();