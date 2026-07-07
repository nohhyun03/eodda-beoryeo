@echo off
setlocal

cd /d %~dp0

if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else if exist backend\.venv\Scripts\activate.bat (
    call backend\.venv\Scripts\activate.bat
) else if exist backend\venv\Scripts\activate.bat (
    call backend\venv\Scripts\activate.bat
) else (
    echo 가상환경을 찾을 수 없습니다. 프로젝트 루트의 .venv 또는 backend 폴더의 가상환경을 확인해 주세요.
    exit /b 1
)

rem LAN 데모용으로 모든 네트워크 인터페이스에서 접속 가능하게 연다.
uvicorn --app-dir backend app.main:app --host 0.0.0.0 --reload