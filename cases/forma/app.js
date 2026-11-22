'use strict';

const byId = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
});
const selectedServices = new Set();
let vehicleIndex = 0;

// Каталог, переключатели и итог используют один учебный прайс.
function renderCatalog() {
  vehicles.forEach((name, index) => {
    const label = document.createElement('label');
    label.className = 'choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'vehicle';
    input.value = String(index);
    input.checked = index === vehicleIndex;
    label.append(input, name);
    byId('vehicles').append(label);
  });

  services.forEach((service) => {
    const row = document.createElement('article');
    row.className = 'program';
    const title = document.createElement('h3');
    title.textContent = service.name;
    const description = document.createElement('p');
    description.textContent = service.description;
    const link = document.createElement('a');
    link.href = '#estimate';
    link.dataset.service = service.id;
    link.textContent = 'От ' + currency.format(Math.min(...service.prices));
    link.setAttribute('aria-label', 'Рассчитать: ' + service.name + ', ' + link.textContent);
    row.append(title, description, link);
    byId('programs').append(row);

    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'service';
    input.value = service.id;
    const price = document.createElement('strong');
    price.id = 'price-' + service.id;
    label.append(input, service.name, price);
    byId('options').append(label);
  });
}

function calculateQuote() {
  const items = services.filter((service) => selectedServices.has(service.id));
  const total = items.reduce((sum, service) => sum + service.prices[vehicleIndex], 0);
  return { items, total };
}

function describeQuote() {
  const { items, total } = calculateQuote();
  return [vehicles[vehicleIndex], items.map((item) => item.name).join(', '), currency.format(total)].join(' · ');
}

function updateQuote() {
  const { items, total } = calculateQuote();
  byId('vehicle-label').textContent = vehicles[vehicleIndex];
  byId('total').textContent = currency.format(total);
  byId('mobile-price').textContent = currency.format(total);
  byId('lines').replaceChildren();
  items.forEach((item) => {
    const line = document.createElement('li');
    const price = document.createElement('span');
    price.textContent = currency.format(item.prices[vehicleIndex]);
    line.append(item.name, price);
    byId('lines').append(line);
  });
  services.forEach((service) => {
    byId('price-' + service.id).textContent = currency.format(service.prices[vehicleIndex]);
  });
  const empty = items.length === 0;
  byId('continue').disabled = empty;
  byId('hint').hidden = !empty;
  byId('review').textContent = describeQuote();
  if (empty) byId('booking-section').hidden = true;
  byId('receipt').hidden = true;
  byId('booking').hidden = false;
}

renderCatalog();
updateQuote();

byId('vehicles').addEventListener('change', (event) => {
  vehicleIndex = Number(event.target.value);
  updateQuote();
});

byId('options').addEventListener('change', (event) => {
  const input = event.target;
  if (input.checked) selectedServices.add(input.value);
  else selectedServices.delete(input.value);
  updateQuote();
});

function addService(id) {
  selectedServices.add(id);
  document.querySelectorAll('input[name="service"]').forEach((input) => {
    input.checked = selectedServices.has(input.value);
  });
  updateQuote();
}

byId('programs').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-service]');
  if (link) addService(link.dataset.service);
});

byId('pick-polish').addEventListener('click', () => addService('polish'));

// Нижняя строка видна только в области выбора до появления основной сводки.
const mobileTotal = document.querySelector('.mobile-total');
function updateMobileTotal() {
  const controls = byId('vehicles').getBoundingClientRect();
  const summary = byId('estimate-summary').getBoundingClientRect();
  mobileTotal.hidden = !selectedServices.size || controls.top > innerHeight * 0.8 || summary.top < innerHeight;
}
window.addEventListener('scroll', updateMobileTotal, { passive: true });
window.addEventListener('resize', updateMobileTotal);
document.addEventListener('change', updateMobileTotal);

byId('continue').addEventListener('click', () => {
  byId('booking-section').hidden = false;
  byId('booking').hidden = false;
  byId('receipt').hidden = true;
  byId('booking-title').focus();
  byId('booking-section').scrollIntoView({block: 'start'});
});

byId('guest').addEventListener('input', () => byId('guest').setCustomValidity(''));

byId('booking').addEventListener('submit', (event) => {
  event.preventDefault();
  const guest = byId('guest');
  const name = guest.value.trim();
  if (!name) {
    guest.setCustomValidity('Введите тестовое имя.');
    guest.reportValidity();
    return;
  }
  if (!selectedServices.size) return;
  byId('receipt-text').textContent = [name, byId('period').value, describeQuote()].join(' · ');
  byId('booking').hidden = true;
  byId('receipt').hidden = false;
  byId('receipt').focus();
});

byId('edit').addEventListener('click', () => {
  byId('receipt').hidden = true;
  byId('booking').hidden = false;
  byId('guest').focus();
});
