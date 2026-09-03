<template>
  <span class="copy-hash">
    <code :title="value">{{ value || "—" }}</code>
    <button v-if="value" class="copy-button" type="button" :aria-label="`Copy ${label || 'value'}`" @click="copyValue">
      {{ copied ? "COPIED" : "COPY" }}
    </button>
  </span>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({ value: { type: String, default: "" }, label: { type: String, default: "value" } });
const copied = ref(false);

async function copyValue() {
  try {
    await navigator.clipboard.writeText(props.value);
    copied.value = true;
    window.setTimeout(() => { copied.value = false; }, 1400);
  } catch {
    copied.value = false;
  }
}
</script>
