@echo off
chcp 65001 >nul
echo ==========================================
echo  SINCRONIZACAO GIT - FALANDO COMO PROFETA
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando status...
git status --short

echo.
echo [2/5] Adicionando alteracoes...
git add -A
git status --short

echo.
echo [3/5] Criando commit...
git commit -m "update: sincronizacao automatica" 2>nul || echo Nada para commitar ou commit ja existe

echo.
echo [4/5] Verificando branch...
git branch --show-current

echo.
echo [5/5] Enviando para GitHub...
git push origin app-com-supabase 2>&1

echo.
echo ==========================================
echo  VERIFICACAO FINAL
echo ==========================================
echo Local:  
git rev-parse HEAD
echo Remote: 
git rev-parse origin/app-com-supabase 2>nul || echo Nao foi possivel verificar remote

echo.
echo Se LOCAL e REMOTE forem iguais, sincronizacao OK!
echo.
pause
