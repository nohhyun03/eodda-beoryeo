import json
import os
import re
import uuid
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.api_core.exceptions import NotFound
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import ScanHistory, User


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# 이미지 업로드를 디스크에 저장하지 않으므로 UPLOAD_DIR 정의 생략

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

GEMINI_MODEL_CANDIDATES = [
    os.getenv("GEMINI_MODEL_NAME", "gemini-3.5-flash"),
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]

NON_TRASH_PATTERNS = (
    "쓰레기가 아닙니다",
    "쓰레기가 아니",
    "분석할 수 없는",
    "정보 부족",
    "알 수 없",
    "판별할 수 없",
    "not trash",
    "not waste",
    "not garbage",
)

TRASH_CATEGORY_KEYWORDS = (
    "플라스틱",
    "페트",
    "유리",
    "종이",
    "캔",
    "금속",
    "비닐",
    "일반",
    "음식물",
    "스티로폼",
    "건전지",
    "배터리",
    "의류",
)

app = FastAPI(title="어따버려 MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # 프론트엔드가 다른 출처에서 접근하는 MVP 구조라 모든 출처를 허용한다.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_history_schema()


def ensure_history_schema() -> None:
    # 기존 SQLite 파일에 is_favorite 컬럼이 없을 수 있어, 앱 시작 시 보강한다.
    with engine.connect() as connection:
        result = connection.execute(text("PRAGMA table_info(SCAN_HISTORY)"))
        column_names = {row[1] for row in result.fetchall()}

        if "is_favorite" not in column_names:
            connection.execute(text("ALTER TABLE SCAN_HISTORY ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT 0"))
            connection.commit()


def _get_gemini_model() -> genai.GenerativeModel:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY가 설정되어 있지 않습니다.")
    # 환경에 따라 1.5-flash가 사용 불가할 수 있어, 호환 가능한 최신 모델로 순차 폴백한다.
    for model_name in GEMINI_MODEL_CANDIDATES:
        try:
            return genai.GenerativeModel(model_name)
        except NotFound:
            continue

    raise HTTPException(status_code=500, detail="사용 가능한 Gemini 모델을 찾지 못했습니다.")


def _clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _parse_gemini_response(text: str) -> dict:
    cleaned = _clean_json_text(text)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Gemini 응답 JSON 파싱에 실패했습니다.") from exc

    required_keys = ["itemName", "category", "steps", "warning"]
    for key in required_keys:
        if key not in parsed:
            raise HTTPException(status_code=500, detail=f"Gemini 응답에 필수 키가 없습니다: {key}")

    if not isinstance(parsed["steps"], list):
        raise HTTPException(status_code=500, detail="Gemini 응답의 steps는 배열이어야 합니다.")

    return parsed


def _build_prompt() -> str:
    return (
        "첨부된 쓰레기 이미지를 분석해서 한국의 분리배출 규정에 맞춰 안내해 줘. "
        "반드시 JSON 형식으로만 응답해야 해. 다음 키 구조를 정확히 지켜야 해:\n"
        '{"itemName":"...","category":"...","steps":["..."],"warning":"..."}\n'
        "설명, 코드블록, 추가 문장은 절대 포함하지 마."
    )


def _should_store_analysis(parsed: dict) -> bool:
    item_name = str(parsed.get("itemName", "")).strip().lower()
    category = str(parsed.get("category", "")).strip().lower()
    warning = str(parsed.get("warning", "")).strip().lower()
    combined_text = f"{item_name} {category} {warning}"

    if not item_name or not category:
        return False

    if any(pattern.lower() in combined_text for pattern in NON_TRASH_PATTERNS):
        return False

    return any(keyword.lower() in combined_text for keyword in TRASH_CATEGORY_KEYWORDS)


def _normalize_analysis_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().lower()


def _normalize_steps(steps: list) -> list:
    return [_normalize_analysis_text(step) for step in (steps or [])]


def _find_duplicate_history(db: Session, user_id: int, parsed: dict) -> ScanHistory | None:
    item_name = _normalize_analysis_text(parsed.get("itemName", ""))
    category = _normalize_analysis_text(parsed.get("category", ""))
    warning = _normalize_analysis_text(parsed.get("warning", ""))
    steps = _normalize_steps(parsed.get("steps", []))

    histories = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user_id)
        .order_by(ScanHistory.id.desc())
        .all()
    )

    for history in histories:
        if (
            _normalize_analysis_text(history.item_name) == item_name
            and _normalize_analysis_text(history.category) == category
            and _normalize_analysis_text(history.warning) == warning
            and _normalize_steps(history.guide_steps) == steps
        ):
            return history

    return None


def _serialize_scan_history(history: ScanHistory) -> dict:
    return {
        "id": history.id,
        "itemName": history.item_name,
        "category": history.category,
        "steps": history.guide_steps,
        "warning": history.warning,
        "isFavorite": bool(history.is_favorite),
        "createdAt": history.created_at.isoformat() if history.created_at else None,
    }


@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    device_token: str = Form(...),
    db: Session = Depends(get_db),
):

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    user = db.query(User).filter(User.device_token == device_token).first()
    if user is None:
        user = User(device_token=device_token)
        db.add(user)
        db.commit()
        db.refresh(user)

    file_bytes = await image.read()

    try:
        model = _get_gemini_model()
        prompt = _build_prompt()

        try:
            response = model.generate_content(
                [
                    prompt,
                    {
                        "mime_type": image.content_type,
                        "data": file_bytes,
                    },
                ]
            )
        except NotFound:
            for model_name in GEMINI_MODEL_CANDIDATES[1:]:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(
                        [
                            prompt,
                            {
                                "mime_type": image.content_type,
                                "data": file_bytes,
                            },
                        ]
                    )
                    break
                except NotFound:
                    continue
            else:
                raise HTTPException(status_code=500, detail="AI 분석 중 오류가 발생했습니다.")

        response_text = getattr(response, "text", None)
        if not response_text:
            raise ValueError("Gemini 응답이 비어 있습니다.")

        parsed = _parse_gemini_response(response_text)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="AI 분석 중 오류가 발생했습니다.") from exc

    scan_history = None
    if _should_store_analysis(parsed):
        duplicate_history = _find_duplicate_history(db, user.id, parsed)
        if duplicate_history is not None:
            scan_history = duplicate_history
        else:
            scan_history = ScanHistory(
                user_id=user.id,
                image_path=image.filename or "uploaded_image.jpg",
                item_name=parsed["itemName"],
                category=parsed["category"],
                guide_steps=parsed["steps"],
                warning=parsed.get("warning"),
            )
            db.add(scan_history)
            db.commit()
            db.refresh(scan_history)

    return {
        "status": "success",
        "data": {
            "history_id": scan_history.id if scan_history else None,
            "itemName": parsed["itemName"],
            "category": parsed["category"],
            "steps": parsed["steps"],
            "warning": parsed.get("warning"),
            "isFavorite": bool(scan_history.is_favorite) if scan_history else False,
        },
    }


@app.get("/api/history")
def get_history(device_token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.device_token == device_token).first()
    if user is None:
        return {
            "status": "success",
            "data": {
                "totalScans": 0,
                "records": [],
            },
        }

    histories = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == user.id)
        .order_by(ScanHistory.created_at.desc(), ScanHistory.id.desc())
        .all()
    )

    return {
        "status": "success",
        "data": {
            "total_scans": len(histories),
            "totalScans": len(histories),
            "records": [_serialize_scan_history(history) for history in histories],
        },
    }


@app.patch("/api/history/{history_id}/favorite")
def toggle_favorite(history_id: int, db: Session = Depends(get_db)):
    history = db.query(ScanHistory).filter(ScanHistory.id == history_id).first()
    if history is None:
        raise HTTPException(status_code=404, detail="해당 기록을 찾을 수 없습니다.")

    history.is_favorite = not bool(history.is_favorite)
    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "status": "success",
        "data": {
            "id": history.id,
            "isFavorite": bool(history.is_favorite),
        },
    }


@app.delete("/api/history/{history_id}")
def delete_history(history_id: int, db: Session = Depends(get_db)):
    history = db.query(ScanHistory).filter(ScanHistory.id == history_id).first()
    if history is None:
        raise HTTPException(status_code=404, detail="해당 기록을 찾을 수 없습니다.")

    db.delete(history)
    db.commit()

    return {
        "status": "success",
        "data": {
            "id": history_id,
        },
    }