# ♻️ 어따버려 (Eodda-Beoryeo)

AI가 업로드된 쓰레기 사진을 분석해서 한국의 분리배출 규정에 맞는 안내를 제공하는 MVP 서비스입니다.

## 프로젝트 구조

```text
project/
├─ frontend/            # 화면 코드 (index.html, app.js)
├─ backend/             # 서버, API, DB 코드
│  ├─ .env              # 로컬 환경변수 설정 파일
│  ├─ .env.example      # 환경변수 템플릿 파일
│  ├─ app.db            # SQLite DB 파일
│  └─ app/
│     ├─ database.py    # 데이터베이스 연결 설정
│     ├─ main.py        # FastAPI 엔드포인트 및 Gemini 연동
│     └─ models.py      # 데이터베이스 모델 정의
├─ data/                # 샘플 시연용 데이터 폴더 (테스트용 이미지)
├─ docs/                # 발표 자료 및 산출물 폴더
│  ├─ presentation.html # 기말 발표용 슬라이드쇼 HTML
│  └─ script.md         # 슬라이드별 발표 대본
├─ .venv/               # Python 가상환경
├─ requirements.txt     # 프로젝트 실행에 필요한 라이브러리 목록
├─ README.md            # 프로젝트 소개 및 실행 가이드
├─ run.bat              # 백엔드 서버 실행 스크립트 (Windows)
└─ run.sh               # 백엔드 서버 실행 스크립트 (Linux/macOS)
```

`.venv`, `backend/app.db`는 실행 중 생성되거나 사용되는 환경/데이터 파일입니다.

## 실행 전 준비

백엔드는 Python + FastAPI + SQLAlchemy + SQLite 기반입니다.

1. `backend/.env` 파일에 Gemini API 키를 넣습니다. (`backend/.env.example` 파일을 복사하여 만듭니다.)

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

2. 프로젝트 루트 디렉토리에서 Python 가상환경을 준비합니다.

```powershell
# 프로젝트 루트 디렉토리(project/)에서 실행합니다.
python -m venv .venv
```

3. 가상환경을 활성화하고 필요한 패키지를 설치합니다.

```powershell
# Windows PowerShell 기준
.venv\Scripts\Activate.ps1

# 라이브러리 설치
pip install -r requirements.txt
```

---

## 데모 실행

발표나 제출용 데모 실행 시 아래의 절차를 따릅니다. 터미널은 총 2개를 사용합니다.

### 1) 백엔드 터미널 (FastAPI)

프로젝트 루트 디렉토리에서 PowerShell을 열고 아래 명령을 실행합니다.

```powershell
# 1. 프로젝트 루트로 이동 (본인의 실제 경로)
cd c:\Users\nohhy\Desktop\project

# 2. 백엔드 실행 스크립트 가동
.\run.bat
```

이 명령을 수행하면 백엔드 서버가 `http://127.0.0.1:8000` 주소에서 시작됩니다.

### 2) 프론트엔드 터미널 (정적 웹 서버)

새 터미널을 하나 더 열고, 동일하게 프로젝트 루트 디렉토리에서 아래 명령을 실행합니다.

```powershell
# 1. 프로젝트 루트로 이동 (본인의 실제 경로)
cd c:\Users\nohhy\Desktop\project

# 2. 내장 HTTP 서버 가동 (프론트엔드 포트 5500 지정)
.\.venv\Scripts\python.exe -m http.server 5500 --bind 0.0.0.0 --directory frontend
```

이 명령을 수행하면 프론트엔드가 `http://127.0.0.1:5500/` 주소에서 구동됩니다.

### 3) 브라우저에서 실행

웹 브라우저를 열고 아래 주소로 접속하여 서비스를 이용합니다.

* **로컬 접속 주소:** `http://127.0.0.1:5500/`
* **모바일 등 외부 기기 동시 접속 시:** 데스크톱/노트북의 사설 IP 주소를 활용하여 접속합니다.
  ```text
  http://[노트북_IP]:5500/
  ```

---

## 동작 흐름

1. **이미지 업로드**: 홈 화면에서 분석할 쓰레기 사진을 선택하여 첨부합니다.
2. **식별 요청**: 브라우저가 디바이스 토큰(로그인 대용)과 함께 이미지를 백엔드의 `POST /api/analyze` API로 보냅니다.
3. **AI 분석**: 백엔드 서버는 구글 Gemini API를 호출하여 이미지 속 사물 정보와 버리는 법 수칙을 해독합니다.
4. **결과 보관**: 분석된 결과와 업로드 정보는 로컬 SQLite 데이터베이스(`app.db`)의 스캔 이력으로 자동 누적됩니다.
5. **결과 출력**: 프론트엔드 화면에 해독된 품목명, 분류 배지, 단계별 배출 요령이 시각적으로 출력됩니다.
6. **마스터리 및 퀴즈**: 이력이 늘어남에 따라 레벨 등급(씨앗~지구 지킴이)이 오르고, 내장 O/X 퀴즈로 상식을 연습할 수 있습니다.