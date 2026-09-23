import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


onAuthStateChanged(auth, async (user) => {

  // 로그인하지 않은 경우
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  // 로그인한 사용자의 정보 가져오기
  const userArea = document.getElementById("user-area");

  if (!userArea) return;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    let username = user.email;

    if (userDoc.exists()) {
      username = userDoc.data().username || user.email;
    }

    userArea.innerHTML = `
      <span class="user-welcome">${username}님 안녕하세요 👋</span>
      <button class="user-logout" id="logout-btn">로그아웃</button>
    `;

    // 로그아웃
    document.getElementById("logout-btn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "/login.html";
    });

  } catch (error) {
    console.error("사용자 정보 불러오기 오류:", error);

    userArea.innerHTML = `
      <span class="user-welcome">${user.email}님 안녕하세요 👋</span>
      <button class="user-logout" id="logout-btn">로그아웃</button>
    `;

    document.getElementById("logout-btn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "/login.html";
    });
  }

});
