@echo off
title OGgames preview - close this window to stop
cd /d "%~dp0"
echo.
echo  OGgames is running on THIS computer only, at http://localhost:8000
echo  Other people can't see it until the site is published.
echo  Close this window to stop it.
echo.
start "" "http://localhost:8000"
python -m http.server 8000 --bind 127.0.0.1
