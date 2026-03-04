<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    role="img"
    aria-hidden="true"
    style="display: block;"
    :class="iconClass"
  >
    <g transform="translate(0 2)">
      <!-- frame -->
      <rect
        x="1.5"
        y="2"
        width="21"
        height="16"
        rx="1.5"
        stroke="currentColor"
        stroke-width="1.6"
      />

      <!-- left person -->
      <circle cx="7.5" cy="9" r="1.35" fill="currentColor" />
      <path
        d="M5.2 14.8 C5.2 12.8 6.2 11.8 7.5 11.8 C8.8 11.8 9.8 12.8 9.8 14.8Z"
        fill="currentColor"
      />

      <!-- right person -->
      <circle cx="16.5" cy="9" r="1.35" fill="currentColor" />
      <path
        d="M14.2 14.8 C14.2 12.8 15.2 11.8 16.5 11.8 C17.8 11.8 18.8 12.8 18.8 14.8Z"
        fill="currentColor"
      />

      <!-- centre person (on top, slightly larger) -->
      <circle cx="12" cy="7.6" r="1.7" fill="currentColor" />
      <path
        d="M9.2 14.8 C9.2 12.2 10.4 11.0 12 11.0 C13.6 11.0 14.8 12.2 14.8 14.8Z"
        fill="currentColor"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    iconClass?: string;
  }>(),
  {
    size: 21,
    iconClass: "",
  },
);
</script>
