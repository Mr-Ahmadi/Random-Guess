# Team Word Guessing Game

A fast-paced, team-based word guessing game built with React, TypeScript, and Vite. Perfect for playing with friends over video calls like Google Meet.

## Features

- **Team-Based Gameplay**: Divide players into teams and play sequentially
- **Real-Time Countdown Timer**: Frame-independent timer with smooth animations
- **Word Management**: Randomly selected words from an editable JSON dataset
- **Score Tracking**: Keep track of guesses for each team
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **No Backend Required**: Pure client-side state management - host is authoritative
- **External Communication**: Integrates with external video calls (Google Meet, Zoom, etc.)

## Game Rules

1. Players are organized into **teams**
2. Teams play **sequentially** - one team plays at a time while others communicate externally
3. Each team has its own **countdown timer** (configurable duration)
4. When a word is guessed correctly, press **"Got It!"** to score a point and get the next word
5. Press **"Skip"** to move to the next word without scoring
6. **The moment ANY team's timer reaches zero, the entire game ends immediately**
7. The game displays final scores and which team ran out of time

## Game States

### LOBBY
- Enter team names (2-6 teams)
- Set timer duration (10-300 seconds)
- Select language (English - all words are in English)
- Start the game (host initiates)

### IN_GAME
- Shows the current team name and score
- Large, readable countdown timer with visual progress indicator
- Current word display
- "Got It!" button to score and advance to next word
- "Skip" button to skip without scoring
- Team status list showing all teams and their scores

### GAME_OVER
- Displays which team ran out of time
- Shows final scores ranked by number of guesses
- "Play Again" button to restart

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **CSS 3** - Responsive styling with flexbox and gradients

## Project Structure

```
src/
├── components/          # React components
│   ├── Lobby.tsx       # Game setup screen
│   ├── Lobby.css       # Lobby styling
│   ├── GameBoard.tsx   # Main gameplay screen
│   ├── GameBoard.css   # Gameplay styling
│   ├── GameOver.tsx    # Game completion screen
│   └── GameOver.css    # Game over styling
├── hooks/              # Custom React hooks
│   └── useGameTimer.ts # Frame-independent timer hook
├── state/              # State management
│   └── gameReducer.ts  # Game state reducer and initial state
├── types/              # TypeScript interfaces
│   └── index.ts        # Type definitions
├── data/               # Data management
│   └── wordLoader.ts   # Word loading and selection logic
├── App.tsx             # Root component
├── App.css             # Root styling
├── main.tsx            # React entry point
└── index.css           # Global styles
public/
└── words.en.json       # Word dataset (editable)
```

## Installation

### Prerequisites
- Node.js 20.16+ (or upgrade to 20.19+/22.12+)
- npm or yarn

### Setup

1. Clone or download the project:
```bash
cd Guess
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173/`

## How to Play

### Setup Phase (Lobby)
1. Select the number of teams (2-6)
2. Enter each team's name (or use defaults)
3. Set the timer duration in seconds (default: 60 seconds)
4. Click "Start Game"

### Gameplay Phase (In-Game)
1. The first team name is displayed at the top
2. A word appears in the large text box
3. **Using External Communication** (Google Meet, Zoom, etc.):
   - Players on the active team discuss the word externally
   - Other teams stay silent and cannot see/hear the discussion
4. When the team guesses the word correctly:
   - Click "✓ Got It!" to score 1 point and display the next word
5. If the team wants to skip without scoring:
   - Click "⊘ Skip" to move to the next word (0 points awarded)
6. **The timer automatically switches teams** when one team's time ends
   - All teams share the same timer pool
   - First team to run out of time ends the game

### Game End Phase (Game Over)
1. The game ends when the first team runs out of time
2. Final scores are displayed, ranked by most guesses
3. Click "Play Again" to return to the lobby

## Customizing Words

Words are stored in a simple, editable JSON file: `public/words.en.json`

### Word Dataset Format
```json
{
  "categories": {
    "general": ["word1", "word2", "word3", ...]
  }
}
```

### Adding New Words
1. Open `public/words.en.json`
2. Add words to the "general" array
3. Save the file
4. Refresh the browser - new words will be available immediately

### Notes on Words
- Words are selected randomly without repetition
- When all words are used, the pool reshuffles automatically
- Add more words to extend gameplay sessions

## Advanced Configuration

### Timer Duration
Set in the Lobby before starting the game. Range: 10-300 seconds.

### Team Count
Choose 2-6 teams in the Lobby. Team names can be customized.

### Game Logic
The game uses a React `useReducer` for state management with a clear state machine:
- State transitions: LOBBY → IN_GAME → GAME_OVER → LOBBY
- Frame-independent timer (uses `requestAnimationFrame`)
- Precise timer using elapsed time calculations

## Running in Production

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

Deploy the `dist/` folder to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Troubleshooting

### Words not loading?
- Ensure `public/words.en.json` exists and is valid JSON
- Check browser console for errors
- Fallback words will be used if the file fails to load

### Timer seems incorrect?
- The timer uses `requestAnimationFrame` for precise timing
- It's independent of display refresh rate
- Times are calculated from elapsed milliseconds, not frame count

### Mobile responsiveness issues?
- The app uses mobile-first responsive design
- Tested on viewport widths from 320px and up
- Try rotating your device or resizing your browser

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Performance Notes

- Component re-renders are optimized with proper hook dependencies
- Timer uses `requestAnimationFrame` for smooth, efficient updates
- Word dataset is cached after initial load
- No backend calls - everything runs locally

## Keyboard Shortcuts

- While in-game, the buttons are touchable on mobile
- Desktop users can click the buttons or use Tab+Enter for accessibility

## API Reference

### `useGameTimer` Hook

```typescript
const timeRemaining = useGameTimer({
  duration: 60,           // Timer duration in seconds
  isActive: true,         // Whether timer is running
  onTimerEnd: () => {}    // Callback when timer reaches 0
});
```

### Game State Types

```typescript
interface GameContext {
  state: 'LOBBY' | 'IN_GAME' | 'GAME_OVER';
  teams: Team[];
  timerDuration: number;
  currentTeamIndex: number;
  currentWord: string | null;
  usedWords: Set<string>;
  allWords: string[];
  winningTeamId: string | null;
}
```

## License

MIT - Feel free to use this game however you like!

## Contributing

Found a bug? Want to add features? Just modify the code:
- Add words to `public/words.en.json`
- Modify component styles (`.css` files)
- Extend game logic in `src/state/gameReducer.ts`
- Add new game states or features as needed

## Credits

Inspired by "Dor" and team-based word guessing games. Built for fun and social gaming with friends and family.
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
