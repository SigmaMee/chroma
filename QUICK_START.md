# 🚀 Quick Start: Semantic Tokens

## What Changed?
The Colour Token Generator now automatically generates **semantic tokens** — high-level color tokens for surfaces, text, and outlines — directly from your neutral palette.

## How to Use

### Step 1: Open the App
Visit `http://localhost:8000/index.html` in your browser (or open `web/index.html` directly)

### Step 2: Set Your Colors
- Enter a primary color (e.g., `#3366FF`)
- Adjust saturation (0–30%)
- Leave tint settings as-is or customize
- Select compliance mode: **AA** (default) or **AAA**

### Step 3: Generate Tokens
Click the **"Generate tokens"** button

### Step 4: View Semantic Tokens

#### In the Preview Tab:
- See **surface colors** with actual backgrounds
- View **text hierarchy** (primary/secondary/tertiary samples)
- Check **outline examples** with 2px borders
- Review **compliance info** (thresholds, mode)

#### In the JSON Output Tab:
- Find all semantic tokens under `color.semantic.*`
- Each token has `$value` (reference) and `$type` ("color")
- Example: `"surface": { "$value": "{color.palettes.neutral.50}", "$type": "color" }`

## What Semantic Tokens Are Generated?

| Category | Tokens | Purpose |
|---|---|---|
| **Surfaces** | surface, surfaceVariant, surfaceInverted, surfaceInvertedVariant | Light/dark backgrounds |
| **Text** | text.primary, text.secondary, text.tertiary | Text on surfaces (3 hierarchy levels) |
| **Text Inverted** | textInverted.primary, textInverted.secondary, textInverted.tertiary | Text on inverted surfaces |
| **Outlines** | outline.default, outline.variant | Border/stroke colors |
| **Outlines Inverted** | outlineInverted.default, outlineInverted.variant | Borders on inverted surfaces |

**Total: 14 semantic tokens**

## Compliance Modes

### AA Mode (Default)
- Text needs 4.5:1 contrast ratio
- Outlines need 3:1 contrast ratio
- WCAG AA standard compliance

### AAA Mode
- Text needs 7:1 contrast ratio
- Outlines need 4.5:1 contrast ratio
- WCAG AAA enhanced compliance

## Example Output

```json
{
  "color": {
    "seed": { /* existing */ },
    "palettes": { /* existing */ },
    "semantic": {
      "surface": {
        "$value": "{color.palettes.neutral.50}",
        "$type": "color"
      },
      "text": {
        "primary": {
          "$value": "{color.palettes.neutral.900}",
          "$type": "color"
        },
        "secondary": {
          "$value": "{color.palettes.neutral.800}",
          "$type": "color"
        },
        "tertiary": {
          "$value": "{color.palettes.neutral.600}",
          "$type": "color"
        }
      },
      "outline": {
        "default": {
          "$value": "{color.palettes.neutral.800}",
          "$type": "color"
        }
      }
    }
  }
}
```

## Key Features

✅ **Automatic** - Generated instantly from your palette  
✅ **Accessible** - Meets WCAG AA/AAA standards  
✅ **Configurable** - Choose compliance level  
✅ **Visual** - See surfaces and text hierarchy  
✅ **Standard** - W3C design token format  
✅ **Live** - Updates as you change inputs  

## How It Works

1. **Surface Selection**: Finds the neutral color with least contrast against white (light surface) and black (dark surface)

2. **Text Search**: Scans through darker colors until finding ones that meet your compliance threshold (4.5:1 for AA, 7:1 for AAA)

3. **Outline Search**: Similar to text but with lower thresholds (3:1 for AA, 4.5:1 for AAA)

4. **Reference Creation**: All tokens reference palette colors using `{color.palettes.neutral.XXX}` format

5. **Output Generation**: Creates W3C design token structure with all 14 semantic tokens

## Tips

💡 **Customize compliance**: Change AA/AAA mode to see different text tokens  
💡 **Copy output**: Click "Copy output" to copy all tokens to clipboard  
💡 **Adjust primary**: Change primary color to regenerate everything  
💡 **Vary saturation**: Try different saturation levels (0–30%) for different neutral bases  

## What's New

| Before | After |
|---|---|
| Only palette tokens | Palette + semantic tokens |
| No guidance on which colors to use where | Clear surface/text/outline guidance |
| Manual color selection | Automatic semantic token generation |
| No accessibility guidance | WCAG AA/AAA compliance built-in |

## Questions?

Check the documentation files for detailed technical information:
- `SEMANTIC_TOKENS_README.md` - Full feature overview
- `SEMANTIC_TOKENS_IMPLEMENTATION.md` - Technical details
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation notes

---

**Version**: 1.0  
**Status**: ✅ Ready to use
