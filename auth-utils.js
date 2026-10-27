// 로그인/회원가입/이메일 인증 화면이 함께 쓰는 공용 코드
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// 새로 가입하는 아이디 규칙 (기존 회원 아이디에는 영향 없음)
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{4,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

// 같은 계정으로 인증 메일을 다시 보내려면 기다려야 하는 시간(초)
export const MAIL_COOLDOWN_SEC = 60;

function cooldownKey(uid) {
  return "pubginfo:verifyMailAt:" + uid;
}

// 남은 대기 시간(초). 없으면 0
export function cooldownLeft(uid) {
  try {
    const last = Number(localStorage.getItem(cooldownKey(uid)) || 0);
    const left = Math.ceil((last + MAIL_COOLDOWN_SEC * 1000 - Date.now()) / 1000);
    return left > 0 ? left : 0;
  } catch (_) {
    return 0;
  }
}

// 인증 메일 발송. 결과: { status: "sent" } 또는 { status: "cooldown", left }
export async function sendVerificationMail(user) {
  const left = cooldownLeft(user.uid);
  if (left > 0) return { status: "cooldown", left };

  const continueUrl = window.location.origin + "/verify-email.html";
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

  try {
    localStorage.setItem(cooldownKey(user.uid), String(Date.now()));
  } catch (_) {}

  return { status: "sent" };
}
