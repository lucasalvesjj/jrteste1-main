@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM 1. BACKUP PRIMEIRO REPO (LÓGICA ORIGINAL)
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push origin main
    echo ✅ Backup primeiro repo OK
)

REM 2. VERIFICA REMOTE
git remote | findstr /C:"seguinte" >nul
if errorlevel 1 (
    git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
    echo Remote adicionado.
)

REM 3. PULL DO PRIMEIRO + PUSH REAL PARA SEGUNDO
git pull origin main
git push seguinte main:main --force

REM 4. VERIFICA SE DEU CERTO
git fetch seguinte
echo.
echo ════════════════════════════════════════
echo COMPARAÇÃO DE COMMITS:
echo PRIMEIRO repo: 
git rev-parse origin/main
echo SEGUNDO repo: 
git rev-parse seguinte/main
echo.
echo Histórico segundo repo:
git log seguinte/main --oneline -3
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
