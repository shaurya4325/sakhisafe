@echo off
rem Opens the Sakhi Safe website on this laptop. Works offline (everything is in this folder).
cd /d "%~dp0"
start "" http://127.0.0.1:8765/
python -m http.server 8765 --bind 127.0.0.1
