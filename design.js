'use strict';

// The URL keeps each preview shareable and lets browser history switch designs.
const designs = new Map([
  ['studio', '#f5f4ef'],
  ['night', '#111613'],
  ['gallery', '#eedfca'],
]);
const requestedDesign = new URLSearchParams(window.location.search).get('design');
const activeDesign = designs.has(requestedDesign) ? requestedDesign : 'night';

document.documentElement.dataset.design = activeDesign;
document.querySelector('meta[name="theme-color"]').content = designs.get(activeDesign);

document.addEventListener('DOMContentLoaded', () => {
  // Older copies of the home page still link to its embedded portfolio card.
  if (document.querySelector('article.feature#portfolio')) {
    document.querySelectorAll('.site-header nav a[href="#portfolio"], .hero .text-action[href="#portfolio"]')
      .forEach((link) => { link.href = 'work.html'; });
  }

  const picker = document.querySelector('.design-picker');
  const trigger = picker?.querySelector('summary');
  const links = document.querySelectorAll('[data-preview]');

  links.forEach((link) => {
    if (link.dataset.preview === activeDesign) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  if (!trigger) return;

  // Keep the native disclosure and close it when the user moves on.
  document.addEventListener('click', (event) => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });

  picker.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
  });

  picker.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picker.open) {
      event.preventDefault();
      picker.open = false;
      trigger.focus();
    }
  });
});
