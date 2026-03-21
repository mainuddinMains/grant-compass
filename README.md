# 🧭 Grant Compass

> **Find the perfect grant for your research in seconds.**

Grant Compass is an AI-powered grant discovery tool built for university researchers. Describe your research in plain English and the app searches NIH Reporter and NSF APIs in parallel, then uses Claude to rank results by relevance and generate a tailored Letter of Intent — all in one click.

Built at **TrueHacks 2025**.

---

## Demo

Click **Try Demo** on the homepage to run a pre-filled search about microplastic neurotoxicity through the full pipeline without typing anything. If the live APIs are slow, the app automatically falls back to curated sample grants so the demo never breaks.

---

## Features

- **Natural-language search** — describe your research in plain English; no need to know grant IDs or agency codes
- **Live data from NIH & NSF** — queries NIH Reporter v2 and NSF Awards API in parallel, deduplicates results
- **AI matching with Claude** — scores every grant 0–100 for relevance and writes a one-sentence reason for each match
- **Match score progress bar** — color-coded red / yellow / green so relevance is visible at a glance
- **Letter of Intent generator** — one click produces a structured, formal one-page letter addressed to the funding agency
- **Copy to clipboard** — copy the generated letter instantly from the modal
- **Demo mode + sample fallback** — works even when external APIs are unavailable
- **Mobile responsive** — readable and usable on any screen size

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Claude (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk` |
| HTTP client | Axios |
| Deployment | Vercel |

---

## Project Structure

```
grant-compass/
├── app/
│   ├── page.tsx                 # Main search page
│   ├── layout.tsx               # Root layout + metadata
│   ├── globals.css              # Tailwind imports + fade-in animation
│   └── api/
│       ├── grants/route.ts      # GET ?q= — fetches NIH + NSF in parallel
│       ├── match/route.ts       # POST — Claude ranks grants by relevance
│       └── letter/route.ts      # POST — Claude writes Letter of Intent
├── components/
│   ├── SearchBar.tsx            # Controlled textarea + submit button
│   ├── GrantCard.tsx            # Card with score bar, reason, metadata
│   └── LetterModal.tsx          # Modal that calls /api/letter on open
└── lib/
    ├── nih.ts                   # fetchNIHGrants() — NIH Reporter API
    ├── nsf.ts                   # fetchNSFGrants() — NSF Awards API
    └── sampleGrants.ts          # 3 hardcoded grants for demo fallback
```

---

## How It Works

```
User types description
        │
        ▼
extractKeywords() → GET /api/grants?q=...
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     fetchNIHGrants()          fetchNSFGrants()
     NIH Reporter API          NSF Awards API
              │                         │
              └────────────┬────────────┘
                    deduplicate by title
                           │
                     (fallback to sampleGrants if empty)
                           │
                           ▼
              POST /api/match  ←  full description + grants
                    Claude scores each grant 0–100
                    returns JSON array sorted by score
                           │
                           ▼
              Render GrantCard list with staggered fade-in
                           │
              Click "Generate Letter of Intent"
                           │
                           ▼
              POST /api/letter  ←  description + grant
                    Claude writes structured 1-page letter
                           │
                           ▼
              LetterModal opens → Copy to Clipboard
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

### Local setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd grant-compass
npm install

# 2. Add your API key
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key — get one at console.anthropic.com |

Copy `.env.example` to `.env.local` and fill in the value. Never commit `.env.local` — it is gitignored.

---

## API Routes

### `GET /api/grants?q={keywords}`

Searches NIH Reporter and NSF Awards in parallel. Returns a deduplicated, unified array.

**Response**
```json
{
  "grants": [
    {
      "title": "...",
      "description": "...",
      "deadline": "2025-06-15",
      "amount": 2850000,
      "agency": "NIH – NIEHS",
      "url": "https://reporter.nih.gov/project-details/..."
    }
  ]
}
```

---

### `POST /api/match`

Sends grants and a researcher description to Claude for relevance scoring.

**Request body**
```json
{
  "researchDescription": "I study the effects of microplastics...",
  "grants": [ ...Grant[] ]
}
```

**Response**
```json
{
  "results": [
    { "grantId": 2, "score": 94, "reason": "...", "grant": { ...Grant } },
    { "grantId": 0, "score": 81, "reason": "...", "grant": { ...Grant } }
  ]
}
```

---

### `POST /api/letter`

Generates a one-page Letter of Intent using Claude.

**Request body**
```json
{
  "researchDescription": "I study the effects of microplastics...",
  "grant": { ...Grant }
}
```

**Response**
```json
{ "letter": "Dear NIH Review Committee,\n\n..." }
```

---

## Deployment

### Deploy to Vercel

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variable
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview

# Deploy
vercel --prod
```

**Note:** The `/api/match` and `/api/letter` routes have `maxDuration = 60` set. This requires the **Vercel Hobby plan or above** — free tier caps functions at 10 seconds which may be too short for Claude responses.

### Vercel dashboard (alternative)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import repository
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY`
4. Click **Deploy**

---

## Claude System Prompts

**Grant matching** (`/api/match`):
> You are a grant matching expert for university researchers. Given a researcher's description and a list of grants, you will: 1. Score each grant 0-100 for relevance to the research, 2. Write one sentence explaining why it matches, 3. Return results sorted by score descending. Return ONLY a JSON array with fields: grantId, score, reason.

**Letter of Intent** (`/api/letter`):
> You are an expert academic grant writer. Write a professional one-page letter of intent for a university researcher applying to a grant. Structure: 1. Opening: researcher background and focus, 2. Middle: alignment between research and grant goals, 3. Closing: expected outcomes and impact. Address it to the funding agency. Sign off as "Principal Investigator".

---

## License

MIT
