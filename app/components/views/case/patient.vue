<template>
  <div>
    <h1>Case Patient Page</h1>
    <BackwardButton route="/case/mentor"></BackwardButton>
    <ForwardButton route="/case/evaluation"></ForwardButton>
  </div>
</template>

<script setup>
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
</script>

<style scoped></style>
