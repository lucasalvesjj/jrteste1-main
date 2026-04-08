@echo off
echo ================================================
echo   COMERCIAL JR - Build de Producao
echo ================================================
echo.
echo Uso:
echo   build-production.bat             (incrementa patch)
echo   build-production.bat --minor     (incrementa minor)
echo   build-production.bat --major     (incrementa major)
echo   build-production.bat --no-tag    (sem git tag)
echo.

node scripts/build-production.mjs %*

echo.
if %errorlevel% neq 0 (
    echo [ERRO] Build falhou! Verifique os erros acima.
    pause
    exit /b 1
)
echo [OK] Build de producao concluida com sucesso!
echo Verifique a pasta deploy\ para os arquivos ZIP.
pause
