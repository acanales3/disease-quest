<template>
  <div class="space-y-10">
    <!-- CLASSROOM DETAILS -->
    <div class="bg-white shadow rounded p-8 text-center">
      <!-- Title -->
      <h1 class="text-2xl font-bold mb-6 text-gray-900">
        {{ classroom.name }}
      </h1>

      <!-- Details grid -->
      <div class="grid grid-cols-4 gap-y-6 gap-x-10 text-center max-w-6xl mx-auto text-gray-700">
        <!-- Column 1: Code & Section -->
        <div>
          <div class="font-semibold">Code</div>
          <div>{{ classroom.code }}</div>
          <div class="font-semibold mt-2">Section</div>
          <div>{{ classroom.section }}</div>
        </div>

        <!-- Column 2: Instructor & School -->
        <div>
          <div class="font-semibold">Instructor</div>
          <div>{{ classroom.instructor }}</div>
          <div class="font-semibold mt-2">School</div>
          <div>{{ classroom.school }}</div>
        </div>

        <!-- Column 3: Start & End Date -->
        <div>
          <div class="font-semibold">Start Date</div>
          <div>{{ classroom.startDate }}</div>
          <div class="font-semibold mt-2">End Date</div>
          <div>{{ classroom.endDate }}</div>
        </div>

        <!-- Column 4: Status -->
        <div>
          <div class="font-semibold">Status</div>
          <div>
            <span
              :class="{
                'text-green-600': classroom.status === 'active',
                'text-red-600': classroom.status === 'inactive',
              }"
            >
              {{ classroom.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- CASES TABLE -->

    <!-- STUDENTS TABLE -->
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

/* GET CLASSROOM DATA */
const route = useRoute();
let classroom = null;

// If classroom data passed via query
if (typeof route.query.data === 'string') {
  classroom = JSON.parse(route.query.data);
}


</script>

<style scoped></style>
