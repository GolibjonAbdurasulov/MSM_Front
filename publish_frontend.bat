@echo off
cd /d "%~dp0"

echo === Frontend build ===
call npm run build
if errorlevel 1 (
    echo XATO: Frontend build muvaffaqiyatsiz!
    pause
    exit /b 1
)

echo === web.config ko'chirish ===
copy "%~dp0web.config" "%~dp0dist\"

echo === Zip qilish ===
if exist msm-frontend.zip del msm-frontend.zip
powershell Compress-Archive -Path dist\* -DestinationPath msm-frontend.zip -Force

echo ================================
echo   msm-frontend.zip tayyor!
echo ================================
pause