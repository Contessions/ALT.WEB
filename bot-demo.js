'use strict';

const botChoices = document.getElementById('bot-choices');
const botReply = document.getElementById('bot-reply');
const botNext = document.getElementById('bot-next');
const topics = new Map([
  ['services', {
    reply: 'В FORMA можно выбрать полировку, химчистку салона и керамическую защиту.',
    label: 'Посмотреть программы',
    href: '#services',
  }],
  ['price', {
    reply: 'Цена зависит от класса автомобиля и набора работ. Откройте калькулятор, чтобы посчитать свой вариант.',
    label: 'Рассчитать стоимость',
    href: '#estimate',
  }],
  ['booking', {
    reply: 'Сначала добавьте услуги в расчёт. Затем откроется демо-запись с выбором времени.',
    label: 'Перейти к демо-записи',
    href: '#estimate',
  }],
]);

// The conversation stays in the browser and leads to the real demo controls.
botChoices.hidden = false;
botChoices.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-topic]');
  const topic = topics.get(button?.dataset.topic);
  if (!topic) return;

  botChoices.querySelectorAll('button').forEach((choice) => {
    choice.setAttribute('aria-pressed', String(choice === button));
  });
  botReply.textContent = topic.reply;
  botNext.textContent = topic.label;
  botNext.href = 'cases/forma/index.html' + topic.href;
  botNext.hidden = false;
});
