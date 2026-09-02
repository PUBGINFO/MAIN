import argparse
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlencode, urlparse, urlunparse

import requests


class PUBGRedeemer:
    """PUBG Mobile coupon redeemer that works from Colab or any Git checkout."""

    def __init__(self, data_dir=None, base_url=None):
        self.base_url = (
            base_url
            or os.environ.get(
                "PUBG_BASE_URL",
                "https://na.apps.amsoveasea.com/swoole/",
            )
        )
        self.data_dir = (
            Path(data_dir).expanduser().resolve() if data_dir else None
        )
        self.script_dir = Path(__file__).resolve().parent
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/150.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Origin": "https://www.pubgmobile.com",
                "Referer": "https://www.pubgmobile.com/",
            }
        )

    def _candidate_dirs(self):
        """Find input files whether they live in /content or inside the repo."""
        dirs = []
        if self.data_dir:
            dirs.append(self.data_dir)

        dirs.extend(
            [
                Path.cwd(),
                self.script_dir,
                self.script_dir.parent,
                self.script_dir.parent.parent,
            ]
        )

        unique_dirs = []
        seen = set()
        for directory in dirs:
            directory = directory.resolve()
            if directory not in seen:
                unique_dirs.append(directory)
                seen.add(directory)
        return unique_dirs

    def resolve_input_file(self, filename):
        requested = Path(filename).expanduser()
        if requested.is_absolute():
            candidates = [requested]
        else:
            candidates = [directory / requested for directory in self._candidate_dirs()]

        for candidate in candidates:
            if candidate.is_file():
                return candidate

        searched = "\n".join(f"  - {candidate}" for candidate in candidates)
        raise FileNotFoundError(
            f"입력 파일을 찾을 수 없습니다: {filename}\n검색한 위치:\n{searched}"
        )

    def read_lines(self, filename):
        path = self.resolve_input_file(filename)
        with path.open("r", encoding="utf-8-sig") as file:
            return [line.strip() for line in file if line.strip()]

    def parse_url(self, url):
        parsed = urlparse(url.strip())
        params = parse_qs(parsed.query)

        return {
            "roleid": params.get("roleid", [None])[0],
            "sCdk": params.get("sCdk", [None])[0],
            "verifyKey": unquote(params.get("verifyKey", [None])[0] or ""),
            "full_url": url.strip(),
        }

    @staticmethod
    def redact_url(url):
        """Do not expose verifyKey in notebook output or saved result logs."""
        parsed = urlparse(url)
        params = parse_qs(parsed.query, keep_blank_values=True)
        if "verifyKey" in params:
            params["verifyKey"] = ["[redacted]"]
        return urlunparse(parsed._replace(query=urlencode(params, doseq=True)))

    def exchange_cdk(self, role_id, cdk, verify_key):
        params = {
            "actid": "1692",
            "r": "ExchangeCdkey/ExchangeCdk",
            "sServiceType": "pubgmobile",
            "roleid": role_id,
            "sCdk": cdk,
            "verifyKey": verify_key,
            "areaid": "1",
            "platid": "0",
            "partition": "0",
            "responsetype": "1",
        }

        try:
            response = self.session.get(self.base_url, params=params, timeout=15)
            if response.status_code != 200:
                return {"error": f"HTTP {response.status_code}"}

            payload = response.json()
            if not isinstance(payload, dict):
                return {"error": "API 응답 형식이 올바르지 않습니다."}
            return payload
        except requests.RequestException as error:
            return {"error": f"네트워크 오류: {error}"}
        except ValueError:
            return {"error": "API가 JSON이 아닌 응답을 반환했습니다."}

    @staticmethod
    def as_int(value, default=None):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def get_error_message(self, error_code):
        error_messages = {
            10204: "✅ 교환 성공",
            -10001: "❌ 유효하지 않은 쿠폰 코드",
            -10002: "❌ 이미 사용된 쿠폰",
            -10003: "❌ 만료된 쿠폰",
            -10004: "❌ UID 불일치",
            -10005: "❌ 이미 사용했거나 유효하지 않은 쿠폰",
            -10006: "⚠️ 서버 내부 오류 (재시도 필요)",
            -10007: "❌ 쿠폰 교환 한도 초과",
            -10008: "❌ 일일 교환 한도 초과",
        }
        return error_messages.get(
            error_code,
            f"❌ 알 수 없는 오류 (코드: {error_code})",
        )

    def redeem_with_url(
        self,
        url,
        target_ids=None,
        max_retries=3,
        delay_seconds=1.0,
    ):
        url_info = self.parse_url(url)

        if not all(
            [url_info["roleid"], url_info["sCdk"], url_info["verifyKey"]]
        ):
            return {
                "error": "URL에서 필수 정보를 추출할 수 없습니다.",
                "url_info": url_info,
            }

        print("\n📋 URL에서 추출한 정보:")
        print(f"   - UID: {url_info['roleid']}")
        print(f"   - 쿠폰 코드: {url_info['sCdk']}")
        print("   - verifyKey: [redacted]")

        if target_ids is None:
            try:
                target_ids = self.read_lines("id.txt")
            except FileNotFoundError as error:
                return {"error": str(error)}
            except OSError as error:
                return {"error": f"id.txt 파일 읽기 오류: {error}"}

        if not target_ids:
            return {"error": "처리할 UID가 없습니다."}

        print(f"\n📋 총 {len(target_ids)}개의 UID를 발견했습니다.")

        results = {
            "source_url": self.redact_url(url),
            "source_info": {
                **url_info,
                "full_url": self.redact_url(url_info["full_url"]),
                "verifyKey": "[redacted]",
            },
            "success": [],
            "failed": [],
            "total": len(target_ids),
            "timestamp": datetime.now().isoformat(),
        }

        for index, role_id in enumerate(target_ids, 1):
            print(f"\n{'=' * 50}")
            print(f"[{index}/{len(target_ids)}] {role_id}", end=" ")

            result = self.redeem_single(
                role_id=role_id,
                cdk=url_info["sCdk"],
                verify_key=url_info["verifyKey"],
                max_retries=max_retries,
            )

            if result["success"]:
                results["success"].append(result)
                print("-> 성공")
            else:
                results["failed"].append(result)
                print(f"-> 실패: {result['message']}")

            if index < len(target_ids) and delay_seconds > 0:
                time.sleep(delay_seconds)

        return results

    def redeem_single(self, role_id, cdk, verify_key, max_retries=3):
        result = {
            "role_id": role_id,
            "success": False,
            "message": "",
            "raw_response": None,
            "retries": 0,
        }

        for attempt in range(1, max_retries + 1):
            if attempt > 1:
                wait_time = min(2 ** attempt, 30)
                print(
                    f"\n   ⏳ {wait_time}초 후 재시도 "
                    f"{attempt}/{max_retries}...",
                    end=" ",
                )
                time.sleep(wait_time)

            result["retries"] = attempt
            exchange_result = self.exchange_cdk(role_id, cdk, verify_key)

            if "error" in exchange_result:
                if attempt < max_retries:
                    print("⚠️ 오류, 재시도 중...", end=" ")
                    continue
                result["message"] = f"API 오류: {exchange_result['error']}"
                return result

            result["raw_response"] = exchange_result

            outer_ret = self.as_int(exchange_result.get("iRet"), -999)
            if outer_ret != 0:
                if attempt < max_retries:
                    print("⚠️ iRet 오류, 재시도 중...", end=" ")
                    continue
                result["message"] = f"교환 실패 (iRet: {exchange_result.get('iRet')})"
                return result

            jdata = exchange_result.get("jData", {})
            if not isinstance(jdata, dict):
                result["message"] = "API 응답의 jData 형식이 올바르지 않습니다."
                return result

            inner_ret = self.as_int(jdata.get("iRet"), -999)
            if inner_ret == -10006 and attempt < max_retries:
                print("⚠️ 서버 오류, 재시도 중...", end=" ")
                continue

            if inner_ret != 0:
                result["message"] = self.get_error_message(inner_ret)
                return result

            result["success"] = True
            result["message"] = "✅ 교환 성공!"
            return result

        result["message"] = f"최대 재시도 횟수({max_retries}) 초과"
        return result


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="PUBG Mobile 쿠폰 교환기 (Google Colab/GitHub 호환)"
    )
    parser.add_argument(
        "--data-dir",
        default=os.environ.get("PUBG_DATA_DIR"),
        help="v.txt와 id.txt가 있는 폴더",
    )
    parser.add_argument(
        "--url-file",
        default=os.environ.get("PUBG_URL_FILE", "v.txt"),
        help="쿠폰 URL 목록 파일 (기본값: v.txt)",
    )
    parser.add_argument(
        "--id-file",
        default=os.environ.get("PUBG_ID_FILE", "id.txt"),
        help="UID 목록 파일 (기본값: id.txt)",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="UID별 최대 재시도 횟수 (기본값: 3)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="UID 사이 대기 시간(초) (기본값: 1)",
    )
    args = parser.parse_args(argv)

    if args.retries < 1:
        parser.error("--retries는 1 이상이어야 합니다.")
    if args.delay < 0:
        parser.error("--delay는 0 이상이어야 합니다.")

    print("=" * 60)
    print("🎮 PUBG Mobile 쿠폰 등록기")
    print("=" * 60)

    redeemer = PUBGRedeemer(data_dir=args.data_dir)

    try:
        urls = redeemer.read_lines(args.url_file)
        target_ids = redeemer.read_lines(args.id_file)
    except FileNotFoundError as error:
        print(f"❌ {error}")
        return
    except OSError as error:
        print(f"❌ 입력 파일 읽기 오류: {error}")
        return

    if not urls:
        print(f"❌ {args.url_file} 파일에 URL이 없습니다.")
        return
    if not target_ids:
        print(f"❌ {args.id_file} 파일에 UID가 없습니다.")
        return

    print(f"\n📋 총 {len(urls)}개의 URL, {len(target_ids)}개의 UID를 발견했습니다.")
    all_results = []

    for index, url in enumerate(urls, 1):
        print(f"\n{'=' * 60}")
        print(f"[{index}/{len(urls)}] URL 처리 중...")
        print(f"🔗 {redeemer.redact_url(url)[:100]}")

        result = redeemer.redeem_with_url(
            url,
            target_ids=target_ids,
            max_retries=args.retries,
            delay_seconds=args.delay,
        )

        if "error" in result:
            print(f"❌ 오류: {result['error']}")
            continue

        all_results.append(result)
        print("\n📊 URL 처리 결과:")
        print(f"   ✅ 성공: {len(result['success'])}개")
        print(f"   ❌ 실패: {len(result['failed'])}개")

    print("\n" + "=" * 60)
    print("✅ 모든 작업이 완료되었습니다!")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다.")
    except Exception as error:
        print(f"\n❌ 예상치 못한 오류 발생: {error}")
