# Chroma - Colour Alchemy

A comprehensive colour token generator and design system tool that creates accessible, semantic colour palettes from a single primary colour.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SigmaMee/chroma)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/SigmaMee/chroma)

## Features

### Core Generation
- **Intelligent Neutral Palette**: Automatically generates a 10-step neutral scale (50-950) from your primary colour with randomized saturation (10-20%) for unique variations
- **Primary Colour Scale**: Creates a harmonious primary palette with 10 tonal variants
- **Semantic Token System**: Automatically generates semantic tokens for surfaces, text, and outlines with WCAG compliance
- **Light & Dark Themes**: Dual theme support with automatic token inversion for dark mode
- **Production Ready**: Error handling, performance optimization, accessibility, and browser compatibility built-in

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
- **Download JSON**: Download tokens as `colour-tokens.json` file

### Performance & Quality
- **Debounced Inputs**: Smooth interaction with 300ms debounce on color inputs
- **LRU Caching**: Contrast calculations cached with 1000-entry limit for instant results
- **Error Handling**: Toast notifications for validation errors and edge cases
- **Browser Compatibility**: Vendor prefixes and feature detection for wide support
- **Accessibility**: Complete ARIA implementation with keyboard navigation
- **Automated Testing**: 16 unit tests covering core functionality

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
│   ├── config-loader.js   # Configuration loader
│   ├── config.json        # UI content configuration
│   ├── tests.html         # Automated test suite
│   └── preview-template   # Semantic preview template
├── package.json           # npm configuration
├── vercel.json           # Vercel deployment config
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── QUICK_START.md        # Quick start guide
└── CONFIG_GUIDE.md       # Configuration documentation
```

## Quick start

### Online (Recommended)

Visit the live app at: **[chroma-prod.vercel.app](https://chroma-prod.vercel.app)**

## Quick start

### Online (Recommended)

Visit the live app at: **[chroma-prod.vercel.app](https://chroma-prod.vercel.app)**

### Local development

```sh
# Clone the repository
git clone https://github.com/SigmaMee/chroma.git
cd chroma

# Start local server
npm start
# Or use Python
python3 -m http.server 8080

# Open http://localhost:8080/web in your browser
```

### Run tests

```sh
# Start local server (if not already running)
npm start

# Open test suite
# Navigate to http://localhost:8080/web/tests.html
```

## Getting started

## Getting started

### Basic workflow

1. **Enter a primary colour** (hex format like `#3366FF`) or use the colour picker
2. **Select compliance level** (AA or AAA) for WCAG contrast validation
3. **Choose tint settings**:
   - **Amount**: Low (10-18%), Mid (19-25%), or High (26-35%) saturation
   - **Colour**: Primary or Complementary tint mode
4. **Generate tokens** - creates unique neutral variations with each generation
5. **Preview & validate**:
   - Switch between Light/Dark themes in Preview tab
   - Check WCAG compliance in Validation tab (Semantic, Neutral, Primary matrices)
   - Review contrast ratios for all combinations
6. **Override tokens** (optional) in the Semantic Mapping panel for custom assignments
7. **Export**:
   - Copy to clipboard from Output tab
   - Download as `colour-tokens.json` file
   - Choose JSON or CSS Variables format

### Understanding the interface

#### Welcome Page
- Enter your primary color via hex input or color picker
- See live preview of the color with hex and RGB values
- Click "Let's go" to access the full generator

#### Generator Tabs
- **Preview**: Live semantic token preview with light/dark theme toggle
- **Validation**: WCAG contrast matrices (Semantic, Neutral, Primary)
- **Semantic Mapping**: Override token assignments with live preview
- **Output**: Copy or download generated tokens as JSON/CSS

#### Settings Panel
- **Prefix**: Add namespace prefix to token names (e.g., `brand-`)
- **Output Format**: Choose between JSON or CSS Variables
- **Compliance Level**: Set WCAG standard (AA = 4.5:1, AAA = 7:1)
- **Tint Amount**: Control neutral saturation (Low/Mid/High)
- **Tint Colour**: Choose Primary or Complementary hue shift
- **Generate**: Create new tokens (randomizes neutral palette each time)
- **Reset**: Clear all inputs and return to defaults

### Deploy your own

#### Deploy to Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SigmaMee/chroma)

Or manually:
```sh
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Deploy to Netlify

Alternatively, deploy to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/SigmaMee/chroma)

Or with Netlify CLI:
```sh
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=web
```

## API reference

### Token structure

Chroma generates tokens in [W3C Design Tokens](https://design-tokens.github.io/community-group/format/) format:

```json
{
  "color": {
    "seed": {
      "primary": {
        "$type": "color",
        "$value": "#3366FF"
      }
    },
    "palette": {
      "50": {
        "$type": "color",
        "$value": "#F5F5F5"
      }
    },
    "primary": {
      "500": {
        "$type": "color",
        "$value": "{color.seed.primary}"
      }
    },
    "surface": {
      "base": {
        "light": {
          "$type": "color",
          "$value": "{color.palette.50}"
        },
        "dark": {
          "$type": "color",
          "$value": "{color.palette.950}"
        }
      }
    }
  }
}
```

### Token categories

#### Seed Colors
- `color.seed.primary` - Your input color
- `color.seed.derived` - Auto-generated neutral base color

#### Neutral Palette
- `color.palette.50` to `color.palette.950` - 11-step neutral scale
- Randomized saturation (10-20%) for unique variations per generation

#### Primary Scale
- `color.primary.50` to `color.primary.950` - 11-step primary color scale
- Maintains consistent hue with varying lightness

#### Semantic Tokens

**Surfaces:**
- `color.surface.base` - Page background
- `color.surface.default` - Card/panel background
- `color.surface.variant` - Hover/alternate background
- `color.surface.inverted` - Inverted background
- `color.surface.inverted-variant` - Inverted alternate
- `color.surface.primary` - Primary color background
- `color.surface.primary-subtle` - Subtle primary background
- `color.surface.primary-intense` - Intense primary background

**Text:**
- `color.text.primary` - Primary body text
- `color.text.secondary` - Secondary/subdued text
- `color.text.tertiary` - Disabled/placeholder text
- `color.text.inverse` - Text on dark backgrounds
- `color.text.inverse-secondary` - Secondary inverse text
- `color.text.on-primary` - Text on primary backgrounds (auto-calculated for contrast)

**Outlines:**
- `color.outline.neutral-subtle` - Subtle border (1.1:1 minimum)
- `color.outline.neutral-default` - Default border (1.5:1 minimum)
- `color.outline.neutral-intense` - Prominent border (3:1 minimum)
- `color.outline.primary-subtle` - Subtle primary border (1.1:1)
- `color.outline.primary-default` - Default primary border (1.5:1)
- `color.outline.primary-intense` - Prominent primary border (3:1)
- `color.outline.inverse` - Border on dark backgrounds

All tokens include both `light` and `dark` theme variants.

### Configuration

Customize UI content via `web/config.json`:

```json
{
  "app": {
    "title": "Chroma",
    "subtitle": "Colour alchemy"
  },
  "welcome": {
    "heading": "Welcome to Chroma",
    "description": "Enter a primary colour to get started",
    "ctaButton": "Let's go"
  }
}
```

See `CONFIG_GUIDE.md` for complete documentation.

## Technical details

### Architecture

- **Pure Vanilla JavaScript** - No build step or dependencies required
- **Client-Side Processing** - All color calculations performed in browser
- **HSL-Based Color Manipulation** - Accurate tonal scales via HSL color space
- **W3C Design Tokens Format** - Industry-standard token structure
- **Recursive Token Resolution** - Handles nested token references

### Browser support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Feature Detection**: Graceful fallbacks for unsupported features
- **Vendor Prefixes**: Cross-browser CSS compatibility
- **Color Input Fallback**: Text input when color picker unsupported

### Performance optimizations

- **Debounced Inputs**: 300ms debounce on main inputs, 100ms on welcome page
- **LRU Cache**: Contrast calculations cached (max 1000 entries)
- **Efficient DOM Updates**: Minimal reflows and repaints
- **Lazy Validation**: Matrix calculations only when tab is active

### Accessibility features

- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Space)
- **Focus Indicators**: Clear focus states with `:focus-visible`
- **Screen Reader Support**: Semantic HTML with ARIA roles
- **Skip Links**: Quick navigation to main content
- **Color Contrast**: All UI elements meet WCAG AA standards

### Testing

Run the automated test suite at `http://localhost:8080/web/tests.html`:

- **16 Unit Tests** covering:
  - Hex validation (3 tests)
  - Color conversion (2 tests)  
  - Contrast calculation (3 tests)
  - Token structure (2 tests)
  - Scale generation (2 tests)
  - Performance utilities (2 tests)

## Key concepts

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

## Roadmap

**Completed:**
- [x] Error handling and validation (1/11)
- [x] Performance optimization (2/11)
- [x] Build system and deployment (3/11)
- [x] Browser compatibility (4/11)
- [x] Accessibility improvements (5/11)
- [x] Export and download features (6/11)
- [x] Automated testing suite (8/11)
- [x] Comprehensive documentation (9/11)
- [x] Color harmony modes (complementary, analogous, triadic)
- [x] WCAG outline contrast validation
- [x] JSON configuration system

**In Progress:**
- [ ] Security and privacy (10/11)
- [ ] Analytics and monitoring (11/11)

**Future:**
- [ ] Figma plugin for direct design tool integration
- [ ] Multi-format export (Style Dictionary, Tailwind, SCSS, etc.)
- [ ] Save/load palette presets with browser storage
- [ ] Token comparison and diff view
- [ ] Component preview library with real UI examples
- [ ] Gradient token generation
- [ ] Custom scale steps (beyond 50-950)
- [ ] Batch color generation from multiple inputs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [Ionicons](https://ionic.io/ionicons) for the icon system
- W3C Design Tokens Community Group for token format specification
- WCAG 2.1 guidelines for accessibility standards
