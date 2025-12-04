# Chroma - Colour Alchemy

A comprehensive colour token generator and design system tool that creates accessible, semantic colour palettes from a single primary colour.

## Features

### Core Generation
- **Intelligent Neutral Palette**: Automatically generates a 10-step neutral scale (50-950) from your primary colour with randomized saturation (10-20%) for unique variations
- **Primary Colour Scale**: Creates a harmonious primary palette with 10 tonal variants
- **Semantic Token System**: Automatically generates semantic tokens for surfaces, text, and outlines with WCAG compliance
- **Light & Dark Themes**: Dual theme support with automatic token inversion for dark mode

### Semantic Tokens
- **Surface Tokens**: Base, default, variant, inverted, and inverted variant surfaces
- **Primary Surface Tokens**: Primary surface with subtle and intense variants
- **Text Tokens**: Primary, secondary, tertiary text with inverse variants
- **Outline Tokens**: Subtle, default, and intense outlines for neutral and primary colours
- **Automatic Text-on-Primary**: Smart contrast detection for text on primary surfaces

### Validation & Preview
- **WCAG Compliance**: Real-time contrast validation for AA/AAA standards
- **Interactive Preview**: Live semantic token preview with theme switching
- **Contrast Matrices**: Visual grids showing all colour combinations with pass/fail indicators
- **Override System**: Manual token mapping overrides with live preview updates

### Export Options
- **JSON Output**: W3C Design Tokens format with nested structure
- **CSS Variables**: Ready-to-use CSS custom properties with semantic naming
- **Copy to Clipboard**: One-click export of generated tokens

### User Experience
- **Icon-Based Navigation**: Clean tab interface with ionicons
- **Responsive Layout**: Viewport-optimized with independent column scrolling
- **Visual Feedback**: Color swatches, pills, and status indicators throughout
- **Accessibility**: ARIA labels and keyboard navigation support

## Project structure

```
chroma/
├── web/                    # Web application
│   ├── index.html         # Main application structure
│   ├── main.js            # Token generation logic
│   ├── layout.js          # Viewport height management
│   ├── styles.css         # Application styling
│   └── preview-template   # Semantic preview template
├── README.md              # This file
└── QUICK_START.md         # Quick start guide
```

## Getting started

### Run locally

```sh
# From the repo root
cd web
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

## Usage

1. **Enter a primary colour** (hex format) or use the colour picker
2. **Select compliance level** (AA or AAA) for contrast validation
3. **Choose tint settings**:
   - Amount: Low, Mid, or High saturation
   - Colour: Primary or Complementary tint mode
4. **Generate tokens** - each generation creates unique neutral variations
5. **Preview & validate**:
   - Switch between Light/Dark themes in Preview tab
   - Check WCAG compliance in Validation tab
   - Review contrast matrices for all combinations
6. **Override tokens** (optional) in the Semantic Mapping panel
7. **Export** as JSON or CSS from the Output tab

## Key Features Explained

### Randomized Neutral Generation
Each token generation applies a random saturation value (10-20%) to create unique neutral palettes while maintaining the primary colour's hue. This ensures variety across generations.

### Semantic Token System
The app automatically generates semantic tokens following a structured hierarchy:
- **Light Theme**: Uses light surfaces with dark text
- **Dark Theme**: Inverts surfaces and text for dark mode compatibility
- **Automatic Mapping**: Intelligent selection of tokens based on contrast ratios

### WCAG Validation
Three validation modes:
- **Semantic Matrix**: Validates semantic token combinations
- **Neutral Matrix**: Tests all neutral scale combinations
- **Primary Matrix**: Tests primary colours against neutral foregrounds

### Override System
Manual control over semantic token assignments with live preview:
- Select from seed colours, neutral palette, or primary palette
- Changes immediately reflected in preview
- Maintains WCAG compliance validation

## Implementation notes

- Pure vanilla JavaScript - no build step or dependencies required
- All colour calculations performed client-side
- HSL-based colour manipulation for accurate tonal scales
- Dynamic viewport height management for optimal layout
- Ionicons for consistent icon system
- CSS Grid and Flexbox for responsive layout

## Roadmap

- [ ] Figma plugin version for direct integration
- [ ] Additional colour formats (RGB, HSB)
- [ ] Export to popular design token formats (Style Dictionary, Tokens Studio)
- [ ] Gradient and multi-colour palette support
- [ ] Colour harmony modes (triadic, tetradic, analogous)
- [ ] Save/load palette presets
