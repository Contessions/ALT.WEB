'use strict';

const finder = document.querySelector('.task-finder');
const choices = finder.querySelector('.task-switch');
const panels = Array.from(finder.querySelectorAll('[data-format]'));

function showFormat(value) {
  const selected = panels.find(panel => panel.dataset.format === value);
  if (!selected) return;
  for (const panel of panels) panel.hidden = panel !== selected;
  for (const choice of choices.elements) choice.checked = choice.value === value;
}

function restoreFormat() {
  const anchor = location.hash.slice(1);
  const matchingPanel = panels.find(panel => panel.id && panel.id === anchor);
  showFormat(matchingPanel?.dataset.format || choices.querySelector(':checked')?.value || 'landing');
}

choices.addEventListener('change', event => {
  const value = event.target.value;
  showFormat(value);
  // Keep links to a particular service shareable without moving the viewport.
  if (finder.classList.contains('service-directory')) history.replaceState(null, '', '#' + value);
});
restoreFormat();
choices.hidden = false;
window.addEventListener('hashchange', restoreFormat);
window.addEventListener('pageshow', restoreFormat);

const sample = finder.querySelector('.sample-price');
const polish = typeof catalog === 'undefined' ? null : catalog.services.find(service => service.id === 'polish');
if (sample && polish) {
  const vehicle = sample.querySelector('select');
  const amount = sample.querySelector('output');
  const rubles = new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0
  });
  for (const [index, name] of catalog.vehicles.entries()) vehicle.add(new Option(name, index));
  function updatePrice() {
    amount.textContent = rubles.format(polish.prices[vehicle.selectedIndex]);
  }
  vehicle.addEventListener('change', updatePrice);
  updatePrice();
  sample.hidden = false;
}
