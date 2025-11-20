<template>
  <div class="space-y-10">
    <!-- CLASSROOM DETAILS -->
    <div v-if="classroom" class="bg-white shadow rounded p-8 text-center">
      <!-- Title -->
      <h1 class="text-2xl font-bold mb-6 text-gray-900">
        {{ classroom.name }}
      </h1>

      <!-- Details grid -->
      <div class="grid grid-cols-3 gap-y-6 gap-x-10 text-center max-w-6xl mx-auto text-gray-700">
        <!-- Column 1: Code & Section -->
        <div>
          <div class="font-semibold">Code</div>
          <div>{{ classroom.code }}</div>
          <div class="font-semibold mt-2">Section</div>
          <div>{{ classroom.section }}</div>
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

    <div v-else class="text-center text-gray-500">
      Classroom not found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { classrooms, type Classroom } from "~/assets/interface/Classroom";

const route = useRoute();

// Get classroomId from route params (as number)
const classroomId = Number(route.params.classroomId);

// Find the classroom in mock data
const classroom: Classroom | undefined = classrooms.find(
  c => c.id === classroomId
);
</script>

<style scoped></style>
