<template>
  <div class="risk-cell" :class="`risk-${normalizedValue}`">
    <span class="risk-cell-index">{{ String(index).padStart(2, "0") }} / {{ label }}</span>
    <strong>{{ value || "UNKNOWN" }}</strong>
    <span v-if="provenance" class="risk-cell-meta">PROVENANCE · {{ provenance }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({ index: { type: Number, required: true }, label: { type: String, required: true }, value: { type: String, default: "UNKNOWN" }, provenance: { type: String, default: "" } });
const normalizedValue = computed(() => String(props.value || "unknown").toLowerCase().replaceAll("_", "-"));
</script>
