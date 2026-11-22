const boundary = document.querySelector('#paint-boundary');
boundary.addEventListener('input', () => {
  boundary.parentElement.style.setProperty('--boundary', boundary.value + '%');
});
