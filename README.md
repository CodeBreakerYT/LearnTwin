# LearnTwin

**An AI Learning Twin for SDG 4: Quality Education.**
LearnTwin builds a continuously updated model of *how one student learns*, then changes what it teaches, how it explains and how hard it asks, based on that model.

> The character is not the intelligence. The Learning Twin is.

---

## Problem

Most learning products give every student the same explanation at the same difficulty. When a student gets an answer wrong, they are told it is wrong. The *reason* (a hidden misconception such as “subtracts the coefficient instead of dividing”) goes unnoticed, so the same mistake comes back.

## Solution

LearnTwin closes the loop between a student's answers and the next learning activity:

```
Student → learns with an AI character → answers a structured question
   → AI analyses the answer and reasoning → misconception detected
   → Learning Twin updated → next activity adapts → student learns
   → the Twin becomes more accurate
```

It is deliberately **not a chatbot**. The student answers structured questions, the AI diagnoses the *why* behind each answer, and every result visibly changes the learner model.

## Why SDG 4?

SDG 4 calls for inclusive and equitable quality education and lifelong learning. Equity is not only about access to content; it is also about whether the learning experience fits the learner. LearnTwin explores personalised, equitable learning by adapting the experience around individual learning needs instead of treating every learner identically, and by making each adaptation explainable (“why did the Twin choose this activity?”). It is a prototype on a small maths curriculum, and this project makes **no claims about improved educational outcomes**.

## Key features

| Area | What it does |
| --- | --- |
| **Learning Twin** | Persistent learner profile: mastery, confidence, attempts, active/resolved misconceptions, error types, response time, preferred explanation style, difficulty. Never static: every answer changes it. |
| **Misconception analysis** | Groq analyses the answer against the question, the answer key and the learner's history and returns validated structured JSON. |
| **Adaptive engine** | Combines correctness, recent performance, mastery, confidence, response time, repeated misconceptions and previous activities to pick the next concept, difficulty and strategy. |
| **Remediation loop** | A repeated misconception does *not* just produce another question: detect → switch teaching strategy → explain → simpler example → guided question → re-test. |
| **Knowledge graph** | Interactive React Flow graph with mastered / developing / weak / locked states, prerequisites, live change badges and a concept detail panel. |
| **AI characters** | Nova (patient mentor), Byte (playful problem solver), Atlas (explorer), rendered as animated VRM 3D avatars. The Twin can recommend the best fit. |
| **Analytics** | Mastery over time, accuracy, difficulty progression, concepts improved, misconceptions resolved, recent sessions. |
| **Gamification** | XP, day streak, levels, milestones and concept unlocks, kept secondary to the learning loop. |
| **Demo mode** | The whole flow works with no API key, using deterministic analysis. |

## Subjects and mentors

Each mentor teaches their own subject, and the Learning Twin keeps one model across all of them:

| Mentor | Subject | Skills taught (each with a spoken lesson, a 3D scene and a check) |
| --- | --- | --- |
| Nova | Mathematics | Fractions, percentages, ratios, linear equations, functions, word problems, geometry |
| Byte | Programming | Variables, if/else, loops, lists |
| Atlas | Geography | Continents and oceans, latitude and longitude, map scale, time zones |

Adding a subject means adding concepts, lesson beats, a scene builder (`lib/visuals*.ts`), questions and misconceptions.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page with an animated Twin preview |
| `/learn` | The main experience: character, question, analysis, reveal, adaptation |
| `/twin` | Learning Twin dashboard: mastery, profile, knowledge graph, patterns, AI insight |
| `/progress` | Learning analytics |
| `/characters` | Choose (or accept the Twin's recommendation for) your tutor |

## Architecture

```
src/
  app/                    Next.js App Router pages + API routes
    api/analyze           Misconception analysis        (server → Groq)
    api/tutor             Character voice               (server → Groq)
    api/activity          Personalised scaffolding      (server → Groq)
    api/status            DEMO MODE / model info (never returns the key)
  components/             UI: character stage, VRM avatar, knowledge graph, charts…
  lib/
    ai/
      groq.ts             Server-only Groq client, DEMO MODE detection
      analyzeAnswer.ts    Analysis + validation + reconciliation with the answer key
      tutor.ts            Character-voiced feedback
      generateActivity.ts Structured activity scaffolding
      updateLearningTwin.ts Applies a validated analysis to the Twin
      prompts.ts          Dedicated system prompts
      schemas.ts          Zod schemas for every request and model response
      mock.ts             Deterministic analyser used in DEMO MODE
    engine.ts             The adaptive learning engine (pure, deterministic)
    curriculum.ts, questions.ts, misconceptions.ts   The maths curriculum
    seed.ts               Demo learner with realistic history (and a blank profile)
    firebase.ts, repo/    Firebase init; Firestore + localStorage repositories
firestore.rules           Firestore security rules
assets → public/models    VRM character models
```

### How the Learning Twin works

The model **proposes**; the engine **decides**.

1. **Analyse.** The student's answer goes to `/api/analyze` together with a compact summary of the Twin (mastery per concept, recent mistakes, misconception counts). Groq returns a diagnosis as JSON: `isCorrect`, `confidence`, `misconception`, `errorType`, `explanation`, `recommendedDifficulty`, `recommendedTeachingStrategy`, `nextActivity`.
2. **Validate.** The response is parsed with Zod, and reconciled with what the server can verify: correctness always comes from the question's answer key, and misconception ids must exist in the catalog for that concept. Malformed output is discarded and replaced by the deterministic analyser.
3. **Update the Twin** (`lib/engine.ts`). Mastery moves with a learning rate that depends on confidence and question difficulty; confidence reflects attempts and consistency; the misconception log, error-type counts, response-time model, XP, streak and achievements are updated.
4. **Adapt.** The next activity is chosen from multiple signals (correctness, recent accuracy, mastery, confidence, response time, active misconceptions, previous activities). Difficulty moves at most one level at a time, and a slow response blocks a step up. If the *same* misconception appears repeatedly, the engine starts a remediation plan instead of serving another question: switch strategy → explanation → simpler worked example → guided question → un-scaffolded re-test. A passed re-test resolves the misconception and updates which explanation style works best for this learner.
5. **Explain.** The UI shows “Why the Twin chose this activity”, the list of Twin changes, and the new insight, so a learner (or a judge) can see the model changing.

### Groq integration

- All Groq calls run in Next.js route handlers via `lib/ai/groq.ts`. `GROQ_API_KEY` is read only on the server (`import "server-only"`) and is never sent to the browser.
- Groq is used for three things: **misconception analysis** (JSON mode), **character-voiced feedback**, and **personalised hints / expected-skill text** for the next question.
- Questions and answer keys come from a curated bank, so grading is trustworthy. The model does not grade answers on its own, and a hint that leaks the final answer is rejected.
- Requests are validated with Zod, size-limited, and time-limited (7–9 s). Any failure falls back to DEMO MODE for that request, silently, so users never see a raw API error.
- The model is configurable through `GROQ_MODEL` (default `openai/gpt-oss-120b`).

### Demo mode

DEMO MODE activates when any of these is true:

- `NEXT_PUBLIC_DEMO_MODE=true`
- `GROQ_API_KEY` is empty
- Groq is unreachable, rate-limited or returns invalid output (per request)

A small **DEMO MODE** badge appears in the header. In demo mode the analyser is deterministic: it recognises the specific wrong answers each question is designed to expose (for example `x = 12` for `3x + 4 = 19` means the coefficient was subtracted instead of divided) and otherwise falls back on the learner's known history. The Learning Twin, adaptive engine, knowledge graph and remediation loop are **identical** in both modes; only the diagnosis text and character voice differ.

## Voice

`/learn` is a spoken, animated conversation. The character reads each question aloud (mouth synced to the audio), listens for your spoken answer, reacts, and moves on hands-free; typing or tapping always works too.

- **Speaking:** Groq text-to-speech (`canopylabs/orpheus-v1-english`) through `/api/tts`; the org admin must accept the model terms once in the Groq console. Until then the browser's built-in voices are used automatically.
- **Listening:** Whisper (`whisper-large-v3-turbo`) through `/api/stt`, with silence detection; falls back to the browser's SpeechRecognition.
- Spoken answers such as "x equals twelve" or "three over four" are converted to numbers before analysis.

## Tech stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS 4 · Framer Motion · React Flow (`@xyflow/react`) · Recharts · three.js + `@pixiv/three-vrm` (VRM characters) · Lucide icons · Zod · Firebase Auth + Firestore · Groq API.

## Setup

Requirements: Node.js 20+.

```bash
cd proj
npm install
cp .env.example .env.local     # optional: add keys, otherwise it runs in DEMO MODE
npm run dev
```

Open http://localhost:3000. `npm run dev` and `npm run build` first copy the VRM models from `../assets` into `public/models` (`scripts/sync-assets.mjs`).

Production build:

```bash
npm run build && npm start
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | no | Enables live Groq inference. Server-side only. |
| `GROQ_MODEL` | no | Groq model id. Defaults to `openai/gpt-oss-120b`. |
| `NEXT_PUBLIC_DEMO_MODE` | no | `true` forces deterministic demo responses. |

### Accounts and saving (Firebase)

Learners can sign in with email and password or Google, or continue as a guest. Signed-in learners' Learning Twin is stored in Firestore at `users/{uid}`; guests use the browser's localStorage, and guest progress is carried over on first sign-in. Only learning state is stored.

One-time Firebase setup:

1. Authentication: enable the **Email/Password** and **Google** providers.
2. Firestore: create a database and publish the rules in `firestore.rules` (each user can only read and write their own document).
3. Authentication → Settings → **Authorized domains**: add your deployed domain (for example `your-app.vercel.app`) so Google sign-in works there.

The Firebase web config is read from `NEXT_PUBLIC_FIREBASE_*` environment variables (nothing is hardcoded). Without them the app runs as guest-only. Restrict the web API key in Google Cloud Console (Credentials) to your site's domains and to the Identity Toolkit and Firestore APIs.

## Deploying (Vercel)

1. Push this folder (including `public/models`, the VRM characters) to GitHub and import it in Vercel. Framework: Next.js.
2. Add environment variables: `GROQ_API_KEY` (never prefixed with `NEXT_PUBLIC_`) and the six `NEXT_PUBLIC_FIREBASE_*` values. `netlify.toml` already tells Netlify's secret scanner that the six Firebase variables are public. `GROQ_API_KEY` is read only on the server through `src/lib/ai/env.ts` and is kept out of the build output, so it stays fully scanned.
3. Deploy, then add the Vercel domain to Firebase authorized domains (step 3 above).

## The 3-minute judge demo

New visitors start with a blank profile: no XP, streak, graph or skills until they play. To demo with history, open `/twin` and choose **Load a demo learner with history** (or **Reset demo** later).

1. **`/twin`**: Learning Twin at ~68% mastery, 3 developing concepts, 2 active misconceptions, and an AI insight about word problems.
2. **`/learn`**: Nova presents `3x + 4 = 19`.
3. Answer **`12`** (wrong on purpose).
4. Watch the analysis, then **“NEW INSIGHT DETECTED”**: “I found a pattern…”. The strategy switches from Example to Step-by-step.
5. Follow the plan: explanation → worked example → guided question (`4`) → re-test (`5`).
6. The misconception flips to **resolved**, the preferred explanation style updates, and difficulty adapts.
7. **`/twin`**: the knowledge graph has visibly changed (mastery, badges, misconception state). **`/progress`** shows the trend.

Use **Reset to demo profile** on `/twin` to replay. **Start from scratch** creates an empty Twin where dependent concepts start locked.

## Future improvements

- More subjects and a larger, reviewed question bank; teacher-authored content tools.
- Free-form reasoning input (“show your work”) analysed by the model, not only final answers.
- Teacher and parent views on top of the existing per-learner Firestore accounts.
- Spaced-repetition scheduling based on the Twin's decay estimates.
- Evaluation with real learners and educators before any claims about outcomes; accessibility audit and localisation.
- Rate limiting and observability on the AI routes.

## Assets

VRM avatar models are used from the `assets/` folder in this repository (`AvatarSample_A/B/C.vrm`, `Unagirl.vrm`); check each model's licence before redistributing.
