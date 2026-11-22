'use strict';

const briefFormats = typeof catalog === 'undefined' ? {} : (catalog.brief ?? {});

function recommendation(goal) {
  return Object.hasOwn(briefFormats, goal) ? briefFormats[goal] : undefined;
}

const brief = document.querySelector('.brief');
if (brief) {
  brief.addEventListener('change', () => {
    const selected = recommendation(new FormData(brief).get('goal'));
    if (!selected) return;
    document.getElementById('recommendation-title').textContent = selected.title;
    document.getElementById('recommendation-copy').textContent = selected.description;
  });
}

const draft = document.getElementById('brief-text');
if (draft) {
  const choice = recommendation(new URLSearchParams(location.search).get('goal'));
  if (choice) {
    draft.value = 'Здравствуйте! Хочу обсудить проект для моего бизнеса.\nПодходящий формат: ' +
      choice.title + '.\nЧем занимается бизнес: \nЧто должен делать сайт: ';
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
