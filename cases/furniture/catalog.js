'use strict';

const furnitureCatalog = {
  rooms: {
    living: 'Гостиная',
    bedroom: 'Спальня',
    dining: 'Столовая',
    office: 'Кабинет'
  },
  categories: {
    sofa: 'Диваны',
    chair: 'Кресла и стулья',
    table: 'Столы',
    storage: 'Хранение',
    bed: 'Кровати'
  },
  products: [
    {
      id: 'lento', name: 'Диван Ленто', category: 'sofa', rooms: ['living'],
      description: 'Прямой диван с низкими подлокотниками.',
      variants: [
        { id: 'sand-190', name: 'Рогожка, песочный', width: 190, depth: 91, height: 82, price: 48900 },
        { id: 'olive-210', name: 'Велюр, оливковый', width: 210, depth: 94, height: 84, price: 55900 }
      ]
    },
    {
      id: 'tayga', name: 'Угловой диван Тайга', category: 'sofa', rooms: ['living'],
      description: 'Диван с секцией для отдыха у стены.',
      variants: [
        { id: 'gray-245', name: 'Рогожка, серый', width: 245, depth: 153, height: 87, price: 73900 },
        { id: 'cream-265', name: 'Букле, кремовый', width: 265, depth: 165, height: 87, price: 87900 }
      ]
    },
    {
      id: 'pole', name: 'Кресло Поле', category: 'chair', rooms: ['living', 'bedroom'],
      description: 'Глубокое кресло для чтения.',
      variants: [
        { id: 'sienna', name: 'Велюр, терракотовый', width: 79, depth: 85, height: 92, price: 25900 },
        { id: 'cream', name: 'Букле, кремовый', width: 79, depth: 85, height: 92, price: 27900 }
      ]
    },
    {
      id: 'runa', name: 'Обеденный стол Руна', category: 'table', rooms: ['dining'],
      description: 'Прямоугольная столешница с закруглёнными углами.',
      variants: [
        { id: 'oak-120', name: 'Шпон дуба', width: 120, depth: 75, height: 75, price: 32900 },
        { id: 'walnut-150', name: 'Шпон ореха', width: 150, depth: 85, height: 75, price: 39900 }
      ]
    },
    {
      id: 'most', name: 'Рабочий стол Мост', category: 'table', rooms: ['office'],
      description: 'Рабочий стол с неглубоким ящиком.',
      variants: [
        { id: 'ash-100', name: 'Шпон ясеня', width: 100, depth: 55, height: 75, price: 21900 },
        { id: 'oak-130', name: 'Шпон дуба', width: 130, depth: 65, height: 75, price: 26900 }
      ]
    },
    {
      id: 'sneg', name: 'Комод Снег', category: 'storage', rooms: ['living', 'bedroom'],
      description: 'Четыре выдвижных ящика.',
      variants: [
        { id: 'white-90', name: 'Эмаль, белый', width: 90, depth: 45, height: 92, price: 30900 },
        { id: 'oak-120', name: 'Шпон дуба', width: 120, depth: 45, height: 92, price: 37900 }
      ]
    },
    {
      id: 'tish', name: 'Кровать Тишь', category: 'bed', rooms: ['bedroom'],
      description: 'Кровать с мягким изголовьем. Указаны внешние габариты.',
      variants: [
        { id: 'stone-156', name: 'Рогожка, каменный', width: 156, depth: 212, height: 107, price: 38900 },
        { id: 'cream-176', name: 'Букле, кремовый', width: 176, depth: 212, height: 107, price: 44900 }
      ]
    },
    {
      id: 'gran', name: 'Стеллаж Грань', category: 'storage', rooms: ['living', 'office'],
      description: 'Открытые полки для книг и хранения.',
      variants: [
        { id: 'graphite-70', name: 'Эмаль, графитовый', width: 70, depth: 34, height: 178, price: 18900 },
        { id: 'oak-100', name: 'Шпон дуба', width: 100, depth: 36, height: 178, price: 24900 }
      ]
    },
    {
      id: 'iva', name: 'Стул Ива', category: 'chair', rooms: ['dining', 'office'],
      description: 'Деревянный стул с мягким сиденьем.',
      variants: [
        { id: 'gray', name: 'Рогожка, серый', width: 46, depth: 51, height: 82, price: 6900 },
        { id: 'green', name: 'Велюр, зелёный', width: 46, depth: 51, height: 82, price: 7900 }
      ]
    }
  ]
};

if (typeof module === 'object' && module.exports) module.exports = furnitureCatalog;
