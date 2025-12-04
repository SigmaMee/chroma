# 🚀 Quick Start Guide

## Getting Started

### 1. Run the App

```sh
cd web
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

### 2. Generate Your First Palette

1. **Enter a primary colour** using the colour picker or type a hex value (e.g., `#3366FF`)
2. **Select compliance level**: Choose AA (4.5:1 text contrast) or AAA (7:1 text contrast)
3. **Adjust tint settings** (optional):
   - **Amount**: Low (10%), Mid (15%), or High (20%) saturation for neutral palette
   - **Colour**: Primary tint or Complementary tint mode
4. Click **"Generate tokens"** to create your colour system

### 3. Explore Your Palette

#### Preview Tab 👁️
- Switch between **Light** and **Dark** themes using the toggle buttons
- See semantic tokens applied to surfaces, text, and components
- Understand how your colours work together in real interfaces

#### Validation Tab ♿
- **Semantic Matrix**: Review all semantic token combinations with pass/fail indicators
- **Neutral Matrix**: Test every neutral colour combination for contrast
- **Primary Matrix**: Validate primary colours against neutral foregrounds
- Green = passes WCAG, Red = fails compliance

#### Output Tab 💻
- Toggle between **JSON** (W3C Design Tokens format) and **CSS** (custom properties)
- Click **"Copy output"** to grab all generated tokens
- Use in your design system, Tailwind config, or Style Dictionary

## Key Features

### Unique Neutral Palettes
Every time you generate tokens, the neutral palette uses a **randomized saturation value between 10-20%**. This creates unique variations while maintaining your primary colour's hue.

### Light & Dark Themes
The app automatically generates semantic tokens for both themes:
- **Light Theme**: Light surfaces (50) with dark text (900-600)
- **Dark Theme**: Dark surfaces (950) with light text (50-400)
- Tokens automatically invert when you switch themes

### Semantic Token System

Your palette generates:

**Surfaces** (6 tokens)
- `surface.base` - Main background
- `surface.default` - Default surface
- `surface.variant` - Alternative surface
- `surface.inverted` - Inverted background
- `surface.invertedVariant` - Inverted alternative
- Primary surfaces with subtle/intense variants

**Text** (6 tokens)
- `text.primary` - Main text (highest contrast)
- `text.secondary` - Secondary text
- `text.tertiary` - Tertiary text
- Plus inverse variants for dark backgrounds

**Outlines** (6 tokens)
- `outline.subtle` - Subtle borders
- `outline.default` - Default borders
- `outline.intense` - Strong borders
- Plus neutral/primary variants

**Primary-on-Text** (1 token)
- `textOnPrimary` - Automatically selected for text on primary surfaces

### Override System
Don't like an automatically assigned token? Override it:
1. Click the **"Override"** button next to any semantic token
2. Select from seed colours, neutral palette, or primary palette
3. Changes are immediately reflected in the preview
4. Hover over any dropdown to see the current colour swatch

## Understanding WCAG Compliance

### AA Mode (Default)
- Text requires **4.5:1** contrast ratio
- Outlines require **3:1** contrast ratio
- Meets WCAG 2.1 Level AA standards

### AAA Mode (Enhanced)
- Text requires **7:1** contrast ratio
- Outlines require **4.5:1** contrast ratio
- Meets WCAG 2.1 Level AAA standards

The validation matrices show pass/fail status for every combination:
- ✅ Green cell = passes your selected compliance level
- ❌ Red cell = fails compliance
- Hover over any cell to see the exact contrast ratio

## Output Formats

### JSON Format (Default)
W3C Design Tokens specification with references:

```json
{
  "color": {
    "semantic": {
      "light": {
        "surface": {
          "base": {
            "$value": "{color.palettes.neutral.50}",
            "$type": "color"
          }
        }
      }
    }
  }
}
```

### CSS Format
Ready-to-use CSS custom properties:

```css
:root {
  --color-semantic-light-surface-base: var(--color-palettes-neutral-50);
  --color-semantic-light-text-primary: var(--color-palettes-neutral-900);
}
```

## Tips & Tricks

💡 **Generate multiple times** - Each generation creates unique neutral variations due to randomized saturation  
💡 **Compare themes** - Switch between Light/Dark in preview to ensure consistency  
💡 **Check all matrices** - Don't just trust semantic tokens, validate all neutral and primary combinations  
💡 **Use overrides wisely** - The automatic selection is WCAG-compliant, overrides may break accessibility  
💡 **Export both formats** - Use JSON for design tools, CSS for immediate web implementation  

## What's Included

✅ 10-step neutral scale (50-950)  
✅ 10-step primary scale (50-950)  
✅ 19 semantic tokens (surfaces, text, outlines)  
✅ Light & dark theme variants  
✅ WCAG AA/AAA validation  
✅ Interactive preview with theme switching  
✅ JSON & CSS export formats  
✅ Manual override system  
✅ Real-time contrast matrices  

## Next Steps

- Experiment with different primary colours to see how the neutral palette adapts
- Try switching between AA and AAA modes to see stricter compliance requirements
- Use the override system to customize specific semantic tokens
- Export your tokens and integrate them into your design system
- Generate multiple times to find your preferred neutral palette variation

---

**Need more details?** Check the full README.md for comprehensive feature documentation and implementation notes.
