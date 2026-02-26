import type { SupabaseClient } from "@supabase/supabase-js";

const adjectives = [
  "Swift",
  "Brave",
  "Clever",
  "Mighty",
  "Noble",
  "Daring",
  "Witty",
  "Gentle",
  "Bold",
  "Keen",
  "Lucky",
  "Calm",
  "Bright",
  "Fierce",
  "Jolly",
  "Silent",
  "Golden",
  "Cosmic",
  "Steady",
  "Agile",
  "Curious",
  "Radiant",
  "Stealthy",
  "Fearless",
  "Wandering",
  "Speedy",
  "Lively",
  "Proud",
  "Sneaky",
  "Charming",
  "Humble",
  "Nimble",
  "Crystal",
  "Crimson",
  "Emerald",
  "Frosty",
  "Rustic",
  "Shadow",
  "Stormy",
  "Amber",
];

const animals = [
  "Falcon",
  "Tiger",
  "Wolf",
  "Eagle",
  "Dolphin",
  "Panther",
  "Fox",
  "Hawk",
  "Bear",
  "Otter",
  "Raven",
  "Lynx",
  "Owl",
  "Stag",
  "Heron",
  "Badger",
  "Cobra",
  "Jaguar",
  "Puma",
  "Crane",
  "Bison",
  "Shark",
  "Viper",
  "Moose",
  "Finch",
  "Gecko",
  "Ibis",
  "Koala",
  "Lemur",
  "Newt",
  "Panda",
  "Robin",
  "Seal",
  "Wren",
  "Hare",
  "Mink",
  "Toucan",
  "Osprey",
  "Pelican",
  "Sparrow",
];

function generateCandidate(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal}`;
}

const MAX_ATTEMPTS = 20;

/**
 * Generates a nickname that doesn't already exist in the students table.
 * After MAX_ATTEMPTS pure adjective+animal tries, appends a random number
 * to guarantee uniqueness.
 */
export async function generateUniqueNickname(
  client: SupabaseClient,
): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = generateCandidate();

    const { data } = await (client as any)
      .from("students")
      .select("user_id")
      .eq("nickname", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  const fallback = `${generateCandidate()} ${Math.floor(Math.random() * 9000) + 1000}`;
  return fallback;
}
