# Eat the Boss's shit to promote

The playable game is in `static/play/eat-the-boss/`. Hugo copies this directory directly to `public/play/eat-the-boss/`; it does not need an iframe, Node.js runtime, or separate deployment workflow.

- Public game URL: https://shandelstudio.github.io/play/eat-the-boss/
- Game information page: `content/games/eat-the-boss/index.md`
- Homepage entry: `content/_index.md`
- The existing Games section automatically lists the information page.

Keep all the game's HTML, CSS, JavaScript and PNG assets together in this directory when updating it. Internal game resource URLs are relative. The existing stylesheet requests Google Fonts and has system fallbacks. Music and effects are synthesized in the browser.

The game uses `localStorage` for progress and mute preference. It does not use accounts, a backend, or a leaderboard. Fullscreen is requested after Play, with an immersive CSS layout when native fullscreen is unavailable.

Publish through the existing Hugo workflow in `.github/workflows/gh-pages.yml`. Do not replace that workflow with the standalone ZIP's `pages.yml`: that would publish the game over the whole studio site.

The integrated game comes from the verified September 14 handoff (source revision `abe9a306ac5253c43826a591b5a1d70016d81ea3`). Its 20 automated tests passed before integration.
