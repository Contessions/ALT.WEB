'use strict';

const themeKey = 'alt-web-theme';
function readTheme() {
  const requested = new URLSearchParams(location.search).get('design');
  if (requested) return requested === 'studio' ? 'studio' : 'night';
  try { return localStorage.getItem(themeKey) === 'studio' ? 'studio' : 'night'; }
  catch { return 'night'; }
}
function applyTheme(theme) {
  const light = theme === 'studio';
  document.documentElement.dataset.design = theme;
  document.querySelector('meta[name="theme-color"]').content = light ? '#f3f5fa' : '#0a0c10';
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.hidden = false;
    toggle.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
  }
  try { localStorage.setItem(themeKey, theme); } catch { /* Storage is optional. */ }
}
applyTheme(readTheme());
window.addEventListener('pageshow', () => applyTheme(readTheme()));
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(readTheme());
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.design === 'night' ? 'studio' : 'night';
    const url = new URL(location.href);
    url.searchParams.set('design', theme);
    try { history.replaceState(history.state, '', url); } catch { /* Local previews may restrict history. */ }
    applyTheme(theme);
  });
});
