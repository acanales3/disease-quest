<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { Case } from './columns'

interface Props {
    caseData: Case
}

const props = defineProps<Props>()

const emit = defineEmits<{
    play: [caseData: Case]
    edit: [caseData: Case]
    delete: [caseData: Case]
}>()

const handlePlay = () => {
    emit('play', props.caseData)
}

const handleEdit = () => {
    emit('edit', props.caseData)
}

const handleDelete = () => {
    emit('delete', props.caseData)
}
</script>

<!-- eventually want to make this dynmaic where the actions shown are based on the role of the user -->
<!-- for now, we will just show the same actions for all users (Play, Edit, Delete) -->
<!-- we will also need to make the actions do something by emitting events -->

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="w-8 h-8 p-0">
                <span class="sr-only">Open menu</span>
                <MoreHorizontal class="w-4 h-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handlePlay">Play</DropdownMenuItem>
            <DropdownMenuItem @click="handleEdit">Edit</DropdownMenuItem>
            <DropdownMenuItem @click="handleDelete">Delete</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
