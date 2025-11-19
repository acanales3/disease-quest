<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { PropType } from 'vue'
import CaseTextArea from '@/components/CaseTextArea/text-area.vue'

const props = defineProps({
  agent: {
    type: String,
    required: true,
  },
  side: {
    type: String as PropType<'left' | 'right' | 'top' | 'bottom'>,
    default: 'right',
    validator: (value: string) => ['left', 'right', 'top', 'bottom'].includes(value)
  }
})
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="default" size="lg">
       {{ agent }} Agent
      </Button>
    </SheetTrigger>
    <SheetContent :side=side>
      <SheetHeader>
        <SheetTitle>{{ agent }} Agent</SheetTitle>
        <SheetDescription>
          Discuss with the {{ agent }} Agent
        </SheetDescription>
      </SheetHeader>
      <div class="flex flex-1 gap-6 px-4 py-2">
        <CaseTextArea />
      </div>
      <SheetFooter>
        <SheetClose as-child>
          <Button variant="default"> 
            Close
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
