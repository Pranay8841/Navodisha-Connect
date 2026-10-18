@echo off
echo Freeing port 8081...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo Port 8081 is now completely free.
