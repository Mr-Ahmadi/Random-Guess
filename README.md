# Word Guess

A fast-paced word guessing game built with React, TypeScript, and Vite.

## Highlights

- Two game modes:
  - `MULTI_PHONE`: classic single-team play flow
  - `SINGLE_PHONE`: one device is passed between players
- Per-team countdown timers
- Optional pass-phone pause screen between turns in single-phone mode
- Team pairing preview modal in lobby
- Team clocks panel in game (scrollable for many teams)
- Word dataset loaded from `public/words.en.json`
- No backend required (all state is local)

## Game Rules

### Multi-phone mode

1. Start the game with the selected team timer.
2. Tap `Got It` for a correct guess (adds score, keeps turn flow).
3. Tap `Skip` to move on without scoring.
4. When the active timer reaches zero, game ends.

### Single-phone mode

1. Enter an even number of players (minimum 4).
2. Players are paired into teams: first half + second half.
3. Each team has its own timer pool and can be eliminated when timer hits zero.
4. The game continues until one team remains (winner).
5. You can enable `Show pass-phone pause screen` to require a `Ready` tap between turns.

## Lobby Setup

- Select mode: `Multi-phone` or `Single-phone`
- Set team timer: presets (`30s`, `60s`, `90s`) or custom (`10-300`)
- Single-phone only:
  - Enter players (one per line)
  - View generated team pairings
  - Toggle pass-phone pause behavior (`On` / `Off`)

## Project Structure

```text
src/
├── components/
│   ├── Lobby.tsx
│   ├── Lobby.css
│   ├── GameBoard.tsx
│   ├── GameBoard.css
│   ├── GameOver.tsx
│   ├── GameOver.css
│   └── Logo.tsx
├── data/
│   └── wordLoader.ts
├── hooks/
│   └── useGameTimer.ts
├── state/
│   └── gameReducer.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.css
└── main.tsx
public/
└── words.en.json
scripts/
└── generate-icons.mjs
```

## Requirements

- Node.js 20+
- npm

## Run Locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173` by default.

## Available Scripts

- `npm run dev` - start dev server
- `npm run build` - generate icons + type-check + production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run deploy` - build and deploy `dist/` with `gh-pages`

## Words Dataset

Edit `public/words.en.json`:

```json
{
  "categories": {
    "general": ["word1", "word2", "word3"]
  }
}
```

Notes:

- Words are selected randomly without repetition until pool is exhausted.
- When exhausted, selection continues via reshuffle behavior in loader/reducer flow.

## State Model (Core)

Main game context includes:

- `state`: `LOBBY | IN_GAME | GAME_OVER`
- `mode`: `MULTI_PHONE | SINGLE_PHONE`
- `teams`, `players`
- `timerDuration`, per-team `remainingTime`
- `isPaused`, `pauseReason`
- `winnerTeamId` (single-phone winner)

See `src/types/index.ts` and `src/state/gameReducer.ts` for full behavior.

## Build for Production

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` to any static host (Vercel, Netlify, GitHub Pages, etc.).

## License

MIT
