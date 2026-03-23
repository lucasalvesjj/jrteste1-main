@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM 1. BACKUP PRIMEIRO REPO (SEU CÓDIGO ORIGINAL)
git checkout master
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push origin master
)

REM 2. SINCRONIZAÇÃO SIMPLES (SEM --mirror)
git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
git push seguinte master:master --force
echo ✅ comercial-jr-2 sincronizado!

REM 3. PROVA IMEDIATA
echo.
echo VERIFICAÇÃO:
git fetch seguinte
git rev-parse origin/master
git rev-parse seguinte/master
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/master
pause
