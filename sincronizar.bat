@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

git checkout master

REM Garante que o remoto "seguinte" existe
git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git

REM Commita se houver mudancas
git add .
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudancas para commitar.
) else (
    git commit -m "auto backup %date% %time%"
)

REM Push para os dois repos em paralelo (force para evitar rejeicoes por commits do GitHub Actions)
echo.
echo Enviando para jrteste1-main...
git push origin master --force

echo.
echo Enviando para comercial-jr-2...
git push seguinte master:main --force

echo.
echo ════════════════════════════════════════
echo ✅ AMBOS OS REPOS ATUALIZADOS E CLONADOS
echo 👉 https://github.com/lucasalvesjj/jrteste1-main/commits/master
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
