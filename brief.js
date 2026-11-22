'use strict';

const options = {
  explain: ['Лендинг', 'Одна страница с предложением, ответами на вопросы и кнопкой обращения.'],
  compare: ['Сайт компании', 'Отдельные страницы услуг, примеры работ и общий путь к обращению.'],
  estimate: ['Калькулятор или конфигуратор', 'Выбор параметров, прозрачный расчёт и сводка перед обращением.']
};

const brief = document.querySelector('.brief');
if (brief) {
  brief.addEventListener('change', () => {
    const selected = options[new FormData(brief).get('goal')];
    document.getElementById('recommendation-title').textContent = selected[0];
    document.getElementById('recommendation-copy').textContent = selected[1];
  });
}

const draft = document.getElementById('brief-text');
if (draft) {
  const goal = new URLSearchParams(location.search).get('goal');
  if (Object.hasOwn(options, goal)) {
    draft.value = 'Здравствуйте! Хочу обсудить проект для моего бизнеса.\nПодходящий формат: ' +
      options[goal][0] + '.\nЧем занимается бизнес: \nЧто должен делать сайт: ';
  }

  const copy = document.getElementById('copy-brief');
  const status = document.getElementById('copy-status');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      status.textContent = 'Черновик скопирован.';
    } catch {
      draft.focus();
      draft.select();
      status.textContent = 'Текст выделен. Нажмите Ctrl+C или используйте меню копирования.';
    }
  });
}
