@echo off
REM Start script: installs dependencies and starts the Node server
cd /d "%~dp0"
echo Installing dependencies (this may take a few minutes)...
npm install

npm start
nPAUSEnecho Starting server...