'use strict';

// Leave the static case available if the calculator resources fail to load.
if (typeof catalog !== 'undefined' && typeof siteModule !== 'undefined' && siteModule) {
  const byId = (id) => document.getElementById(id);
  const currency = new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0
  });
  const { vehicles, services, totals } = catalog;
  const serviceIndex = new Map(services.map((service, index) => [service.id, index]));
  const mobileTotal = document.querySelector('.mobile-total');
  let selection = 0;
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
    const items = services.filter((_, index) => siteModule.selected(selection, index));
    const total = totals[vehicleIndex][selection];
    return { items, total };
  }

  function describeQuote({ items, total } = calculateQuote()) {
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
    // Reveal the workshop note for a full selection without changing the quote.
    const fullProgramNote = byId('full-program-note');
    if (fullProgramNote) fullProgramNote.hidden = empty || items.length !== services.length;
    byId('review').textContent = describeQuote({ items, total });
    if (empty) byId('booking-section').hidden = true;
    byId('receipt').hidden = true;
    byId('booking').hidden = false;
    updateMobileTotal();
  }

  renderCatalog();
  updateQuote();

  byId('vehicles').addEventListener('change', (event) => {
    const index = Number(event.target.value);
    if (!Number.isInteger(index) || !vehicles[index]) return;
    vehicleIndex = index;
    updateQuote();
  });

  byId('options').addEventListener('change', (event) => {
    const input = event.target;
    const index = serviceIndex.get(input.value);
    if (index === undefined) return;
    selection = siteModule.select(selection, index, Number(input.checked));
    updateQuote();
  });

  function addService(id) {
    const index = serviceIndex.get(id);
    if (index === undefined) return;
    selection = siteModule.select(selection, index, 1);
    document.querySelectorAll('input[name="service"]').forEach((input) => {
      input.checked = Boolean(siteModule.selected(selection, serviceIndex.get(input.value)));
    });
    updateQuote();
  }

  byId('programs').addEventListener('click', (event) => {
    const link = event.target.closest('a[data-service]');
    if (link) addService(link.dataset.service);
  });

  byId('pick-polish').addEventListener('click', () => addService('polish'));

  // Нижняя строка видна только в области выбора до появления основной сводки.
  function updateMobileTotal() {
    const controls = byId('vehicles').getBoundingClientRect();
    const total = byId('total').getBoundingClientRect();
    mobileTotal.hidden = !selection || controls.top > innerHeight * 0.8 || total.bottom < innerHeight - 64;
  }
  window.addEventListener('scroll', updateMobileTotal, { passive: true });
  window.addEventListener('resize', updateMobileTotal);

  byId('continue').addEventListener('click', () => {
    byId('booking-section').hidden = false;
    byId('booking').hidden = false;
    byId('receipt').hidden = true;
    byId('booking-title').focus();
    byId('booking-section').scrollIntoView({block: 'start'});
  });

  const guest = byId('guest');
  const period = byId('period');
  guest.addEventListener('input', () => guest.setCustomValidity(''));

  byId('booking').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = guest.value.trim();
    if (!name) {
      guest.setCustomValidity('Введите тестовое имя.');
      guest.reportValidity();
      return;
    }
    if (!selection || !period.value) return;
    byId('receipt-text').textContent = [name, period.value, describeQuote()].join(' · ');
    byId('booking').hidden = true;
    byId('receipt').hidden = false;
    byId('receipt').focus();
  });

  byId('edit').addEventListener('click', () => {
    byId('receipt').hidden = true;
    byId('booking').hidden = false;
    byId('guest').focus();
  });
} else {
  document.getElementById('catalog-unavailable').hidden = false;
}
