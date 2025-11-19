<template>
    <div class="flex flex-col w-full mx-auto px-4 pb-10">
        <!-- Header -->
    <div class="flex flex-col items-center w-full">
      <h1 class="text-lg font-bold pt-12">{{ caseData.title }}</h1>
    </div>
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-8">
            <!-- Content Paragraphs -->
            <div class="space-y-4 text-foreground leading-relaxed">
                <p
                    v-for="(paragraph, index) in caseData.content"
                    :key="index"
                    class="text-justify"
                >
                    {{ paragraph }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

// Mock data - replace with API call later
const caseData = ref({
    title: 'Amelia Thompson Case',
    content: [
        `On a seemingly ordinary day, enriched by the vibrant pulse of city life, 9-month-old Amelia's parents, encased in the sanctuary of their modest home, were met with alarming signs. Despite the ambient glow of health that typically surrounded their daughter, they discovered her radiating an unsettling warmth. A rectal thermometer reading revealed a fever spiking to 103°F, unresponsive to acetaminophen, marking the onset of a deepening concern. Amelia's condition, weighed of the common markers of a simple cold, propelled her family into a state of heightened anxiety. Urged by a pediatrician's advice, they navigated their way to the emergency department, a journey fraught with the weight of Amelia's sudden illness and the broader concern of their life's stability.`,

        `Amelia's mother, balancing the demands of a minimum-wage job devoid of health benefits, faced the harrowing reality of a child in distress amidst a landscape where primary care was a luxury. The reliance on telehealth recommendations and the convenience of over-the-counter medications highlighted the gaps in a system struggling to meet the needs of its most vulnerable. The backdrop of a rural setting, with its limited access to healthcare, well water usage, and reliance on a wood-burning stove were the environmental factors that could influence Amelia's condition.`,

        `The day unfolded with an air of anxiety as Amelia's mother, a 27-year-old woman embodying both the strength and worries of parenthood, found herself confronting the possibility that her daughter's condition might be more serious than a simple fever. Her intuition, honed by months of nurturing and caring for Amelia, whispered that something was amiss, a sentiment echoed by the pediatrician's urgent recommendation to seek immediate medical attention.`,

        `Amelia's medical history pointed a picture of a typically healthy infant, thriving under the watchful eyes of her devoted parents. Her diet, consisting of baby food, cereal, and iron-fortified formula, had been momentarily cast aside by her lack of appetite, an unusual deviation from her normal routine. Remarkably, her vaccinations were up to date, providing a shield against the common threats that loom over the early years of life. The family's home, free from the presence of pets and the haze of tobacco, offered a safe haven for Amelia's growth and development, further supported by a community of healthy relatives and a childcare environment shared with other young children.`,
    ],
})
</script>

<style scoped></style>
