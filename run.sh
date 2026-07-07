#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")"

if [ -f .venv/bin/activate ]; then
  . .venv/bin/activate
elif [ -f venv/bin/activate ]; then
  . venv/bin/activate
elif [ -f backend/.venv/bin/activate ]; then
  . backend/.venv/bin/activate
elif [ -f ../.venv/bin/activate ]; then
  . ../.venv/bin/activate
else
  echo "가상환경을 찾을 수 없습니다. 프로젝트 루트의 .venv 또는 backend 폴더의 가상환경을 확인해 주세요."
  exit 1
fi

uvicorn --app-dir backend app.main:app --reload