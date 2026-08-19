@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === Owl Game: Production + Development Deploy ===
echo.
echo Production: index.html
echo Development: dev\index.html
echo.

set "PARENT_NO_PAUSE=%OWL_DEPLOY_NO_PAUSE%"
set "PARENT_NO_OPEN=%OWL_DEPLOY_NO_OPEN%"
set "OWL_DEPLOY_NO_OPEN=1"
set "OWL_DEPLOY_NO_PAUSE=1"

call "%~dp0deploy-owl-game-prod.bat"
set "PROD_EXIT=%ERRORLEVEL%"
if not "%PROD_EXIT%"=="0" goto production_failed

call "%~dp0deploy-owl-game-dev.bat"
set "DEV_EXIT=%ERRORLEVEL%"
if not "%DEV_EXIT%"=="0" goto development_failed

echo.
echo [OK] Production:  https://owl-game.painkiller.eu.org/
echo [OK] Development: https://owl-game.painkiller.eu.org/dev/
if not defined PARENT_NO_OPEN start "" "https://owl-game.painkiller.eu.org/"
if not defined PARENT_NO_PAUSE pause
exit /b 0

:production_failed
echo.
echo [ERROR] Production deployment failed. Development was not attempted.
if not defined PARENT_NO_PAUSE pause
exit /b 1

:development_failed
echo.
echo [WARN] Production was deployed, but development failed.
echo [HINT] The production site remains live. Check .deploy-dev-last.log before retrying.
if not defined PARENT_NO_PAUSE pause
exit /b 1
