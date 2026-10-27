import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// 로그인·인증 확인이 끝나기 전에는 페이지 내용을 숨겨서 깜빡임을 막는다.
// (이 파일이 로드되지 못하면 이 줄도 실행되지 않으므로 페이지가 빈 화면으로 남지는 않는다.)
const pageRoot = document.documentElement;
pageRoot.style.visibility = "hidden";

function revealPage() {
  pageRoot.style.visibility = "";
}


// 사용자 이름은 innerHTML이 아니라 textContent로 넣는다. (XSS 방지)
function renderUser(userArea, label) {
  userArea.textContent = "";

  const welcome = document.createElement("span");
  welcome.className = "user-welcome";
  welcome.textContent = label + "님 안녕하세요 👋";

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "user-logout";
  logoutBtn.id = "logout-btn";
  logoutBtn.textContent = "로그아웃";
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } finally {
      window.location.replace("/login.html");
    }
  });

  userArea.append(welcome, logoutBtn);
}


onAuthStateChanged(auth, async (user) => {

  // 로그인하지 않은 경우
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  // 이메일 인증을 마치지 않은 기존/신규 회원은 인증 화면으로 이동
  if (!user.emailVerified) {
    window.location.replace("/verify-email.html");
    return;
  }

  let label = user.email || "회원";
  let blocked = false;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.username) label = data.username;
      if (data.disabled === true) blocked = true;
    }
  } catch (error) {
    console.error("사용자 정보 불러오기 오류:", error);
  }

  // 관리자가 차단한 계정은 로그아웃시킨다.
  if (blocked) {
    try { await signOut(auth); } catch (_) {}
    window.location.replace("/login.html?blocked=1");
    return;
  }

  revealPage();

  const userArea = document.getElementById("user-area");
  if (userArea) renderUser(userArea, label);
});
