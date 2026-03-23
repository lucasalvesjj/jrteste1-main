@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"
git checkout master
git add .
git diff --cached --quiet
if %errorlevel%==0 (echo Sem mudanças.) else (git commit -m "auto backup %date% %time%"& git push origin master)

REM CRIA E SINCRONIZA A BRANCH MAIN NO SEGUNDO REPO
git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
git checkout -b main
git push seguinte main:main --force
git checkout master

echo.
echo ════════════════════════════════════════
echo ✅ BACKUP OK ✓ comercial-jr-2/main ATUALIZADO
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
