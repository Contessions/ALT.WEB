'use strict';

// The URL keeps each preview shareable and lets browser history switch designs.
const designs = new Map([
  ['studio', '#f5f4ef'],
  ['night', '#141819'],
  ['gallery', '#eedfca'],
]);
const requestedDesign = new URLSearchParams(window.location.search).get('design');
const activeDesign = designs.has(requestedDesign) ? requestedDesign : 'studio';

document.documentElement.dataset.design = activeDesign;
document.querySelector('meta[name="theme-color"]').content = designs.get(activeDesign);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-preview]').forEach((link) => {
    if (link.dataset.preview === activeDesign) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  });
});
