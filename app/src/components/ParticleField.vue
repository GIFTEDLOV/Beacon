<template>
  <canvas ref="canvas" :class="['particle-field', { 'particle-field-dimmed': props.dimmed }]" aria-hidden="true"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps({ dimmed: Boolean });

const canvas = ref(null);
let frame = 0;
let resizeObserver = null;
let stop = false;

function setupField() {
  const element = canvas.value;
  if (!element) return;
  const context = element.getContext("2d", { alpha: true });
  if (!context) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const points = [];
  let width = 0;
  let height = 0;

  function resize() {
    const rect = element.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    element.width = Math.floor(width * dpr);
    element.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    const count = window.innerWidth < 700 ? 360 : window.innerWidth < 1100 ? 620 : 900;
    points.length = 0;
    for (let index = 0; index < count; index += 1) {
      const shell = index % 4;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.78;
      points.push({
        x: Math.cos(angle) * radius * (shell === 2 ? 1.45 : 1),
        y: Math.sin(angle) * radius * (shell === 1 ? 0.48 : 0.82),
        z: Math.sin(angle * (shell + 1)) * 0.32 + (Math.random() * 2 - 1),
        size: 0.45 + Math.random() * 1.1,
        drift: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(time) {
    if (stop) return;
    const seconds = time * 0.00006;
    context.clearRect(0, 0, width, height);
    const centerX = width * 0.56;
    const centerY = height * 0.48;
    const scale = Math.min(width, height) * 0.36;
    const rotation = motionQuery.matches ? 0.22 : seconds;

    for (const point of points) {
      const wobble = Math.sin(seconds * 1.8 + point.drift) * 0.018;
      const x = point.x + wobble;
      const y = point.y;
      const z = point.z;
      const rotatedX = x * Math.cos(rotation) - z * Math.sin(rotation);
      const rotatedZ = x * Math.sin(rotation) + z * Math.cos(rotation);
      const perspective = 1.12 / (1.7 - rotatedZ * 0.34);
      const screenX = centerX + rotatedX * scale * perspective;
      const screenY = centerY + y * scale * perspective;
      if (screenX < -4 || screenX > width + 4 || screenY < -4 || screenY > height + 4) continue;
      const depth = Math.max(0, Math.min(1, (rotatedZ + 1) / 2));
      const alpha = 0.035 + depth * 0.26;
      context.fillStyle = `rgba(99, 220, 203, ${alpha})`;
      const size = point.size * (0.65 + depth * 0.75);
      context.fillRect(screenX, screenY, size, size);
    }
    frame = requestAnimationFrame(draw);
  }

  resize();
  seed();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);
  frame = requestAnimationFrame(draw);
}

onMounted(setupField);
onUnmounted(() => {
  stop = true;
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
});
</script>
