from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite:///{BASE_DIR}/app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    # FastAPI dependency로 세션을 열고 닫아 요청 단위로 누수를 방지한다.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()