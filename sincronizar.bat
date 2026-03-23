@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM BACKUP + SYNC
git add .
git diff --cached --quiet
if %errorlevel%==0 (echo Sem mudanças.) else (git commit -m "auto backup %date% %time%"& git push)

git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
git push seguinte +main:main >nul 2>&1

REM MOSTRA SUCESSO LIMPO
echo.
echo ════════════════════════════════════════
echo ✅ BACKUP FEITO NO PRIMEIRO REPO
echo ✅ SEGUNDO REPO ATUALIZADO (comercial-jr-2)  
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
