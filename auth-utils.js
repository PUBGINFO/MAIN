// 로그인/회원가입/이메일 인증 화면이 함께 쓰는 공용 코드
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// 새로 가입하는 아이디 규칙 (기존 회원 아이디에는 영향 없음)
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{4,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

// 메일을 보낸 뒤 다시 보내려면 기다려야 하는 시간(초)
export const MAIL_COOLDOWN_SEC = 60;
// Firebase가 '요청이 너무 많음'으로 막았을 때, 이 기기에서 다시 시도하지 않을 시간(초)
export const LIMIT_BLOCK_SEC = 15 * 60;

function sentKey(uid) { return "pubginfo:verifyMailAt:" + uid; }
function blockKey(uid) { return "pubginfo:verifyMailBlockUntil:" + uid; }

function secondsLeft(untilMs) {
  const left = Math.ceil((untilMs - Date.now()) / 1000);
  return left > 0 ? left : 0;
}

function readNumber(key) {
  try { return Number(localStorage.getItem(key) || 0); } catch (_) { return 0; }
}

function writeNumber(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (_) {}
}

// 제한에 걸려 막아둔 남은 시간(초)
export function blockLeft(uid) {
  return secondsLeft(readNumber(blockKey(uid)));
}

// 다시 보낼 수 있을 때까지 남은 시간(초). 0이면 지금 가능
export function cooldownLeft(uid) {
  const sentLeft = secondsLeft(readNumber(sentKey(uid)) + MAIL_COOLDOWN_SEC * 1000);
  return Math.max(sentLeft, blockLeft(uid));
}

// 인증 메일 발송. 결과:
//  { status: "sent" } / { status: "cooldown", left } / { status: "limited", left }
export async function sendVerificationMail(user) {
  const blocked = blockLeft(user.uid);
  if (blocked > 0) return { status: "limited", left: blocked };

  const recent = secondsLeft(readNumber(sentKey(user.uid)) + MAIL_COOLDOWN_SEC * 1000);
  if (recent > 0) return { status: "cooldown", left: recent };

  const continueUrl = window.location.origin + "/verify-email.html";
  try {
    try {
      await sendEmailVerification(user, { url: continueUrl });
    } catch (error) {
      // 현재 도메인이 Firebase '승인된 도메인'에 없으면 링크 없이 기본 방식으로 재시도
      if (
        error.code === "auth/unauthorized-continue-uri" ||
        error.code === "auth/invalid-continue-uri"
      ) {
        await sendEmailVerification(user);
      } else {
        throw error;
      }
    }
  } catch (error) {
    // 제한에 걸렸으면 한동안 요청 자체를 보내지 않는다. (계속 누르면 제한이 길어짐)
    if (error.code === "auth/too-many-requests") {
      writeNumber(blockKey(user.uid), Date.now() + LIMIT_BLOCK_SEC * 1000);
      return { status: "limited", left: LIMIT_BLOCK_SEC };
    }
    throw error;
  }

  writeNumber(sentKey(user.uid), Date.now());
  return { status: "sent" };
}

// 남은 시간을 "1분 24초" / "45초" 처럼 정확하게 표기
export function formatWait(sec) {
  const total = Math.max(0, Math.ceil(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? m + "분 " + s + "초" : s + "초";
}
