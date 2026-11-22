'use strict';

const themes = { night: '#111613', studio: '#f5f4ef' };
const themeKey = 'alt-web-theme';

function preferredTheme() {
  const requested = new URLSearchParams(location.search).get('design');
  if (requested !== null) return Object.hasOwn(themes, requested) ? requested : 'night';
  try {
    const saved = localStorage.getItem(themeKey);
    if (Object.hasOwn(themes, saved)) return saved;
  } catch {
    // File previews and private browsing can disable storage.
  }
  return 'night';
}

function showTheme(theme) {
  document.documentElement.dataset.design = theme;
  document.querySelector('meta[name="theme-color"]').content = themes[theme];
  document.querySelectorAll('[data-preview]').forEach(link => {
    if (link.dataset.preview === theme) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
    const url = new URL(location.href);
    url.searchParams.set('design', link.dataset.preview);
    link.href = url.href;
  });
}

function syncTheme() {
  const theme = preferredTheme();
  showTheme(theme);
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    // The theme still works for the current page.
  }
}

syncTheme();
window.addEventListener('pageshow', syncTheme);
window.addEventListener('popstate', syncTheme);

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('article.feature#portfolio')) {
    document.querySelectorAll('.site-header nav a[href="#portfolio"], .hero .text-action[href="#portfolio"]')
      .forEach(link => { link.href = 'work.html'; });
  }

  const picker = document.querySelector('.design-picker');
  if (!picker) return;
  const trigger = picker.querySelector('summary');
  showTheme(preferredTheme());

  picker.addEventListener('click', event => {
    const link = event.target.closest('[data-preview]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      history.replaceState(history.state, '', link.href);
      syncTheme();
    } catch {
      // Some browsers restrict history changes on file URLs.
      location.assign(link.href);
    }
    picker.open = false;
    trigger.focus();
  });
  document.addEventListener('click', event => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });
  picker.addEventListener('focusout', event => {
    if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
  });
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && picker.open) {
      picker.open = false;
      trigger.focus();
    }
  });
});
