'use strict';

const briefFormats = typeof catalog === 'undefined' ? {} : (catalog.brief ?? {});

function recommendation(goal) {
  return Object.hasOwn(briefFormats, goal) ? briefFormats[goal] : undefined;
}

const builder = document.getElementById('brief-builder');
if (builder) {
  const business = document.getElementById('brief-business');
  const goal = document.getElementById('brief-goal');
  const details = document.getElementById('brief-details');
  const preview = document.getElementById('draft-preview');
  const draft = document.getElementById('brief-text');
  const copy = document.getElementById('copy-brief');
  const edit = document.getElementById('edit-fields');
  const status = document.getElementById('copy-status');
  const initialGoal = new URLSearchParams(location.search).get('goal');
  if (recommendation(initialGoal)) goal.value = initialGoal;

  let previousTemplate;
  builder.hidden = false;
  preview.hidden = true;
  copy.hidden = false;
  edit.hidden = false;
  builder.addEventListener('submit', event => {
    event.preventDefault();
    const format = recommendation(goal.value);
    const lines = ['Здравствуйте! Хочу обсудить сайт с ALT Web.'];
    if (business.value.trim()) lines.push('Наш бизнес: ' + business.value.trim());
    if (format) lines.push('Задача: ' + goal.selectedOptions[0].textContent + '.', 'Формат: ' + format.title + '.');
    if (details.value.trim()) lines.push('Подробности: ' + details.value.trim());
    const template = lines.join('\n\n');
    // Revisiting the same answers preserves direct edits made in the preview.
    if (template !== previousTemplate) draft.value = template;
    previousTemplate = template;
    builder.hidden = true;
    preview.hidden = false;
    status.textContent = '';
    draft.focus();
  });
  edit.addEventListener('click', () => {
    preview.hidden = true;
    builder.hidden = false;
    business.focus();
  });
  copy.addEventListener('click', async () => {
    if (!draft.value.trim()) {
      status.textContent = 'Добавьте текст сообщения.';
      draft.focus();
      return;
    }
    try {
      await navigator.clipboard.writeText(draft.value);
      status.textContent = 'Текст скопирован. Вставьте его в переписку с Антоном.';
    } catch {
      draft.focus();
      draft.select();
      status.textContent = 'Текст выделен. Нажмите Ctrl+C или используйте меню копирования.';
    }
  });
}
