# Taxonomy-driven semantic tokens (breaking change)

## Summary
Adopt `web/token-taxonomy.json` to drive semantic token naming and UI. Exported token paths will follow the taxonomy instead of hardcoded structures.

## Path Formula
`semantic.{theme}.{tokenType}.{semanticValue}.{tokenType+CapitalizedSubtype}`

Examples:
- `semantic.light.surface.neutral.surfaceBase`
- `semantic.light.outline.neutral.outlineSubtle`
- `semantic.light.text.primary.textPrimary`

Themes, tokenTypes, semanticValues, and subtypes come from `web/token-taxonomy.json`.

## Scope
- Load taxonomy at startup (like `config.json`).
- Generate semantic tokens dynamically per taxonomy across both themes.
- Drive Semantic Mapping UI from taxonomy (groups: tokenType → semanticValue → subtype rows).
- Keep overrides, but keys change to new paths (breaking change).
- Document migration and provide optional legacy mode toggle if needed.

## Tasks
- [ ] Confirm taxonomy rules
  - Lock path formula and validate examples against current export
- [ ] Define name builder
  - Build leaf names: `tokenType + Capitalized(subtype)`; casing/sanitization rules
- [ ] Plan taxonomy loader
  - Load `web/token-taxonomy.json` and expose `window.TAXONOMY` with defaults
- [ ] Plan token generation
  - Iterate taxonomy (themes × tokenTypes × semanticValues × subtypes), create nodes and default palette refs
- [ ] Plan mapping UI
  - Render rows from taxonomy; grouped by tokenType and semanticValue; preserve overrides
- [ ] Back-compat + migration
  - Document breaking change; consider legacy output flag for transition
- [ ] QA scenarios
  - Verify both themes, 12 labels, neutral/primary refs, overrides persistence, invalid taxonomy handling

## Acceptance Criteria
- Exported tokens use taxonomy-driven paths exactly as defined.
- Semantic Mapping UI reflects taxonomy groups and labels.
- Overrides persist and affect export as before (with new keys).
- Default palette references applied sensibly (e.g., surface → neutral; text.onPrimary → primary).

## Migration Notes
- This is a breaking change: token consumers must update paths to include the `semanticValue` segment where applicable.
- Provide a brief migration guide in `README.md` once merged.

## Risks
- Downstream consumers relying on current paths will break.
- Incomplete taxonomy could hide or omit tokens; add safe defaults.
