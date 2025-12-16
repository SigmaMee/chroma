// Script to generate tokens for different harmony modes
// This uses the core color functions from main.js

const fs = require('fs');

// ========== Color utility functions (from main.js) ==========

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

// ========== Harmony mode hue shift calculator ==========

function getHueShift(harmonyMode) {
  const shifts = {
    'analogous-plus': 30,
    'analogous-minus': -30,
    'triadic-plus': 120,
    'triadic-minus': -120,
    'split-complementary-plus': 150,
    'split-complementary-minus': 210,
    'tetradic-60': 60,
    'tetradic-240': 240,
    'warm-shift': 45,
    'cool-shift': -45,
  };
  return shifts[harmonyMode] || 0;
}

function deriveGreyscaleColor(primaryHex, saturationPercent, harmonyMode = "primary") {
  const normalized = normalizeHex(primaryHex);
  if (!normalized) {
    return null;
  }
  const rgb = hexToRgb(normalized);
  if (!rgb) {
    return null;
  }
  let hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Apply harmony mode hue shift
  if (harmonyMode !== "primary") {
    const shift = getHueShift(harmonyMode);
    hsl = { ...hsl, h: (hsl.h + shift + 360) % 360 };
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
      name: `greyscale.scale.${lighterSteps - i + 1}`,
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
      name: `greyscale.scale.${lighterSteps + 1 + i}`,
    });
  }

  const base = {
    hex: data.hex,
    lightness: hsl.l,
    name: `greyscale.scale.${lighterSteps + 1}`,
  };

  return [...lighten.reverse(), base, ...darken];
}

function generatePrimaryScale(primaryData) {
  if (!primaryData || !primaryData.hsl) {
    return [];
  }
  const { hsl } = primaryData;
  const scale = [];
  for (let i = 0; i < 10; i++) {
    const lightness = clamp(0.95 - i * 0.1, 0.05, 0.95);
    const rgb = hslToRgb(hsl.h, hsl.s, lightness);
    scale.push({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      lightness,
      name: `primary.scale.${i + 1}`,
    });
  }
  return scale;
}

function createTokens(scale, prefix, primaryData, derivedData) {
  const tokens = {};
  
  // Add greyscale tokens
  scale.forEach((item) => {
    const parts = item.name.split(".");
    let current = tokens;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = {
          $type: "color",
          $value: item.hex,
        };
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });

  return tokens;
}

// ========== Generate tokens for each harmony mode ==========

const PRIMARY_COLOR = '#3366FF';
const SATURATION = 14; // Mid-range saturation

const harmonyModes = [
  { name: 'analogous-plus', label: 'Analogous +30°' },
  { name: 'analogous-minus', label: 'Analogous -30°' },
  { name: 'triadic-plus', label: 'Triadic +120°' },
  { name: 'triadic-minus', label: 'Triadic -120°' },
  { name: 'split-complementary-plus', label: 'Split Complementary +150°' },
  { name: 'split-complementary-minus', label: 'Split Complementary +210°' },
  { name: 'tetradic-60', label: 'Tetradic 60°/240°' },
  { name: 'tetradic-240', label: 'Tetradic 60°/240° (alt)' },
  { name: 'warm-shift', label: 'Warm Shift +45°' },
  { name: 'cool-shift', label: 'Cool Shift -45°' },
];

console.log(`Generating tokens for primary color: ${PRIMARY_COLOR}`);
console.log(`Using saturation: ${SATURATION}%\n`);

harmonyModes.forEach(mode => {
  console.log(`Generating: ${mode.label}...`);
  
  // Generate derived color with harmony mode
  const derived = deriveGreyscaleColor(PRIMARY_COLOR, SATURATION, mode.name);
  
  if (!derived) {
    console.error(`Failed to generate derived color for ${mode.name}`);
    return;
  }
  
  // Generate greyscale scale
  const scale = generateGreyscaleScale(derived);
  
  // Generate primary scale
  const primaryHex = normalizeHex(PRIMARY_COLOR);
  const prgb = hexToRgb(primaryHex);
  const primaryData = { hex: primaryHex, hsl: rgbToHsl(prgb.r, prgb.g, prgb.b) };
  const primaryScale = generatePrimaryScale(primaryData);
  
  // Create tokens
  const tokens = createTokens(scale.concat(primaryScale), '', primaryData, derived);
  
  // Write to file
  const filename = `tokens-${mode.name}.json`;
  fs.writeFileSync(filename, JSON.stringify(tokens, null, 2));
  console.log(`  ✓ Created ${filename} (Tint: ${derived.hex})\n`);
});

console.log('All harmony mode tokens generated successfully!');
