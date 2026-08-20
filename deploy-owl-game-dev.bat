@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === Owl Game Development Deploy ===
echo.

if not exist "dev-public\dev\index.html" (
  echo [ERROR] dev-public\dev\index.html is missing.
  if not defined OWL_DEPLOY_NO_PAUSE pause
  exit /b 1
)

if not exist "dev-public\dev\src" (
  echo [ERROR] dev-public\dev\src is missing.
  if not defined OWL_DEPLOY_NO_PAUSE pause
  exit /b 1
)

echo.
echo Syncing GitHub dev branch...
set "GIT_BRANCH="
set "GIT_UNTRACKED="
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "GIT_BRANCH=%%B"
if not "!GIT_BRANCH!"=="dev" goto github_branch_failed
git diff --quiet
if errorlevel 1 goto github_dirty
git diff --cached --quiet
if errorlevel 1 goto github_dirty
for /f "delims=" %%U in ('git ls-files --others --exclude-standard 2^>nul') do set "GIT_UNTRACKED=1"
if defined GIT_UNTRACKED goto github_dirty
git push origin dev
if errorlevel 1 goto github_sync_failed

set "LEGACY_TOKEN_FILE=%~dp0.cloudflare-api-token"
set "TOKEN_DIR=%APPDATA%\owl-game"
set "TOKEN_FILE=%TOKEN_DIR%\cloudflare-api-token"
set "TOKEN_FROM_FILE="

if exist "%LEGACY_TOKEN_FILE%" del /q "%LEGACY_TOKEN_FILE%" >nul 2>&1
if not exist "%TOKEN_DIR%" mkdir "%TOKEN_DIR%" >nul 2>&1

if not defined CLOUDFLARE_API_TOKEN if exist "%TOKEN_FILE%" (
  set /p CLOUDFLARE_API_TOKEN=<"%TOKEN_FILE%"
  set "TOKEN_FROM_FILE=1"
)

if defined CLOUDFLARE_API_TOKEN (
  call :validate_token
  if errorlevel 1 (
    echo [WARN] The saved Cloudflare token is invalid and will not be used.
    if defined TOKEN_FROM_FILE del /q "%TOKEN_FILE%" >nul 2>&1
    set "CLOUDFLARE_API_TOKEN="
  )
)

if not defined CLOUDFLARE_API_TOKEN (
  call :validate_wrangler_auth
  if not errorlevel 1 goto cloudflare_auth_ready
  echo No saved Cloudflare API token or Wrangler login was found.
  echo A browser page will open now. Create a Custom Token with:
  echo   Account - Account Settings - Read
  echo   Account - Workers Scripts - Edit
  echo   Zone - Workers Routes - Edit  ^(painkiller.eu.org only^)
  echo Paste only the token, then press Enter.
  start "" "https://dash.cloudflare.com/profile/api-tokens"
  echo.
  set /p "CLOUDFLARE_API_TOKEN=Paste Cloudflare API token: "
  call :validate_token
  if errorlevel 1 (
    echo [ERROR] This is not a valid API token. Paste the token only, without quotes or notes.
    if not defined OWL_DEPLOY_NO_PAUSE pause
    exit /b 1
  )
  >"%TOKEN_FILE%" echo !CLOUDFLARE_API_TOKEN!
  if errorlevel 1 (
    echo [ERROR] The API token could not be saved locally.
    if not defined OWL_DEPLOY_NO_PAUSE pause
    exit /b 1
  )
)

:cloudflare_auth_ready
echo.
echo Uploading dev-public\dev to owl-game-dev...
set "DEPLOY_LOG=%~dp0.deploy-dev-last.log"
call npx --yes wrangler@4.120.0 deploy --config "wrangler.dev.toml" --keep-vars > "%DEPLOY_LOG%" 2>&1
set "WRANGLER_EXIT=!ERRORLEVEL!"
type "%DEPLOY_LOG%"
findstr /C:"Current Version ID:" "%DEPLOY_LOG%" >nul
if errorlevel 1 goto deployment_failed
if not "!WRANGLER_EXIT!"=="0" goto deployment_failed

echo.
echo [OK] Development deployment completed: https://owl-game.painkiller.eu.org/dev/
if not defined OWL_DEPLOY_NO_OPEN start "" "https://owl-game.painkiller.eu.org/dev/"
if not defined OWL_DEPLOY_NO_PAUSE pause
exit /b 0

:deployment_failed
echo.
findstr /I /C:"permission" /C:"authorization" "%DEPLOY_LOG%" >nul
if not errorlevel 1 echo [HINT] The dev route needs Zone - Workers Routes - Edit for painkiller.eu.org. Recreate the saved token with that permission, then retry.
echo [ERROR] Development deployment failed. Your production game was not changed.
if not defined OWL_DEPLOY_NO_PAUSE pause
exit /b 1

:github_sync_failed
echo.
echo [ERROR] GitHub dev sync failed. Cloudflare deployment was not started.
if not defined OWL_DEPLOY_NO_PAUSE pause
exit /b 1

:github_branch_failed
echo.
echo [ERROR] Development deployment must run from the GitHub dev branch.
if not defined OWL_DEPLOY_NO_PAUSE pause
exit /b 1

:github_dirty
echo.
echo [ERROR] Git working tree is not clean. Commit local changes before deploying.
if not defined OWL_DEPLOY_NO_PAUSE pause
exit /b 1

:validate_token
powershell -NoProfile -Command "$t=$env:CLOUDFLARE_API_TOKEN; if ($t -match '^[A-Za-z0-9_-]{32,}$') { exit 0 } else { exit 1 }"
exit /b %ERRORLEVEL%

:validate_wrangler_auth
call npx --yes wrangler@4.120.0 whoami >nul 2>&1
exit /b %ERRORLEVEL%
