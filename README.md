# AlgoTrack — Automated DSA Progress Tracker

Track your LeetCode progress automatically. Solve a problem on LeetCode, LeetHub commits it to GitHub, and AlgoTrack picks it up — logging everything to your dashboard and Google Sheets.

## System Flow

```
User solves a LeetCode problem
  → LeetHub commits solution to GitHub
  → GitHub sends push webhook to /api/github-webhook
  → Extract problem slug from commit message
  → Fetch metadata from LeetCode GraphQL API
  → Save problem to Neon PostgreSQL via Prisma
  → Append row to Google Sheet
  → Dashboard analytics update automatically
```

## Tech Stack

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Framework     | Next.js 15 (App Router, TypeScript)                     |
| Database      | PostgreSQL on Neon                                      |
| ORM           | Prisma                                                  |
| Auth          | Auth.js v5 (NextAuth)                                   |
| UI            | shadcn/ui + Tailwind CSS                                |
| Icons         | Lucide React                                            |
| Charts        | Recharts                                                |
| Notifications | Sonner (via shadcn/ui Toast)                            |
| HTTP Client   | Axios                                                   |
| External APIs | GitHub Webhooks, LeetCode GraphQL, Google Sheets API v4 |

## Prerequisites

- Node.js 20+
- Neon account (free tier works)
- Google Cloud project with Sheets API enabled
- GitHub repository for DSA solutions
- LeetHub browser extension

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/algotrack.git
cd algotrack
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in all values in `.env` (see Environment Variables section below).

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable                       | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `DATABASE_URL`                 | Neon PostgreSQL connection string                        |
| `NEXTAUTH_SECRET`              | Random secret for Auth.js session encryption             |
| `NEXTAUTH_URL`                 | Base URL of the app (http://localhost:3000 for dev)      |
| `GOOGLE_CLIENT_ID`             | Google OAuth client ID                                   |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth client secret                               |
| `GITHUB_WEBHOOK_SECRET`        | Secret used to verify GitHub webhook signatures          |
| `GITHUB_TOKEN`                 | GitHub personal access token (optional, for API calls)   |
| `GOOGLE_SHEETS_ID`             | Google Sheet ID (pre-configured in .env.example)         |
| `GOOGLE_SHEETS_RANGE`          | Target worksheet range (default `Sheet1!A:H`)            |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email for Sheets API                     |
| `GOOGLE_PRIVATE_KEY`           | Service account private key (keep `\n` literal newlines) |

## GitHub Webhook Setup

1. Go to your GitHub DSA solutions repo → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `https://your-domain.com/api/github-webhook`
3. **Content type**: `application/json`
4. **Secret**: value of `GITHUB_WEBHOOK_SECRET`
5. **Events**: select **"Just the push event"**

The webhook parses commit messages matching: `Add solution: 213. House Robber II`

## Google Sheets Service Account Setup

1. Go to **Google Cloud Console** → Create project → Enable **Google Sheets API**
2. **IAM & Admin** → **Service Accounts** → Create → Download JSON key
3. Copy `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
4. Copy `private_key` → `GOOGLE_PRIVATE_KEY` (keep `\n` literal newlines)
5. Share your Google Sheet with the service account email (**Editor** role)
6. Sheet ID is pre-configured: `1kNtEzncuDmXt463avshm9zV_OcQC8YAViByTqMsREyE`

### Sheet Columns

| Col | Header           | Source                  |
| --- | ---------------- | ----------------------- |
| A   | Problem Name     | problem.title           |
| B   | Problem Link     | LeetCode URL            |
| C   | Topic            | problem.topic           |
| D   | Difficulty       | problem.difficulty      |
| E   | Idea             | (blank — fill manually) |
| F   | What I did wrong | (blank — fill manually) |
| G   | Status           | "Solved (No help)"      |
| H   | Revisit          | "No"                    |

## LeetHub Setup

1. Install **LeetHub** extension from Chrome Web Store
2. Authenticate with GitHub
3. Select your DSA solutions repository
4. Solve a problem on LeetCode — LeetHub auto-commits the solution

## Deploy on Vercel

1. Push this project to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Keep defaults:

- Framework preset: **Next.js**
- Install command: `npm install`
- Build command: `npm run build`

4. Add these environment variables in Vercel (Project Settings → Environment Variables):

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (set to your production domain, e.g. `https://your-app.vercel.app`)
- `AUTH_TRUST_HOST` (`true`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_WEBHOOK_SECRET`
- `GITHUB_TOKEN`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

5. Deploy.

### Post-deploy checklist

1. In Google OAuth client settings, add your Vercel production URL to authorized origins/redirects.
2. Update GitHub webhook Payload URL to: `https://your-domain.com/api/github-webhook`.
3. Ensure webhook secret matches `GITHUB_WEBHOOK_SECRET` in Vercel.
4. Test login, onboarding, and one webhook delivery.

## API Endpoints

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| POST   | `/api/auth/register`       | Register with email/password        |
| GET    | `/api/auth/check-username` | Check username availability         |
| PATCH  | `/api/auth/set-username`   | Set permanent username (onboarding) |
| POST   | `/api/github-webhook`      | GitHub push event handler           |
| GET    | `/api/problems`            | Paginated list of solved problems   |
| GET    | `/api/stats`               | Dashboard statistics                |

## Project Structure

```
algotrack/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── onboarding/username/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/check-username/route.ts
│   │       ├── auth/set-username/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── github-webhook/route.ts
│   │       ├── problems/route.ts
│   │       └── stats/route.ts
│   ├── components/
│   │   ├── ui/           (shadcn components)
│   │   ├── charts/
│   │   │   ├── DifficultyChart.tsx
│   │   │   └── TopicChart.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentProblems.tsx
│   │   │   ├── StreakDisplay.tsx
│   │   │   └── DashboardNav.tsx
│   │   └── profile/
│   │       └── EditProfileButton.tsx
│   ├── lib/
│   │   ├── prisma.ts     (Prisma client singleton)
│   │   ├── auth.ts       (Auth.js config)
│   │   ├── github.ts     (webhook signature verification)
│   │   ├── leetcode.ts   (GraphQL metadata fetcher)
│   │   └── sheets.ts     (Google Sheets append logic)
│   ├── types/
│   │   └── next-auth.d.ts
│   └── middleware.ts     (route protection)
├── prisma/
│   └── schema.prisma
├── .env.example
└── README.md
```
