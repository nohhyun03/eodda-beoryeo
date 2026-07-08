# 어따버려 MVP

AI가 업로드된 쓰레기 사진을 분석해서 한국의 분리배출 규정에 맞는 안내를 제공하는 MVP 웹서비스입니다.

## 프로젝트 구조

```text
project/
├─ frontend/          # 화면 코드 (index.html, app.js)
├─ backend/           # 서버, API, DB 코드
│  ├─ .env            # 로컬 환경변수 설정 파일
│  ├─ .env.example    # 환경변수 템플릿 파일
│  ├─ app.db          # SQLite DB 파일
│  ├─ uploads/        # 업로드된 이미지 보관 폴더
│  └─ app/
│     ├─ database.py  # 데이터베이스 연결 설정
│     ├─ main.py      # FastAPI 엔드포인트 및 Gemini 연동
│     └─ models.py    # 데이터베이스 모델 정의
├─ data/              # 샘플 시연용 데이터 폴더
├─ docs/              # 보고서, 발표자료, 설계문서 폴더
├─ .venv/             # Python 가상환경
├─ requirements.txt    # 백엔드 실행에 필요한 라이브러리 목록
├─ README.md          # 프로젝트 소개 및 실행 가이드
├─ run.bat            # 백엔드 서버 실행 스크립트 (Windows)
└─ run.sh             # 백엔드 서버 실행 스크립트 (Linux/macOS)
```

`.venv`, `backend/uploads`, `backend/app.db`는 실행 중 생성되거나 사용되는 환경/데이터 파일입니다.

## 실행 전 준비

백엔드는 Python + FastAPI + SQLAlchemy + SQLite 기반입니다.

1. `backend/.env` 파일에 Gemini API 키를 넣습니다.

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Python 가상환경을 준비합니다.

```powershell
cd backend
python -m venv .venv
```

3. 패키지를 설치합니다.

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 데모 실행

발표나 제출용으로는 이 순서만 따르면 됩니다. 터미널은 2개를 씁니다.

### 1) 백엔드 터미널

프로젝트 루트에서 PowerShell을 열고 아래 명령을 입력합니다.

```powershell
cd c:\Users\nohhy\Desktop\project
.\run.bat
```

이 명령으로 백엔드가 `http://127.0.0.1:8000`에서 실행됩니다.

### 2) 프론트엔드 터미널

새 터미널을 하나 더 열고, 같은 프로젝트 루트에서 아래처럼 입력합니다.

```powershell
cd c:\Users\nohhy\Desktop\project
.\.venv\Scripts\python.exe -m http.server 5500 --bind 0.0.0.0 --directory frontend
```

이 명령으로 프론트엔드가 `http://127.0.0.1:5500/`에서 실행됩니다.

### 3) 브라우저에서 열기

브라우저는 아래 주소로 접속합니다.

```text
http://127.0.0.1:5500/
```

같은 Wi-Fi의 다른 기기에서 접속하려면 노트북 IP를 사용합니다.

```text
http://내노트북IP:5500/
```

### 한 번에 보는 실행 순서

1. `backend/.env` 파일에 Gemini API 키가 들어 있는지 확인합니다.
2. 백엔드 터미널에서 `run.bat`을 실행합니다.
3. 프론트엔드 터미널에서 `.\.venv\Scripts\python.exe -m http.server 5500 --bind 0.0.0.0 --directory frontend`를 실행합니다.
4. 브라우저에서 `http://127.0.0.1:5500/`을 엽니다.

예시:

```text
http://192.168.0.9:5500/
http://192.168.0.9:8000/docs
```

## 로컬 실행 참고

이 부분은 개발 중 확인할 때만 보면 됩니다. 발표/데모 때는 위의 데모 실행만 따르면 됩니다.

- 백엔드만 확인할 때는 `cd backend` 후 `.\run.bat`을 실행해도 됩니다. (단, 현재는 데이터베이스 설정과 환경변수 파일이 모두 `backend/` 폴더 내에 있으므로 백엔드 폴더 내부에서 백엔드를 직접 실행하여도 `backend/app.db`를 안전하게 사용합니다.)
- 프론트엔드는 `frontend/index.html`을 Live Server로 열어도 됩니다.
- 정적 서버를 직접 띄우고 싶으면 `.\.venv\Scripts\python.exe -m http.server 5500 --bind 0.0.0.0 --directory frontend`를 사용합니다.

## 동작 흐름

1. 홈 화면에서 사진을 선택합니다.
2. 브라우저가 `device_token`을 `localStorage`에 저장합니다.
3. 이미지가 백엔드의 `POST /api/analyze`로 전송됩니다.
4. 백엔드는 Gemini API로 이미지를 분석하고 결과를 저장합니다.
5. 프론트엔드는 결과 화면에서 쓰레기 종류와 분리배출 안내를 표시합니다.

## 참고

- 프론트엔드와 백엔드는 서로 다른 출처에서 실행되므로 CORS 허용이 필요합니다.