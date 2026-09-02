@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === Owl Alpha Demo Deploy ===
echo.

if not exist "alpha-public\alpha\index.html" (
  echo [ERROR] alpha-public\alpha\index.html is missing.
  exit /b 1
)

for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
if not "%CURRENT_BRANCH%"=="alpha" (
  echo [ERROR] This deploy script only runs from the alpha branch.
  exit /b 1
)

for /f "delims=" %%S in ('git status --porcelain') do (
  echo [ERROR] Working tree is not clean. Commit changes before deploying.
  exit /b 1
)

echo Pushing alpha to GitHub...
git push -u origin alpha
if errorlevel 1 (
  echo [ERROR] GitHub push failed. Cloudflare deployment was not started.
  exit /b 1
)

set "DEPLOY_LOG=%~dp0.deploy-alpha-last.log"
echo Deploying owl-game-alpha...
call npx --yes wrangler@4.120.0 deploy --config "wrangler.alpha.toml" --keep-vars > "%DEPLOY_LOG%" 2>&1
set "WRANGLER_EXIT=%ERRORLEVEL%"
type "%DEPLOY_LOG%"
findstr /C:"Current Version ID:" "%DEPLOY_LOG%" >nul
if errorlevel 1 goto deployment_failed
if not "%WRANGLER_EXIT%"=="0" goto deployment_failed

powershell -NoProfile -Command "$r=Invoke-WebRequest 'https://owl-game.painkiller.eu.org/alpha/' -UseBasicParsing; if ($r.StatusCode -ne 200) { exit 1 }"
if errorlevel 1 (
  echo [ERROR] Alpha deployment succeeded but HTTP health check failed.
  exit /b 1
)

echo.
echo [OK] Alpha deployment completed: https://owl-game.painkiller.eu.org/alpha/
exit /b 0

:deployment_failed
echo.
echo [ERROR] Alpha deployment failed. See .deploy-alpha-last.log.
exit /b 1
