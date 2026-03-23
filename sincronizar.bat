@echo off
cd /d "C:\CAMINHO\DO\PROJETO"

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push
)
