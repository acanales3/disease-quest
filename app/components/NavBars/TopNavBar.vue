<template>
    <header class=" p-4 flex justify-end gap-4">
        <NuxtLink to="/settings">
            <div class="bg-gray-200 rounded-full p-2 flex items-center justify-center hover:bg-gray-300">
                <Icon name="mdi-light:settings" class="text-xl" />
            </div>
        </NuxtLink>
        <NuxtLink to="/login">
            <div class="bg-gray-200 rounded-full p-2 flex items-center justify-center hover:bg-gray-300">
                <Icon name="mdi:logout" class="text-xl" />
            </div>
        </NuxtLink>
    </header>

</template>

<script setup>

</script>

<style  scoped>

</style>
