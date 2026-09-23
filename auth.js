import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// 로그인 상태 확인
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // 로그인하지 않은 경우 로그인 페이지로 이동
    window.location.href = "/login.html";
  }
});
