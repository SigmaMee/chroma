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
// Track latest generated scales for graph previews
let currentNeutralScale = [];
let currentPrimaryScale = [];

// Reuseable helper to enforce step bounds and minimum total of 5
function sanitizeStepCounts(before, after) {
  let safeBefore = Math.max(2, Math.min(16, Number.isFinite(before) ? before : 2));
  let safeAfter = Math.max(2, Math.min(16, Number.isFinite(after) ? after : 2));
  const total = safeBefore + safeAfter + 1;
  if (total < 5) {
    safeBefore = Math.max(safeBefore, 2);
    safeAfter = Math.max(safeAfter, 2);
  }
  return { before: safeBefore, after: safeAfter };
}

// Palette generation settings
let paletteSettings = {
  neutral: {
    stepsBefore: 5,
    stepsAfter: 6,
    easing: {
      curveType: 'cubic',
      easingType: 'inOut'
    }
  },
  primary: {
    stepsBefore: 5,
    stepsAfter: 6,
    easing: {
      curveType: 'cubic',
      easingType: 'inOut'
    }
  }
};

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
const complianceBtns = document.querySelectorAll(".compliance-btn");
const getComplianceMode = () => document.querySelector(".compliance-btn.active")?.dataset.level || "AA";

// Debug: Log compliance buttons
console.log("Compliance buttons found:", complianceBtns.length, complianceBtns);
console.log("Active button:", document.querySelector(".compliance-btn.active"));
console.log("Current compliance mode:", getComplianceMode());
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
  let lighterSteps = paletteSettings.neutral.stepsBefore;
  let darkerSteps = paletteSettings.neutral.stepsAfter;
  // Apply selected easing for neutral palette
  const neutralCurve = paletteSettings?.neutral?.easing?.curveType || 'cubic';
  const neutralEase = paletteSettings?.neutral?.easing?.easingType || 'inOut';
  const neutralEaseFn = getEasingFunction(neutralCurve, neutralEase);

  const lighten = [];
  for (let i = 1; i <= lighterSteps; i += 1) {
    const t = i / (lighterSteps + 1);
    const et = neutralEaseFn(t);
    const lightness = clamp(hsl.l + (1 - hsl.l) * et, 0, 1);
    const rgb = hslToRgb(hsl.h, saturation, lightness);
    lighten.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
    });
  }

  const darken = [];
  for (let i = 1; i <= darkerSteps; i += 1) {
    const t = i / (darkerSteps + 1);
    const et = neutralEaseFn(t);
    const lightness = clamp(hsl.l - hsl.l * et, 0, 1);
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

  return mapScaleToLabels(
    ordered,
    lighterSteps,
    darkerSteps,
    'greyscale.scale'
  );
}

function generatePrimaryScale(data) {
  if (!data || !data.hsl) {
    return [];
  }

  const { hsl } = data;
  let lighterSteps = paletteSettings.primary.stepsBefore;
  let darkerSteps = paletteSettings.primary.stepsAfter;
  // Apply selected easing for primary palette
  const primaryCurve = paletteSettings?.primary?.easing?.curveType || 'cubic';
  const primaryEase = paletteSettings?.primary?.easing?.easingType || 'inOut';
  const primaryEaseFn = getEasingFunction(primaryCurve, primaryEase);

  const lighten = [];
  for (let i = 1; i <= lighterSteps; i += 1) {
    const t = i / (lighterSteps + 1);
    const et = primaryEaseFn(t);
    const lightness = clamp(hsl.l + (1 - hsl.l) * et, 0, 1);
    const rgb = hslToRgb(hsl.h, hsl.s, lightness);
    lighten.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
    });
  }

  const darken = [];
  for (let i = 1; i <= darkerSteps; i += 1) {
    const t = i / (darkerSteps + 1);
    const et = primaryEaseFn(t);
    const lightness = clamp(hsl.l - hsl.l * et, 0, 1);
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

  return mapScaleToLabels(
    ordered,
    lighterSteps,
    darkerSteps,
    'color.primary'
  );
}

// Generate scale labels with seed always at 500 (index 6)
// Always returns the full 12-label array: [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
function generateScaleLabels() {
  // Full 12 predefined scale labels centered on 500 (index 6)
  return ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
}

// Map an ordered list of colors to the fixed label set, keeping the seed at 500
function mapScaleToLabels(ordered, stepsBefore, stepsAfter, prefix) {
  const labels = generateScaleLabels();
  const seedLabelIndex = labels.indexOf('500');
  const total = stepsBefore + stepsAfter + 1;

  // If the requested window meets or exceeds the available labels, return the full contiguous set.
  if (total >= labels.length) {
    return ordered.slice(0, labels.length).map((entry, index) => ({
      name: `${prefix}.${labels[index]}`,
      hex: entry.hex,
      isSeed: index === seedLabelIndex,
    }));
  }

  // Start centered on the seed, then shift the window to keep it contiguous inside bounds.
  let start = seedLabelIndex - stepsBefore;
  let end = seedLabelIndex + stepsAfter;

  if (start < 0) {
    const shift = -start;
    start = 0;
    end = Math.min(labels.length - 1, end + shift);
  }

  if (end > labels.length - 1) {
    const shift = end - (labels.length - 1);
    end = labels.length - 1;
    start = Math.max(0, start - shift);
  }

  const windowLabels = labels.slice(start, end + 1);
  const trimmed = ordered.slice(0, windowLabels.length);

  return trimmed.map((entry, index) => ({
    name: `${prefix}.${windowLabels[index]}`,
    hex: entry.hex,
    isSeed: index === stepsBefore,
  }));
}

// Easing function implementations
function easeInQuadratic(t) { return t * t; }
function easeOutQuadratic(t) { return 1 - (1 - t) * (1 - t); }
function easeInOutQuadratic(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function easeInCubic(t) { return t * t * t; }
function easeOutCubic(t) { return 1 - (1 - t) ** 3; }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; }

function easeInQuartic(t) { return t * t * t * t; }
function easeOutQuartic(t) { return 1 - (1 - t) ** 4; }
function easeInOutQuartic(t) { return t < 0.5 ? 8 * t * t * t * t : 1 - (-2 * t + 2) ** 4 / 2; }

function easeInQuintic(t) { return t * t * t * t * t; }
function easeOutQuintic(t) { return 1 - (1 - t) ** 5; }
function easeInOutQuintic(t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) ** 5 / 2; }

function getEasingFunction(curveType, easingType) {
  const easingMap = {
    linear: {
      in: t => t,
      out: t => t,
      inOut: t => t
    },
    quadratic: {
      in: easeInQuadratic,
      out: easeOutQuadratic,
      inOut: easeInOutQuadratic
    },
    cubic: {
      in: easeInCubic,
      out: easeOutCubic,
      inOut: easeInOutCubic
    },
    quartic: {
      in: easeInQuartic,
      out: easeOutQuartic,
      inOut: easeInOutQuartic
    },
    quintic: {
      in: easeInQuintic,
      out: easeOutQuintic,
      inOut: easeInOutQuintic
    }
  };
  
  return easingMap[curveType]?.[easingType] || ((t) => t);
}

// Render a palette preview strip using DOM cells
function renderPreviewStrip(containerId, colors) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  const arr = Array.isArray(colors) ? colors : [];
  arr.forEach((hex) => {
    const cell = document.createElement('div');
    cell.className = 'palette-preview-cell';
    cell.style.background = hex;
    el.appendChild(cell);
  });
}

// Build eased preview colors for neutral palette
function buildNeutralPreviewColors(curveType, easingType, stepsBeforeOverride, stepsAfterOverride) {
  try {
    const derived = updateDerivedPreview();
    if (!derived || !derived.hsl) return currentNeutralScale.map(e => e.hex);
    const easeFn = getEasingFunction(curveType, easingType);
    const { hsl, saturation } = derived;
    const lighterSteps = Number.isFinite(stepsBeforeOverride) ? stepsBeforeOverride : paletteSettings.neutral.stepsBefore;
    const darkerSteps = Number.isFinite(stepsAfterOverride) ? stepsAfterOverride : paletteSettings.neutral.stepsAfter;
    const colors = [];
    // lighter side (from near-seed to lightest)
    const lighten = [];
    for (let i = 1; i <= lighterSteps; i++) {
      const t = i / (lighterSteps + 1);
      const et = easeFn(t);
      const lightness = clamp(hsl.l + (1 - hsl.l) * et, 0, 1);
      const rgb = hslToRgb(hsl.h, saturation, lightness);
      lighten.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    // seed
    lighten.sort((a, b) => {
      const la = rgbToHsl(...Object.values(hexToRgb(a))).l;
      const lb = rgbToHsl(...Object.values(hexToRgb(b))).l;
      return lb - la;
    });
    colors.push(...lighten);
    colors.push(derived.hex);
    // darker side
    const darken = [];
    for (let i = 1; i <= darkerSteps; i++) {
      const t = i / (darkerSteps + 1);
      const et = easeFn(t);
      const lightness = clamp(hsl.l - hsl.l * et, 0, 1);
      const rgb = hslToRgb(hsl.h, saturation, lightness);
      darken.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    darken.sort((a, b) => {
      const la = rgbToHsl(...Object.values(hexToRgb(a))).l;
      const lb = rgbToHsl(...Object.values(hexToRgb(b))).l;
      return lb - la;
    });
    colors.push(...darken);
    // Trim to requested total
    const total = lighterSteps + darkerSteps + 1;
    return colors.slice(0, total);
  } catch (e) {
    return currentNeutralScale.map(e => e.hex);
  }
}

// Build eased preview colors for primary palette
function buildPrimaryPreviewColors(curveType, easingType, stepsBeforeOverride, stepsAfterOverride) {
  try {
    const primaryHex = normalizeHex(primaryInput && primaryInput.value ? primaryInput.value : "");
    const prgb = primaryHex ? hexToRgb(primaryHex) : null;
    if (!prgb) return currentPrimaryScale.map(e => e.hex);
    const hsl = rgbToHsl(prgb.r, prgb.g, prgb.b);
    const easeFn = getEasingFunction(curveType, easingType);
    const lighterSteps = Number.isFinite(stepsBeforeOverride) ? stepsBeforeOverride : paletteSettings.primary.stepsBefore;
    const darkerSteps = Number.isFinite(stepsAfterOverride) ? stepsAfterOverride : paletteSettings.primary.stepsAfter;
    const colors = [];
    const lighten = [];
    for (let i = 1; i <= lighterSteps; i++) {
      const t = i / (lighterSteps + 1);
      const et = easeFn(t);
      const lightness = clamp(hsl.l + (1 - hsl.l) * et, 0, 1);
      const rgb = hslToRgb(hsl.h, hsl.s, lightness);
      lighten.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    lighten.sort((a, b) => {
      const la = rgbToHsl(...Object.values(hexToRgb(a))).l;
      const lb = rgbToHsl(...Object.values(hexToRgb(b))).l;
      return lb - la;
    });
    colors.push(...lighten);
    colors.push(primaryHex);
    const darken = [];
    for (let i = 1; i <= darkerSteps; i++) {
      const t = i / (darkerSteps + 1);
      const et = easeFn(t);
      const lightness = clamp(hsl.l - hsl.l * et, 0, 1);
      const rgb = hslToRgb(hsl.h, hsl.s, lightness);
      darken.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    darken.sort((a, b) => {
      const la = rgbToHsl(...Object.values(hexToRgb(a))).l;
      const lb = rgbToHsl(...Object.values(hexToRgb(b))).l;
      return lb - la;
    });
    colors.push(...darken);
    const total = lighterSteps + darkerSteps + 1;
    return colors.slice(0, total);
  } catch (e) {
    return currentPrimaryScale.map(e => e.hex);
  }
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
  
  const level = getComplianceMode();
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

  const level = getComplianceMode();
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
    if (semantic.surface.primary.surfacePrimaryStrong) primarySurfaces.push({ name: "surfacePrimaryStrong", hex: resolveHex(semantic.surface.primary.surfacePrimaryStrong) });
  }

  // Build separate foreground arrays
  const neutralText = [];
  const invertedText = [];
  const primaryText = [];
  
  if (semantic.text && semantic.text.neutral) {
    if (semantic.text.neutral.textEmphasisHigh) neutralText.push({ name: "textEmphasisHigh", hex: resolveHex(semantic.text.neutral.textEmphasisHigh) });
    if (semantic.text.neutral.textEmphasisMedium) neutralText.push({ name: "textEmphasisMedium", hex: resolveHex(semantic.text.neutral.textEmphasisMedium) });
    if (semantic.text.neutral.textEmphasisLow) neutralText.push({ name: "textEmphasisLow", hex: resolveHex(semantic.text.neutral.textEmphasisLow) });
    if (semantic.text.neutral.textInverseHigh) invertedText.push({ name: "textInverseHigh", hex: resolveHex(semantic.text.neutral.textInverseHigh) });
    if (semantic.text.neutral.textInverseMedium) invertedText.push({ name: "textInverseMedium", hex: resolveHex(semantic.text.neutral.textInverseMedium) });
    if (semantic.text.neutral.textInverseLow) invertedText.push({ name: "textInverseLow", hex: resolveHex(semantic.text.neutral.textInverseLow) });
  }
  if (semantic.text && semantic.text.primary) {
    if (semantic.text.primary.textEmphasisHigh) primaryText.push({ name: "text.primary.emphasisHigh", hex: resolveHex(semantic.text.primary.textEmphasisHigh) });
    if (semantic.text.primary.textEmphasisMedium) primaryText.push({ name: "text.primary.emphasisMedium", hex: resolveHex(semantic.text.primary.textEmphasisMedium) });
    if (semantic.text.primary.textEmphasisLow) primaryText.push({ name: "text.primary.emphasisLow", hex: resolveHex(semantic.text.primary.textEmphasisLow) });
    if (semantic.text.primary.textOnPrimary) primaryText.push({ name: "textOnPrimary", hex: resolveHex(semantic.text.primary.textOnPrimary) });
  }
  if (semantic.outline && semantic.outline.neutral) {
    if (semantic.outline.neutral.outlineDefault) neutralText.push({ name: "outlineDefault", hex: resolveHex(semantic.outline.neutral.outlineDefault) });
    if (semantic.outline.neutral.outlineSubtle) neutralText.push({ name: "outlineSubtle", hex: resolveHex(semantic.outline.neutral.outlineSubtle) });
    if (semantic.outline.neutral.outlineStrong) neutralText.push({ name: "outlineStrong", hex: resolveHex(semantic.outline.neutral.outlineStrong) });
    if (semantic.outline.neutral.outlineInverse) invertedText.push({ name: "outlineInverse", hex: resolveHex(semantic.outline.neutral.outlineInverse) });
    if (semantic.outline.neutral.outlineInverseSubtle) invertedText.push({ name: "outlineInverseSubtle", hex: resolveHex(semantic.outline.neutral.outlineInverseSubtle) });
    if (semantic.outline.neutral.outlineInverseStrong) invertedText.push({ name: "outlineInverseStrong", hex: resolveHex(semantic.outline.neutral.outlineInverseStrong) });
  }
  if (semantic.outline && semantic.outline.primary) {
    if (semantic.outline.primary.outlinePrimary) neutralText.push({ name: "outlinePrimary", hex: resolveHex(semantic.outline.primary.outlinePrimary) });
    if (semantic.outline.primary.outlinePrimarySubtle) neutralText.push({ name: "outlinePrimarySubtle", hex: resolveHex(semantic.outline.primary.outlinePrimarySubtle) });
    if (semantic.outline.primary.outlinePrimaryStrong) neutralText.push({ name: "outlinePrimaryStrong", hex: resolveHex(semantic.outline.primary.outlinePrimaryStrong) });
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
    if (txt.textEmphasisHigh) cssVars['--semantic-text-emphasis-high'] = resolveTokenRef(txt.textEmphasisHigh.$value, tokens, scale);
    if (txt.textEmphasisMedium) cssVars['--semantic-text-emphasis-medium'] = resolveTokenRef(txt.textEmphasisMedium.$value, tokens, scale);
    if (txt.textEmphasisLow) cssVars['--semantic-text-emphasis-low'] = resolveTokenRef(txt.textEmphasisLow.$value, tokens, scale);
    if (txt.textInverseHigh) cssVars['--semantic-text-inverse-high'] = resolveTokenRef(txt.textInverseHigh.$value, tokens, scale);
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
    if (primSurf.surfacePrimaryStrong) cssVars['--semantic-surface-primary-strong'] = resolveTokenRef(primSurf.surfacePrimaryStrong.$value, tokens, scale);
  }

  // Map textOnPrimary token
  if (semanticTokens.text && semanticTokens.text.primary && semanticTokens.text.primary.textOnPrimary) {
    cssVars['--semantic-text-onPrimary'] = resolveTokenRef(semanticTokens.text.primary.textOnPrimary.$value, tokens, scale);
  }

  // Map outline tokens (fix variable names to match template)
  if (semanticTokens.outline && semanticTokens.outline.neutral) {
    const outl = semanticTokens.outline.neutral;
    if (outl.outlineSubtle) cssVars['--semantic-outline-neutral-outlineSubtle'] = resolveTokenRef(outl.outlineSubtle.$value, tokens, scale);
    if (outl.outlineDefault) cssVars['--semantic-outline-neutral-outlineDefault'] = resolveTokenRef(outl.outlineDefault.$value, tokens, scale);
    if (outl.outlineStrong) cssVars['--semantic-outline-neutral-outlineStrong'] = resolveTokenRef(outl.outlineStrong.$value, tokens, scale);
    if (outl.outlineInverseSubtle) cssVars['--semantic-outline-neutral-outlineInverseSubtle'] = resolveTokenRef(outl.outlineInverseSubtle.$value, tokens, scale);
    if (outl.outlineInverse) cssVars['--semantic-outline-neutral-outlineInverse'] = resolveTokenRef(outl.outlineInverse.$value, tokens, scale);
    if (outl.outlineInverseStrong) cssVars['--semantic-outline-neutral-outlineInverseStrong'] = resolveTokenRef(outl.outlineInverseStrong.$value, tokens, scale);
  }

  // Map primary outline tokens
  if (semanticTokens.outline && semanticTokens.outline.primary) {
    const primOutl = semanticTokens.outline.primary;
    if (primOutl.outlinePrimary) cssVars['--semantic-outline-primary-outlineDefault'] = resolveTokenRef(primOutl.outlinePrimary.$value, tokens, scale);
    if (primOutl.outlinePrimarySubtle) cssVars['--semantic-outline-primary-outlineSubtle'] = resolveTokenRef(primOutl.outlinePrimarySubtle.$value, tokens, scale);
    if (primOutl.outlinePrimaryStrong) cssVars['--semantic-outline-primary-outlineStrong'] = resolveTokenRef(primOutl.outlinePrimaryStrong.$value, tokens, scale);
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
      
      <!-- Row 1: Neutral outlines (subtle, default, strong) -->
      <div class="row">
        <div class="box outlineSubtle">Elixir</div>
        <div class="box outlineDefault">Philosopher's Stone</div>
        <div class="box outlineStrong">Transmutation</div>
      </div>

      <!-- Row 2: Primary outlines (subtle, default, strong) -->
      <div class="row">
        <div class="outlinePrimarySubtle box">Athanor</div>
        <div class="outlinePrimaryDefault box">Prima Materia</div>
        <div class="outlinePrimaryStrong box">Chrysopoeia</div>
      </div>

      </div>

      <!-- Surfaces demo -->
      <div class="row">
        <div class="box surfacePrimarySubtle">Ingredients</div>
        <div class="box primarySurface"><span class="onPrimary">Magic</span></div>
        <div class="box surfacePrimaryStrong">Catalyst</div>
      </div>

      <!-- Inverse container with inverse outlines row -->
      <div class="box surfaceInverted">
        Instructions
        <div class="box surfaceInvertedVariant">luck</div>
        <div class="row">
          <div class="box outlineInverseSubtle">Arcana</div>
          <div class="box outlineInverse">Nigredo</div>
          <div class="box outlineInverseStrong">Albedo</div>
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
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .outlineDefault {
      border: 2px solid var(--semantic-outline-neutral-outlineDefault);
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .outlineStrong {
      border: 2px solid var(--semantic-outline-neutral-outlineStrong);
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .outlineInverseSubtle {
      border: 2px solid var(--semantic-outline-neutral-outlineInverseSubtle);
      color: var(--semantic-text-inverse-high);
    }

    #semantic-preview-container .outlineInverse {
      border: 2px solid var(--semantic-outline-neutral-outlineInverse);
      color: var(--semantic-text-inverse-high);
    }

    #semantic-preview-container .outlineInverseStrong {
      border: 2px solid var(--semantic-outline-neutral-outlineInverseStrong);
      color: var(--semantic-text-inverse-high);
    }

    #semantic-preview-container .outlinePrimarySubtle {
      border: 2px solid var(--semantic-outline-primary-outlineSubtle);
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .outlinePrimaryDefault {
      border: 2px solid var(--semantic-outline-primary-outlineDefault);
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .outlinePrimaryStrong {
      border: 2px solid var(--semantic-outline-primary-outlineStrong);
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .surfaceVariant {
      background-color: var(--semantic-surface-neutral-surfaceVariant);
      color: var(--semantic-text-emphasis-high);
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    #semantic-preview-container .surfaceInvertedVariant {
      background-color: var(--semantic-surface-neutral-surfaceInvertedVariant);
      color: var(--semantic-text-inverse-high);
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
      color: var(--semantic-text-emphasis-high);
      font-size: 1rem;
    }

    #semantic-preview-container .secondaryText {
      color: var(--semantic-text-emphasis-medium);
      font-size: 0.875rem;
    }

    #semantic-preview-container .tertiaryText {
      color: var(--semantic-text-emphasis-low);
      font-size: 0.75rem;
    }

    #semantic-preview-container .preview-heading {
      color: var(--semantic-text-emphasis-high);
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
      color: var(--semantic-text-emphasis-high);
    }

    #semantic-preview-container .surfaceInverted {
      background-color: var(--semantic-surface-neutral-surfaceInverted);
      color: var(--semantic-text-inverse-high);
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

    #semantic-preview-container .surfacePrimaryStrong {
      background-color: var(--semantic-surface-primary-strong);
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
      if (semanticNeutral.text.primary) root[colorKey].semantic.light.text.neutral.textEmphasisHigh = { $value: semanticOverrides["text.neutral.textEmphasisHigh"] || semanticNeutral.text.primary.ref, $type: "color" };
      if (semanticNeutral.text.secondary) root[colorKey].semantic.light.text.neutral.textEmphasisMedium = { $value: semanticOverrides["text.neutral.textEmphasisMedium"] || semanticNeutral.text.secondary.ref, $type: "color" };
      if (semanticNeutral.text.tertiary) root[colorKey].semantic.light.text.neutral.textEmphasisLow = { $value: semanticOverrides["text.neutral.textEmphasisLow"] || semanticNeutral.text.tertiary.ref, $type: "color" };
    }

    // Add neutral text inverted tokens directly under semantic.light.text.neutral (not nested in inverted)
    if (semanticNeutral.textInverted) {
      if (semanticNeutral.textInverted.primary) root[colorKey].semantic.light.text.neutral.textInverseHigh = { $value: semanticOverrides["text.neutral.textInverseHigh"] || semanticNeutral.textInverted.primary.ref, $type: "color" };
      if (semanticNeutral.textInverted.secondary) root[colorKey].semantic.light.text.neutral.textInverseMedium = { $value: semanticOverrides["text.neutral.textInverseMedium"] || semanticNeutral.textInverted.secondary.ref, $type: "color" };
      if (semanticNeutral.textInverted.tertiary) root[colorKey].semantic.light.text.neutral.textInverseLow = { $value: semanticOverrides["text.neutral.textInverseLow"] || semanticNeutral.textInverted.tertiary.ref, $type: "color" };
    }

    // Add neutral outline tokens under semantic.light.outline.neutral
    root[colorKey].semantic.light.outline.neutral = {};
    if (semanticNeutral.outline) {
      if (semanticNeutral.outline.subtle) root[colorKey].semantic.light.outline.neutral.outlineSubtle = { $value: semanticOverrides["outline.neutral.outlineSubtle"] || semanticNeutral.outline.subtle.ref, $type: "color" };
      if (semanticNeutral.outline.default) root[colorKey].semantic.light.outline.neutral.outlineDefault = { $value: semanticOverrides["outline.neutral.outlineDefault"] || semanticNeutral.outline.default.ref, $type: "color" };
      if (semanticNeutral.outline.strong) root[colorKey].semantic.light.outline.neutral.outlineStrong = { $value: semanticOverrides["outline.neutral.outlineStrong"] || semanticNeutral.outline.strong.ref, $type: "color" };
    }

    // Add neutral outline inverted tokens directly under semantic.light.outline.neutral (not nested in inverted)
    if (semanticNeutral.outlineInverted) {
      if (semanticNeutral.outlineInverted.subtle) root[colorKey].semantic.light.outline.neutral.outlineInverseSubtle = { $value: semanticOverrides["outline.neutral.outlineInverseSubtle"] || semanticNeutral.outlineInverted.subtle.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.default) root[colorKey].semantic.light.outline.neutral.outlineInverse = { $value: semanticOverrides["outline.neutral.outlineInverse"] || semanticNeutral.outlineInverted.default.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.strong) root[colorKey].semantic.light.outline.neutral.outlineInverseStrong = { $value: semanticOverrides["outline.neutral.outlineInverseStrong"] || semanticNeutral.outlineInverted.strong.ref, $type: "color" };
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
      if (semanticNeutral.textInverted.primary) root[colorKey].semantic.dark.text.neutral.textEmphasisHigh = { $value: semanticOverrides["text.neutral.textInverseHigh"] || semanticNeutral.textInverted.primary.ref, $type: "color" };
      if (semanticNeutral.textInverted.secondary) root[colorKey].semantic.dark.text.neutral.textEmphasisMedium = { $value: semanticOverrides["text.neutral.textInverseMedium"] || semanticNeutral.textInverted.secondary.ref, $type: "color" };
      if (semanticNeutral.textInverted.tertiary) root[colorKey].semantic.dark.text.neutral.textEmphasisLow = { $value: semanticOverrides["text.neutral.textInverseLow"] || semanticNeutral.textInverted.tertiary.ref, $type: "color" };
    }
    if (semanticNeutral.text) {
      if (semanticNeutral.text.primary) root[colorKey].semantic.dark.text.neutral.textInverseHigh = { $value: semanticOverrides["text.neutral.textEmphasisHigh"] || semanticNeutral.text.primary.ref, $type: "color" };
      if (semanticNeutral.text.secondary) root[colorKey].semantic.dark.text.neutral.textInverseMedium = { $value: semanticOverrides["text.neutral.textEmphasisMedium"] || semanticNeutral.text.secondary.ref, $type: "color" };
      if (semanticNeutral.text.tertiary) root[colorKey].semantic.dark.text.neutral.textInverseLow = { $value: semanticOverrides["text.neutral.textEmphasisLow"] || semanticNeutral.text.tertiary.ref, $type: "color" };
    }

    // Dark theme outlines: swap outline <-> outlineInverted
    root[colorKey].semantic.dark.outline.neutral = {};
    if (semanticNeutral.outlineInverted) {
      if (semanticNeutral.outlineInverted.subtle) root[colorKey].semantic.dark.outline.neutral.outlineSubtle = { $value: semanticOverrides["outline.neutral.outlineInverseSubtle"] || semanticNeutral.outlineInverted.subtle.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.default) root[colorKey].semantic.dark.outline.neutral.outlineDefault = { $value: semanticOverrides["outline.neutral.outlineInverse"] || semanticNeutral.outlineInverted.default.ref, $type: "color" };
      if (semanticNeutral.outlineInverted.strong) root[colorKey].semantic.dark.outline.neutral.outlineStrong = { $value: semanticOverrides["outline.neutral.outlineInverseStrong"] || semanticNeutral.outlineInverted.strong.ref, $type: "color" };
    }
    if (semanticNeutral.outline) {
      if (semanticNeutral.outline.subtle) root[colorKey].semantic.dark.outline.neutral.outlineInverseSubtle = { $value: semanticOverrides["outline.neutral.outlineSubtle"] || semanticNeutral.outline.subtle.ref, $type: "color" };
      if (semanticNeutral.outline.default) root[colorKey].semantic.dark.outline.neutral.outlineInverse = { $value: semanticOverrides["outline.neutral.outlineDefault"] || semanticNeutral.outline.default.ref, $type: "color" };
      if (semanticNeutral.outline.strong) root[colorKey].semantic.dark.outline.neutral.outlineInverseStrong = { $value: semanticOverrides["outline.neutral.outlineStrong"] || semanticNeutral.outline.strong.ref, $type: "color" };
    }
  }

  // Add semantic tokens for primary scale (primary surfaces & outlines)
  // Always use primaryData (seed) for surfacePrimary, then calculate subtle/strong from it
  if (primaryData && primaryData.hex && primaryData.hsl) {
    // Initialize primary sub-objects if they don't exist
    if (!root[colorKey].semantic.light.surface.primary) root[colorKey].semantic.light.surface.primary = {};
    if (!root[colorKey].semantic.light.outline.primary) root[colorKey].semantic.light.outline.primary = {};
    if (!root[colorKey].semantic.dark.surface.primary) root[colorKey].semantic.dark.surface.primary = {};
    if (!root[colorKey].semantic.dark.outline.primary) root[colorKey].semantic.dark.outline.primary = {};

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
      const outlineThreshold = 4.5; // AA threshold - used for all primary tokens
      
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
    
    // Find the lightest primary color that meets AA (4.5:1) contrast with surface variant
    // This becomes the baseline for ALL primary tokens (surface, outline, text)
    let baselineIndex = -1;
    let baselineColor = null;
    
    if (semanticNeutral && semanticNeutral.surfaceVariant) {
      const surfaceVariantHex = semanticNeutral.surfaceVariant.hex;
      
      // Scan from light to dark to find first passing color (lightest that meets AA)
      for (let i = 0; i < primaryScaleEntries.length; i++) {
        const ratio = getContrastRatio(surfaceVariantHex, primaryScaleEntries[i].hex);
        if (typeof ratio === "number" && ratio >= 4.5) {
          baselineIndex = i;
          baselineColor = primaryScaleEntries[i];
          break;
        }
      }
    }
    
    // If no color meets AA threshold, fall back to seed
    if (baselineIndex === -1) {
      baselineIndex = seedIndex;
      baselineColor = seedIndex >= 0 ? primaryScaleEntries[seedIndex] : null;
    }
    
    // All primary tokens derive from the baseline (lightest color meeting AA with surfaceVariant)
    // Low emphasis (subtle): 4 steps lighter than baseline (e.g., 600→200)
    // Medium emphasis: baseline itself (e.g., 600)
    // High emphasis (strong): 1 step darker than baseline (e.g., 600→700)
    
    let lowEmphasisLabel = null;
    let mediumEmphasisLabel = null;
    let highEmphasisLabel = null;
    
    if (baselineIndex !== -1) {
      // Medium = baseline (lightest passing AA)
      mediumEmphasisLabel = getPrimaryLabel(baselineColor);
      
      // Low = 4 steps lighter (lower index)
      lowEmphasisLabel = getPrimaryLabel(primaryScaleEntries[baselineIndex - 4]);
      
      // High = 1 step darker (higher index)
      highEmphasisLabel = getPrimaryLabel(primaryScaleEntries[baselineIndex + 1]);
    }
    
    // OUTLINE PRIMARY - all use the same low/medium/high values
    if (mediumEmphasisLabel) {
      root[colorKey].semantic.light.outline.primary.outlinePrimary = { $value: semanticOverrides["outline.primary.outlinePrimary"] || `{color.palettes.primary.${mediumEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimary = { $value: semanticOverrides["outline.primary.outlinePrimary"] || `{color.palettes.primary.${mediumEmphasisLabel}}`, $type: "color" };
    }
    
    if (lowEmphasisLabel) {
      root[colorKey].semantic.light.outline.primary.outlinePrimarySubtle = { $value: semanticOverrides["outline.primary.outlinePrimarySubtle"] || `{color.palettes.primary.${lowEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimarySubtle = { $value: semanticOverrides["outline.primary.outlinePrimarySubtle"] || `{color.palettes.primary.${lowEmphasisLabel}}`, $type: "color" };
    }
    
    if (highEmphasisLabel) {
      root[colorKey].semantic.light.outline.primary.outlinePrimaryStrong = { $value: semanticOverrides["outline.primary.outlinePrimaryStrong"] || `{color.palettes.primary.${highEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.outline.primary.outlinePrimaryStrong = { $value: semanticOverrides["outline.primary.outlinePrimaryStrong"] || `{color.palettes.primary.${highEmphasisLabel}}`, $type: "color" };
    }
    
    // SURFACE PRIMARY - same low/medium/high values
    if (mediumEmphasisLabel) {
      root[colorKey].semantic.light.surface.primary.surfacePrimary = { $value: semanticOverrides["surface.primary.surfacePrimary"] || `{color.palettes.primary.${mediumEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.surface.primary.surfacePrimary = { $value: semanticOverrides["surface.primary.surfacePrimary"] || `{color.palettes.primary.${mediumEmphasisLabel}}`, $type: "color" };
    }
    
    if (lowEmphasisLabel) {
      root[colorKey].semantic.light.surface.primary.surfacePrimarySubtle = { $value: semanticOverrides["surface.primary.surfacePrimarySubtle"] || `{color.palettes.primary.${lowEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.surface.primary.surfacePrimarySubtle = { $value: semanticOverrides["surface.primary.surfacePrimarySubtle"] || `{color.palettes.primary.${lowEmphasisLabel}}`, $type: "color" };
    }
    
    if (highEmphasisLabel) {
      root[colorKey].semantic.light.surface.primary.surfacePrimaryStrong = { $value: semanticOverrides["surface.primary.surfacePrimaryStrong"] || `{color.palettes.primary.${highEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.surface.primary.surfacePrimaryStrong = { $value: semanticOverrides["surface.primary.surfacePrimaryStrong"] || `{color.palettes.primary.${highEmphasisLabel}}`, $type: "color" };
    }

    // TEXT PRIMARY - same low/medium/high values for both themes
    if (!root[colorKey].semantic.light.text.primary) root[colorKey].semantic.light.text.primary = {};
    if (!root[colorKey].semantic.dark.text.primary) root[colorKey].semantic.dark.text.primary = {};
    
    if (lowEmphasisLabel) {
      root[colorKey].semantic.light.text.primary.textEmphasisLow = { $value: semanticOverrides["text.primary.textEmphasisLow"] || `{color.palettes.primary.${lowEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.text.primary.textInverseLow = { $value: semanticOverrides["text.primary.textEmphasisLow"] || `{color.palettes.primary.${lowEmphasisLabel}}`, $type: "color" };
    }
    
    if (mediumEmphasisLabel) {
      root[colorKey].semantic.light.text.primary.textEmphasisMedium = { $value: semanticOverrides["text.primary.textEmphasisMedium"] || `{color.palettes.primary.${mediumEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.text.primary.textInverseMedium = { $value: semanticOverrides["text.primary.textEmphasisMedium"] || `{color.palettes.primary.${mediumEmphasisLabel}}`, $type: "color" };
    }
    
    if (highEmphasisLabel) {
      root[colorKey].semantic.light.text.primary.textEmphasisHigh = { $value: semanticOverrides["text.primary.textEmphasisHigh"] || `{color.palettes.primary.${highEmphasisLabel}}`, $type: "color" };
      root[colorKey].semantic.dark.text.primary.textInverseHigh = { $value: semanticOverrides["text.primary.textEmphasisHigh"] || `{color.palettes.primary.${highEmphasisLabel}}`, $type: "color" };
    }
    
    // For dark theme, find inverse colors (light text on dark background)
    if (semanticNeutral && semanticNeutral.surfaceInverted) {
      const darkBgHex = semanticNeutral.surfaceInverted.hex;
      
      // Find lightest color meeting AA threshold for dark backgrounds
      let inverseBaselineIndex = -1;
      for (let i = 0; i < primaryScaleEntries.length; i++) {
        const ratio = getContrastRatio(darkBgHex, primaryScaleEntries[i].hex);
        if (typeof ratio === "number" && ratio >= 4.5) {
          inverseBaselineIndex = i;
          break;
        }
      }
      
      if (inverseBaselineIndex !== -1) {
        const inverseLowLabel = getPrimaryLabel(primaryScaleEntries[inverseBaselineIndex - 4]);
        const inverseMediumLabel = getPrimaryLabel(primaryScaleEntries[inverseBaselineIndex]);
        const inverseHighLabel = getPrimaryLabel(primaryScaleEntries[inverseBaselineIndex + 1]);
        
        if (inverseLowLabel) {
          root[colorKey].semantic.light.text.primary.textInverseLow = { $value: semanticOverrides["text.primary.textInverseLow"] || `{color.palettes.primary.${inverseLowLabel}}`, $type: "color" };
          root[colorKey].semantic.dark.text.primary.textEmphasisLow = { $value: semanticOverrides["text.primary.textInverseLow"] || `{color.palettes.primary.${inverseLowLabel}}`, $type: "color" };
        }
        
        if (inverseMediumLabel) {
          root[colorKey].semantic.light.text.primary.textInverseMedium = { $value: semanticOverrides["text.primary.textInverseMedium"] || `{color.palettes.primary.${inverseMediumLabel}}`, $type: "color" };
          root[colorKey].semantic.dark.text.primary.textEmphasisMedium = { $value: semanticOverrides["text.primary.textInverseMedium"] || `{color.palettes.primary.${inverseMediumLabel}}`, $type: "color" };
        }
        
        if (inverseHighLabel) {
          root[colorKey].semantic.light.text.primary.textInverseHigh = { $value: semanticOverrides["text.primary.textInverseHigh"] || `{color.palettes.primary.${inverseHighLabel}}`, $type: "color" };
          root[colorKey].semantic.dark.text.primary.textEmphasisHigh = { $value: semanticOverrides["text.primary.textInverseHigh"] || `{color.palettes.primary.${inverseHighLabel}}`, $type: "color" };
        }
      }
    }
    
    // textOnPrimary: check contrast between primary surface (medium emphasis = baseline) and textEmphasisHigh from neutral scale
    // If contrast >= 4.5:1, use textEmphasisHigh, else use white (same for both themes)
    if (semanticNeutral && semanticNeutral.text && semanticNeutral.text.primary) {
      // Use the hex value directly from the semantic object
      const textPrimaryHex = semanticNeutral.text.primary.hex;
      const contrastOnPrimary = getContrastRatio(primaryData.hex, textPrimaryHex);
      
      if (typeof contrastOnPrimary === "number" && contrastOnPrimary >= 4.5) {
        // Use neutral text.primary as textOnPrimary
        root[colorKey].semantic.light.text.primary.textOnPrimary = { $value: semanticOverrides["text.primary.textOnPrimary"] || semanticNeutral.text.primary.ref, $type: "color" };
        root[colorKey].semantic.dark.text.primary.textOnPrimary = { $value: semanticOverrides["text.primary.textOnPrimary"] || semanticNeutral.text.primary.ref, $type: "color" };
      } else {
        // Use white
        root[colorKey].semantic.light.text.primary.textOnPrimary = { $value: semanticOverrides["text.primary.textOnPrimary"] || "{color.seed.white}", $type: "color" };
        root[colorKey].semantic.dark.text.primary.textOnPrimary = { $value: semanticOverrides["text.primary.textOnPrimary"] || "{color.seed.white}", $type: "color" };
      }
    } else {
      // Fallback to white if semantic text is not available
      root[colorKey].semantic.light.text.primary.textOnPrimary = { $value: "{color.seed.white}", $type: "color" };
      root[colorKey].semantic.dark.text.primary.textOnPrimary = { $value: "{color.seed.white}", $type: "color" };
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
    // Extract any numeric label from the name (supports dynamic scale labels)
    const match = item.name.match(/\.(\d+)$/);
    return match ? match[1] : null;
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

  // Outline tokens: find the first color that passes threshold, then derive subtle/strong from it
  const outlineTokens = { subtle: null, default: null, strong: null };
  
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

  // If we found a default, derive subtle (2 steps lighter/earlier) and strong (2 steps darker/later)
  if (defaultIdx >= 0) {
    const subtleIdx = defaultIdx - 2;
    const strongIdx = defaultIdx + 2;
    // Only assign if indices are valid
    if (subtleIdx >= 0 && subtleIdx < neutralScale.length) {
      outlineTokens.subtle = neutralScale[subtleIdx];
    } else {
      outlineTokens.subtle = neutralScale[defaultIdx]; // fallback to default
    }
    if (strongIdx >= 0 && strongIdx < neutralScale.length) {
      outlineTokens.strong = neutralScale[strongIdx];
    } else {
      outlineTokens.strong = neutralScale[defaultIdx]; // fallback to default
    }
  } else {
    // If no default found, use fallback from the darkest available
    const fallbackIdx = neutralScale.length - 1;
    outlineTokens.default = neutralScale[fallbackIdx];
    outlineTokens.subtle = neutralScale[Math.max(0, fallbackIdx - 2)];
    outlineTokens.strong = neutralScale[fallbackIdx];
  }

  // Outline inverted: find the first light color that passes threshold, then derive subtle/strong from it
  const outlineInvertedTokens = { subtle: null, default: null, strong: null };
  
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

  // If we found a default, derive subtle (2 steps darker/later) and strong (2 steps lighter/earlier)
  if (defaultIdxInverted >= 0) {
    const subtleIdx = defaultIdxInverted + 2;
    const strongIdx = defaultIdxInverted - 2;
    // Only assign if indices are valid
    if (subtleIdx >= 0 && subtleIdx < neutralScale.length) {
      outlineInvertedTokens.subtle = neutralScale[subtleIdx];
    } else {
      outlineInvertedTokens.subtle = neutralScale[defaultIdxInverted]; // fallback
    }
    if (strongIdx >= 0 && strongIdx < neutralScale.length) {
      outlineInvertedTokens.strong = neutralScale[strongIdx];
    } else {
      outlineInvertedTokens.strong = neutralScale[defaultIdxInverted]; // fallback
    }
  } else {
    // If no default found, use fallback from the lightest available
    const fallbackIdx = 0;
    outlineInvertedTokens.default = neutralScale[fallbackIdx];
    outlineInvertedTokens.subtle = neutralScale[Math.min(neutralScale.length - 1, fallbackIdx + 2)];
    outlineInvertedTokens.strong = neutralScale[fallbackIdx];
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
      strong: outlineTokens.strong ? { hex: outlineTokens.strong.hex, ref: makeRef(getLabel(outlineTokens.strong)) } : null,
    },
    outlineInverted: {
      subtle: outlineInvertedTokens.subtle ? { hex: outlineInvertedTokens.subtle.hex, ref: makeRef(getLabel(outlineInvertedTokens.subtle)) } : null,
      default: outlineInvertedTokens.default ? { hex: outlineInvertedTokens.default.hex, ref: makeRef(getLabel(outlineInvertedTokens.default)) } : null,
      strong: outlineInvertedTokens.strong ? { hex: outlineInvertedTokens.strong.hex, ref: makeRef(getLabel(outlineInvertedTokens.strong)) } : null,
    },
  };
}

function generateSemanticFromPrimary(primaryScale, complianceMode = "AA") {
  // primaryScale: array of {name, hex} from light to dark (50 to 950)
  // This function extracts text tokens from primary palette for text.primary semantic group
  const textThreshold = complianceMode === "AAA" ? 7 : 4.5;
  
  if (!Array.isArray(primaryScale) || primaryScale.length === 0) {
    return null;
  }

  function getLabel(item) {
    if (!item || !item.name) return null;
    const match = item.name.match(/(\d+)/);
    return match ? match[0] : null;
  }

  function makeRef(label) {
    return label ? `{color.palettes.primary.${label}}` : null;
  }

  // Use a typical light surface variant (darker surface in light mode) as the background reference
  // Assume surfaceVariant hex of around #E8E8E8 for text contrast checks
  const lightBgHex = "#E8E8E8";
  const darkBgHex = "#1A1A1A";

  // Text tokens for light theme: scan from light to dark, collect first 3 that meet threshold
  // This ensures emphasisLow is the LIGHTEST passing color, then darker for medium, darkest for high
  const textTokens = { primary: null, secondary: null, tertiary: null };
  const passingText = [];
  for (let i = 0; i < primaryScale.length && passingText.length < 3; i++) {
    const ratio = getContrastRatio(lightBgHex, primaryScale[i].hex);
    if (typeof ratio === "number" && ratio >= textThreshold) {
      passingText.push(primaryScale[i]);
    }
  }
  
  if (passingText.length === 1) {
    textTokens.tertiary = passingText[0];
    textTokens.secondary = passingText[0];
    textTokens.primary = passingText[0];
  } else if (passingText.length === 2) {
    textTokens.tertiary = passingText[0]; // lightest
    textTokens.secondary = passingText[0]; // duplicate to preserve hierarchy
    textTokens.primary = passingText[1]; // darker
  } else if (passingText.length >= 3) {
    textTokens.tertiary = passingText[0]; // lightest (emphasisLow)
    textTokens.secondary = passingText[1]; // middle (emphasisMedium)
    textTokens.primary = passingText[2]; // darkest (emphasisHigh)
  }

  // Text inverted: scan from light to dark for dark backgrounds
  // For inverted (light text on dark bg), primary should be LIGHTEST, tertiary should be DARKEST
  const textInvertedTokens = { primary: null, secondary: null, tertiary: null };
  const passingInverted = [];
  for (let i = 0; i < primaryScale.length && passingInverted.length < 3; i++) {
    const ratio = getContrastRatio(darkBgHex, primaryScale[i].hex);
    if (typeof ratio === "number" && ratio >= textThreshold) {
      passingInverted.push(primaryScale[i]);
    }
  }
  
  if (passingInverted.length === 1) {
    textInvertedTokens.tertiary = passingInverted[0];
    textInvertedTokens.secondary = passingInverted[0];
    textInvertedTokens.primary = passingInverted[0];
  } else if (passingInverted.length === 2) {
    textInvertedTokens.primary = passingInverted[0];   // lightest (inverseHigh)
    textInvertedTokens.secondary = passingInverted[0]; // duplicate
    textInvertedTokens.tertiary = passingInverted[1];  // darker (inverseLow)
  } else if (passingInverted.length >= 3) {
    textInvertedTokens.primary = passingInverted[0];   // lightest (inverseHigh)
    textInvertedTokens.secondary = passingInverted[1]; // middle (inverseMedium)
    textInvertedTokens.tertiary = passingInverted[2];  // darkest (inverseLow)
  }

  return {
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
    if (lightSemantic.surface.primary.surfacePrimaryStrong) {
      lightSurfaceGroup.appendChild(createMapping("primary strong", lightSemantic.surface.primary.surfacePrimaryStrong.$value, "surface.primary.surfacePrimaryStrong"));
    }
  }

  lightThemeSection.appendChild(lightSurfaceGroup);

  // Light theme text tokens
  const lightTextGroup = document.createElement("div");
  lightTextGroup.style.marginBottom = "16px";
  const lightTextTitle = document.createElement("h4");
  lightTextTitle.textContent = "Text (Neutral)";
  lightTextTitle.style.fontSize = "13px";
  lightTextTitle.style.fontWeight = "600";
  lightTextTitle.style.marginBottom = "8px";
  lightTextGroup.appendChild(lightTextTitle);

  if (lightSemantic && lightSemantic.text && lightSemantic.text.neutral) {
    if (lightSemantic.text.neutral.textEmphasisHigh) {
      lightTextGroup.appendChild(createMapping("emphasis high", lightSemantic.text.neutral.textEmphasisHigh.$value, "text.neutral.textEmphasisHigh"));
    }
    if (lightSemantic.text.neutral.textEmphasisMedium) {
      lightTextGroup.appendChild(createMapping("emphasis medium", lightSemantic.text.neutral.textEmphasisMedium.$value, "text.neutral.textEmphasisMedium"));
    }
    if (lightSemantic.text.neutral.textEmphasisLow) {
      lightTextGroup.appendChild(createMapping("emphasis low", lightSemantic.text.neutral.textEmphasisLow.$value, "text.neutral.textEmphasisLow"));
    }
    if (lightSemantic.text.neutral.textInverseHigh) {
      lightTextGroup.appendChild(createMapping("inverse high", lightSemantic.text.neutral.textInverseHigh.$value, "text.neutral.textInverseHigh"));
    }
    if (lightSemantic.text.neutral.textInverseMedium) {
      lightTextGroup.appendChild(createMapping("inverse medium", lightSemantic.text.neutral.textInverseMedium.$value, "text.neutral.textInverseMedium"));
    }
    if (lightSemantic.text.neutral.textInverseLow) {
      lightTextGroup.appendChild(createMapping("inverse low", lightSemantic.text.neutral.textInverseLow.$value, "text.neutral.textInverseLow"));
    }
  }

  lightThemeSection.appendChild(lightTextGroup);

  // Light theme text.primary tokens
  const lightTextPrimaryGroup = document.createElement("div");
  lightTextPrimaryGroup.style.marginBottom = "16px";
  const lightTextPrimaryTitle = document.createElement("h4");
  lightTextPrimaryTitle.textContent = "Text (Primary)";
  lightTextPrimaryTitle.style.fontSize = "13px";
  lightTextPrimaryTitle.style.fontWeight = "600";
  lightTextPrimaryTitle.style.marginBottom = "8px";
  lightTextPrimaryGroup.appendChild(lightTextPrimaryTitle);

  if (lightSemantic && lightSemantic.text && lightSemantic.text.primary) {
    if (lightSemantic.text.primary.textEmphasisHigh) {
      lightTextPrimaryGroup.appendChild(createMapping("emphasis high", lightSemantic.text.primary.textEmphasisHigh.$value, "text.primary.textEmphasisHigh"));
    }
    if (lightSemantic.text.primary.textEmphasisMedium) {
      lightTextPrimaryGroup.appendChild(createMapping("emphasis medium", lightSemantic.text.primary.textEmphasisMedium.$value, "text.primary.textEmphasisMedium"));
    }
    if (lightSemantic.text.primary.textEmphasisLow) {
      lightTextPrimaryGroup.appendChild(createMapping("emphasis low", lightSemantic.text.primary.textEmphasisLow.$value, "text.primary.textEmphasisLow"));
    }
    if (lightSemantic.text.primary.textInverseHigh) {
      lightTextPrimaryGroup.appendChild(createMapping("inverse high", lightSemantic.text.primary.textInverseHigh.$value, "text.primary.textInverseHigh"));
    }
    if (lightSemantic.text.primary.textInverseMedium) {
      lightTextPrimaryGroup.appendChild(createMapping("inverse medium", lightSemantic.text.primary.textInverseMedium.$value, "text.primary.textInverseMedium"));
    }
    if (lightSemantic.text.primary.textInverseLow) {
      lightTextPrimaryGroup.appendChild(createMapping("inverse low", lightSemantic.text.primary.textInverseLow.$value, "text.primary.textInverseLow"));
    }
    if (lightSemantic.text.primary.textOnPrimary) {
      lightTextPrimaryGroup.appendChild(createMapping("on primary", lightSemantic.text.primary.textOnPrimary.$value, "text.primary.textOnPrimary"));
    }
  }

  lightThemeSection.appendChild(lightTextPrimaryGroup);

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
    if (lightSemantic.outline.neutral.outlineStrong) {
      lightOutlineGroup.appendChild(createMapping("strong", lightSemantic.outline.neutral.outlineStrong.$value, "outline.neutral.outlineStrong"));
    }
    if (lightSemantic.outline.neutral.outlineInverseSubtle) {
      lightOutlineGroup.appendChild(createMapping("inverse subtle", lightSemantic.outline.neutral.outlineInverseSubtle.$value, "outline.neutral.outlineInverseSubtle"));
    }
    if (lightSemantic.outline.neutral.outlineInverse) {
      lightOutlineGroup.appendChild(createMapping("inverse", lightSemantic.outline.neutral.outlineInverse.$value, "outline.neutral.outlineInverse"));
    }
    if (lightSemantic.outline.neutral.outlineInverseStrong) {
      lightOutlineGroup.appendChild(createMapping("inverse strong", lightSemantic.outline.neutral.outlineInverseStrong.$value, "outline.neutral.outlineInverseStrong"));
    }
  }

  if (lightSemantic && lightSemantic.outline && lightSemantic.outline.primary) {
    if (lightSemantic.outline.primary.outlinePrimary) {
      lightOutlineGroup.appendChild(createMapping("primary", lightSemantic.outline.primary.outlinePrimary.$value, "outline.primary.outlinePrimary"));
    }
    if (lightSemantic.outline.primary.outlinePrimarySubtle) {
      lightOutlineGroup.appendChild(createMapping("primary subtle", lightSemantic.outline.primary.outlinePrimarySubtle.$value, "outline.primary.outlinePrimarySubtle"));
    }
    if (lightSemantic.outline.primary.outlinePrimaryStrong) {
      lightOutlineGroup.appendChild(createMapping("primary strong", lightSemantic.outline.primary.outlinePrimaryStrong.$value, "outline.primary.outlinePrimaryStrong"));
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
    if (darkSemantic.surface.primary.surfacePrimaryStrong) {
      darkSurfaceGroup.appendChild(createMapping("primary strong", darkSemantic.surface.primary.surfacePrimaryStrong.$value, "surface.primary.surfacePrimaryStrong"));
    }
  }

  darkThemeSection.appendChild(darkSurfaceGroup);

  // Dark theme text tokens
  const darkTextGroup = document.createElement("div");
  darkTextGroup.style.marginBottom = "16px";
  const darkTextTitle = document.createElement("h4");
  darkTextTitle.textContent = "Text (Neutral)";
  darkTextTitle.style.fontSize = "13px";
  darkTextTitle.style.fontWeight = "600";
  darkTextTitle.style.marginBottom = "8px";
  darkTextGroup.appendChild(darkTextTitle);

  if (darkSemantic && darkSemantic.text && darkSemantic.text.neutral) {
    if (darkSemantic.text.neutral.textEmphasisHigh) {
      darkTextGroup.appendChild(createMapping("emphasis high", darkSemantic.text.neutral.textEmphasisHigh.$value, "text.neutral.textEmphasisHigh"));
    }
    if (darkSemantic.text.neutral.textEmphasisMedium) {
      darkTextGroup.appendChild(createMapping("emphasis medium", darkSemantic.text.neutral.textEmphasisMedium.$value, "text.neutral.textEmphasisMedium"));
    }
    if (darkSemantic.text.neutral.textEmphasisLow) {
      darkTextGroup.appendChild(createMapping("emphasis low", darkSemantic.text.neutral.textEmphasisLow.$value, "text.neutral.textEmphasisLow"));
    }
    if (darkSemantic.text.neutral.textInverseHigh) {
      darkTextGroup.appendChild(createMapping("inverse high", darkSemantic.text.neutral.textInverseHigh.$value, "text.neutral.textInverseHigh"));
    }
    if (darkSemantic.text.neutral.textInverseMedium) {
      darkTextGroup.appendChild(createMapping("inverse medium", darkSemantic.text.neutral.textInverseMedium.$value, "text.neutral.textInverseMedium"));
    }
    if (darkSemantic.text.neutral.textInverseLow) {
      darkTextGroup.appendChild(createMapping("inverse low", darkSemantic.text.neutral.textInverseLow.$value, "text.neutral.textInverseLow"));
    }
  }

  darkThemeSection.appendChild(darkTextGroup);

  // Dark theme text.primary tokens
  const darkTextPrimaryGroup = document.createElement("div");
  darkTextPrimaryGroup.style.marginBottom = "16px";
  const darkTextPrimaryTitle = document.createElement("h4");
  darkTextPrimaryTitle.textContent = "Text (Primary)";
  darkTextPrimaryTitle.style.fontSize = "13px";
  darkTextPrimaryTitle.style.fontWeight = "600";
  darkTextPrimaryTitle.style.marginBottom = "8px";
  darkTextPrimaryGroup.appendChild(darkTextPrimaryTitle);

  if (darkSemantic && darkSemantic.text && darkSemantic.text.primary) {
    if (darkSemantic.text.primary.textEmphasisHigh) {
      darkTextPrimaryGroup.appendChild(createMapping("emphasis high", darkSemantic.text.primary.textEmphasisHigh.$value, "text.primary.textEmphasisHigh"));
    }
    if (darkSemantic.text.primary.textEmphasisMedium) {
      darkTextPrimaryGroup.appendChild(createMapping("emphasis medium", darkSemantic.text.primary.textEmphasisMedium.$value, "text.primary.textEmphasisMedium"));
    }
    if (darkSemantic.text.primary.textEmphasisLow) {
      darkTextPrimaryGroup.appendChild(createMapping("emphasis low", darkSemantic.text.primary.textEmphasisLow.$value, "text.primary.textEmphasisLow"));
    }
    if (darkSemantic.text.primary.textInverseHigh) {
      darkTextPrimaryGroup.appendChild(createMapping("inverse high", darkSemantic.text.primary.textInverseHigh.$value, "text.primary.textInverseHigh"));
    }
    if (darkSemantic.text.primary.textInverseMedium) {
      darkTextPrimaryGroup.appendChild(createMapping("inverse medium", darkSemantic.text.primary.textInverseMedium.$value, "text.primary.textInverseMedium"));
    }
    if (darkSemantic.text.primary.textInverseLow) {
      darkTextPrimaryGroup.appendChild(createMapping("inverse low", darkSemantic.text.primary.textInverseLow.$value, "text.primary.textInverseLow"));
    }
    if (darkSemantic.text.primary.textOnPrimary) {
      darkTextPrimaryGroup.appendChild(createMapping("on primary", darkSemantic.text.primary.textOnPrimary.$value, "text.primary.textOnPrimary"));
    }
  }

  darkThemeSection.appendChild(darkTextPrimaryGroup);

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
    if (darkSemantic.outline.neutral.outlineStrong) {
      darkOutlineGroup.appendChild(createMapping("strong", darkSemantic.outline.neutral.outlineStrong.$value, "outline.neutral.outlineStrong"));
    }
    if (darkSemantic.outline.neutral.outlineInverseSubtle) {
      darkOutlineGroup.appendChild(createMapping("inverse subtle", darkSemantic.outline.neutral.outlineInverseSubtle.$value, "outline.neutral.outlineInverseSubtle"));
    }
    if (darkSemantic.outline.neutral.outlineInverse) {
      darkOutlineGroup.appendChild(createMapping("inverse", darkSemantic.outline.neutral.outlineInverse.$value, "outline.neutral.outlineInverse"));
    }
    if (darkSemantic.outline.neutral.outlineInverseStrong) {
      darkOutlineGroup.appendChild(createMapping("inverse strong", darkSemantic.outline.neutral.outlineInverseStrong.$value, "outline.neutral.outlineInverseStrong"));
    }
  }

  if (darkSemantic && darkSemantic.outline && darkSemantic.outline.primary) {
    if (darkSemantic.outline.primary.outlinePrimary) {
      darkOutlineGroup.appendChild(createMapping("primary", darkSemantic.outline.primary.outlinePrimary.$value, "outline.primary.outlinePrimary"));
    }
    if (darkSemantic.outline.primary.outlinePrimarySubtle) {
      darkOutlineGroup.appendChild(createMapping("primary subtle", darkSemantic.outline.primary.outlinePrimarySubtle.$value, "outline.primary.outlinePrimarySubtle"));
    }
    if (darkSemantic.outline.primary.outlinePrimaryStrong) {
      darkOutlineGroup.appendChild(createMapping("primary strong", darkSemantic.outline.primary.outlinePrimaryStrong.$value, "outline.primary.outlinePrimaryStrong"));
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
      // Store for easing graph previews
      currentNeutralScale = neutralScale.slice();
      currentPrimaryScale = Array.isArray(primaryScale) ? primaryScale.slice() : [];
      let semantic = null;
      if (neutralScale.length > 0) {
        const complianceMode = getComplianceMode();
        semantic = generateSemanticFromNeutral(neutralScale, complianceMode);
      }

      // Pass primaryData, derived, and semantic to createTokens so it can use semantic.text.primary
      const tokens = createTokens(scale.concat(primaryScale), prefixInput ? prefixInput.value : "", primaryData, derived, semantic);

      // Render semantic tokens preview
      if (semantic) {
        const complianceMode = getComplianceMode();
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

complianceBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    complianceBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
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
    
    // Update semantic matrix if tokens exist
    if (currentTokens) {
      if (wcagTab.classList.contains("active")) {
        renderSemanticMatrix(currentTokens, getComplianceMode(), currentTheme);
      }
    }
  });
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
const modalTabBtns = document.querySelectorAll('.modal-tab-btn');
const modalTabContents = document.querySelectorAll('.modal-tab-content');

if (paletteSettingsBtn) {
  paletteSettingsBtn.addEventListener('click', () => {
    paletteSettingsModal.classList.remove('hidden');
    // Sync slider values with current settings
    setTimeout(() => {
      const nSliderBefore = document.getElementById('neutral-slider-before');
      const nSliderAfter = document.getElementById('neutral-slider-after');
      const pSliderBefore = document.getElementById('primary-slider-before');
      const pSliderAfter = document.getElementById('primary-slider-after');
      const nCurve = document.getElementById('neutral-easing-curve-type');
      const nEase = document.getElementById('neutral-easing-easing-type');
      const pCurve = document.getElementById('primary-easing-curve-type');
      const pEase = document.getElementById('primary-easing-easing-type');
      
      if (nSliderBefore) {
        nSliderBefore.value = paletteSettings.neutral.stepsBefore;
        document.querySelector('#neutral-settings .slider-input-group:nth-child(1) .slider-value').textContent = paletteSettings.neutral.stepsBefore;
      }
      if (nSliderAfter) {
        nSliderAfter.value = paletteSettings.neutral.stepsAfter;
        document.querySelector('#neutral-settings .slider-input-group:nth-child(2) .slider-value').textContent = paletteSettings.neutral.stepsAfter;
      }
      if (pSliderBefore) {
        pSliderBefore.value = paletteSettings.primary.stepsBefore;
        document.querySelector('#primary-settings .slider-input-group:nth-child(1) .slider-value').textContent = paletteSettings.primary.stepsBefore;
      }
      if (pSliderAfter) {
        pSliderAfter.value = paletteSettings.primary.stepsAfter;
        document.querySelector('#primary-settings .slider-input-group:nth-child(2) .slider-value').textContent = paletteSettings.primary.stepsAfter;
      }

      if (nCurve) nCurve.value = paletteSettings.neutral.easing.curveType;
      if (nEase) nEase.value = paletteSettings.neutral.easing.easingType;
      if (pCurve) pCurve.value = paletteSettings.primary.easing.curveType;
      if (pEase) pEase.value = paletteSettings.primary.easing.easingType;

      const neutralColors = buildNeutralPreviewColors(
        nCurve?.value || 'cubic',
        nEase?.value || 'inOut',
        paletteSettings.neutral.stepsBefore,
        paletteSettings.neutral.stepsAfter
      );
      const primaryColors = buildPrimaryPreviewColors(
        pCurve?.value || 'cubic',
        pEase?.value || 'inOut',
        paletteSettings.primary.stepsBefore,
        paletteSettings.primary.stepsAfter
      );
      renderPreviewStrip('neutral-preview-strip', neutralColors);
      renderPreviewStrip('primary-preview-strip', primaryColors);
    }, 0);
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
    // Read slider values directly (2-16 range)
    const nBeforeRaw = Number.parseInt(document.getElementById('neutral-slider-before')?.value, 10);
    const nAfterRaw = Number.parseInt(document.getElementById('neutral-slider-after')?.value, 10);
    const pBeforeRaw = Number.parseInt(document.getElementById('primary-slider-before')?.value, 10);
    const pAfterRaw = Number.parseInt(document.getElementById('primary-slider-after')?.value, 10);
    const nBefore = clamp(Number.isFinite(nBeforeRaw) ? nBeforeRaw : paletteSettings.neutral.stepsBefore, 2, 5);
    const nAfter = clamp(Number.isFinite(nAfterRaw) ? nAfterRaw : paletteSettings.neutral.stepsAfter, 2, 6);
    const pBefore = clamp(Number.isFinite(pBeforeRaw) ? pBeforeRaw : paletteSettings.primary.stepsBefore, 2, 5);
    const pAfter = clamp(Number.isFinite(pAfterRaw) ? pAfterRaw : paletteSettings.primary.stepsAfter, 2, 6);
    
    paletteSettings.neutral.stepsBefore = nBefore;
    paletteSettings.neutral.stepsAfter = nAfter;
    paletteSettings.primary.stepsBefore = pBefore;
    paletteSettings.primary.stepsAfter = pAfter;
    
    // Read per-palette easing settings
    const nCurveVal = document.getElementById('neutral-easing-curve-type')?.value || 'cubic';
    const nEaseVal = document.getElementById('neutral-easing-easing-type')?.value || 'inOut';
    const pCurveVal = document.getElementById('primary-easing-curve-type')?.value || 'cubic';
    const pEaseVal = document.getElementById('primary-easing-easing-type')?.value || 'inOut';
    paletteSettings.neutral.easing.curveType = nCurveVal;
    paletteSettings.neutral.easing.easingType = nEaseVal;
    paletteSettings.primary.easing.curveType = pCurveVal;
    paletteSettings.primary.easing.easingType = pEaseVal;
    
    console.log('Applied palette settings:', paletteSettings);
    
    paletteSettingsModal.classList.add('hidden');
    generateTokens();
  });
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', () => {
    paletteSettingsModal.classList.add('hidden');
  });
}

// Modal tab switching
modalTabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    // Remove active class from all tabs and contents
    modalTabBtns.forEach((b) => b.classList.remove('active'));
    modalTabContents.forEach((content) => content.classList.remove('active'));
    // Add active class to clicked tab and corresponding content
    btn.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    // Draw the appropriate preview when switching
    setTimeout(() => {
      if (tabName === 'neutral-settings') {
        const nCurve = document.getElementById('neutral-easing-curve-type');
        const nEase = document.getElementById('neutral-easing-easing-type');
        const nSteps = sanitizeStepCounts(
          Number.parseInt(document.getElementById('neutral-slider-before')?.value, 10),
          Number.parseInt(document.getElementById('neutral-slider-after')?.value, 10)
        );
        const colors = buildNeutralPreviewColors(
          nCurve?.value || 'cubic',
          nEase?.value || 'inOut',
          nSteps.before,
          nSteps.after
        );
        renderPreviewStrip('neutral-preview-strip', colors);
      } else if (tabName === 'primary-settings') {
        const pCurve = document.getElementById('primary-easing-curve-type');
        const pEase = document.getElementById('primary-easing-easing-type');
        const pSteps = sanitizeStepCounts(
          Number.parseInt(document.getElementById('primary-slider-before')?.value, 10),
          Number.parseInt(document.getElementById('primary-slider-after')?.value, 10)
        );
        const colors = buildPrimaryPreviewColors(
          pCurve?.value || 'cubic',
          pEase?.value || 'inOut',
          pSteps.before,
          pSteps.after
        );
        renderPreviewStrip('primary-preview-strip', colors);
      }
    }, 0);
  });
});

// Easing curve control event listeners (neutral)
const nCurveTypeSelect = document.getElementById('neutral-easing-curve-type');
const nEasingTypeSelect = document.getElementById('neutral-easing-easing-type');
if (nCurveTypeSelect) {
  nCurveTypeSelect.addEventListener('change', () => {
    const steps = sanitizeStepCounts(
      Number.parseInt(document.getElementById('neutral-slider-before')?.value, 10),
      Number.parseInt(document.getElementById('neutral-slider-after')?.value, 10)
    );
    const colors = buildNeutralPreviewColors(nCurveTypeSelect.value, nEasingTypeSelect?.value || 'inOut', steps.before, steps.after);
    renderPreviewStrip('neutral-preview-strip', colors);
  });
}
if (nEasingTypeSelect) {
  nEasingTypeSelect.addEventListener('change', () => {
    const steps = sanitizeStepCounts(
      Number.parseInt(document.getElementById('neutral-slider-before')?.value, 10),
      Number.parseInt(document.getElementById('neutral-slider-after')?.value, 10)
    );
    const colors = buildNeutralPreviewColors(nCurveTypeSelect?.value || 'cubic', nEasingTypeSelect.value, steps.before, steps.after);
    renderPreviewStrip('neutral-preview-strip', colors);
  });
}

// Easing curve control event listeners (primary)
const pCurveTypeSelect = document.getElementById('primary-easing-curve-type');
const pEasingTypeSelect = document.getElementById('primary-easing-easing-type');
if (pCurveTypeSelect) {
  pCurveTypeSelect.addEventListener('change', () => {
    const steps = sanitizeStepCounts(
      Number.parseInt(document.getElementById('primary-slider-before')?.value, 10),
      Number.parseInt(document.getElementById('primary-slider-after')?.value, 10)
    );
    const colors = buildPrimaryPreviewColors(pCurveTypeSelect.value, pEasingTypeSelect?.value || 'inOut', steps.before, steps.after);
    renderPreviewStrip('primary-preview-strip', colors);
  });
}
if (pEasingTypeSelect) {
  pEasingTypeSelect.addEventListener('change', () => {
    const steps = sanitizeStepCounts(
      Number.parseInt(document.getElementById('primary-slider-before')?.value, 10),
      Number.parseInt(document.getElementById('primary-slider-after')?.value, 10)
    );
    const colors = buildPrimaryPreviewColors(pCurveTypeSelect?.value || 'cubic', pEasingTypeSelect.value, steps.before, steps.after);
    renderPreviewStrip('primary-preview-strip', colors);
  });
}

// Update preview when step numbers change (live feedback) - now using sliders
const neutralSliderBefore = document.getElementById('neutral-slider-before');
const neutralSliderAfter = document.getElementById('neutral-slider-after');
if (neutralSliderBefore) {
  neutralSliderBefore.addEventListener('input', () => {
    const before = Number.parseInt(neutralSliderBefore.value, 10);
    const after = Number.parseInt(neutralSliderAfter?.value, 10) || 5;
    document.querySelector('#neutral-settings .slider-input-group:nth-child(1) .slider-value').textContent = before;
    
    const nCurve = document.getElementById('neutral-easing-curve-type');
    const nEase = document.getElementById('neutral-easing-easing-type');
    const colors = buildNeutralPreviewColors(nCurve?.value || 'cubic', nEase?.value || 'inOut', before, after);
    renderPreviewStrip('neutral-preview-strip', colors);
  });
}
if (neutralSliderAfter) {
  neutralSliderAfter.addEventListener('input', () => {
    const before = Number.parseInt(neutralSliderBefore?.value, 10) || 4;
    const after = Number.parseInt(neutralSliderAfter.value, 10);
    document.querySelector('#neutral-settings .slider-input-group:nth-child(2) .slider-value').textContent = after;
    
    const nCurve = document.getElementById('neutral-easing-curve-type');
    const nEase = document.getElementById('neutral-easing-easing-type');
    const colors = buildNeutralPreviewColors(nCurve?.value || 'cubic', nEase?.value || 'inOut', before, after);
    renderPreviewStrip('neutral-preview-strip', colors);
  });
}

const primarySliderBefore = document.getElementById('primary-slider-before');
const primarySliderAfter = document.getElementById('primary-slider-after');
if (primarySliderBefore) {
  primarySliderBefore.addEventListener('input', () => {
    const before = Number.parseInt(primarySliderBefore.value, 10);
    const after = Number.parseInt(primarySliderAfter?.value, 10) || 6;
    document.querySelector('#primary-settings .slider-input-group:nth-child(1) .slider-value').textContent = before;
    
    const pCurve = document.getElementById('primary-easing-curve-type');
    const pEase = document.getElementById('primary-easing-easing-type');
    const colors = buildPrimaryPreviewColors(pCurve?.value || 'cubic', pEase?.value || 'inOut', before, after);
    renderPreviewStrip('primary-preview-strip', colors);
  });
}
if (primarySliderAfter) {
  primarySliderAfter.addEventListener('input', () => {
    const before = Number.parseInt(primarySliderBefore?.value, 10) || 4;
    const after = Number.parseInt(primarySliderAfter.value, 10);
    document.querySelector('#primary-settings .slider-input-group:nth-child(2) .slider-value').textContent = after;
    
    const pCurve = document.getElementById('primary-easing-curve-type');
    const pEase = document.getElementById('primary-easing-easing-type');
    const colors = buildPrimaryPreviewColors(pCurve?.value || 'cubic', pEase?.value || 'inOut', before, after);
    renderPreviewStrip('primary-preview-strip', colors);
  });
}

updateDerivedPreview();
renderScale();
renderMatrix();
renderPrimaryScale();