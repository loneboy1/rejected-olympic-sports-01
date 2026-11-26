// One-line sport writer for "Rejected Olympic Sports" (make.fun).
// Writes a single funny rejected Olympic sport (<=200 chars) to
// $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The house judge compares two lines at a time, weighing, most important
// first:
//   1. how funny the line is;
//   2. how plausible the invented event sounds (real enough to sound like
//      a broadcast);
//   3. how little it wastes (tight, quotable);
//   4. how quotable it is.
// The winner is the line a commentator would have to read with a straight
// face. The scorer below mirrors that brief in the same order. Each
// candidate carries hand-scored rubric sub-scores (funny /25, plausible
// /25, tight /25, quotable /25) scored against the brief; the program adds
// a length bonus (+3 at 110 characters or fewer, +1 at 140 or fewer) and a
// sting bonus (+2 when the final 45 characters carry the turn), then
// picks the winner by deterministic argmax: highest score, then
// shortest, then lexicographic.
//
// Every candidate is an original line written for this entry, one line,
// under 200 characters. Crowded angles the field is already flooding are
// left out entirely: queueing of any kind, napping, apologising, fitted
// sheets, ironing, sighing, password resetting, and extreme anything
// involving a cliff edge. A joke that has to be explained has already
// failed.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is one invented Olympic event, under 200 characters, written
// for this entry. The strongest lines share one shape: a formal event name
// a commentator could announce, a recognisable everyday ordeal as the
// sport, and a disqualification or medal rule as the punchline.

interface Rubric {
  funny: number; // /25 — how funny the line is
  plausible: number; // /25 — sounds like a real broadcast event
  tight: number; // /25 — tight wording, every word earning its place
  quotable: number; // /25 — quotable, repeatable out loud
}

interface Candidate {
  text: string;
  rubric: Rubric;
}

const CANDIDATES: Candidate[] = [
  // The 100m Scroll: four hours of feeds, feeling is a foul.
  {
    text: "Men's 100m Scroll: athletes scroll their feeds for four hours — the first to feel anything is disqualified.",
    rubric: { funny: 25, plausible: 25, tight: 25, quotable: 25 },
  },
  // Competitive Unsubscribing: the button moves every lap.
  {
    text: "Competitive Unsubscribing: athletes must unsubscribe from a newsletter while the button moves every lap.",
    rubric: { funny: 24, plausible: 24, tight: 24, quotable: 24 },
  },
  // Extreme CAPTCHA Solving: prove you are not a robot, forever.
  {
    text: "Extreme CAPTCHA Solving: athletes prove they are not robots by selecting every traffic light, forever.",
    rubric: { funny: 24, plausible: 24, tight: 24, quotable: 24 },
  },
  // Synchronized Airplane Mode: the first to check is disqualified.
  {
    text: "Synchronized Airplane Mode: four athletes switch their phones off; the first to check is disqualified.",
    rubric: { funny: 23, plausible: 23, tight: 24, quotable: 23 },
  },
  // Competitive Wi-Fi Password Sharing: one point lost per capital letter.
  {
    text: "Competitive Wi-Fi Password Sharing: athletes shout the password across a café; one point lost per capital letter.",
    rubric: { funny: 24, plausible: 23, tight: 22, quotable: 24 },
  },
  // Men's 400m Reply-All: apologising for replying-all is the foul.
  {
    text: "Men's 400m Reply-All: four athletes reply-all at once; the first to apologise for replying-all is disqualified.",
    rubric: { funny: 24, plausible: 23, tight: 22, quotable: 23 },
  },
  // Competitive Thermostat Negotiation: the first to touch it loses.
  {
    text: "Competitive Thermostat Negotiation: two athletes share one thermostat; the first to touch it loses.",
    rubric: { funny: 23, plausible: 24, tight: 24, quotable: 23 },
  },
  // Synchronized Umbrella Opening: points deducted per superstition broken.
  {
    text: "Synchronized Umbrella Opening: four athletes open umbrellas indoors; points deducted for every superstition broken.",
    rubric: { funny: 23, plausible: 23, tight: 22, quotable: 24 },
  },
  // Men's Marathon of Waiting on Hold: hold music is the national anthem.
  {
    text: "Men's Marathon of Waiting on Hold: athletes wait on hold for six hours; hold music is the national anthem.",
    rubric: { funny: 24, plausible: 23, tight: 23, quotable: 23 },
  },
  // Competitive Lid Finding: the gold medallist finds the lid that fits nothing.
  {
    text: "Competitive Lid Finding: athletes match lids to containers; the gold medallist finds the one lid that fits nothing.",
    rubric: { funny: 23, plausible: 24, tight: 22, quotable: 23 },
  },
  // Synchronized Elevator Silence: gold for saying nothing longest.
  {
    text: "Synchronized Elevator Silence: four strangers share a lift; gold goes to whoever says nothing longest.",
    rubric: { funny: 23, plausible: 24, tight: 24, quotable: 22 },
  },
  // Competitive Small Talk: the first to mention feelings is out.
  {
    text: "Competitive Small Talk: athletes discuss the weather for ninety minutes; the first to mention feelings is out.",
    rubric: { funny: 23, plausible: 24, tight: 23, quotable: 22 },
  },
  // Extreme Group-Chat Leaving: the first to be re-added loses.
  {
    text: "Extreme Group-Chat Leaving: athletes leave a group chat; the first to be re-added loses.",
    rubric: { funny: 23, plausible: 23, tight: 24, quotable: 23 },
  },
  // Synchronized Nodding: gold for the most convincing nod.
  {
    text: "Synchronized Nodding: four athletes nod through a meeting they do not understand; gold for the most convincing nod.",
    rubric: { funny: 23, plausible: 23, tight: 22, quotable: 23 },
  },
  // Men's 4x100m Relay of Blame: the baton is a forwarded email.
  {
    text: "Men's 4x100m Relay of Blame: athletes pass the blame; the baton is a forwarded email nobody opened.",
    rubric: { funny: 24, plausible: 23, tight: 23, quotable: 23 },
  },
  // Competitive Fridge Light Checking: is the light really off?
  {
    text: "Competitive Fridge Light Checking: athletes open the fridge to see if the light is really off when the door closes.",
    rubric: { funny: 22, plausible: 24, tight: 22, quotable: 23 },
  },
  // Extreme Voicemail Deletion: the first to listen to one is out.
  {
    text: "Extreme Voicemail Deletion: athletes delete 400 voicemails; the first to listen to one is disqualified.",
    rubric: { funny: 23, plausible: 23, tight: 23, quotable: 23 },
  },
  // Synchronized Screen Sharing: gold for hiding tabs fastest.
  {
    text: "Synchronized Screen Sharing: four athletes share their screens; gold goes to whoever hides their tabs fastest.",
    rubric: { funny: 23, plausible: 23, tight: 23, quotable: 23 },
  },
  // Men's Marathon of "Just One More Episode": the race ends at sunrise.
  {
    text: "Men's Marathon of 'Just One More Episode': athletes watch one more episode; the race ends when the sun comes up.",
    rubric: { funny: 23, plausible: 23, tight: 22, quotable: 22 },
  },
];

// The broadcast shape: a formal event name and a rule that reads like one.
const BROADCAST: string[] = [
  "men's", "women's", "competitive", "synchronized", "synchronised",
  "extreme", "gold", "disqualified", "athletes",
];

// The sting: the punchline rule must land in the final 45 characters.
const STING: string[] = [
  "is disqualified", "moves every lap", "every traffic light, forever",
  "check is disqualified", "per capital letter", "replying-all is disqualified",
  "touch it loses", "superstition broken", "national anthem",
  "fits nothing", "says nothing longest", "mention feelings is out",
  "re-added loses", "most convincing nod", "nobody opened",
  "door closes", "listen to one is disqualified", "tabs fastest",
  "sun comes up",
];

// Flooded angles: any candidate containing one is rejected outright.
const FLOODED: string[] = [
  "queue", "napping", "nap", "apologising", "apologizing", "fitted-sheet",
  "fitted sheet", "ironing", "sighing", "password reset", "cliff",
];

// ------------------------------------------------------------------- scoring
interface Scored {
  text: string;
  score: number;
}

function isValid(c: Candidate): boolean {
  const t = c.text;
  if (t.length < 1 || t.length > 200) return false;
  if (t.includes("\n") || t.includes("\r")) return false;
  const lower = t.toLowerCase();
  if (!BROADCAST.some((w) => lower.includes(w))) return false;
  if (FLOODED.some((w) => lower.includes(w))) return false;
  return true;
}

function lengthBonus(text: string): number {
  if (text.length <= 110) return 3;
  if (text.length <= 140) return 1;
  return 0;
}

function stingBonus(text: string): number {
  const tail = text.slice(-45);
  return STING.some((s) => tail.includes(s)) ? 2 : 0;
}

function score(c: Candidate): number {
  const r = c.rubric;
  return r.funny + r.plausible + r.tight + r.quotable
    + lengthBonus(c.text) + stingBonus(c.text);
}

function buildCandidates(): Scored[] {
  const out: Scored[] = [];
  for (const c of CANDIDATES) {
    if (!isValid(c)) throw new Error(`invalid candidate: ${c.text}`);
    // Rubric sub-scores must be real scores against the brief: each
    // within 0-25, and the line must clear 80/100 before bonuses, so a
    // half-hearted line can never win on length and sting alone.
    const r = c.rubric;
    for (const v of [r.funny, r.plausible, r.tight, r.quotable]) {
      if (!Number.isInteger(v) || v < 0 || v > 25) {
        throw new Error(`rubric out of range: ${c.text}`);
      }
    }
    if (r.funny + r.plausible + r.tight + r.quotable < 80) {
      throw new Error(`rubric total below floor: ${c.text}`);
    }
    out.push({ text: c.text, score: score(c) });
  }
  if (out.length === 0) throw new Error("no valid sport candidate");
  return out;
}

function pickBest(candidates: Scored[]): Scored {
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  const best = pickBest(candidates);
  if (process.env.JUDGE_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 8)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, best.text, "utf8");
  // Round-trip verification: the file must read back byte-identical.
  const back = readFileSync(outPath, "utf8");
  if (back !== best.text) {
    throw new Error("round-trip mismatch: entry.txt did not read back identical");
  }
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
