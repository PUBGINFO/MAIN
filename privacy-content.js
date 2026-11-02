// 개인정보 처리방침 공용 코드: 기본 초안 + 화면 그리기
// 글 서식(관리자 수정 화면에서 쓰는 방식)
//   # 제목            → 큰 제목
//   ## 소제목         → 소제목
//   - 내용            → 목록
//   | 항목 | 내용 |   → 표 (연속된 줄이 하나의 표)
//   그 외 문장        → 문단 (빈 줄로 문단 구분)

export const POLICY_COLLECTION = "siteContent";
export const POLICY_ID = "privacy";
export const POLICY_MAX_LENGTH = 40000;

export const DEFAULT_TEXT = `# 개인정보 처리방침
시행일: [YYYY년 M월 D일]

PUBG INFO(이하 “서비스”)는 회원가입과 계정 관리에 필요한 최소한의 개인정보만 처리하며, 개인정보 보호법 등 관련 법령을 지키기 위해 아래와 같이 처리방침을 공개합니다.

## 1. 처리하는 개인정보 항목과 목적, 보유 기간
| 항목 | 아이디, 이메일 주소, 비밀번호(암호화되어 저장되며 운영자는 볼 수 없음), 가입 일시 |
| 처리 목적 | 회원 식별 및 로그인, 이메일 인증, 비밀번호 재설정 안내, 부정 이용 방지, 문의 응대 |
| 보유·이용 기간 | 회원 정보 삭제를 요청하거나 운영자가 삭제할 때까지. 법령에서 보관을 요구하는 정보가 있으면 그 기간 동안 보관합니다. |
| 동의 거부 | 개인정보 수집·이용에 동의하지 않을 수 있으며, 이 경우 회원가입과 로그인이 필요한 서비스를 이용할 수 없습니다. |

서비스는 마케팅 목적의 정보를 수집하거나 광고성 메시지를 보내지 않습니다.

## 2. 제3자 제공
서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거가 있는 경우는 예외입니다.

## 3. 개인정보 처리 위탁 및 국외 보관
| 수탁자 | Google LLC (Firebase Authentication, Cloud Firestore) |
| 위탁 업무 | 회원 인증, 이메일 발송, 회원 정보 저장 및 관리 |
| 이전·보관 국가 | [Google 데이터센터 소재지. Firebase Console > Firestore Database 설정에서 위치를 확인해 적어주세요] |
| 이전 항목 | 아이디, 이메일 주소, 암호화된 비밀번호, 가입 일시 |
| 이전 시기·방법 | 회원가입 및 서비스 이용 시 네트워크를 통해 전송 |
| 이용 목적·보유 기간 | 위 1항과 같음. 회원 정보 삭제 시 함께 삭제됨 |
| 이전 거부 | 국외 보관을 원하지 않는 경우 회원가입을 하지 않을 수 있으며, 이 경우 로그인이 필요한 서비스를 이용할 수 없습니다. |

웹사이트는 GitHub Pages(GitHub, Inc.)를 통해 제공되며, 접속 과정에서 IP 주소 등 접속 기록이 해당 업체에 의해 처리될 수 있습니다.

## 4. 파기 절차와 방법
보유 기간이 끝났거나 삭제 요청을 받으면 지체 없이 회원 정보를 삭제합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다.

## 5. 정보주체의 권리와 행사 방법
이용자는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다. 아래 연락처로 요청해주시면 확인 후 지체 없이 조치합니다.

## 6. 개인정보 보호책임자
| 성명 | [이름 또는 운영자 명칭] |
| 연락처 | [문의용 이메일 주소] |

## 7. 자동으로 수집되는 정보(로그인 유지 장치)
서비스는 로그인 상태를 유지하기 위해 이용자의 브라우저 저장소(IndexedDB, localStorage)에 로그인 정보(토큰)를 저장합니다. 로그아웃하거나 브라우저의 사이트 데이터를 삭제하면 제거되며, 브라우저 설정으로 저장을 차단할 수 있습니다. 다만 차단하면 로그인이 필요한 기능을 이용할 수 없습니다.

## 8. 만 14세 미만 아동
서비스는 만 14세 미만 아동의 회원가입을 받지 않으며, 가입 화면에서 이를 안내합니다.

## 9. 안전성 확보 조치
비밀번호는 Firebase Authentication에서 암호화되어 저장되며 운영자도 확인할 수 없습니다. 회원 정보는 접근 권한이 제한된 데이터베이스에 저장되고, 관리자 계정만 열람할 수 있습니다.

## 10. 처리방침의 변경
이 처리방침이 변경되면 시행일과 변경 내용을 이 페이지에 공지합니다.
개정 이력: [YYYY.MM.DD 최초 공개]
`;

function el(tag, text) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
}

// 글을 화면 요소로 바꾼다. innerHTML을 쓰지 않고 textContent만 사용하므로 안전하다.
export function renderPolicy(text, root) {
  root.textContent = "";
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  const isSpecial = (t) => t.startsWith("# ") || t.startsWith("## ") || t.startsWith("- ") || t.startsWith("|");

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    if (line.startsWith("## ")) { root.append(el("h2", line.slice(3))); i++; continue; }
    if (line.startsWith("# ")) { root.append(el("h1", line.slice(2))); i++; continue; }

    if (line.startsWith("- ")) {
      const ul = el("ul");
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        ul.append(el("li", lines[i].trim().slice(2)));
        i++;
      }
      root.append(ul);
      continue;
    }

    if (line.startsWith("|")) {
      const table = el("table");
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().split("|").map((c) => c.trim());
        cells.shift();
        if (cells.length && cells[cells.length - 1] === "") cells.pop();
        const tr = el("tr");
        cells.forEach((cell, idx) => tr.append(el(idx === 0 ? "th" : "td", cell)));
        table.append(tr);
        i++;
      }
      root.append(table);
      continue;
    }

    // 문단: 이어지는 일반 줄을 한 문단으로 묶는다 (줄바꿈 유지)
    const p = el("p");
    let first = true;
    while (i < lines.length && lines[i].trim() && !isSpecial(lines[i].trim())) {
      if (!first) p.append(document.createElement("br"));
      p.append(document.createTextNode(lines[i].trim()));
      first = false;
      i++;
    }
    root.append(p);
  }
}
