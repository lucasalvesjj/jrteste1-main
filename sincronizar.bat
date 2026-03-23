@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM 1. GARANTE MASTER ATUALIZADO
git checkout master
git pull origin master --allow-unrelated-histories

REM 2. BACKUP ORIGINAL
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push origin master
)

REM 3. ESPELHA TUDO (força sincronização completa)
git remote remove seguinte 2>nul
git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
git push seguinte master --mirror --force

echo.
echo 👉 VERIFIQUE: https://github.com/lucasalvesjj/comercial-jr-2/commits/master
pause
