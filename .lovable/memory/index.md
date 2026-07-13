# Memory: index.md
Updated: now

Design system: Netflix-inspired dark theme with HSL tokens. All colors via CSS vars in index.css.
Key semantic colors: --primary (red), --success (green), --warning (orange), --destructive (red), --info (blue).
Font: font-display for headings. Tailwind + shadcn/ui components.

Game modes: turnBased, againstTheClock, speedRace, lastManStanding
- lastManStanding: elimination mode with hearts, 2-step answer (continent then country)
- Heart loss: both correct=0, one wrong=0.5, both wrong=1
- Timings: 8s continent phase, 22s location phase (total 30s)
- Session creation accepts startingHearts param (3/5/10)
- Firebase state: lmsRoundState, lmsPlayerStates on GameSession
- Continent selector uses watercolor webp images in /public/continents/
- Reuses Speed Race's synchronized round architecture

Multiplayer: Firebase RTDB for real-time sync. Host orchestrates phases via timeouts.
Session creation: useFirebaseSession.createSession() - 8 params including startingHearts.
GameContext wraps useFirebaseSession.

Translations: 3 languages (en/fr/ar) in src/i18n/translations.ts. Use `as any` for keys not in TranslationKey type.

Modal pattern: GameSettingsModal uses sticky close button at top, scrollable content below.
