@echo off
cd /d "C:\CAMINHO\DO\SEU\PROJETO"

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo Nada para commitar.
) else (
    git commit -m "auto update"
    git push
)

pause