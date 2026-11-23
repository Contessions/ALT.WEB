'use strict';

const furnitureEngine = (() => {
  const catalog = typeof module === 'object' && module.exports ? require('./catalog.js') : furnitureCatalog;
  const { products, rooms, categories } = catalog;
  const maxSize = 2000;
  const maxQuantity = 20;
  const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
  const key = ({ productId, variantId }) => productId + '/' + variantId;

  function measurement(value, min = 1) {
    if (!Number.isInteger(value) || value < min || value > maxSize) {
      throw new RangeError('Введите целые размеры от ' + min + ' до ' + maxSize + ' см.');
    }
    return value;
  }

  function getVariant(productId, variantId) {
    const product = products.find((item) => item.id === productId);
    const variant = product?.variants.find((item) => item.id === variantId);
    if (!variant) throw new RangeError('Вариант товара отсутствует в каталоге.');
    return { product, variant };
  }

  function filter(filters = {}) {
    const { room = '', category = '', sort = 'catalog' } = filters;
    if ((room !== '' && !Object.hasOwn(rooms, room)) || (category !== '' && !Object.hasOwn(categories, category))) {
      throw new RangeError('Выберите комнату и категорию из каталога.');
    }
    if (!['catalog', 'price'].includes(sort)) throw new RangeError('Неизвестный порядок сортировки.');

    const query = String(filters.query ?? '').trim().toLowerCase().replaceAll('ё', 'е');
    const width = filters.width == null ? maxSize : measurement(filters.width);
    const depth = filters.depth == null ? maxSize : measurement(filters.depth);
    const price = filters.price == null ? Infinity : filters.price;
    if (price !== Infinity && (!Number.isSafeInteger(price) || price < 1)) {
      throw new RangeError('Укажите положительный бюджет в рублях.');
    }

    const matches = products.flatMap((product) => {
      if ((room && !product.rooms.includes(room)) || (category && product.category !== category)) return [];
      const searchable = [product.name, product.description, categories[product.category]].join(' ').toLowerCase().replaceAll('ё', 'е');
      const variants = product.variants.filter((variant) =>
        variant.width <= width && variant.depth <= depth && variant.price <= price &&
        (!query || (searchable + ' ' + variant.name.toLowerCase().replaceAll('ё', 'е')).includes(query))
      );
      return variants.length ? [{ ...product, variants }] : [];
    });

    if (sort === 'price') {
      const lowest = ({ variants }) => Math.min(...variants.map(({ price }) => price));
      matches.sort((first, second) => lowest(first) - lowest(second));
    }
    return matches;
  }

  function quote(items) {
    if (!Array.isArray(items) || items.length > 100) throw new RangeError('Проверьте список товаров.');
    const combined = new Map();

    for (const item of items) {
      if (!item || !Number.isInteger(item.quantity) || item.quantity < 1) throw new RangeError('Укажите количество от 1 до ' + maxQuantity + '.');
      const { product, variant } = getVariant(item.productId, item.variantId);
      const id = key(item);
      const quantity = (combined.get(id)?.quantity ?? 0) + item.quantity;
      if (quantity > maxQuantity) throw new RangeError('Максимум ' + maxQuantity + ' штук одного варианта.');
      combined.set(id, {
        productId: product.id, variantId: variant.id, name: product.name, variant: variant.name,
        quantity, price: variant.price, subtotal: quantity * variant.price
      });
    }

    const lines = [...combined.values()];
    return { lines, total: lines.reduce((total, item) => total + item.subtotal, 0) };
  }

  // Keep the item flush to the back-left corner. Passage is measured in front.
  function fit(input) {
    const { variant } = getVariant(input.productId, input.variantId);
    const width = measurement(input.width);
    const depth = measurement(input.depth);
    const passage = measurement(input.passage, 0);
    return [false, true].map((rotated) => {
      const widthLeft = width - (rotated ? variant.depth : variant.width);
      const depthLeft = depth - (rotated ? variant.width : variant.depth);
      return {
        rotated, widthLeft, depthLeft, passageLeft: depthLeft - passage,
        fits: widthLeft >= 0 && depthLeft >= 0,
        hasPassage: widthLeft >= 0 && depthLeft >= passage
      };
    });
  }

  return { filter, getVariant, key, quote, fit, maxQuantity, money };
})();

if (typeof module === 'object' && module.exports) module.exports = furnitureEngine;
