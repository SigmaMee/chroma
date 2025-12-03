// Layout sizing script: keeps bottom-row height equal to viewport minus header, primary-menu, footer, padding and gaps
(function () {
  function setContentHeight() {
    const appEl = document.querySelector('.app');
    const headerEl = document.querySelector('header');
    const menuEl = document.querySelector('.primary-menu');
    const footerEl = document.querySelector('footer');
    const bottomRowEl = document.querySelector('.bottom-row');
    if (!appEl || !headerEl || !menuEl || !footerEl || !bottomRowEl) return;

    const appStyles = getComputedStyle(appEl);
    const padTop = parseFloat(appStyles.paddingTop) || 0;
    const padBottom = parseFloat(appStyles.paddingBottom) || 0;
    const gap = parseFloat(appStyles.gap) || 16; // grid/flex gap between rows
    const totalGaps = gap * 3; // header-menu, menu-bottom, bottom-footer

    const available = window.innerHeight
      - headerEl.offsetHeight
      - menuEl.offsetHeight
      - footerEl.offsetHeight
      - padTop - padBottom
      - totalGaps;

    bottomRowEl.style.height = `${Math.max(0, available)}px`;
  }

  window.addEventListener('resize', setContentHeight);
  window.addEventListener('load', setContentHeight);
  document.addEventListener('DOMContentLoaded', setContentHeight);
})();
