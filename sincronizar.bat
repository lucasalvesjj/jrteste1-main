@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

REM Adiciona remote se não existir
git remote | findstr /C:"seguinte" >nul
if errorlevel 1 (
    git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
)

REM LÓGICA ORIGINAL INTACTA
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudancas locais para commit.
) else (
    git commit -m "auto backup %date% %time%"
    git push origin main
)

REM Sincroniza segundo repo (sempre, independente de mudanças locais)
git push seguinte --mirror
echo ✓ comercial-jr-2 sincronizado!
pause
