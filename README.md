# Dowr · دور

A bilingual (English / Persian) party word game for the web. One team member
describes the word on screen, their partner shouts it out, and the phone keeps
travelling around the circle. Installable as a PWA, works offline, no backend.

> **دور** یک بازی دورهمی سریع و خنده‌دار است: یک نفر کلمه را توضیح می‌دهد،
> هم‌تیمی‌اش حدس می‌زند و گوشی دور می‌چرخد.

## Highlights

- **Full English / Persian interface** with a live language switch, RTL layout,
  Vazirmatn typography and Persian digits everywhere.
- **Two Persian and English word sets** (~530 words each) split into 12 packs
  you can mix per game.
- **Two game modes**
  - *Classic rounds* — a fixed number of timed rounds, every team plays one turn
    per round, highest score wins.
  - *Time relay* — every team owns a bank of time, the phone passes after each
    correct guess, and a team is out when its bank empties. The team that spent
    the least time is left standing.
- **Rules baked in**: changing the word costs a point, calling a foul replaces
  the word and takes 3 points off, exactly like the table rules.
- Team colours, hand-off screens, per-turn scorecards, streaks, confetti,
  synthesised sound effects, haptics and desktop keyboard shortcuts.

## How to play

Players pair up two by two and sit facing each other; teammates share a colour
on screen. On your turn a word appears — describe it until your partner says it
out loud, tap **Correct**, and pass the phone on.

Not allowed: any part of the word or a rhyme, pointing at things around you,
switching language. Break a rule and the other players tap **Foul −3**: the word
is replaced and the team loses three points. Changing the word yourself costs
one point. Losing team owes everyone a dare.

The in-app **How to play** screen carries the same rules in both languages.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/Random-Guess/
```

Requires Node 20.19+ (Vite 7).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | icons + type-check + production build |
| `npm run preview` | serve the production build |
| `npm run lint` | ESLint |
| `npm run deploy` | build and publish `dist/` with `gh-pages` |

## Project layout

```text
src/
├── components/     Lobby, TurnIntro, GameBoard, TurnSummary, GameOver, RulesModal, TopBar
├── i18n/           strings.ts (en + fa dictionaries), LanguageProvider, useI18n
├── state/          gameReducer.ts - the whole game model
├── hooks/          useGameTimer.ts - rAF countdown
├── data/           wordLoader.ts - loads and shuffles the word packs
├── utils/          sound effects, clock/number formatting, team colours
└── types/
public/
├── words.en.json   English word packs
└── words.fa.json   Persian word packs
```

## Game model

`gameReducer` owns everything. Phases: `LOBBY → TURN_INTRO → PLAYING →
TURN_SUMMARY → … → GAME_OVER`. Each team tracks score, correct/changed/foul
counts, streaks, time used and (in relay mode) the remaining bank. A turn opens
by bumping `turnKey`, which remounts the board so the countdown starts fresh.

## Word packs

Both files use the same shape:

```json
{
  "language": "fa",
  "direction": "rtl",
  "categories": {
    "animals": ["شیر", "ببر"],
    "food": ["نان", "عسل"]
  }
}
```

Add a category and it shows up in the lobby as a selectable pack; add a
`cat.<key>` entry in `src/i18n/strings.ts` to give it a translated label.

## License

MIT
