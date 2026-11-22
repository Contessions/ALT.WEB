'use strict';

// Фиксированный образец остаётся одинаковым при сравнении двух состояний.
const paint = document.getElementById('paint');
const context = paint.getContext('2d');
const lamp = document.getElementById('lamp');
const lampValue = document.getElementById('lamp-value');

function seededRandom(seed) {
  return function next() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const random = seededRandom(98317);
const scratches = Array.from({ length: 1800 }, () => ({
  x: random(), y: random(), radius: .012 + random() * .09,
  angle: random() * Math.PI * 2, span: .12 + random() * 1.45,
  depth: .16 + random() * .84
}));
const flakes = Array.from({ length: 5600 }, () => ({
  x: random(), y: random(), light: .1 + random() * .8
}));

function drawPaint() {
  if (!context) return;
  const bounds = paint.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  if (paint.width !== Math.round(width * pixelRatio) || paint.height !== Math.round(height * pixelRatio)) {
    paint.width = Math.round(width * pixelRatio);
    paint.height = Math.round(height * pixelRatio);
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const corrected = document.querySelector('[name="finish"]:checked').value === 'corrected';
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
  for (const point of flakes) {
    context.fillStyle = 'rgba(216,233,211,' + point.light * .17 + ')';
    context.fillRect(point.x * width,point.y * height,1,.7);
  }
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
  for (const mark of scratches) {
    const x = mark.x * width;
    const y = mark.y * height;
    const distance = Math.hypot((x-lampX) / (radius * 1.15),(y-lampY) / radius);
    const exposure = Math.max(0, 1 - distance);
    if (!exposure || (corrected && mark.depth < .92)) continue;
    const alpha = exposure * exposure * mark.depth * (corrected ? .20 : .9);
    context.strokeStyle = 'rgba(242,237,219,' + alpha + ')';
    context.beginPath();
    context.arc(x,y,mark.radius * height,mark.angle,mark.angle + mark.span);
    context.stroke();
  }
}

let pendingFrame = 0;
function requestDraw() {
  if (pendingFrame) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = 0;
    lampValue.textContent = lamp.value + '%';
    drawPaint();
  });
}
function positionLight(event) {
  const bounds = paint.getBoundingClientRect();
  lamp.value = String(Math.round(100 * (event.clientX - bounds.left) / bounds.width));
  requestDraw();
}
paint.addEventListener('pointerdown', positionLight);
paint.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'mouse' || event.buttons === 1) positionLight(event);
});
lamp.addEventListener('input', requestDraw);
document.querySelector('.inspection-modes').addEventListener('change', requestDraw);
new ResizeObserver(requestDraw).observe(paint);
requestDraw();
