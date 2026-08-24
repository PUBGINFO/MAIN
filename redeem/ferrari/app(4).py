import requests
import time
import json
# ==========================================
# 네가 소유한 테스트 서버의 POST 주소
# ==========================================
TEST_URL = "https://pubgmferrari.com/wp-admin/admin-ajax.php?action=bitforms_submit_form"
def submit_form(email):
    """
    테스트 서버에 실제 POST 요청을 보냅니다.
    """
    try:
        data = {
            "email": email
        }
        response = requests.post(
            TEST_URL,
            json=data,
            timeout=10
        )
        return response.status_code, response.text
    except requests.RequestException as e:
        return None, str(e)
def main():
    print("🚀 폼 제출 시작!")
    print("여러 이메일은 쉼표(,)로 구분하세요.")
    print("입력을 끝내려면 end 를 입력하세요.")
    print("-" * 50)
    emails = []
    while True:
        emails_input = input(
            "이메일 입력 (쉼표로 구분 / 종료: end): "
        ).strip()
        if emails_input.lower() == "end":
            break
        if not emails_input:
            continue
        new_emails = [
            email.strip()
            for email in emails_input.split(",")
            if email.strip()
        ]
        emails.extend(new_emails)
    if not emails:
        print("❌ 입력된 이메일이 없습니다.")
        return
    print("-" * 50)
    print(f"📧 총 {len(emails)}개의 이메일을 찾았습니다.")
    print("-" * 50)
    results = []
    success_count = 0
    for idx, email in enumerate(emails, 1):
        print(f"[{idx}/{len(emails)}] 📤 전송 중: {email}")
        status, response = submit_form(email)
        if status is not None:
            print(f"   ✅ HTTP {status}")
            if 200 <= status < 300:
                success_count += 1
        else:
            print(f"   ❌ 요청 실패: {response}")
        results.append({
            "email": email,
            "status_code": status,
            "response": response
        })
        if idx < len(emails):
            time.sleep(0.2)
    print("-" * 50)
    print(
        f"📊 완료! 총 {len(emails)}개 중 "
        f"{success_count}개 성공"
    )
    with open(
        "/content/results.json",
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            results,
            f,
            ensure_ascii=False,
            indent=2
        )
    print("📄 결과 저장 완료: /content/results.json")
if __name__ == "__main__":
    main()
