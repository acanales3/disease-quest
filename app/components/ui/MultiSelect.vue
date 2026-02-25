<script setup lang="ts">
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Item {
    value: string;
    label: string;
}

const props = defineProps<{
    items: Item[]
    selectionsLabel: string
    selected: Item[]
}>();

const emit = defineEmits<{ (e: 'update:selected', value: Item[]): void }>();

const selectedValues = ref<string[]>([]);

const open = ref(false)
const value = ref('')

// const selectedItem = computed(() =>
//   props.items.find(framework => framework.value === value.value),
// )

const selectedItems = computed(() => {
    return props.items.filter(item => selectedValues.value.includes(item.value))
})

const unselectedItems = computed(() => {
    return props.items.filter(item => !selectedValues.value.includes(item.value))
})

function selectItem(selectedValue: string) {
    const index = selectedValues.value.indexOf(selectedValue);

    if (index == -1) {
        // Add if not selected
        selectedValues.value.push(selectedValue)
    } else {
        selectedValues.value.splice(index, 1);
    }
    emit('update:selected', selectedItems.value)
}

watch (
    () => props.selected,
    (newVal) => { 
        selectedValues.value = newVal.map(i => i.value)
    },
    { immediate: true }
)
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-[200px] justify-between"
      >
        Select {{ props.selectionsLabel }}...
        <ChevronsUpDownIcon class="opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0">
      <Command>
        <CommandInput class="h-9" placeholder="Search for classrooms..." />
        <CommandList>
          <CommandEmpty>No {{ props.selectionsLabel }} found.</CommandEmpty>
          
          <!-- Selected Items (Top) -->
          <CommandGroup v-if="selectedItems.length" heading="Selected">
            <CommandItem
              v-for="item in selectedItems"
              :key="item.value"
              :value="item.value"
              class="cursor-pointer hover:bg-muted transition-colors"
              @select="(ev) => {
                selectItem(ev.detail.value as string)
              }"
            >
              {{ item.label }}
              <CheckIcon
                :class="cn(
                  'ml-auto',
                  value === item.value ? 'opacity-100' : 'opacity-0',
                )"
              />
            </CommandItem>
          </CommandGroup>

          <!-- Unselected Items (Bottom) -->
           <CommandGroup heading="Available">
            <CommandItem
                v-for="item in unselectedItems"
                :key="item.value"
                :value="item.value"
                class="cursor-pointer hover:bg-muted transition-colors"
                @select="(ev) => {
                selectItem(ev.detail.value as string)
              }"
              >
              {{ item.label }}
              <CheckIcon :class="cn(
                  'ml-auto',
                  value === item.value ? 'opacity-100' : 'opacity-0',
                )" />
            </CommandItem>
           </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>