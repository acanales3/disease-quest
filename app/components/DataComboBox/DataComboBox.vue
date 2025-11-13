<template>
  <Combobox by="id">  <!-- Changed from 'label' to 'id' for more reliable comparison -->
    <ComboboxAnchor>
      <div class="relative w-full max-w-sm items-center">
        <ComboboxInput 
          class="w-full" 
          :display-value="(val: any) => val?.name ?? ''" 
          :placeholder="`Select ${props.label.toLowerCase()}...`" 
        />
      </div>
    </ComboboxAnchor>

    <ComboboxList>
      <ComboboxEmpty>
        No {{ label.toLowerCase() }}s found.
      </ComboboxEmpty>

      <ComboboxGroup>
        <ComboboxItem
          v-for="item in items"
          :key="item.id" 
          :value="item"
        >
          {{ item.name }}

          <ComboboxItemIndicator>
            <Check class="ml-auto h-4 w-4" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>

<script setup lang="ts">
import { Check } from "lucide-vue-next"
import { 
  Combobox, 
  ComboboxAnchor, 
  ComboboxEmpty, 
  ComboboxGroup, 
  ComboboxInput, 
  ComboboxItem, 
  ComboboxItemIndicator, 
  ComboboxList 
} from "@/components/ui/combobox"
import { computed } from "vue"

const props = defineProps<{
  label: string
  data: Array<{ id: number | string, name: string, [key: string]: any }>
}>()

// Use a computed property to ensure we always have an array
const items = computed(() => Array.isArray(props.data) ? props.data : [])
</script>

<style scoped>
/* Add any custom styles here */
</style>