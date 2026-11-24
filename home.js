'use strict';

const root = document.documentElement;
root.classList.add('home-js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const page = document.querySelector('.home-page');
const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.alt-menu-toggle');
const navigation = document.querySelector('.alt-navigation');
const hero = document.querySelector('.alt-hero');
const brandWord = document.querySelector('.alt-hero-word');
const brandLabel = document.querySelector('[data-brand-label]');

function closeMenu() {
  if (!header || !menuButton) return;
  header.dataset.open = 'false';
  menuButton.setAttribute('aria-expanded', 'false');
}

if (header && menuButton && navigation) {
  header.dataset.open = 'false';
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    header.dataset.open = String(open);
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

let brandTimers = [];
let projectionTimer = 0;
let logoBeatTimer = 0;
function clearBrandTimers() {
  brandTimers.forEach(window.clearTimeout);
  brandTimers = [];
}
function setBrandLabel(text) {
  if (brandLabel) brandLabel.textContent = text;
}
function playBrandIntro() {
  if (!brandWord) return;
  clearBrandTimers();
  brandWord.classList.remove('is-branding');
  root.classList.remove('is-branding');
  if (reducedMotion.matches) {
    setBrandLabel('ALT.WEB / ALTAI');
    return;
  }
  void brandWord.offsetWidth;
  setBrandLabel('DESIGN / CODE');
  brandWord.classList.add('is-branding');
  root.classList.add('is-branding');
  brandTimers.push(window.setTimeout(() => setBrandLabel('AI / VIBE CODING'), 2200));
  brandTimers.push(window.setTimeout(() => setBrandLabel('ALT.WEB / ALTAI'), 3700));
  brandTimers.push(window.setTimeout(() => {
    brandWord.classList.remove('is-branding');
    root.classList.remove('is-branding');
  }, 4800));
}

if (header && 'IntersectionObserver' in window) {
  const logoSections = ['services', 'offer', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const logoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || root.classList.contains('is-branding') || reducedMotion.matches) return;
      window.clearTimeout(logoBeatTimer);
      header.classList.remove('is-logo-beat');
      void header.offsetWidth;
      header.classList.add('is-logo-beat');
      logoBeatTimer = window.setTimeout(() => header.classList.remove('is-logo-beat'), 4800);
    });
  }, { threshold: 0.18 });
  logoSections.forEach((section) => logoObserver.observe(section));
}

function projectScene() {
  if (!hero) return;
  window.clearTimeout(projectionTimer);
  hero.classList.remove('is-projecting');
  if (reducedMotion.matches) return;
  void hero.offsetWidth;
  hero.classList.add('is-projecting');
  projectionTimer = window.setTimeout(() => hero.classList.remove('is-projecting'), 1750);
}

const sceneButtons = document.querySelectorAll('[data-scene-button]');
sceneButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!hero) return;
    const scene = button.dataset.sceneButton;
    hero.dataset.scene = scene;
    if (page) page.dataset.scene = scene;
    sceneButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    setBrandLabel(scene === 'nature' ? 'ALTAI / NATURE / CODE' : 'ALT.WEB / DESIGN + AI');
    projectScene();
  });
});
document.querySelectorAll('.alt-logo').forEach((logo) => {
  logo.addEventListener('click', playBrandIntro);
});

const serviceRows = document.querySelectorAll('[data-service]');
const serviceImages = document.querySelectorAll('[data-service-image]');
const previewLabel = document.querySelector('[data-preview-label]');
function showService(row) {
  const service = row.dataset.service;
  serviceImages.forEach((image) => image.classList.toggle('is-active', image.dataset.serviceImage === service));
  if (previewLabel) previewLabel.textContent = row.dataset.label;
}
serviceRows.forEach((row) => {
  row.addEventListener('pointerenter', () => showService(row));
  row.addEventListener('focus', () => showService(row));
});

const revealItems = document.querySelectorAll('.alt-reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  root.classList.add('home-motion');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

let frame = 0;
const parallaxMedia = document.querySelectorAll('[data-parallax-media]');
function render() {
  frame = 0;
  const scrollY = window.scrollY;
  if (header) header.dataset.scrolled = String(scrollY > 24);
  if (hero) {
    const progress = Math.min(1, Math.max(0, scrollY / Math.max(hero.offsetHeight, 1)));
    hero.style.setProperty('--home-scroll', progress.toFixed(3));
  }
  parallaxMedia.forEach((media) => {
    const rect = media.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    media.style.setProperty('--image-progress', progress.toFixed(3));
  });
}
function requestRender() {
  if (!frame) frame = requestAnimationFrame(render);
}
window.addEventListener('scroll', requestRender, { passive: true });
window.addEventListener('resize', requestRender);
render();

let pointerFrame = 0;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
function renderPointer() {
  pointerFrame = 0;
  if (!hero) return;
  currentX += (targetX - currentX) * .065;
  currentY += (targetY - currentY) * .065;
  hero.style.setProperty('--pointer-x', `${currentX.toFixed(2)}px`);
  hero.style.setProperty('--pointer-y', `${currentY.toFixed(2)}px`);
  if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > .02) {
    pointerFrame = requestAnimationFrame(renderPointer);
  }
}
function requestPointerRender() {
  if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
}
if (hero) {
  hero.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    const rect = hero.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * 12;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * 8;
    requestPointerRender();
  });
  hero.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    requestPointerRender();
  });
}

reducedMotion.addEventListener('change', () => {
  targetX = 0;
  targetY = 0;
  currentX = 0;
  currentY = 0;
  if (hero) {
    hero.style.setProperty('--pointer-x', '0px');
    hero.style.setProperty('--pointer-y', '0px');
    hero.classList.remove('is-projecting');
  }
  if (reducedMotion.matches) {
    clearBrandTimers();
    brandWord?.classList.remove('is-branding');
    root.classList.remove('is-branding');
    setBrandLabel('ALT.WEB / ALTAI');
  }
  requestRender();
});

playBrandIntro();
projectScene();
