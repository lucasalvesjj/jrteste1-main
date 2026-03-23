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

REM VERIFICA E ADICIONA REMOTE SE NECESSÁRIO
git remote | findstr /C:"seguinte" >nul
if errorlevel 1 (
    git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git
    echo Remote "seguinte" adicionado.
)

REM SINCRONIZA SEGUNDO REPO
git push seguinte main:main --force
echo ✓ comercial-jr-2 atualizado!
pause
