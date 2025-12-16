# Content Configuration Guide

## Overview
All user-facing text, labels, and descriptions are now managed through `config.json`. You can update the application content without touching the HTML, CSS, or JavaScript code.

## How to Update Content

1. **Open `web/config.json`** in any text editor
2. **Edit the text values** you want to change
3. **Save the file**
4. **Refresh the browser** - changes appear immediately

## Configuration Structure

### Welcome Page
```json
"welcomePage": {
  "title": "Welcome to Chroma",
  "subtitle": "App description...",
  "colorInputLabel": "Choose your primary colour",
  "defaultColor": "#3366FF",
  "ctaButton": "Begin the transmutation"
}
```

### Harmony Modes
Each harmony mode has:
- `id`: unique identifier (don't change)
- `mode` & `variant`: technical values (don't change)
- `title`: Display name
- `description`: Card description text
- `tooltip`: Hover text

```json
{
  "id": "monochromatic",
  "mode": "primary",
  "variant": "",
  "title": "Monochromatic",
  "description": "Your custom description here",
  "tooltip": "Monochromatic (same hue)"
}
```

### Labels and UI Text
All button labels, helper text, and section headings can be customized:
```json
"controls": {
  "primaryColorLabel": "Primary colour (hex)",
  "resetButton": "Reset",
  "generateButton": "Generate tokens"
}
```

## Important Notes

⚠️ **Do not modify:**
- `id`, `mode`, `variant` fields - these are used by the code
- The JSON structure (add/remove objects carefully)
- File encoding (keep as UTF-8)

✅ **Safe to modify:**
- All text content (titles, descriptions, labels)
- `defaultColor` hex value
- Button text
- Footer text and links

## Validation

After editing, validate your JSON:
1. Use an online JSON validator (jsonlint.com)
2. Or check browser console for errors after refresh

## Deployment

After updating `config.json`:
1. Test locally
2. Copy the file to `docs/config.json` for GitHub Pages
3. Commit and push both files

## Need Help?

If you accidentally break the JSON structure:
1. Check the browser console for error messages
2. Use a JSON validator to find syntax errors
3. Revert to a previous version from git history
