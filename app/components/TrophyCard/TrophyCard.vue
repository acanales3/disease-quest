<template>
  <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between gap-4 min-h-[138px] relative">
    <div class="flex items-start justify-between">
      <p class="text-[13px] font-medium text-gray-500 leading-snug">Current level</p>
      <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center shrink-0">
        <Icon :name="trophy.icon" size="18" :class="trophy.color || 'text-[#4d1979]'" />
      </div>
    </div>

    <div>
      <p class="text-[32px] font-semibold text-gray-900 tabular-nums leading-none tracking-tight">
        {{ trophy.title }}
      </p>

      <div class="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
        <span>{{ completed }} cases completed</span>
        <button
          @click="showInfo = !showInfo"
          class="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
        >
          <Icon name="mdi:information-outline" size="15" />
        </button>
      </div>
    </div>

    <!-- Info popup/modal -->
    <div
      v-if="showInfo"
      class="absolute top-full mt-2 right-0 bg-gray-100 shadow-lg rounded-lg z-50 p-3 pr-1"
    >
      <h3 class="font-bold mb-1 text-sm">Level Info</h3>
      <p class="text-xs text-gray-500">
        (Cases completed needed per level)
      </p>
      <ul class="space-y-1 text-xs">
        <li
          v-for="level in LEVELS"
          :key="level.title"
          class="flex items-center gap-2"
        >
          <Icon :name="level.icon" size="16" :class="level.color" />
          <span class="font-medium">{{ level.title }}</span>
          <span class="text-gray-500">
            ({{ level.min }} cases)
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"

// Level type
type Level = {
  min: number
  icon: string
  title: string
  color: string
}

// Trophy levels
const LEVELS: Level[] = [
  { min: 0, icon: "game-icons-sport-medal", title: "Beginner", color: "text-green-600" },
  { min: 1, icon: "game-icons-ribbon-medal", title: "Bronze", color: "text-amber-900" },
  { min: 3, icon: "game-icons-medal", title: "Silver", color: "text-gray-400" },
  { min: 5, icon: "game-icons-star-medal", title: "Gold", color: "text-yellow-500" },
  { min: 7, icon: "game-icons-trophy-cup", title: "Platinum", color: "text-cyan-400" },
  { min: 10, icon: "game-icons-diamond-trophy", title: "Diamond", color: "text-blue-600" },
  { min: 12, icon: "game-icons-laurels-trophy", title: "Master", color: "text-purple-800" },
  { min: 15, icon: "game-icons-crown", title: "Grandmaster", color: "text-pink-600" },
  { min: 20, icon: "game-icons-throne-king", title: "Legend", color: "text-red-600" },
]

// Props
const props = defineProps({
  completed: {
    type: Number,
    required: true,
  },
})

// Info popup state
const showInfo = ref(false)

// Current level computed
const trophy = computed(() => {
  const found = LEVELS.slice().reverse().find(level => props.completed >= level.min)
  const level: Level = found || LEVELS[0]
  return level
})
</script>