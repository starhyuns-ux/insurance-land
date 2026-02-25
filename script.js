// ✅ 여기를 본인 카카오 링크로 바꾸세요.
// 예) 채널: https://open.kakao.com/o/sdWFlvYh
// 예) 오픈채팅: https://open.kakao.com/o/sdWFlvYh
const KAKAO_CHAT_URL = "https://open.kakao.com/o/sdWFlvYh";
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzuJNkShYMOKqTE1nEuEys9T8qFdc-r0fllh23wHOUnPGvPVmBMsWzGxrjAz29rkK0zWA/exec";
const $ = (sel) => document.querySelector(sel);

const form = $("#consultForm");
const modal = $("#resultModal");
const msgBox = $("#msgBox");
const goKakaoBtn = $("#goKakaoBtn");
const copyBtn = $("#copyBtn");

const kakaoDirectBtn = $("#kakaoDirectBtn");
const kakaoBottomBtn = $("#kakaoBottomBtn");

kakaoDirectBtn.addEventListener("click", () => openKakao());
kakaoBottomBtn.addEventListener("click", () => openKakao());

function openKakao() {
  if (!KAKAO_CHAT_URL || KAKAO_CHAT_URL.includes("여기에")) {
    alert("KAKAO_CHAT_URL을 본인 카카오 링크로 설정해 주세요.");
    return;
  }
  window.open(KAKAO_CHAT_URL, "_blank", "noopener,noreferrer");
}

// 전화번호 입력 시 자동 하이픈
$("#phone").addEventListener("input", (e) => {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
  e.target.value = formatPhone(digits);
});

// 생년월일/예산 숫자만
$("#birth").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
});
$("#budget").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name = $("#name").value.trim();
  const phoneRaw = $("#phone").value.trim();
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  const birth = $("#birth").value.trim();
  const budget = $("#budget").value.trim();
  const consent = $("#consent").checked;

  const ok = validate({ name, phoneDigits, birth, budget, consent });
  if (!ok) return;

  const formattedPhone = formatPhone(phoneDigits);

  const message = `보험료 줄이기 상담 신청합니다.
이름: ${name}
생년월일: ${birth}
전화번호: ${formattedPhone}
원하는 보험료: ${budget}만원`;

  // ✅ 구글시트 저장 (폼 전송 방식: CORS/preflight 이슈 최소화)
  try {
    const body = new URLSearchParams({
      name,
      phone: formattedPhone,
      birth,
      budget,
      ua: navigator.userAgent,
      referrer: document.referrer,
    });

    const res = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      body,
    });

    // (선택) 응답 확인
    // const text = await res.text();
    // console.log("시트 응답:", text);

  } catch (err) {
    console.log("시트 저장 실패", err);
  }

  // 모달에 메시지 표시 + 링크 세팅
  msgBox.value = message;
  goKakaoBtn.href = KAKAO_CHAT_URL;

  openModal();

  // 자동 복사(가능하면) - 실패해도 버튼으로 복사 가능
  try {
    await navigator.clipboard.writeText(message);
  } catch (err) {
    // 일부 브라우저/환경에서 자동 복사가 막힐 수 있어 무시
  }
});

// 복사 버튼
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(msgBox.value);
    alert("메시지가 복사되었습니다. 카톡에서 붙여넣기 해주세요.");
  } catch (e) {
    alert("복사에 실패했습니다. 메시지를 길게 눌러 직접 복사해 주세요.");
  }
});

// 모달 닫기(배경/닫기 버튼)
modal.addEventListener("click", (e) => {
  const close = e.target?.dataset?.close === "true";
  if (close) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function clearErrors() {
  $("#err-name").textContent = "";
  $("#err-phone").textContent = "";
  $("#err-birth").textContent = "";
  $("#err-budget").textContent = "";
  $("#err-consent").textContent = "";
}

function validate({ name, phoneDigits, birth, budget, consent }) {
  let valid = true;

  if (name.length < 2) {
    $("#err-name").textContent = "이름은 2자 이상 입력해 주세요.";
    valid = false;
  }

  if (!/^010\d{7,8}$/.test(phoneDigits)) {
    $("#err-phone").textContent = "전화번호를 정확히 입력해 주세요. (010-1234-5678)";
    valid = false;
  }

  if (!/^\d{8}$/.test(birth) || !isValidDateYYYYMMDD(birth)) {
    $("#err-birth").textContent = "생년월일을 YYYYMMDD 형식으로 정확히 입력해 주세요.";
    valid = false;
  }

  const b = Number(budget);
  if (!Number.isFinite(b) || b < 1) {
    $("#err-budget").textContent = "원하는 보험료(만원)를 1 이상 숫자로 입력해 주세요.";
    valid = false;
  }

  if (!consent) {
    $("#err-consent").textContent = "개인정보 수집·이용 동의가 필요합니다.";
    valid = false;
  }

  return valid;
}

function formatPhone(digits) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 11) {
    const mid = digits.length === 10 ? 3 : 4;
    return `${digits.slice(0, 3)}-${digits.slice(3, 3 + mid)}-${digits.slice(3 + mid)}`;
  }
  return digits;
}

function isValidDateYYYYMMDD(s) {
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;

  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}