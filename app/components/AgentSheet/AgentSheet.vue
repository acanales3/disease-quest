<script setup lang="ts">
import { Button } from '@/components/ui/button'
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
import { useCaseSession } from '@/composables/useCaseSession'

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

const { messages, loading, error, consultTutor } = useCaseSession()

const agentType = props.agent.toLowerCase() === 'mentor' ? 'tutor' : props.agent.toLowerCase()

async function handleSend(message: string) {
  if (agentType === 'tutor') {
    await consultTutor(message)
  }
}
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="default" size="lg">
       {{ agent }} Agent
      </Button>
    </SheetTrigger>
    <SheetContent :side="side" class="w-[400px] sm:w-[540px]">
      <SheetHeader>
        <SheetTitle>{{ agent }} Agent</SheetTitle>
        <SheetDescription>
          Discuss with the {{ agent }} Agent
        </SheetDescription>
      </SheetHeader>
      <div class="flex flex-1 gap-6 px-4 py-2">
        <CaseTextArea
          :agent-type="agentType as 'patient' | 'tutor' | 'evaluator'"
          :messages="messages"
          :loading="loading"
          :error-msg="error ?? ''"
          @send="handleSend"
        />
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
