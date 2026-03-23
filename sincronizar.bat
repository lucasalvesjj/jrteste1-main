@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM LÓGICA ORIGINAL (backup automático)
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push
)

REM VERIFICA REMOTE
git remote | findstr /C:"seguinte" >nul
if errorlevel 1 (
    git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
)

REM *** FORÇA TOTAL - BYPASSSA TUDO ***
git push seguinte +main:main
echo ✓ comercial-jr-2 FORÇADO com sucesso!
pause

REM MOSTRA ÚLTIMAS 3 ALTERAÇÕES NO SEGUNDO REPO
git log seguinte/main --oneline -3
pause