<template>
  <div
    class="bg-white border border-gray-200 rounded-xl flex flex-col justify-between"
    :class="compact ? 'p-4 gap-3 min-h-[112px]' : 'p-5 gap-4 min-h-[138px]'"
  >
    <div class="flex items-start justify-between">
      <p
        class="font-medium text-gray-500 leading-snug"
        :class="[
          compact ? 'text-[12px]' : 'text-[13px]',
          showIcon ? 'max-w-[120px]' : 'max-w-[170px]'
        ]"
      >
        {{ label }}
      </p>
      <div
        v-if="showIcon"
        class="rounded-lg bg-[#f5f3ff] flex items-center justify-center shrink-0"
        :class="compact ? 'w-7 h-7' : 'w-8 h-8'"
      >
        <Icon :name="icon" :size="compact ? 13 : 15" class="text-[#4d1979]" />
      </div>
    </div>
    <div class="flex items-end justify-between">
      <div>
        <p
          class="font-semibold text-gray-900 tabular-nums leading-none tracking-tight"
          :class="compact ? 'text-[24px]' : 'text-[32px]'"
        >
          {{ typeof count === "number" ? count.toLocaleString() : count }}
        </p>
        <p
          v-if="meta"
          class="text-gray-400 leading-snug max-w-[170px] truncate"
          :class="compact ? 'text-[10px] mt-1.5' : 'text-[11px] mt-2'"
        >
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
  showIcon: {
    type: Boolean,
    default: true,
  },
  meta: {
    type: String,
    default: "",
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>
