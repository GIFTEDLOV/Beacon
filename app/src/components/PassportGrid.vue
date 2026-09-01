<template>
  <div v-if="passport" class="passport-grid">
    <div v-for="field in fields" :key="field.key" class="passport-cell">
      <small>{{ field.label }}</small><strong>{{ passport[field.key] ?? "--" }}</strong>
    </div>
  </div>
  <div v-else class="empty-state">No finalized passport is available.</div>
</template>

<script setup>
defineProps({ passport: { type: Object, default: null } });
const fields = [
  { key: "peg_risk", label: "Peg risk" },
  { key: "liquidity_risk", label: "Liquidity risk" },
  { key: "redemption_risk", label: "Redemption risk" },
  { key: "backing_risk", label: "Backing risk" },
  { key: "admin_governance_risk", label: "Admin / governance" },
  { key: "security_risk", label: "Security risk" },
  { key: "dependency_risk", label: "Dependency risk" },
  { key: "confidence", label: "Confidence" },
  { key: "failure_state", label: "Failure state" },
  { key: "safety_cap", label: "Safety cap" },
];
</script>
