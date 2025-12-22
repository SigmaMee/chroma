// Taxonomy Loader
// Loads the token taxonomy from token-taxonomy.json and exposes it globally

(function() {
  'use strict';

  // Default taxonomy fallback in case the file fails to load
  const DEFAULT_TAXONOMY = {
    version: "1.0.0",
    themes: ["light", "dark"],
    tokenTypes: {
      surface: {
        label: "Surfaces",
        description: "Background and surface colors",
        semanticValues: {
          neutral: {
            label: "Neutral",
            paletteRef: "neutral",
            subtypes: [
              { id: "base", label: "Base", description: "Foundational surface color" },
              { id: "default", label: "Default", description: "Primary surface color" },
              { id: "variant", label: "Variant", description: "Alternative surface color" },
              { id: "inverted", label: "Inverted", description: "Inverted surface color for contrast" },
              { id: "invertedVariant", label: "Inverted Variant", description: "Inverted variant surface color" }
            ]
          },
          primary: {
            label: "Primary",
            paletteRef: "primary",
            subtypes: [
              { id: "primary", label: "Primary", description: "Primary brand surface" },
              { id: "primarySubtle", label: "Primary Subtle", description: "Subtle primary surface" },
              { id: "primaryIntense", label: "Primary Intense", description: "Intense primary surface" }
            ]
          }
        }
      },
      text: {
        label: "Text",
        description: "Text and typography colors",
        semanticValues: {
          neutral: {
            label: "Neutral",
            paletteRef: "neutral",
            subtypes: [
              { id: "primary", label: "Primary", description: "Primary text color" },
              { id: "secondary", label: "Secondary", description: "Secondary text color" },
              { id: "tertiary", label: "Tertiary", description: "Tertiary text color" },
              { id: "primaryInverse", label: "Primary Inverse", description: "Inverted primary text color" },
              { id: "secondaryInverse", label: "Secondary Inverse", description: "Inverted secondary text color" },
              { id: "tertiaryInverse", label: "Tertiary Inverse", description: "Inverted tertiary text color" }
            ]
          },
          primary: {
            label: "On Primary",
            paletteRef: "primary",
            subtypes: [
              { id: "default", label: "Default", description: "Text color on primary surfaces" }
            ]
          }
        }
      },
      outline: {
        label: "Outlines",
        description: "Border and outline colors",
        semanticValues: {
          neutral: {
            label: "Neutral",
            paletteRef: "neutral",
            subtypes: [
              { id: "subtle", label: "Subtle", description: "Subtle outline color" },
              { id: "default", label: "Default", description: "Default outline color" },
              { id: "intense", label: "Intense", description: "Intense outline color" },
              { id: "inverseSubtle", label: "Inverse Subtle", description: "Inverted subtle outline color" },
              { id: "inverse", label: "Inverse", description: "Inverted outline color" },
              { id: "inverseIntense", label: "Inverse Intense", description: "Inverted intense outline color" }
            ]
          },
          primary: {
            label: "Primary",
            paletteRef: "primary",
            subtypes: [
              { id: "primary", label: "Primary", description: "Primary brand outline" },
              { id: "primarySubtle", label: "Primary Subtle", description: "Subtle primary outline" },
              { id: "primaryIntense", label: "Primary Intense", description: "Intense primary outline" }
            ]
          }
        }
      }
    }
  };

  /**
   * Build token name from tokenType and subtype
   * Formula: tokenType + Capitalized(subtype)
   * Examples:
   * - surface + base -> surfaceBase
   * - text + primary -> textPrimary
   * - outline + inverseSubtle -> outlineInverseSubtle
   */
  function buildTokenName(tokenType, subtypeId) {
    if (!tokenType || !subtypeId) {
      console.error('buildTokenName: missing tokenType or subtypeId', { tokenType, subtypeId });
      return null;
    }
    
    // Capitalize first letter of subtypeId
    const capitalizedSubtype = subtypeId.charAt(0).toUpperCase() + subtypeId.slice(1);
    return tokenType + capitalizedSubtype;
  }

  /**
   * Build full token path for a semantic token
   * Formula: semantic.{theme}.{tokenType}.{semanticValue}.{tokenName}
   * Examples:
   * - semantic.light.surface.neutral.surfaceBase
   * - semantic.dark.text.primary.textDefault
   */
  function buildTokenPath(theme, tokenType, semanticValue, tokenName) {
    if (!theme || !tokenType || !semanticValue || !tokenName) {
      console.error('buildTokenPath: missing required parameters', { theme, tokenType, semanticValue, tokenName });
      return null;
    }
    return `semantic.${theme}.${tokenType}.${semanticValue}.${tokenName}`;
  }

  /**
   * Build legacy override key (for backwards compatibility during transition)
   * Formula: {tokenType}.{semanticValue}.{tokenName}
   * Examples:
   * - surface.neutral.surfaceBase
   * - text.primary.textDefault
   */
  function buildOverrideKey(tokenType, semanticValue, tokenName) {
    if (!tokenType || !semanticValue || !tokenName) {
      console.error('buildOverrideKey: missing required parameters', { tokenType, semanticValue, tokenName });
      return null;
    }
    return `${tokenType}.${semanticValue}.${tokenName}`;
  }

  // Load taxonomy from JSON file
  async function loadTaxonomy() {
    try {
      const response = await fetch('./token-taxonomy.json');
      if (!response.ok) {
        throw new Error(`Failed to load taxonomy: ${response.status} ${response.statusText}`);
      }
      const taxonomy = await response.json();
      console.log('Taxonomy loaded successfully:', taxonomy);
      return taxonomy;
    } catch (error) {
      console.warn('Failed to load taxonomy, using default:', error);
      return DEFAULT_TAXONOMY;
    }
  }

  // Initialize and expose taxonomy globally
  async function initializeTaxonomy() {
    const taxonomy = await loadTaxonomy();
    
    // Expose taxonomy and helper functions globally
    window.TAXONOMY = {
      ...taxonomy,
      // Helper functions
      buildTokenName,
      buildTokenPath,
      buildOverrideKey
    };

    console.log('Taxonomy initialized and available at window.TAXONOMY');
    
    // Dispatch event to signal taxonomy is ready
    window.dispatchEvent(new CustomEvent('taxonomy-loaded', { detail: taxonomy }));
  }

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTaxonomy);
  } else {
    initializeTaxonomy();
  }
})();
