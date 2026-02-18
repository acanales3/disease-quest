<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowUpIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  route?: string; // optional now
}>();

const router = useRouter();

function go() {
  // If route is "back" or not provided → go to previous page
  if (!props.route || props.route === "back") {
    router.back();
  } else {
    router.push(props.route);
  }
}
</script>

<template>
  <Button variant="outline" size="icon" aria-label="Back" @click="go">
    <ArrowUpIcon class="-rotate-90" />
  </Button>
</template>
