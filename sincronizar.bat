@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

git checkout master

REM Sincroniza com o remoto antes de qualquer coisa
git pull origin master --rebase

git add .
git diff --cached --quiet
if %errorlevel%==0 (echo Sem mudanças para commitar.) else (
    git commit -m "auto backup %date% %time%"
    git push origin master
)

git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git

REM Usa -B para criar OU usar branch existente (sem warning)
git checkout -B main
git push seguinte main:main --force
git checkout master

echo.
echo ════════════════════════════════════════
echo ✅ BACKUP OK ✓ comercial-jr-2/main ATUALIZADO
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
