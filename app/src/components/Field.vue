<template>
  <label class="field"><span class="field-label">{{ label }}<span v-if="required"> *</span></span>
    <textarea v-if="type === 'textarea'" class="field-input field-textarea" :value="modelValue" :placeholder="placeholder" :required="required" @input="$emit('update:modelValue', $event.target.value)" />
    <input v-else class="field-input" :type="type" :value="modelValue" :placeholder="placeholder" :required="required" @input="$emit('update:modelValue', $event.target.value)" />
  </label>
</template>
<script setup>
defineProps({ modelValue: { type: String, default: "" }, label: { type: String, required: true }, type: { type: String, default: "text" }, placeholder: { type: String, default: "" }, required: Boolean });
defineEmits(["update:modelValue"]);
</script>
