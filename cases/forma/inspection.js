'use strict';

if (typeof siteModule !== 'undefined' && siteModule) {
  // Фиксированный образец остаётся одинаковым при сравнении двух состояний.
  const paint = document.getElementById('paint');
  const comparison = document.getElementById('paint-comparison');
  const correctedPaint = document.getElementById('corrected-paint');
  const split = document.getElementById('paint-split');
  const bodywork = document.querySelector('.hero-photo');
  const lampInset = .07;
  const lamp = document.getElementById('lamp');
  const lampValue = document.getElementById('lamp-value');
  const secret = document.getElementById('inspection-secret');

  const scratchCount = 1800;
  const flakeCount = 5600;
  const sample = siteModule.surface();

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
        grain.fillStyle = 'rgba(207,220,240,' + sample[i + 2] * .17 + ')';
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
    const lampX = width * (lampInset + light * (1 - 2 * lampInset));
    const lampY = height * (.55 - light * .21);

    context.fillStyle = '#17202b';
    context.fillRect(0, 0, width, height);
    if (bodywork.complete && bodywork.naturalWidth) {
      // A crop of the same painted bumper in both finishes. Keep the reflection
      // straight on a narrow screen by cropping instead of stretching the photo.
      const frameWidth = bodywork.naturalWidth * .30;
      const frameHeight = bodywork.naturalHeight * .15;
      const sourceWidth = Math.min(frameWidth, frameHeight * width / height);
      const sourceHeight = sourceWidth * height / width;
      context.drawImage(bodywork,
        bodywork.naturalWidth * .68 + (frameWidth - sourceWidth) * .5,
        bodywork.naturalHeight * .62 + (frameHeight - sourceHeight) * .5,
        sourceWidth, sourceHeight, 0, 0, width, height);
    }
    context.fillStyle = corrected ? '#08162555' : '#17233244';
    context.fillRect(0, 0, width, height);
    drawGrain(context, width, height, pixelRatio);

    const radius = Math.max(width * .38, height * .72);
    const glow = context.createRadialGradient(lampX, lampY, 0, lampX, lampY, radius);
    glow.addColorStop(0, corrected ? '#e7f1ff96' : '#fff3d5dc');
    glow.addColorStop(.10, corrected ? '#cbdeff32' : '#f6dfbb95');
    glow.addColorStop(.35, corrected ? '#adc5e407' : '#c2cada50');
    glow.addColorStop(1, '#bed1e600');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(lampX,lampY);
    context.rotate(-.63);
    const beamLength = height * .36;
    for (const offset of [-4, 4]) {
      context.shadowColor = '#e6f2ff';
      context.shadowBlur = corrected ? 4 : 14;
      context.strokeStyle = '#e4efff';
      context.lineWidth = corrected ? 2 : 3.2;
      context.beginPath();
      context.moveTo(offset,-beamLength * .5);
      context.quadraticCurveTo(offset + 4,0,offset,beamLength * .5);
      context.stroke();
    }
    context.restore();

    // Одинаковые дуги проявляются с разной силой только в зоне скользящего света.
    context.lineCap = 'round';
    for (let i = 0; i < scratchCount * 6; i += 6) {
      const x = sample[i] * width;
      const y = sample[i + 1] * height;
      const depth = sample[i + 5];
      // Long wash marks follow broad arcs. Their geometry is fixed in the coat;
      // only their visibility changes under the moving inspection lamp.
      const tangent = Math.atan2(y - height * .46, x - width * .49) + Math.PI / 2;
      const angle = tangent + Math.sin(sample[i + 3]) * .40;
      const halfLength = (2.6 + sample[i + 2] * 88) * Math.min(1.4, height / 240);
      const dx = Math.cos(angle) * halfLength;
      const dy = Math.sin(angle) * halfLength;
      const alpha = siteModule.scratchAlpha((x - lampX) / (radius * 1.15), (y - lampY) / radius, sample[i + 5], Number(corrected));
      if (alpha < .01) continue;
      context.lineWidth = .32 + .54 * depth;
      context.strokeStyle = 'rgba(243,243,238,' + Math.min(.93, alpha * 1.25) + ')';
      context.beginPath();
      context.moveTo(x - dx, y - dy);
      context.quadraticCurveTo(x - dy * .16, y + dx * .16, x + dx, y + dy);
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
    lamp.value = String(siteModule.lightPercent(event.clientX - bounds.left - bounds.width * lampInset, bounds.width * (1 - 2 * lampInset)));
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
  bodywork.addEventListener('load', requestDraw);
  new ResizeObserver(requestDraw).observe(paint);
  requestDraw();
}
