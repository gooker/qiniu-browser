@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "APP_ROOT=%~dp0"
set "OUTPUT_DIR=%APP_ROOT%release"
set "NO_PAUSE="
if /I "%~1"=="--no-pause" set "NO_PAUSE=1"

echo.
echo [1/4] Checking build tools...
where npm >nul 2>&1
if errorlevel 1 goto :missing_npm
where cargo >nul 2>&1
if errorlevel 1 goto :missing_cargo

if not exist "%APP_ROOT%node_modules\.bin\tsc.cmd" (
  echo.
  echo [2/4] Installing dependencies...
  call npm ci
  if errorlevel 1 goto :failed
) else (
  echo [2/4] Dependencies already installed.
)

echo.
echo [3/4] Building Qiniu Browser...
call npm run tauri build
set "TAURI_EXIT=%ERRORLEVEL%"

if not exist "%APP_ROOT%src-tauri\target\release\qiniu-browser.exe" goto :missing_binary
if not "%TAURI_EXIT%"=="0" echo WARNING: Tauri reported exit code %TAURI_EXIT%, but the executable was generated. Continuing with artifact export.

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
if errorlevel 1 goto :failed

if not exist "%APP_ROOT%src-tauri\target\release\qiniu-browser.exe" goto :missing_binary
copy /Y "%APP_ROOT%src-tauri\target\release\qiniu-browser.exe" "%OUTPUT_DIR%\qiniu-browser.exe" >nul
if errorlevel 1 goto :failed

set "INSTALLER="
for /f "delims=" %%F in ('dir /b /s "%APP_ROOT%src-tauri\target\release\bundle\nsis\*.exe" 2^>nul') do if not defined INSTALLER set "INSTALLER=%%F"
if defined INSTALLER copy /Y "%INSTALLER%" "%OUTPUT_DIR%\qiniu-browser-setup.exe" >nul

set "MSI="
for /f "delims=" %%F in ('dir /b /s "%APP_ROOT%src-tauri\target\release\bundle\msi\*.msi" 2^>nul') do if not defined MSI set "MSI=%%F"
if defined MSI copy /Y "%MSI%" "%OUTPUT_DIR%\qiniu-browser.msi" >nul

echo.
echo [4/4] Build complete.
echo Raw executable: %OUTPUT_DIR%\qiniu-browser.exe
if not "%TAURI_EXIT%"=="0" echo WARNING: Updater signing was not completed because TAURI_SIGNING_PRIVATE_KEY is missing.
if defined INSTALLER echo Installer:       %OUTPUT_DIR%\qiniu-browser-setup.exe
if defined MSI echo MSI package:      %OUTPUT_DIR%\qiniu-browser.msi
if not defined NO_PAUSE pause
exit /b 0

:missing_npm
echo ERROR: npm was not found. Install Node.js and try again.
goto :failed

:missing_cargo
echo ERROR: cargo was not found. Install Rust and try again.
goto :failed

:missing_binary
echo ERROR: Tauri build finished but qiniu-browser.exe was not found.
goto :failed

:failed
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" set "EXIT_CODE=1"
echo.
echo Build failed with exit code %EXIT_CODE%.
if not defined NO_PAUSE pause
exit /b %EXIT_CODE%