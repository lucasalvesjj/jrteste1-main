@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudanças.
) else (
    git commit -m "auto backup %date% %time%"
    git push
)