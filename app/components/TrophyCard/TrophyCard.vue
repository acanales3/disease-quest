<template>
  <div class="rounded-lg shadow-sm p-4 flex flex-col items-start justify-center w-46 h-28 bg-white">
    <div class="flex w-full mb-2 gap-2">
      <Icon :name="trophy.icon" size="40" class="text-[#AF67F0]" />
      <p class="text-lg font-bold">{{ trophy.title }}</p>
    </div>

    <p class="text-sm text-gray-500">
      {{ completed }} cases completed
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const LEVELS = [
  { min: 0, icon: "game-icons-sport-medal", title: "Beginner" },
  { min: 1, icon: "game-icons-ribbon-medal", title: "Bronze" },
  { min: 3, icon: "game-icons-medal", title: "Silver" },
  { min: 5, icon: "game-icons-star-medal", title: "Gold" },
  { min: 7, icon: "game-icons-trophy-cup", title: "Platinum" },
  { min: 10, icon: "game-icons-diamond-trophy", title: "Diamond" },
  { min: 12, icon: "game-icons-laurels-trophy", title: "Master" },
  { min: 15, icon: "game-icons-crown", title: "Grandmaster" },
  { min: 20, icon: "game-icons-throne-king", title: "Legend" },
]

const props = defineProps({
  completed: {
    type: Number,
    required: true,
  },
})

const trophy = computed(() => {
  return LEVELS.slice().reverse().find(l => props.completed >= l.min)!
})
</script>