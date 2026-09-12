<template>
  <aside v-if="state.open" class="tx-drawer" role="dialog" aria-modal="true" aria-labelledby="tx-title">
    <div class="tx-drawer-head"><div><span class="label">Write lifecycle</span><h2 id="tx-title">{{ state.operation.replaceAll('_', ' ') }}</h2></div><button class="icon-button" aria-label="Close transaction status" @click="$emit('close')">×</button></div>
    <div class="tx-steps"><div v-for="step in steps" :key="step" :class="stepClass(step)"><span>{{ stepNumber(step) }}</span><strong>{{ step }}</strong></div></div>
    <div v-if="state.hash" class="tx-hash"><span class="label">Persisted transaction hash</span><code>{{ state.hash }}</code></div>
    <div v-if="state.error" class="notice error">{{ state.error }}</div>
    <div v-if="state.recoverable" class="tx-actions"><button class="button button-dark" @click="$emit('recover')">Check again</button><p class="form-note">The saved hash will be reconciled. Beacon will not rebroadcast automatically.</p></div>
  </aside>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ state: { type: Object, required: true } });
defineEmits(["close", "recover"]);
const steps = ["Preparing", "Wallet confirmation", "SUBMITTED", "ACCEPTED", "FINALIZED", "FINISHED_WITH_RETURN", "FINISHED_WITH_ERROR", "State verified"];
const current = computed(() => props.state.phase || "Preparing");
function stepNumber(step) { return String(steps.indexOf(step) + 1).padStart(2, "0"); }
function stepClass(step) { const currentIndex = steps.indexOf(current.value); const index = steps.indexOf(step); return { done: index < currentIndex && current.value !== "Unable to complete" && current.value !== "FINISHED_WITH_ERROR", active: step === current.value, failed: current.value === "Unable to complete" || (current.value === "FINISHED_WITH_ERROR" && step === "FINISHED_WITH_ERROR") }; }
</script>
