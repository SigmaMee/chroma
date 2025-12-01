# Colour Token Generator (Figma plugin)

Generate shareable colour design tokens from either local paint styles or the current selection. The plugin has no build step and can run directly inside the Figma desktop app.

## Features

- Scan all local paint styles and convert them into JSON or CSS custom properties.
- Derive tokens from the current selection (deduplicated by colour). Optionally include unnamed layers with auto-generated identifiers.
- Automatic token name normalisation with optional prefixing (`color.brand.primary` → `--color.brand.primary`).
- Copy-to-clipboard output and quick status feedback inside the plugin UI.
- Greyscale helper: enter a primary hex colour, cap the saturation at 30%, and instantly derive the neutral base token plus a 9-step scale of lighter/darker variants that respect the seed hue & lightness.
- WCAG AA checker: the UI renders a background × foreground matrix of every grey combination, highlighting the pairs that meet the 4.5:1 contrast requirement.
- Responsive canvas: the plugin automatically opens at ~80% of the viewport width and 70% of its height (within Figma’s limits) so the scale and matrix stay visible.

## Project structure

```
token-generator/
├── code.js        # Main plugin controller (Figma scene access)
├── manifest.json  # Figma plugin manifest (API v1)
├── ui.html        # Plugin UI (vanilla HTML/CSS/JS)
├── web/           # Standalone browser version (HTML/CSS/JS)
└── README.md
```

## Getting started

1. Open **Figma Desktop** → **Plugins** → **Development** → **Import plugin from manifest…**.
2. Select the `manifest.json` file in this folder.
3. Run the plugin via **Plugins → Development → Colour Token Generator**.

## Usage

1. Choose a source:
   - **Local paint styles** scans all solid paint styles in the file.
   - **Current selection** walks each selected node (and its descendants) looking for visible solid fills.
2. Adjust the **Primary colour** and **Greyscale saturation** inputs (0 = neutral grey, max 30%). The live preview shows the derived base grey plus a 9-step scale.
3. Pick an output format (`JSON tokens` or `CSS custom properties`).
4. (Optional) Provide a token prefix (e.g. `color.light`).
5. Hit **Generate tokens**. Copy the generated output and drop it into your design system repository. The derived base grey token plus the 9-step scale is appended to the collected paint styles/nodes, and the WCAG matrix updates to show all compliant pairings.

## Web app version

The `web/` folder contains a dependency-free version of the tool that runs in any modern browser.

### Run it locally

```sh
# From the repo root
cd web
# start a quick static server (choose one you already have installed)
npx serve .
# ...or simply open index.html directly in your browser
```

### Feature parity

- Primary colour input, saturation slider (0–30 %), optional token prefix, JSON/CSS export, copy-to-clipboard
- Derived greyscale preview + 9-step scale identical to the plugin logic
- WCAG AA contrast matrix showing every background × foreground combination that meets the 4.5:1 threshold
- All calculations run locally; no data leaves the browser

## Implementation notes

- Only solid paints are supported. Colors with opacity include the alpha channel (e.g. `#FFAA0080`).
- When scanning selections, the plugin deduplicates by hex value to avoid repeated entries.
- Node names are used for token names. Enable *“Include unnamed layers”* if you want auto-numbered tokens for anonymous layers (e.g. `layer-1`).
- The UI is intentionally lightweight; no bundler or dependencies are required. You can extend it with any framework by adding a build step if needed.
- The greyscale generator reuses the seed hue/lightness, caps saturation to 30%, and outputs up to 4 lighter / 5 darker variants (or all dark/light variants when the base sits near the extremes) to always produce a 9-token scale.

## Next ideas

- Support gradients & effects by translating them into multi-stop tokens.
- Export directly to Style Dictionary, Tokens Studio JSON, or Tailwind config.
- Allow syncing tokens back into paint styles from imported JSON.

