<script setup lang="ts">
import { ref, computed } from "vue";
import { useSupabaseClient } from "#imports";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Icon } from "#components";

type DialogType = "student" | "instructor" | "administrator";
type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const props = defineProps<{
  dialogType: DialogType;
}>();

const supabase = useSupabaseClient();

const roleMap: Record<DialogType, Role> = {
  student: "STUDENT",
  instructor: "INSTRUCTOR",
  administrator: "ADMIN",
};

const config: Record<
  DialogType,
  { title: string; description: string; defaultEmail: string }
> = {
  student: {
    title: "Students",
    description:
      "Enter the email addresses of the students you would like to invite to DiseaseQuest.",
    defaultEmail: "student@tcu.edu",
  },
  instructor: {
    title: "Instructors",
    description:
      "Enter the email addresses of the instructors you would like to invite to DiseaseQuest.",
    defaultEmail: "instructor@tcu.edu",
  },
  administrator: {
    title: "Administrators",
    description:
      "Enter the email addresses of the administrators you would like to invite to DiseaseQuest.",
    defaultEmail: "admin@tcu.edu",
  },
};

const { title, description, defaultEmail } = config[props.dialogType];

// ---- Multi-email chips input ----
const emailInput = ref("");
const emails = ref<string[]>([]);

// Track invalid reasons per email
type InvalidReason = "format" | "edu";
const invalidReasons = ref<Map<string, InvalidReason>>(new Map());

const sending = ref(false);
const error = ref("");
const lastResult = ref<any>(null);

// progress (client-side sequential sends)
const processedCount = ref(0);

function isValidEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function endsWithEdu(email: string) {
  return email.toLowerCase().endsWith(".edu");
}

function validateEmail(
  email: string,
): { ok: true } | { ok: false; reason: InvalidReason } {
  if (!isValidEmailFormat(email)) return { ok: false, reason: "format" };
  if (!endsWithEdu(email)) return { ok: false, reason: "edu" };
  return { ok: true };
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/g) // whitespace, commas, semicolons
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function addEmails(raw: string) {
  const parsed = parseEmails(raw);
  if (parsed.length === 0) return;

  const existing = new Set(emails.value);
  for (const e of parsed) {
    if (existing.has(e)) continue;
    emails.value.push(e);
    existing.add(e);

    const v = validateEmail(e);
    if (!v.ok) invalidReasons.value.set(e, v.reason);
    else invalidReasons.value.delete(e);
  }
}

function commitInput() {
  if (!emailInput.value.trim()) return;
  addEmails(emailInput.value);
  emailInput.value = "";
}

function removeEmail(e: string) {
  emails.value = emails.value.filter((x) => x !== e);
  invalidReasons.value.delete(e);
}

function onKeydown(ev: KeyboardEvent) {
  // Gmail/Outlook-like commit keys
  if (["Enter", "Tab", ",", " "].includes(ev.key)) {
    if (emailInput.value.trim()) {
      ev.preventDefault();
      commitInput();
    }
  }

  // Backspace removes last chip if input is empty
  if (ev.key === "Backspace" && !emailInput.value) {
    const last = emails.value[emails.value.length - 1];
    if (last) removeEmail(last);
  }
}

function onPaste(ev: ClipboardEvent) {
  const text = ev.clipboardData?.getData("text") ?? "";
  if (!text) return;

  const parsed = parseEmails(text);
  if (parsed.length >= 2) {
    ev.preventDefault();
    addEmails(text);
  }
}

const invalidCount = computed(() => invalidReasons.value.size);
const validCount = computed(() => emails.value.length - invalidCount.value);

const invalidFormatCount = computed(() => {
  let n = 0;
  for (const [, reason] of invalidReasons.value) if (reason === "format") n++;
  return n;
});

const invalidEduCount = computed(() => {
  let n = 0;
  for (const [, reason] of invalidReasons.value) if (reason === "edu") n++;
  return n;
});

const hasInvalid = computed(() => invalidCount.value > 0);
const canSend = computed(
  () => !sending.value && emails.value.length > 0 && !hasInvalid.value,
);

const totalToSend = computed(() => emails.value.length);

function invalidTooltipFor(email: string) {
  const reason = invalidReasons.value.get(email);
  if (reason === "format") return "Invalid email format";
  if (reason === "edu") return "Email must end in .edu";
  return email;
}

async function sendInvite() {
  error.value = "";
  lastResult.value = null;
  processedCount.value = 0;

  // commit any text currently typed
  commitInput();

  if (emails.value.length === 0) {
    error.value = "Please enter at least one email.";
    return;
  }

  if (hasInvalid.value) {
    error.value = "Please remove or fix invalid email(s) before sending.";
    return;
  }

  sending.value = true;

  // CLIENT-SIDE SEQUENTIAL:
  // Call the edge function once per email, in order.
  const results: Array<{
    email: string;
    ok: boolean;
    error?: string;
    invitationId?: string;
    acceptLink?: string;
  }> = [];

  for (const email of emails.value) {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "send-invitation",
        {
          body: {
            email, // single email per call
            role: roleMap[props.dialogType],
          },
        },
      );

      if (fnErr) {
        results.push({ email, ok: false, error: fnErr.message });
      } else if (data?.results?.[0]) {
        // Your function returns { ok:true, results:[...] }
        results.push(data.results[0]);
      } else {
        // fallback if shape changes
        results.push({ email, ok: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ email, ok: false, error: msg });
    } finally {
      processedCount.value += 1;
    }
  }

  sending.value = false;
  lastResult.value = { ok: true, results };
  console.log("Invite results:", lastResult.value);
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button
        variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="ic:baseline-person-add" size="24" />
          <span class="text-sm">Invite {{ title }}</span>
        </div>
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Invite {{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-start gap-4">
          <Label :for="`${dialogType}-email`" class="text-right pt-2"
            >Email</Label
          >

          <div class="col-span-3">
            <!-- chips container -->
            <div
              class="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-ring"
            >
              <!-- chips -->
              <div
                v-for="e in emails"
                :key="e"
                class="group inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border transition-colors"
                :class="
                  invalidReasons.has(e)
                    ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100'
                "
                :title="invalidTooltipFor(e)"
              >
                <span class="max-w-[260px] truncate">{{ e }}</span>
                <button
                  type="button"
                  class="opacity-70 group-hover:opacity-100 hover:text-red-700 transition-colors"
                  aria-label="Remove email"
                  @click="removeEmail(e)"
                >
                  ✕
                </button>
              </div>

              <!-- input -->
              <input
                :id="`${dialogType}-email`"
                v-model="emailInput"
                class="flex-1 min-w-[180px] outline-none bg-transparent"
                :placeholder="emails.length ? '' : defaultEmail"
                @keydown="onKeydown"
                @blur="commitInput"
                @paste="onPaste"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <!-- status area -->
            <div v-if="emails.length" class="mt-2 text-xs">
              <p class="text-muted-foreground">
                {{ validCount }} valid · {{ invalidCount }} invalid
              </p>

              <p v-if="invalidFormatCount" class="text-red-600 mt-1">
                {{ invalidFormatCount }} not valid due to improper email format
              </p>

              <p v-if="invalidEduCount" class="text-red-600">
                {{ invalidEduCount }} not valid due to not being .edu
              </p>
            </div>
          </div>
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {{ error }}
        </div>

        <div
          v-if="sending && totalToSend"
          class="text-xs text-muted-foreground"
        >
          Sending {{ processedCount }}/{{ totalToSend }}…
        </div>

        <div
          v-if="lastResult?.results"
          class="text-sm bg-green-50 text-green-800 p-3 rounded-md"
        >
          <p class="font-medium mb-1">Invite results</p>
          <ul class="list-disc ml-5 space-y-1">
            <li
              v-for="r in lastResult.results"
              :key="r.email"
              class="wrap-break-word"
            >
              <span class="font-mono">{{ r.email }}</span>
              <span v-if="r.ok"> SENT</span>
              <span v-else> FAILED({{ r.error }})</span>
            </li>
          </ul>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" :disabled="!canSend" @click="sendInvite">
          {{
            sending
              ? `Sending ${processedCount}/${totalToSend}...`
              : "Send registration email"
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
