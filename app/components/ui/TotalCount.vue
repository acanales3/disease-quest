<template>
  <div class="rounded-lg shadow p-4 flex flex-col items-start justify-center w-36 h-25">
    <!-- Top Row -->
    <div class="flex w-full mb-2 gap-2">
      <Icon :name="icon" size="24" class="text-purple-500" />
      <h4>{{ count }}</h4>
    </div>
    <!-- Bottom Row -->
    <div>
      <p class="text-sm text-gray-500">{{ label }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 0,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
});
</script>

<style scoped></style>
