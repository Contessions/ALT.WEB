'use strict';

if (typeof furnitureEngine !== 'undefined') {
  const { filter, getVariant, key, quote, fit, money, maxQuantity } = furnitureEngine;
  const byId = (id) => document.getElementById(id);
  const filters = byId('filters');
  const fitForm = byId('fit-form');
  const downloadButton = byId('download');
  const roomButtons = [...document.querySelectorAll('[data-room]')];
  const motionAllowed = matchMedia('(prefers-reduced-motion: no-preference)');
  const catalogGrid = byId('products');
  const storageKey = 'alt-web:furniture:estimate:v1';
  const isServer = document.documentElement.hasAttribute('data-furniture-api');
  let cart = restoreCart();
  let fitRevision = 0;
  let catalogRevision = 0;
  let totalMotion;

  function updateRoomButtons(room) {
    roomButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.room === room));
    });
  }

  function element(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }

  function addOptions(select, entries) {
    select.append(...entries.map(([value, label]) => new Option(label, value)));
  }

  function restoreCart() {
    const restored = new Map();
    try {
      const items = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      if (!Array.isArray(items)) return restored;
      for (const item of items.slice(0, 100)) {
        try {
          const [line] = quote([item]).lines;
          restored.set(key(line), { productId: line.productId, variantId: line.variantId, quantity: line.quantity });
        } catch {
          // A removed catalog variant must not discard the other saved items.
        }
      }
    } catch {
      // Storage can be unavailable in private browsing or on local files.
    }
    return restored;
  }

  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...cart.values()]));
    } catch {
      // The current session still works when storage is blocked.
    }
  }

  async function callApi(endpoint, body) {
    const options = body === undefined ? undefined : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
    const response = await fetch('api/' + endpoint, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Не удалось выполнить расчёт.');
    return data;
  }

  async function renderCatalog() {
    const fields = filters.elements;
    const criteria = {
      query: fields.query.value,
      room: fields.room.value,
      category: fields.category.value,
      width: fields.width.value ? fields.width.valueAsNumber : undefined,
      depth: fields.depth.value ? fields.depth.valueAsNumber : undefined,
      price: fields.price.value ? fields.price.valueAsNumber : undefined,
      sort: fields.sort.value
    };
    updateRoomButtons(criteria.room);
    const revision = ++catalogRevision;
    catalogGrid.setAttribute('aria-busy', 'true');
    let matches;
    try {
      if (isServer) {
        const params = new URLSearchParams();
        Object.entries(criteria).forEach(([name, value]) => {
          if (value !== undefined) params.set(name, value);
        });
        matches = (await callApi('catalog?' + params)).products;
      } else {
        matches = filter(criteria);
      }
    } catch (error) {
      if (revision === catalogRevision) {
        byId('results-status').textContent = 'Не удалось обновить каталог. ' + error.message;
      }
      return;
    } finally {
      if (revision === catalogRevision) catalogGrid.removeAttribute('aria-busy');
    }
    if (revision !== catalogRevision) return;

    byId('results-status').textContent = matches.length
      ? 'Моделей в подборке: ' + matches.length
      : 'Подходящих моделей нет. Увеличьте пределы или сбросьте фильтры.';
    catalogGrid.replaceChildren(...matches.map(renderProduct));
  }

  function renderProduct(product, index) {
    const card = byId('product-card').content.firstElementChild.cloneNode(true);
    const image = card.querySelector('img');
    card.style.setProperty('--enter-delay', Math.min(index, 5) * 38 + 'ms');
    card.querySelector('[data-category]').textContent = furnitureCatalog.categories[product.category];
    const select = card.querySelector('[data-variant]');
    select.setAttribute('aria-label', 'Исполнение: ' + product.name);
    const size = card.querySelector('[data-size]');
    const price = card.querySelector('[data-price]');
    const feedback = card.querySelector('[data-feedback]');
    card.querySelector('h3').textContent = product.name;
    card.querySelector('[data-description]').textContent = product.description;
    addOptions(select, product.variants.map((variant) => [variant.id, variant.name + ' · ' + variant.width + ' см']));

    function updateVariant() {
      const { variant } = getVariant(product.id, select.value);
      image.src = 'assets/' + product.id + '-' + variant.id + '.webp';
      image.alt = product.name + ', ' + variant.name + ', иллюстрация исполнения';
      size.textContent = [variant.width, variant.depth, variant.height].join(' × ') + ' см (Ш × Г × В)';
      price.textContent = money.format(variant.price);
      feedback.textContent = '';
    }

    select.addEventListener('change', updateVariant);
    image.addEventListener('load', () => {
      if (motionAllowed.matches) image.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 245 });
    });
    card.querySelector('[data-add]').addEventListener('click', () => {
      const item = { productId: product.id, variantId: select.value, quantity: 1 };
      const id = key(item);
      const previous = cart.get(id)?.quantity ?? 0;
      if (previous >= maxQuantity) {
        feedback.textContent = 'Достигнут лимит для этого исполнения.';
        return;
      }
      cart.set(id, { ...item, quantity: previous + 1 });
      updateCart();
      feedback.textContent = 'В расчёте: ' + (previous + 1) + ' шт.';
    });
    card.querySelector('[data-fit]').addEventListener('click', () => {
      fitForm.elements.variant.value = key({ productId: product.id, variantId: select.value });
      clearFit();
      byId('fit-title').focus({ preventScroll: true });
      byId('fit').scrollIntoView();
    });
    updateVariant();
    return card;
  }

  function renderCartLine(line) {
    const row = document.createElement('li');
    const label = element('label', 'Количество');
    const quantity = document.createElement('select');
    quantity.setAttribute('aria-label', 'Количество: ' + line.name + ', ' + line.variant);
    for (let amount = 1; amount <= maxQuantity; amount += 1) {
      quantity.add(new Option(String(amount), String(amount)));
    }
    quantity.value = String(line.quantity);
    quantity.addEventListener('change', () => {
      const item = cart.get(key(line));
      item.quantity = Number(quantity.value);
      updateCart();
      const next = [...byId('cart').querySelectorAll('select')].find((select) => select.getAttribute('aria-label') === quantity.getAttribute('aria-label'));
      next?.focus();
    });
    label.append(quantity);

    const remove = element('button', 'Убрать');
    remove.type = 'button';
    remove.className = 'button button-outline';
    remove.setAttribute('aria-label', 'Убрать: ' + line.name + ', ' + line.variant);
    remove.addEventListener('click', () => {
      const index = [...byId('cart').children].indexOf(row);
      cart.delete(key(line));
      updateCart();
      const buttons = byId('cart').querySelectorAll('button');
      const target = buttons[Math.min(index, buttons.length - 1)] ?? byId('estimate-title');
      target.focus();
    });

    row.append(
      element('span', line.name + ' · ' + line.variant + ' · ' + money.format(line.price) + ' за шт.'),
      label, element('strong', money.format(line.subtotal)), remove
    );
    return row;
  }

  function updateCart() {
    const { lines, total } = quote([...cart.values()]);
    byId('cart').replaceChildren(...lines.map(renderCartLine));
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const badge = byId('cart-count');
    badge.textContent = String(count);
    badge.hidden = !count;
    byId('cart-empty').hidden = Boolean(count);
    const totalOutput = byId('total');
    const formatted = money.format(total);
    if (totalOutput.textContent !== formatted && motionAllowed.matches) {
      totalMotion?.cancel();
      totalMotion = totalOutput.animate([
        { transform: 'translateY(4px)', opacity: .6 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 260, easing: 'ease-out' });
    }
    totalOutput.textContent = formatted;
    byId('cart-status').textContent = '';
    downloadButton.disabled = !count || downloadButton.hasAttribute('aria-busy');
    saveCart();
  }

  function clearFit() {
    fitRevision += 1;
    byId('fit-status').textContent = '';
    byId('fit-result').replaceChildren();
  }

  function renderPlan(input, widthLeft, depthLeft, planWidth, planDepth) {
    const pieceWidth = input.width - widthLeft;
    const pieceDepth = input.depth - depthLeft;
    const diagram = element('div', '');
    diagram.className = 'fit-plan';
    diagram.setAttribute('aria-hidden', 'true');
    const stage = element('div', '');
    stage.className = 'fit-plan-stage';
    stage.style.setProperty('--plan-ratio', planWidth / planDepth);
    stage.style.setProperty('--zone-w', input.width / planWidth * 100 + '%');
    stage.style.setProperty('--zone-d', input.depth / planDepth * 100 + '%');
    stage.style.setProperty('--piece-w', pieceWidth / planWidth * 100 + '%');
    stage.style.setProperty('--piece-d', pieceDepth / planDepth * 100 + '%');
    stage.style.setProperty('--front-d', Math.max(0, depthLeft) / planDepth * 100 + '%');
    for (const part of ['zone', 'passage', 'piece']) {
      const shape = element('span', '');
      shape.className = 'fit-plan-' + part;
      stage.append(shape);
    }
    diagram.append(stage);
    return diagram;
  }

  function renderFit({ widthLeft, depthLeft, passageLeft, rotated, fits, hasPassage }, input, planWidth, planDepth) {
    const panel = element('article', '');
    panel.className = 'fit-card';
    const heading = rotated ? 'После поворота на 90°' : 'Исходное положение';
    const status = hasPassage ? 'Мебель помещается, проход достаточный.' :
      fits ? 'Мебель помещается, проход уже заданного.' : 'Мебель не помещается.';
    const side = widthLeft >= 0 ? 'Сбоку остаётся ' + widthLeft + ' см.' : 'По ширине не хватает ' + Math.abs(widthLeft) + ' см.';
    const front = depthLeft >= 0 ? 'Перед мебелью остаётся ' + depthLeft + ' см.' : 'По глубине не хватает ' + Math.abs(depthLeft) + ' см.';
    const verdict = element('p', status);
    verdict.className = 'fit-verdict';
    panel.append(element('h3', heading), verdict, element('p', side + ' ' + front));
    if (fits && passageLeft < 0) panel.append(element('p', 'До нужного прохода не хватает ' + Math.abs(passageLeft) + ' см.'));
    const legend = element('p', 'Пунктир — зона, терракотовый — мебель, зелёный — проход.');
    legend.className = 'fit-legend';
    panel.append(renderPlan(input, widthLeft, depthLeft, planWidth, planDepth), legend);
    return panel;
  }

  filters.addEventListener('submit', (event) => {
    event.preventDefault();
    renderCatalog();
  });
  filters.addEventListener('reset', () => setTimeout(renderCatalog, 0));
  filters.elements.room.addEventListener('change', () => updateRoomButtons(filters.elements.room.value));
  roomButtons.forEach((button) => button.addEventListener('click', () => {
    const room = filters.elements.room;
    room.value = room.value === button.dataset.room ? '' : button.dataset.room;
    updateRoomButtons(room.value);
    filters.requestSubmit();
  }));

  fitForm.addEventListener('input', clearFit);
  fitForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFit();
    const revision = fitRevision;
    const fields = fitForm.elements;
    const [productId, variantId] = fields.variant.value.split('/');
    const input = {
      productId, variantId, width: fields.width.valueAsNumber,
      depth: fields.depth.valueAsNumber, passage: fields.passage.valueAsNumber
    };
    try {
      const positions = isServer ? await callApi('fit', input) : fit(input);
      if (revision !== fitRevision) return;
      const { variant } = getVariant(input.productId, input.variantId);
      const largestSide = Math.max(variant.width, variant.depth);
      const planWidth = Math.max(input.width, largestSide);
      const planDepth = Math.max(input.depth, largestSide);
      byId('fit-result').replaceChildren(...positions.map((position) => renderFit(position, input, planWidth, planDepth)));
      byId('fit-status').textContent = 'Расчёт готов. Подходящих положений с заданным проходом: ' +
        positions.filter((position) => position.hasPassage).length + ' из 2.';
    } catch (error) {
      if (revision === fitRevision) byId('fit-status').textContent = 'Проверка недоступна. ' + error.message;
    }
  });

  downloadButton.addEventListener('click', async () => {
    const items = [...cart.values()].map((item) => ({ ...item }));
    if (!items.length) return;
    downloadButton.setAttribute('aria-busy', 'true');
    downloadButton.disabled = true;
    try {
      const { lines, total } = isServer ? await callApi('quote', { items }) : quote(items);
      const text = [
        'Мера · предварительный расчёт',
        ...lines.map((line) => line.name + ' · ' + line.variant + ' × ' + line.quantity + ' — ' + money.format(line.subtotal)),
        'Итого: ' + money.format(total),
        'Учебные цены. Доставка и сборка считаются отдельно.'
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mera-estimate.txt';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      byId('cart-status').textContent = 'Файл расчёта готов.';
    } catch (error) {
      byId('cart-status').textContent = 'Не удалось скачать расчёт. ' + error.message;
    } finally {
      downloadButton.removeAttribute('aria-busy');
      downloadButton.disabled = !cart.size;
    }
  });

  addOptions(filters.elements.room, Object.entries(furnitureCatalog.rooms));
  addOptions(filters.elements.category, Object.entries(furnitureCatalog.categories));
  addOptions(fitForm.elements.variant, furnitureCatalog.products.flatMap((product) =>
    product.variants.map((variant) => [
      key({ productId: product.id, variantId: variant.id }),
      product.name + ' · ' + variant.name + ' · ' + variant.width + ' см'
    ])
  ));
  byId('shop').hidden = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        target.classList.add('heading-enter');
        observer.unobserve(target);
      });
    }, { threshold: .25 });
    document.querySelectorAll('.section-heading').forEach((heading) => observer.observe(heading));
  }
  renderCatalog();
  updateCart();
}

{
  const curtain = document.querySelector('.curtain');
  const drawer = curtain.querySelector('details');
  const updateOffset = () => document.documentElement.style.setProperty('--curtain-height', curtain.offsetHeight + 10 + 'px');
  updateOffset();
  new ResizeObserver(updateOffset).observe(curtain);
  document.addEventListener('click', (event) => {
    if (drawer.open && !drawer.contains(event.target)) drawer.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.open) {
      drawer.open = false;
      drawer.querySelector('summary').focus();
    }
  });
}

{
  const controls = document.querySelector('.scene-buttons');
  const photo = document.getElementById('scene-photo');
  const title = document.getElementById('scene-title');
  controls.addEventListener('click', (event) => {
    const choice = event.target.closest('button[data-scene]');
    if (!choice || choice.getAttribute('aria-pressed') === 'true') return;
    for (const button of controls.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button === choice));
    }
    const caption = choice.getAttribute('aria-label');
    photo.src = 'assets/' + choice.dataset.scene + '.webp';
    photo.alt = caption;
    title.textContent = caption;
    if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      photo.animate([{ opacity: .45, scale: '1.035' }, { opacity: 1, scale: '1' }], { duration: 410 });
    }
  });
}
