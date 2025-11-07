<template>
  <div class="rounded-lg shadow-sm p-4 flex flex-col items-start justify-center w-46 h-28 bg-white">
    <!-- Top Row -->
    <div class="flex w-full mb-2 gap-2">
      <div class="flex flex-col justify-center">
        <Icon :name="icon" size="20" class="text-purple-500" />
      </div>
      <p class="text-lg font-bold">{{ count }}</p>
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
