<template><span class="badge" :class="`badge-${normalized}`">{{ value || "UNASSESSED" }}</span></template>
<script setup>
import { computed } from "vue";
const props = defineProps({ value: { type: String, default: "" } });
const normalized = computed(() => (props.value || "submitted").toLowerCase().replaceAll("_", "-"));
</script>
