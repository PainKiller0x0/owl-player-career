owl-game local deploy

Normal use:
1. Keep the development page in dev-public\dev\.
2. The development page entry is dev-public\dev\index.html; its CSS and JS stay under the same directory.
3. Double-click deploy-owl-game-dev.bat to deploy owl-game-dev.

Development release order:
1. Commit the intended changes on the dev branch.
2. deploy-owl-game-dev.bat checks that the working tree is clean and pushes dev to GitHub.
3. Only after GitHub succeeds does it deploy the Cloudflare dev Worker.

The development page is now a split source tree rather than one bundled HTML file.
Cloudflare serves dev-public as Worker Assets, so /dev/ maps to dev-public\dev\.

GitHub / Cloudflare Workers Builds:
- The development source is committed on the dev branch.
- Connect this repository to the existing owl-game-dev Worker under Settings > Builds.
- Use the repository root as the root directory.
- Use `npx wrangler deploy --config wrangler.dev.toml` as the deploy command.
- Do not commit `.cloudflare-api-token` or any other API token.

URLs:
- Production:  https://owl-game.painkiller.eu.org/
- Development: https://owl-game.painkiller.eu.org/dev/

Deployment behavior:
- deploy-owl-game-dev.bat validates the complete dev-public\dev tree and deploys only the development Worker.
- deploy-owl-game-prod.bat remains the production helper.
- deploy-owl-game.bat is retained for the old production-first workflow.

First use only (choose either route):
- If Wrangler is already logged in, the batch file reuses that OAuth login.
- Otherwise it opens Cloudflare's API-token page.
- Create a Custom Token scoped to Jack0hjj@qq.com's Account with:
  Account > Account Settings > Read
  Account > Workers Scripts > Edit
  Zone > Workers Routes > Edit, restricted to painkiller.eu.org
- Paste the token itself into the opened terminal once, then press Enter.
- The token is stored only in your Windows user profile:
  %APPDATA%\owl-game\cloudflare-api-token
- To create the OAuth login without an API token, run `npx wrangler@4.120.0 login --device` once.

Safety:
- Production and development deploy to separate Workers, so the development files cannot overwrite the live game.
- Development responses bypass Cloudflare and browser caches, so the newest upload is visible immediately.
- Do not share or upload the locally stored API token.
