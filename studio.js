'use strict';

const studioRoot = document.documentElement;
studioRoot.classList.add('studio-js');

const studioHeader = document.querySelector('[data-header]');
const studioMenuButton = document.querySelector('.alt-menu-toggle');
const studioNavigation = document.querySelector('.alt-navigation');
const studioReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function closeStudioMenu() {
  if (!studioHeader || !studioMenuButton) return;
  studioHeader.dataset.open = 'false';
  studioMenuButton.setAttribute('aria-expanded', 'false');
}

if (studioHeader && studioMenuButton && studioNavigation) {
  closeStudioMenu();
  studioMenuButton.addEventListener('click', () => {
    const open = studioMenuButton.getAttribute('aria-expanded') !== 'true';
    studioMenuButton.setAttribute('aria-expanded', String(open));
    studioHeader.dataset.open = String(open);
  });
  studioNavigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeStudioMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && studioMenuButton.getAttribute('aria-expanded') === 'true') {
      closeStudioMenu();
      studioMenuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!studioHeader.contains(event.target)) closeStudioMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeStudioMenu();
  });
}

let studioFrame = 0;
function renderStudioScroll() {
  studioFrame = 0;
  if (studioHeader) studioHeader.dataset.scrolled = String(window.scrollY > 24);
}
window.addEventListener('scroll', () => {
  if (!studioFrame) studioFrame = requestAnimationFrame(renderStudioScroll);
}, { passive: true });
renderStudioScroll();

const studioRevealItems = document.querySelectorAll('.studio-reveal');
if ('IntersectionObserver' in window && !studioReducedMotion.matches) {
  studioRoot.classList.add('studio-motion');
  const studioRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
  studioRevealItems.forEach(item => studioRevealObserver.observe(item));
} else {
  studioRevealItems.forEach(item => item.classList.add('is-visible'));
}

studioReducedMotion.addEventListener('change', () => {
  if (!studioReducedMotion.matches) return;
  studioRoot.classList.remove('studio-motion');
  studioRevealItems.forEach(item => item.classList.add('is-visible'));
});
