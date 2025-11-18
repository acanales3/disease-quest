<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    /** When true, constrains width and enables horizontal scrolling */
    enableScroll?: boolean;
  }>(),
  {
    enableScroll: true,
  }
);
</script>

<template>
  <div
    data-slot="table-container"
    :class="cn(
      'relative w-full',
      props.enableScroll ? 'overflow-x-auto' : 'overflow-visible'
    )"
  >
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-sm', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
