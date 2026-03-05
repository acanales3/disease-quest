<template>
  <div class="w-full min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
    <div
      class="absolute inset-0 z-0"
      style="background: radial-gradient(125% 125% at 50% 10%, #fff 50%, #4d1979 100%)"
    />

    <div class="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      <img src="/dq-logo.svg" alt="DiseaseQuest" class="h-20 w-auto"/>
      <span class="h-7 w-px bg-gray-300" />
      <img src="/tcu-logo.png" alt="TCU Burnett School of Medicine" class="h-32 w-auto" />
    </div>

    <div class="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-6">
      <h1 class="text-5xl md:text-7xl tracking-tighter font-normal text-gray-900 text-center leading-[1.15]">
        <span class="block">Case-based learning</span>
        <span class="block">made <span class="relative inline-grid text-left"><span class="invisible col-start-1 row-start-1 font-semibold">interactive</span><span
              class="col-start-1 row-start-1 font-semibold text-[#4d1979] text-left"
            >{{ displayedText }}<span class="inline-block w-[3px] h-[0.85em] bg-[#4d1979] align-baseline ml-0.5 animate-blink" /></span></span></span>
      </h1>

      <p class="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-xl">
        Practice diagnosis, treatment planning, and clinical decision-making
        through realistic, interactive patient simulations.
      </p>

      <div class="flex flex-row gap-3 pt-2">
        <Button size="lg" variant="outline" @click="router.push('/login')">
          Login
        </Button>
        <Button
          size="lg"
          class="bg-[#4d1979] hover:bg-[#3d1361] text-white"
          @click="router.push('/register')"
        >
          Register
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";

definePageMeta({
  layout: false,
});

const router = useRouter();
const supabase = useSupabaseClient();

const titles = ["interactive", "engaging", "intuitive", "effective", "smarter"];
const displayedText = ref("");

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function tick() {
  const currentWord = titles[wordIndex];

  if (!isDeleting) {
    charIndex++;
    displayedText.value = currentWord.slice(0, charIndex);

    if (charIndex === currentWord.length) {
      timeoutId = setTimeout(() => {
        isDeleting = true;
        tick();
      }, 1500);
      return;
    }
    timeoutId = setTimeout(tick, 80);
  } else {
    charIndex--;
    displayedText.value = currentWord.slice(0, charIndex);

    if (charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % titles.length;
      timeoutId = setTimeout(tick, 300);
      return;
    }
    timeoutId = setTimeout(tick, 40);
  }
}

onMounted(async () => {
  tick();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const { getUserProfile } = useUsers();
    const { data: profile } = await getUserProfile(session.user.id);

    if (profile?.role) {
      router.push(`/${profile.role.toLowerCase()}/dashboard`);
    }
  }
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.animate-blink {
  animation: blink 0.8s step-end infinite;
}
.brand-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  letter-spacing: -0.03em;
}
</style>
