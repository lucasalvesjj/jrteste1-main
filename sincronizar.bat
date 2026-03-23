@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM Seu backup original + sincronização
git add .
git diff --cached --quiet
if %errorlevel%==0 (echo Sem mudanças.) else (git commit -m "auto backup %date% %time%"& git push)

git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
git push seguinte +main:main

REM === MOSTRA ALTERAÇÕES SINCRONIZADAS ===
echo.
echo ════════════════════════════════════════
echo ÚLTIMAS ALTERAÇÕES NO comercial-jr-2:
git log seguinte/main --oneline -3
echo.
echo Acesse: https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
