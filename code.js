const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

figma.on("run", ({ command }) => {
  if (command === "help") {
    figma.notify("Open the plugin UI for help and documentation.");
    figma.closePlugin();
    return;
  }

  const size = getViewportSize();
  figma.showUI(__html__, size);

  if (figma.command === "open") {
    return;
  }
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === "close-plugin") {
    figma.closePlugin("Color token generator closed.");
    return;
  }

  if (msg.type === "generate-tokens") {
    try {
      const tokens =
        msg.source === "styles"
          ? collectFromPaintStyles()
          : collectFromSelection(msg.includeNameless);

      const greyscaleData = deriveGreyscaleColor(
        msg.primaryColor,
        msg.greySaturation
      );

      const derivedToken = greyscaleData
        ? {
            id: "generated.greyscale",
            name: "greyscale.base",
            hex: greyscaleData.hex,
            type: "derived",
          }
        : null;

      const greyscaleScale = greyscaleData
        ? generateGreyscaleScale(greyscaleData)
        : [];

      const combinedTokens = tokens
        .concat(derivedToken ? [derivedToken] : [])
        .concat(greyscaleScale);

      if (!combinedTokens.length) {
        figma.notify("No solid colours found for the requested source.");
        figma.ui.postMessage({
          type: "tokens-generated",
          status: "empty",
          output: "",
          derivedColor: greyscaleData ? greyscaleData.hex : null,
          derivedScale: greyscaleScale.map((token) => ({
            name: token.name,
            hex: token.hex,
          })),
          metadata: {
            count: 0,
            derived: Boolean(greyscaleData),
          },
        });
        return;
      }

      const prepared = combinedTokens.map((token) =>
        Object.assign({}, token, {
          tokenName: createTokenName(token.name, msg.prefix || ""),
        })
      );

      const payload = formatTokens(prepared, msg.format);

      figma.ui.postMessage({
        type: "tokens-generated",
        status: "success",
        tokens: prepared,
        output: payload,
        metadata: {
          count: prepared.length,
          source: msg.source,
          format: msg.format,
          derived: Boolean(greyscaleData),
        },
        derivedColor: greyscaleData ? greyscaleData.hex : null,
        derivedScale: greyscaleScale.map((token) => ({
          name: token.name,
          hex: token.hex,
        })),
      });
    } catch (error) {
      figma.notify("Failed to generate tokens. See console for details.");
      console.error("Token generation error", error);
      figma.ui.postMessage({
        type: "tokens-generated",
        status: "error",
        message: error.message || "Unknown error",
        derivedColor: null,
        derivedScale: [],
      });
    }
  }
};

function collectFromPaintStyles() {
  const styles = figma.getLocalPaintStyles();

  return styles
    .map((style) => {
      const hex = getSolidPaintHex(style.paints);
      if (!hex) {
        return null;
      }
      return {
        id: style.id,
        name: style.name,
        hex,
        type: "style",
      };
    })
    .filter(Boolean);
}

function collectFromSelection(includeNameless = false) {
  const selection = figma.currentPage.selection;
  if (!selection.length) {
    throw new Error("Select at least one node that contains solid fills.");
  }

  const tokens = [];
  const seen = new Set();

  selection.forEach((node) => {
    traverseNode(node, (target) => {
      if (!("fills" in target) || !Array.isArray(target.fills)) {
        return;
      }

      const hex = getSolidPaintHex(target.fills);
      if (!hex || seen.has(hex)) {
        return;
      }

      const name =
        target.name && target.name.trim().length
          ? target.name
          : includeNameless
          ? `layer-${tokens.length + 1}`
          : null;

      if (!name) {
        return;
      }

      seen.add(hex);
      tokens.push({
        id: target.id,
        name,
        hex,
        type: "node",
      });
    });
  });

  return tokens;
}

function traverseNode(node, callback) {
  callback(node);
  if ("children" in node) {
    node.children.forEach((child) => traverseNode(child, callback));
  }
}

function getSolidPaintHex(paints) {
  if (!Array.isArray(paints)) {
    return null;
  }

  const solidPaint = paints.find(function (paint) {
    return paint && paint.type === "SOLID" && paint.visible !== false;
  });

  if (!solidPaint || !solidPaint.color) {
    return null;
  }

  const { r, g, b } = solidPaint.color;
  const alpha =
    typeof solidPaint.opacity === "number" ? solidPaint.opacity : 1;

  const hex = rgbToHex(r * 255, g * 255, b * 255);

  if (alpha < 1) {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${hex}${alphaHex.toUpperCase()}`;
  }

  return hex;
}

function rgbToHex(r, g, b) {
  const toHex = (value) =>
    Math.round(value)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function createTokenName(rawName, prefix) {
  const base = rawName
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-\/]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");

  const normalized = base
    .split("/")
    .filter(Boolean)
    .join(".");

  if (!prefix) {
    return normalized;
  }

  const cleanedPrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/^\.+|\.+$/g, "");

  return [cleanedPrefix, normalized].filter(Boolean).join(".");
}

function formatTokens(tokens, format) {
  if (format === "css") {
    const lines = tokens.map((token) => `  --${token.tokenName}: ${token.hex};`);
    return `:root {\n${lines.join("\n")}\n}`;
  }

  const output = tokens.reduce((acc, token) => {
    acc[token.tokenName] = token.hex;
    return acc;
  }, {});

  return JSON.stringify(output, null, 2);
}

function deriveGreyscaleColor(primaryHex, saturationPercent) {
  const normalized = normalizeHex(primaryHex);
  if (!normalized) {
    return null;
  }

  const hsl = hexToHsl(normalized);
  if (!hsl) {
    return null;
  }

  const saturationRatio = clamp(
    Number.parseFloat(saturationPercent) / 100 || 0,
    0,
    0.3
  );

  const rgb = hslToRgb(hsl.h, saturationRatio, hsl.l);
  if (!rgb) {
    return null;
  }

  return {
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    hsl: hsl,
    saturation: saturationRatio,
  };
}

function normalizeHex(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((char) => char + char)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }

  return null;
}

function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  const value = normalized.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }

    s = delta / (1 - Math.abs(2 * l - 1));
  }

  const hue = Math.round((h * 60 + 360) % 360);
  return { h: hue, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

function hslToRgb(h, s, l) {
  const normalizedH = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((normalizedH / 60) % 2) - 1));
  const m = l - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (normalizedH < 60) {
    rPrime = c;
    gPrime = x;
  } else if (normalizedH < 120) {
    rPrime = x;
    gPrime = c;
  } else if (normalizedH < 180) {
    gPrime = c;
    bPrime = x;
  } else if (normalizedH < 240) {
    gPrime = x;
    bPrime = c;
  } else if (normalizedH < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function getViewportSize() {
  const bounds =
    figma.viewport && figma.viewport.bounds
      ? figma.viewport.bounds
      : { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

  const width = clamp(Math.round(bounds.width * 0.8), 600, 1920);
  const height = clamp(Math.round(bounds.height * 0.7), 500, 1080);

  return { width, height };
}

function generateGreyscaleScale(greyscaleData) {
  if (!greyscaleData || !greyscaleData.hsl) {
    return [];
  }

  const { hsl, saturation } = greyscaleData;

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
    lighten.push({
      hex: hslToHex(hsl.h, saturation, lightness),
      lightness,
    });
  }

  const darken = [];
  for (let i = 1; i <= darkerSteps; i += 1) {
    const ratio = i / (darkerSteps + 1);
    const lightness = clamp(hsl.l - hsl.l * ratio, 0, 1);
    darken.push({
      hex: hslToHex(hsl.h, saturation, lightness),
      lightness,
    });
  }

  const ordered = []
    .concat(lighten.sort((a, b) => b.lightness - a.lightness))
    .concat([{ hex: greyscaleData.hex, lightness: hsl.l }])
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
    id: `generated.greyscale.scale.${scaleLabels[index]}`,
    name: `greyscale.scale.${scaleLabels[index]}`,
    hex: entry.hex,
    type: "derived-scale",
  }));
}

function hslToHex(h, s, l) {
  const rgb = hslToRgb(h, s, l);
  if (!rgb) {
    return null;
  }
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

