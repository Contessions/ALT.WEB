'use strict';

if (typeof siteModule !== 'undefined' && siteModule) {
  // Фиксированный образец остаётся одинаковым при сравнении двух состояний.
  const paint = document.getElementById('paint');
  const comparison = document.getElementById('paint-comparison');
  const correctedPaint = document.getElementById('corrected-paint');
  const split = document.getElementById('paint-split');
  const lamp = document.getElementById('lamp');
  const lampValue = document.getElementById('lamp-value');
  const secret = document.getElementById('inspection-secret');

  const scratchCount = 1800;
  const flakeCount = 5600;
  const surfaceOffset = siteModule.surface();
  const sample = new Float64Array(siteModule.memory.buffer, surfaceOffset, scratchCount * 6 + flakeCount * 3);

  // The grain stays fixed when the lamp moves and is shared by both finishes.
  const grainLayer = document.createElement('canvas');
  grainLayer.width = 0;
  function drawGrain(context, width, height, pixelRatio) {
    if (grainLayer.width !== context.canvas.width || grainLayer.height !== context.canvas.height) {
      grainLayer.width = context.canvas.width;
      grainLayer.height = context.canvas.height;
      const grain = grainLayer.getContext('2d');
      if (!grain) return;
      grain.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      for (let i = scratchCount * 6; i < sample.length; i += 3) {
        grain.fillStyle = 'rgba(216,233,211,' + sample[i + 2] * .17 + ')';
        grain.fillRect(sample[i] * width, sample[i + 1] * height, 1, .7);
      }
    }
    context.drawImage(grainLayer, 0, 0, width, height);
  }
  function drawSurface(canvas, corrected) {
    const context = canvas.getContext('2d');
    if (!context) return;
    const bounds = paint.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const light = Number(lamp.value) / 100;
    const lampX = width * (.1 + light * .8);
    const lampY = height * (.60 - light * .25);

    // Изогнутая панель: широкое отражение стены и узкая линия канта.
    const metal = context.createLinearGradient(0, 0, width * .22, height);
    [[0,'#07100e'],[.2,'#243632'],[.32,'#3c534b'],[.39,'#1d302a'],
      [.51,'#0e1917'],[.68,'#273831'],[.69,'#53645b'],[.715,'#101e1a'],[1,'#060d0c']]
      .forEach(([stop,color]) => metal.addColorStop(stop,color));
    context.fillStyle = metal;
    context.fillRect(0, 0, width, height);
    const radius = Math.max(width * .39, height * .6);
    const glow = context.createRadialGradient(lampX,lampY,0,lampX,lampY,radius);
    glow.addColorStop(0, corrected ? '#eef6e66e' : '#f7ebceaa');
    glow.addColorStop(.16, corrected ? '#c8e2d343' : '#e1dfc96c');
    glow.addColorStop(.55,'#adc0aa1c');
    glow.addColorStop(1,'#c7dbb900');
    context.fillStyle = glow;
    context.fillRect(0,0,width,height);
    drawGrain(context, width, height, pixelRatio);
    context.save();
    context.translate(lampX,lampY);
    context.rotate(-.38);
    const beamLength = height * .47;
    for (const offset of [-5, 5]) {
      context.shadowColor = '#e5f9eb';
      context.shadowBlur = corrected ? 7 : 15;
      context.strokeStyle = '#e3f2e7';
      context.lineWidth = corrected ? 2.5 : 3.4;
      context.beginPath();
      context.moveTo(offset,-beamLength * .5);
      context.quadraticCurveTo(offset + 4,0,offset,beamLength * .5);
      context.stroke();
    }
    context.restore();

    // Одинаковые дуги проявляются с разной силой только в зоне скользящего света.
    context.lineWidth = .85;
    for (let i = 0; i < scratchCount * 6; i += 6) {
      const x = sample[i] * width;
      const y = sample[i + 1] * height;
      const angle = sample[i + 3];
      const alpha = siteModule.scratch_alpha((x - lampX) / (radius * 1.15), (y - lampY) / radius, sample[i + 5], Number(corrected));
      if (!alpha) continue;
      context.strokeStyle = 'rgba(242,237,219,' + alpha + ')';
      context.beginPath();
      context.arc(x, y, sample[i + 2] * height, angle, angle + sample[i + 4]);
      context.stroke();
    }
  }

  let pendingFrame = 0;
  function requestDraw() {
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      lampValue.textContent = lamp.value + '%';
      const mode = document.querySelector('[name="finish"]:checked').value;
      comparison.hidden = mode !== 'compare';
      if (secret) secret.hidden = mode !== 'corrected' || Number(lamp.value) < 100;
      drawSurface(paint, mode === 'corrected');
      if (!comparison.hidden) drawSurface(correctedPaint, true);
    });
  }
  function positionLight(event) {
    const bounds = paint.getBoundingClientRect();
    lamp.value = String(siteModule.light_percent(event.clientX - bounds.left, bounds.width));
    requestDraw();
  }
  paint.addEventListener('pointerdown', positionLight);
  paint.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || event.buttons === 1) positionLight(event);
  });
  // The divider clips the prepared layers without repainting the model.
  split.addEventListener('input', () => {
    comparison.style.setProperty('--split', split.value + '%');
    split.setAttribute('aria-valuetext', split.value + ' процентов до полировки');
  });
  lamp.addEventListener('input', requestDraw);
  document.querySelector('.inspection-modes').addEventListener('change', requestDraw);
  new ResizeObserver(requestDraw).observe(paint);
  requestDraw();
}
