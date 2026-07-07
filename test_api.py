import argparse
import base64
import mimetypes
from pathlib import Path

import requests


API_URL = "http://127.0.0.1:8000/api/analyze"


_FALLBACK_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7xY1sAAAAASUVORK5CYII="
)


def build_payload(image_path: str | None):
    if image_path:
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"이미지 파일을 찾을 수 없습니다: {path}")

        mime_type, _ = mimetypes.guess_type(str(path))
        return path.name, path.read_bytes(), mime_type or "application/octet-stream"

    return "dummy.png", _FALLBACK_PNG, "image/png"


def main() -> None:
    parser = argparse.ArgumentParser(description="어따버려 API 테스트 스크립트")
    parser.add_argument("--image", help="전송할 로컬 이미지 경로. 생략하면 내장 더미 이미지를 사용합니다.")
    parser.add_argument("--device-token", default="local-test-device-token", help="device_token 값")
    args = parser.parse_args()

    try:
        filename, file_bytes, mime_type = build_payload(args.image)

        files = {
            "image": (filename, file_bytes, mime_type),
        }
        data = {
            "device_token": args.device_token,
        }

        response = requests.post(API_URL, files=files, data=data, timeout=120)
        print(f"status_code: {response.status_code}")

        if not response.ok:
            print("요청은 도착했지만 서버가 성공 응답을 반환하지 않았습니다.")

        try:
            payload = response.json()
            print(payload)
        except ValueError:
            print(response.text)

    except FileNotFoundError as error:
        print(f"파일 오류: {error}")
    except requests.exceptions.Timeout:
        print("요청이 시간 초과되었습니다. 백엔드 서버가 실행 중인지 확인해 주세요.")
    except requests.exceptions.ConnectionError:
        print("백엔드 서버에 연결할 수 없습니다. 먼저 FastAPI 서버를 실행해 주세요.")
    except requests.exceptions.RequestException as error:
        print(f"네트워크 오류가 발생했습니다: {error}")


if __name__ == "__main__":
    main()