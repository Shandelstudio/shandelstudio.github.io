# Eat the Boss's shit to promote

The playable game is in `static/play/eat-the-boss/`. Hugo copies this directory directly to `public/play/eat-the-boss/`; it does not need an iframe, Node.js runtime, or separate deployment workflow.

- Public game URL: https://shandelstudio.github.io/play/eat-the-boss/
- Game information page: `content/games/eat-the-boss/index.md`
- Homepage entry: `content/_index.md`
- The existing Games section automatically lists the information page.

Keep all the game's HTML, CSS, JavaScript and PNG assets together in this directory when updating it. Internal game resource URLs are relative. The existing stylesheet requests Google Fonts and has system fallbacks. Music and effects are synthesized in the browser.

The game uses `localStorage` for progress and mute preference. It does not use accounts, a backend, or a leaderboard. Fullscreen is requested after Play, with an immersive CSS layout when native fullscreen is unavailable.

Publish through the existing Hugo workflow in `.github/workflows/gh-pages.yml`. Do not replace that workflow with the standalone ZIP's `pages.yml`: that would publish the game over the whole studio site.

The September 21 update replaces coffee with cash, makes each middle manager the sole opponent and drop source, gives boss introductions seven seconds with a paused deadline, and cleans sprite matte residue without removing enclosed white clothing. Screenshots are page resources under `content/games/eat-the-boss/screenshots/`.

Run the regression tests with Node.js 24 from the repository root:

```sh
node --test tests/eat-the-boss/*.test.mjs
```

The homepage links to game information. The Games catalog gives each game the same card layout and a link to its own information page; the browser Play button appears on the game's information page. Catalog images, platform labels, and summaries are defined in each game's front matter. Keep the existing studio publishing workflow when updating the game.

The September 23 update adds automatic elevator rides between floors, four increasing body sizes with the outfit upgrades and a larger final CEO, persistent floor splats for missed poop, and a sinking animation before the retry screen. `career.js` holds the timing and career tiers, and `cinematics.js` draws the transitions. Boss instructions appear only before combat; the floor warning graphics and HUD remain visible during fights. Progress saves when a promotion is earned, and retry resets the current floor's dirt and score to the attempt's starting score.

The visual polish update replaces runtime body stretching with separately drawn transparent sprites in `assets/career-redrawn.png`, including three promotion outfits and three heavier final CEO poses. Every sprite preserves its original aspect ratio. `assets/elevator.png` supplies a matching walnut/brass cabin and textured sliding doors. Prompts and asset provenance are in [game-art-notes.md](game-art-notes.md).

Poop catches use brown particles and a matching mouth effect; gold catches use ochre, and cash retains its green healing effect. Floating score/damage/payday text is removed; the quota, health and boss HUD still show gameplay feedback. The final boss switches directly to its faster second round after hit four, without freezing the deadline, clearing airborne drops, or pausing input.
