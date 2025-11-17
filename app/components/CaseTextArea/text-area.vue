<template>
  <div class="w-full max-w-2xl mx-auto space-y-4">
    <!-- Output / Response Box -->
    <div class="border rounded-lg p-4 min-h-[200px] bg-gray-50">
      <p v-if="response">{{ response }}</p>
      <p v-else class="text-muted-foreground italic">Responses will appear here...</p>
    </div>

    <!-- Input Area -->
    <Textarea
      v-model="userMessage"
      placeholder="Ask anything..."
      class="min-h-[100px]"
    />

    <!-- Submit Button -->
    <button
      @click="sendMessage"
      class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
    >
      Send
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Textarea } from '@/components/ui/textarea'

const userMessage = ref('')
const response = ref('')

const sendMessage = () => {
  if (!userMessage.value.trim()) return

  // Example output behavior. Replace with actual logic/API call when we have it
  response.value = `You said: ${userMessage.value}`

  userMessage.value = ''
}
</script>
