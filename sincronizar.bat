@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM 1. VAI PARA MASTER E ATUALIZA
git checkout master
git pull origin master

REM 2. BACKUP ORIGINAL (só se mudanças)
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push origin master
    echo ✅ Backup primeiro repo OK
)

REM 3. VERIFICA REMOTE
git remote | findstr /C:"seguinte" >nul
if errorlevel 1 (
    git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
)

REM 4. SINCRONIZA MASTER → MASTER
git push seguinte master:master --force
echo ✅ comercial-jr-2 sincronizado!

REM 5. PROVA VISUAL
echo.
echo ════════════════════════════════════════
echo VERIFICAÇÃO:
git fetch seguinte
echo PRIMEIRO repo (master): 
git rev-parse origin/master
echo SEGUNDO repo (master): 
git rev-parse seguinte/master
echo.
echo Últimos 3 commits SEGUNDO repo:
git log seguinte/master --oneline -3
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/master
pause
