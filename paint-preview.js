const boundary = document.querySelector('#paint-boundary');
const presets = document.querySelectorAll('.sample-labels button');
function updateSample() {
  boundary.parentElement.style.setProperty('--boundary', boundary.value + '%');
  presets.forEach(button => {
    const selected = button.dataset.boundary === '50'
      ? boundary.valueAsNumber > 0 && boundary.valueAsNumber < 100
      : button.dataset.boundary === boundary.value;
    button.setAttribute('aria-pressed', String(selected));
  });
}
presets.forEach(button => button.addEventListener('click', () => {
  boundary.value = button.dataset.boundary;
  updateSample();
}));
boundary.addEventListener('input', updateSample);
updateSample();
