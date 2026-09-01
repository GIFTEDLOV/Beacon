<template><div class="page-heading"><div class="eyebrow">{{ eyebrow }}</div><h1>{{ title }}</h1><p class="hero-copy">{{ copy }}</p></div></template>
<script setup>defineProps({ eyebrow: { type: String, required: true }, title: { type: String, required: true }, copy: { type: String, required: true } });</script>
