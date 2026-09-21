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

The homepage links to game information. Play buttons appear on the Games index and game information page. Keep the existing studio publishing workflow when updating the game.
