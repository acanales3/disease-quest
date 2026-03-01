<template>
  <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between gap-4 min-h-[138px]">
    <div class="flex items-start justify-between">
      <p class="text-[13px] font-medium text-gray-500 leading-snug max-w-[120px]">{{ label }}</p>
      <div class="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center shrink-0">
        <Icon :name="icon" size="15" class="text-[#4d1979]" />
      </div>
    </div>
    <div class="flex items-end justify-between">
      <div>
        <p class="text-[32px] font-semibold text-gray-900 tabular-nums leading-none tracking-tight">
          {{ typeof count === "number" ? count.toLocaleString() : count }}
        </p>
        <p v-if="meta" class="text-[11px] text-gray-400 mt-2 leading-snug max-w-[170px] truncate">
          {{ meta }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: [Number, String],
    default: 0,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "lucide:bar-chart-3",
  },
  meta: {
    type: String,
    default: "",
  },
})
</script>
