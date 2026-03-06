<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowUpIcon } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  route: string;
  disabled?: boolean;
}>();

const router = useRouter();

function go() {
  if (props.disabled) return;
  router.push(props.route);
}
</script>

<template>
  <Button
    variant="outline"
    size="icon"
    aria-label="Forward"
    :disabled="props.disabled"
    @click="go"
  >
    <ArrowUpIcon class="rotate-90" />
  </Button>
</template>
