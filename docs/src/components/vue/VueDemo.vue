<!-- The text goes through Vue's own slot, exactly as in a Vue app. -->
<script setup lang="ts">
import { WordHug } from "wordhug/vue";

defineProps<{ text: string }>();
</script>

<template>
  <WordHug>{{ text }}</WordHug>
</template>
