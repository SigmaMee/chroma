// Content configuration loader
let appConfig = null;

async function loadConfig() {
  try {
    const response = await fetch('./config.json');
    if (!response.ok) {
      throw new Error('Failed to load config.json');
    }
    appConfig = await response.json();
    return appConfig;
  } catch (error) {
    console.error('Error loading configuration:', error);
    // Fallback to default content if config fails to load
    return null;
  }
}

function applyConfig(config) {
  if (!config) return;

  // Welcome page
  if (config.welcomePage) {
    const welcomeTitle = document.querySelector('.welcome-container h1');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const welcomeColorLabel = document.querySelector('.welcome-input-section label');
    const welcomeCTA = document.getElementById('welcomeGenerateBtn');
    const welcomePrimaryHex = document.getElementById('welcomePrimaryHex');
    const welcomePrimaryColor = document.getElementById('welcomePrimaryColor');

    if (welcomeTitle) welcomeTitle.textContent = config.welcomePage.title;
    if (welcomeSubtitle) welcomeSubtitle.textContent = config.welcomePage.subtitle;
    if (welcomeColorLabel) welcomeColorLabel.textContent = config.welcomePage.colorInputLabel;
    if (welcomeCTA) welcomeCTA.textContent = config.welcomePage.ctaButton;
    if (welcomePrimaryHex) {
      welcomePrimaryHex.value = config.welcomePage.defaultColor;
      welcomePrimaryHex.placeholder = config.welcomePage.defaultColor;
    }
    if (welcomePrimaryColor) {
      welcomePrimaryColor.value = config.welcomePage.defaultColor;
    }
  }

  // Main app header
  if (config.mainApp) {
    const appTitle = document.querySelector('header h1');
    const appSubtitle = document.querySelector('header .subtitle');
    const badge = document.querySelector('.badge');

    if (appTitle) appTitle.textContent = config.mainApp.title;
    if (appSubtitle) appSubtitle.textContent = config.mainApp.subtitle;
    if (badge) badge.textContent = config.mainApp.badge;
  }

  // Controls
  if (config.controls) {
    const primaryLabel = document.querySelector('.primary-color-input label');
    const optionsLabel = document.querySelector('.card label');
    const resetBtn = document.getElementById('reset');
    const generateBtn = document.getElementById('generate');

    if (primaryLabel) primaryLabel.textContent = config.controls.primaryColorLabel;
    if (optionsLabel && optionsLabel.textContent === 'Options') {
      optionsLabel.textContent = config.controls.optionsLabel;
    }
    if (resetBtn) resetBtn.textContent = config.controls.resetButton;
    if (generateBtn) generateBtn.textContent = config.controls.generateButton;

    // Update harmony mode label and helper
    const harmonyModeSection = document.querySelector('.option-label');
    if (harmonyModeSection) {
      const harmonyLabel = harmonyModeSection;
      const harmonyHelper = harmonyModeSection.querySelector('.helper');
      if (harmonyLabel) harmonyLabel.childNodes[0].textContent = config.controls.harmonyModeLabel + ' ';
      if (harmonyHelper) harmonyHelper.textContent = config.controls.harmonyModeHelper;
    }

    // Update tint amount label and helper
    const tintAmountSection = document.querySelector('.switch-row').parentElement;
    if (tintAmountSection) {
      const tintLabel = tintAmountSection.querySelector('label');
      const tintHelper = tintAmountSection.querySelector('.helper');
      if (tintLabel) tintLabel.childNodes[0].textContent = config.controls.tintAmountLabel + ' ';
      if (tintHelper) tintHelper.textContent = config.controls.tintAmountHelper;
    }
  }

  // Harmony mode cards
  if (config.harmonyModes) {
    const harmonyCards = document.querySelector('.harmony-cards');
    if (harmonyCards) {
      harmonyCards.innerHTML = '';
      
      // Group harmony modes by title (for modes with multiple variants)
      const groupedModes = {};
      config.harmonyModes.forEach(mode => {
        if (!groupedModes[mode.title]) {
          groupedModes[mode.title] = {
            title: mode.title,
            description: mode.description,
            icon: mode.icon || null,
            variants: []
          };
        }
        // Prefer the first provided icon if multiple variants share a title
        if (!groupedModes[mode.title].icon && mode.icon) {
          groupedModes[mode.title].icon = mode.icon;
        }
        groupedModes[mode.title].variants.push(mode);
      });

      // Render harmony cards
      Object.values(groupedModes).forEach(group => {
        const card = document.createElement('div');
        card.className = 'harmony-card';
        
        const header = document.createElement('div');
        header.className = 'harmony-header';
        header.innerHTML = `
          ${group.icon ? `<img src="${group.icon}" alt="${group.title} icon" class="harmony-icon" />` : ''}
          <h3>${group.title}</h3>
          <p class="harmony-description">${group.description}</p>
        `;
        
        const swatches = document.createElement('div');
        swatches.className = 'harmony-swatches';
        
        group.variants.forEach((variant, index) => {
          const isActive = variant.mode === 'primary' && variant.variant === '';
          const button = document.createElement('button');
          button.className = `harmony-swatch${isActive ? ' active' : ''}`;
          button.dataset.mode = variant.mode;
          button.dataset.variant = variant.variant;
          button.title = variant.tooltip;
          button.innerHTML = '<span class="swatch-color" style="background: #8B95A7;"></span>';
          swatches.appendChild(button);
        });
        
        card.appendChild(header);
        card.appendChild(swatches);
        harmonyCards.appendChild(card);
      });
    }
  }

  // Tint amount buttons
  if (config.tintAmounts) {
    const tintSwitchContainer = document.querySelector('.switch-row');
    if (tintSwitchContainer && tintSwitchContainer.querySelector('#tintAmountSwitch-low')) {
      tintSwitchContainer.innerHTML = '';
      config.tintAmounts.forEach((amount, index) => {
        const button = document.createElement('button');
        button.id = `tintAmountSwitch-${amount.id}`;
        button.className = `tint-switch${index === 0 ? ' active' : ''}`;
        button.dataset.value = amount.id;
        button.textContent = amount.label;
        tintSwitchContainer.appendChild(button);
      });
    }
  }

  // Palettes labels
  if (config.palettes) {
    const paletteSpans = document.querySelectorAll('.scale-card span');
    if (paletteSpans.length >= 2) {
      paletteSpans[0].textContent = config.palettes.neutralLabel;
      paletteSpans[1].textContent = config.palettes.primaryLabel;
    }
  }

  // Palette settings modal labels
  if (config.paletteSettingsModal) {
    const modalTitle = document.querySelector('#palette-settings-modal .modal-header h2');
    if (modalTitle) modalTitle.textContent = config.paletteSettingsModal.title;

    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn && config.paletteSettingsModal.closeAriaLabel) {
      closeBtn.setAttribute('aria-label', config.paletteSettingsModal.closeAriaLabel);
    }

    const neutralTabBtn = document.querySelector('.modal-tab-btn[data-tab="neutral-settings"]');
    const primaryTabBtn = document.querySelector('.modal-tab-btn[data-tab="primary-settings"]');
    if (neutralTabBtn && config.paletteSettingsModal.tabs) {
      neutralTabBtn.textContent = config.paletteSettingsModal.tabs.neutral;
      if (config.paletteSettingsModal.tabs.neutralAria) {
        neutralTabBtn.setAttribute('aria-label', config.paletteSettingsModal.tabs.neutralAria);
      }
    }
    if (primaryTabBtn && config.paletteSettingsModal.tabs) {
      primaryTabBtn.textContent = config.paletteSettingsModal.tabs.primary;
      if (config.paletteSettingsModal.tabs.primaryAria) {
        primaryTabBtn.setAttribute('aria-label', config.paletteSettingsModal.tabs.primaryAria);
      }
    }

    const neutralLabels = document.querySelectorAll('#neutral-settings .modal-control-label');
    if (neutralLabels.length >= 5 && config.paletteSettingsModal.labels) {
      neutralLabels[0].textContent = config.paletteSettingsModal.labels.stepsBefore;
      neutralLabels[1].textContent = config.paletteSettingsModal.labels.stepsAfter;
      neutralLabels[2].textContent = config.paletteSettingsModal.labels.curveType;
      neutralLabels[3].textContent = config.paletteSettingsModal.labels.easingType;
      neutralLabels[4].textContent = config.paletteSettingsModal.labels.preview;
    }

    const primaryLabels = document.querySelectorAll('#primary-settings .modal-control-label');
    if (primaryLabels.length >= 5 && config.paletteSettingsModal.labels) {
      primaryLabels[0].textContent = config.paletteSettingsModal.labels.stepsBefore;
      primaryLabels[1].textContent = config.paletteSettingsModal.labels.stepsAfter;
      primaryLabels[2].textContent = config.paletteSettingsModal.labels.curveType;
      primaryLabels[3].textContent = config.paletteSettingsModal.labels.easingType;
      primaryLabels[4].textContent = config.paletteSettingsModal.labels.preview;
    }

    const neutralUnits = document.querySelectorAll('#neutral-settings .input-unit');
    const primaryUnits = document.querySelectorAll('#primary-settings .input-unit');
    if (config.paletteSettingsModal.labels?.stepsUnit) {
      neutralUnits.forEach((unit) => unit.textContent = config.paletteSettingsModal.labels.stepsUnit);
      primaryUnits.forEach((unit) => unit.textContent = config.paletteSettingsModal.labels.stepsUnit);
    }

    if (config.paletteSettingsModal.buttons) {
      const applyBtn = document.getElementById('modal-apply-btn');
      const cancelBtn = document.getElementById('modal-cancel-btn');
      if (applyBtn) applyBtn.textContent = config.paletteSettingsModal.buttons.apply;
      if (cancelBtn) cancelBtn.textContent = config.paletteSettingsModal.buttons.cancel;
    }
  }

  // Semantic Mapping
  if (config.semanticMapping) {
    const semanticSection = document.querySelector('#semantic-mapping-container').parentElement;
    if (semanticSection) {
      const label = semanticSection.querySelector('label');
      const helperText = semanticSection.querySelector('.helper');
      if (label) label.textContent = config.semanticMapping.label;
      if (helperText) helperText.textContent = config.semanticMapping.helperText;
    }
  }

  // Tab buttons (aria-labels)
  if (config.tabs) {
    const previewTab = document.querySelector('[data-tab="preview"]');
    const wcagTab = document.querySelector('[data-tab="wcag"]');
    const outputTab = document.querySelector('[data-tab="output"]');
    if (previewTab) previewTab.setAttribute('aria-label', config.tabs.preview);
    if (wcagTab) wcagTab.setAttribute('aria-label', config.tabs.wcag);
    if (outputTab) outputTab.setAttribute('aria-label', config.tabs.output);
  }

  // Preview tab
  if (config.preview) {
    const previewLabel = document.querySelector('#preview-tab .status span');
    const themeBtns = document.querySelectorAll('.theme-btn');
    if (previewLabel) previewLabel.textContent = config.preview.label;
    if (themeBtns.length >= 2) {
      themeBtns[0].textContent = config.preview.themeLight;
      themeBtns[1].textContent = config.preview.themeDark;
    }
  }

  // WCAG tab
  if (config.wcag) {
    const wcagLabel = document.querySelector('#wcag-tab .status span');
    const complianceLabel = document.querySelector('[for="complianceLevel"]');
    if (wcagLabel) wcagLabel.textContent = config.wcag.label;
    if (complianceLabel) complianceLabel.textContent = config.wcag.complianceLabel;
  }

  // Output tab
  if (config.output) {
    const outputLabel = document.querySelector('#output-tab .status span');
    const copyBtn = document.getElementById('copy');
    if (outputLabel) outputLabel.textContent = config.output.label;
    if (copyBtn) copyBtn.textContent = config.output.copyButton;
  }

  // Footer
  if (config.footer) {
    const footerP = document.querySelector('footer p');
    if (footerP) {
      const link = footerP.querySelector('a');
      if (link) {
        footerP.childNodes[0].textContent = config.footer.text + ' ';
        link.textContent = config.footer.linkText;
        link.href = config.footer.linkUrl;
        if (footerP.childNodes[2]) {
          footerP.childNodes[2].textContent = '. ' + config.footer.copyright;
        }
      }
    }
  }
}

// Initialize configuration on page load
async function initConfig() {
  const config = await loadConfig();
  if (config) {
    applyConfig(config);
  }
  return config;
}

// Expose initConfig globally
window.initConfig = initConfig;
