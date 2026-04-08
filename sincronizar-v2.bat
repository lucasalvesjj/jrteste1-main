@echo off
cd /d "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main"

echo ================================================
echo   SINCRONIZAR v2
echo   source code -> jrteste1-main (origin)
echo   build dist/ -> comercial-jr-2 (seguinte)
echo ================================================
echo.

git checkout master

REM Garante que o remoto "seguinte" existe
git remote | findstr /C:"seguinte" >nul || git remote add seguinte https://github.com/lucasalvesjj/comercial-jr-2.git

REM ================================================
REM PARTE 1: Commit e push do codigo fonte para origin
REM ================================================
echo.
echo [1/3] Commitando alteracoes no codigo fonte...
git add -A -- . ":!dist" ":!deploy"
git diff --cached --quiet
if %errorlevel%==0 (
    echo Sem mudancas no codigo fonte.
) else (
    git commit -m "auto backup %date% %time%"
)

echo.
echo [2/3] Enviando codigo fonte para jrteste1-main...
git push origin master --force
if %errorlevel% neq 0 (
    echo [ERRO] Push para jrteste1-main falhou!
    pause
    exit /b 1
)

REM ================================================
REM PARTE 2: Push do dist/ para comercial-jr-2
REM ================================================
echo.
echo [3/3] Enviando build para comercial-jr-2...

if not exist "dist\index.html" (
    echo [AVISO] dist/index.html nao encontrado.
    echo Execute "npm run build:production" antes de sincronizar.
    pause
    exit /b 1
)

REM Cria repo temporario dentro de dist/
cd dist
git init
git checkout -b main
git add -A
git commit -m "deploy: %date% %time% (from jrteste1-main)"
git remote add origin https://github.com/lucasalvesjj/comercial-jr-2.git
git push origin main --force

REM Limpa o .git temporario
cd ..
rmdir /s /q dist\.git

echo.
echo ================================================
echo   SINCRONIZACAO COMPLETA
echo.
echo   Codigo fonte: https://github.com/lucasalvesjj/jrteste1-main/commits/master
echo   Build prod:   https://github.com/lucasalvesjj/comercial-jr-2/commits/main
echo ================================================
pause
