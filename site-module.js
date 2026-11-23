'use strict';

// Общие функции калькулятора и осмотра лака. Сборка и WebAssembly не требуются.
const siteModule = (() => {
  const scratchCount = 1800;
  const flakeCount = 5600;

  function select(mask, service, checked) {
    if (!Number.isInteger(service) || service < 0 || service >= 32) return mask;
    const bit = 1 << service;
    return checked ? mask | bit : mask & ~bit;
  }

  function selected(mask, service) {
    if (!Number.isInteger(service) || service < 0 || service >= 32) return 0;
    return Number((mask & (1 << service)) !== 0);
  }

  function surface() {
    let seed = 98317;
    const random = () => {
      // Тот же линейный конгруэнтный генератор, что был в WASM-версии.
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const sample = new Float64Array(scratchCount * 6 + flakeCount * 3);
    let offset = 0;

    for (let index = 0; index < scratchCount; index += 1) {
      sample[offset++] = random();
      sample[offset++] = random();
      sample[offset++] = 0.012 + random() * 0.09;
      sample[offset++] = random() * Math.PI * 2;
      sample[offset++] = 0.12 + random() * 1.45;
      sample[offset++] = 0.16 + random() * 0.84;
    }
    for (let index = 0; index < flakeCount; index += 1) {
      sample[offset++] = random();
      sample[offset++] = random();
      sample[offset++] = 0.1 + random() * 0.8;
    }
    return sample;
  }

  function lightPercent(offset, width) {
    if (width <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(100 * offset / width)));
  }

  function scratchAlpha(dx, dy, depth, corrected) {
    if (corrected && depth < 0.92) return 0;
    const exposure = Math.max(0, 1 - Math.hypot(dx, dy));
    return exposure * exposure * depth * (corrected ? 0.20 : 0.9);
  }

  return { select, selected, surface, lightPercent, scratchAlpha };
})();
