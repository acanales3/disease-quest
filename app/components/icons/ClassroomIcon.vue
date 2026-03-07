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
        d="M4.8 14.8 C4.8 13.1 5.9 12.2 7.5 12.2 C9.1 12.2 10.2 13.1 10.2 14.8Z"
        fill="currentColor"
      />

      <!-- right person -->
      <circle cx="16.5" cy="9" r="1.35" fill="currentColor" />
      <path
        d="M13.8 14.8 C13.8 13.1 14.9 12.2 16.5 12.2 C18.1 12.2 19.2 13.1 19.2 14.8Z"
        fill="currentColor"
      />

      <!-- centre person (on top, slightly larger) -->
      <circle cx="12" cy="7.6" r="1.7" fill="currentColor" />
      <path
        d="M8.7 14.8 C8.7 12.8 10.0 11.7 12 11.7 C14.0 11.7 15.3 12.8 15.3 14.8Z"
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
