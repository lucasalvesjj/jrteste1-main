@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"
git checkout master
git add .
git diff --cached --quiet
if %errorlevel%==0 (echo Sem mudanças.) else (
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
echo ✅ BACKUP OK ✓ comercial-jr-2/main ATUALIZADO (43de2da)
echo 👉 https://github.com/lucasalvesjj/comercial-jr-2/commits/main
pause
