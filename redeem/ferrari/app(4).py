import requests
import time
import json
from pathlib import Path

TARGET_URL = "https://pubgmferrari.com/wp-admin/admin-ajax.php?action=bitforms_submit_form"

HEADERS = {
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "ko-KR,ko;q=0.9,en-AS;q=0.8,en;q=0.7,en-US;q=0.6,ja;q=0.5",
    "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryUfaGSfhGkk3NBvEr",
    "origin": "https://pubgmferrari.com",
    "priority": "u=1, i",
    "referer": "https://pubgmferrari.com/",
    "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
}

FIXED_DATA = {
    "csrf": "cwjnQCB9o0IO8o8VlpygG/ooZsNNMRBzL/neVvAV2K4=",
    "t_identity": "JnMf7Q3KzM0ikDq0WnvQFrEgN4jxaD6mQAnRND9BbuQ=",
    "b_h_t": "WDJKcGRHWnZjbTF6WHpKZk1UYzROVGc1TkRRek1GOD0=",
    "bitforms_id": "bitforms_2",
    "text-b2-2": "K",
    "text-b2-8": "K",
    "advanced-datetime-2-15": "01/12/2000",
    "check-2-6[]": "* I have read and understood Ferrari S.p.A. Privacy Notice.",
    "check-2-13[]": "I'd love to receive exclusive news, updates, and special marketing offers from Ferrari S.p.A.",
    "hidden_fields": "b2-7,b2-9,b2-11,b2-12"
}

def read_emails(file_path=None):
    # GitHub/Colab에서 어느 위치에서 실행해도 스크립트 옆의 파일을 찾도록 함
    if file_path is None:
        file_path = Path(__file__).resolve().parent / "email.txt"
    else:
        file_path = Path(file_path)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            emails = [line.strip() for line in f if line.strip()]
        return emails
    except FileNotFoundError:
        print(f"⚠️ {file_path} 파일을 찾을 수 없습니다.")
        print("📧 테스트할 이메일을 한 줄에 하나씩 입력하세요.")
        print("✅ 입력을 마치면 빈 줄에서 Enter를 누르세요.")

        emails = []
        while True:
            email = input("이메일: ").strip()
            if not email:
                break
            emails.append(email)

        return emails

def build_multipart_form_data(email):
    boundary = "----WebKitFormBoundaryUfaGSfhGkk3NBvEr"
    lines = []
    
    fields = {
        "csrf": FIXED_DATA["csrf"],
        "t_identity": FIXED_DATA["t_identity"],
        "b_h_t": FIXED_DATA["b_h_t"],
        "WDJKcGRHWnZjbTF6WHpKZk1UYzROVGc1TkRRek1GOD0=": "",
        "bitforms_id": FIXED_DATA["bitforms_id"],
        "text-b2-2": FIXED_DATA["text-b2-2"],
        "text-b2-8": FIXED_DATA["text-b2-8"],
        "email-b2-5": email,  # 여기만 변경!
        "date-2-9": "",
        "advanced-datetime-2-15": FIXED_DATA["advanced-datetime-2-15"],
        "check-2-6[]": FIXED_DATA["check-2-6[]"],
        "check-2-13[]": FIXED_DATA["check-2-13[]"],
        "advanced-datetime-2-11": "",
        "hidden_fields": FIXED_DATA["hidden_fields"]
    }
    
    for name, value in fields.items():
        lines.append(f"--{boundary}")
        lines.append(f'Content-Disposition: form-data; name="{name}"')
        lines.append("")
        lines.append(str(value))
    
    lines.append(f"--{boundary}--")
    lines.append("")
    
    return "\r\n".join(lines).encode("utf-8")

def submit_form(email):
    try:
        data = build_multipart_form_data(email)
        response = requests.post(TARGET_URL, data=data, headers=HEADERS)
        return response.status_code, response.text
    except Exception as e:
        return None, str(e)

def main():
    print("🚀 폼 제출 자동화 시작!")
    print("📁 email.txt 파일 읽는 중...")
    
    emails = read_emails()
    
    if not emails:
        print("❌ email.txt에 이메일이 없거나 파일이 없습니다.")
        return
    
    print(f"📧 총 {len(emails)}개의 이메일을 찾았습니다.")
    print("-" * 50)
    
    results = []
    success_count = 0
    
    for idx, email in enumerate(emails, 1):
        print(f"[{idx}/{len(emails)}] 📤 전송 중: {email}")
        status, response = submit_form(email)
        
        if status == 200:
            success_count += 1
            print(f"   ✅ 성공 (200)")
        else:
            print(f"   ❌ 실패 (status: {status})")
            if status is None:
                print(f"   ⚠️ 에러: {response}")
        
        results.append({
            "email": email,
            "status_code": status,
            "response": response if status == 200 else f"Error: {response}"
        })
        
        if idx < len(emails):
            time.sleep(0.1)
    
    print("-" * 50)
    print(f"📊 완료! 총 {len(emails)}개 중 {success_count}개 성공")
    
    with open("results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("📄 결과가 results.json 파일로 저장되었습니다.")

if __name__ == "__main__":
    main()
