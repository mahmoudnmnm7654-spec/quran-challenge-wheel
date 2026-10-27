
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const questions = [
  { label: "الفاتحة", question: "ما السورة التي تبدأ بـ الحمد لله رب العالمين؟" },
  { label: "عدد السور", question: "كم عدد سور القرآن الكريم؟" },
  { label: "أطول سورة", question: "ما أطول سورة في القرآن الكريم؟" },
  { label: "أقصر سورة", question: "ما أقصر سورة في القرآن الكريم؟" },
  { label: "آية الكرسي", question: "في أي سورة توجد آية الكرسي؟" },
  { label: "بلا بسملة", question: "ما السورة التي لا تبدأ بالبسملة؟" },
  { label: "أول سورة", question: "ما أول سورة في المصحف الشريف؟" },
  { label: "آخر سورة", question: "ما آخر سورة في المصحف الشريف؟" },
  { label: "أجزاء القرآن", question: "كم عدد أجزاء القرآن الكريم؟" },
  { label: "قلب القرآن", question: "ما السورة التي تُعرف عند بعض الناس باسم قلب القرآن؟" },
  { label: "أم عيسى", question: "ما اسم أم النبي عيسى عليه السلام؟" },
  { label: "سورة الصلاة", question: "ما السورة التي نقرأها في كل ركعة من الصلاة؟" },
  { label: "شهر النزول", question: "في أي شهر نزل القرآن الكريم؟" },
  { label: "أصحاب الفيل", question: "ما السورة التي تتحدث عن أصحاب الفيل؟" },
  { label: "ليلة القدر", question: "ما اسم الليلة التي نزل فيها القرآن؟" },
  { label: "الإخلاص", question: "ما السورة التي تبدأ بـ قل هو الله أحد؟" }
];

let currentQuestion = null;
let currentIndex = -1;
let scores = {};
let usedQuestions = [];
let isSpinning = false;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>عجلة تحدي القرآن</title>
<script src="/socket.io/socket.io.js"></script>
<style>
* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  padding: 18px;
  font-family: Arial, Tahoma, sans-serif;
  text-align: center;
  color: #fff8e8;
  background: linear-gradient(135deg, #29113c, #64234f, #a56837);
}

main { max-width: 760px; margin: auto; }

h1 { font-size: clamp(25px, 5vw, 36px); }

.subtitle { color: #f8dfad; }

.panel {
  padding: 20px;
  margin: 18px 0;
  border: 1px solid #f7dfaa66;
  border-radius: 22px;
  background: #ffffff12;
  box-shadow: 0 8px 24px #16081b25;
}

input, button {
  font-size: 16px;
  padding: 12px 16px;
  margin: 5px;
  border: 0;
  border-radius: 12px;
}

input { max-width: 100%; width: 240px; }

button {
  background: linear-gradient(135deg, #ffe7a0, #d9a644);
  color: #35183d;
  font-weight: bold;
  cursor: pointer;
}

button:disabled { opacity: .45; cursor: not-allowed; }

#wheelWrap {
  position: relative;
  width: min(86vw, 430px);
  aspect-ratio: 1;
  margin: 35px auto 24px;
}

#pointer {
  position: absolute;
  z-index: 5;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 19px solid transparent;
  border-right: 19px solid transparent;
  border-top: 0;
  border-bottom: 35px solid #fff0b4;
  filter: drop-shadow(0 3px 4px #16091b99);
}

#wheel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 7px solid #ffe7a0;
  border-radius: 50%;
  background: conic-gradient(
    #d9a644 0deg 22.5deg,
    #55235f 22.5deg 45deg,
    #f1d28b 45deg 67.5deg,
    #80365f 67.5deg 90deg,
    #bd7940 90deg 112.5deg,
    #44204f 112.5deg 135deg,
    #e6bc61 135deg 157.5deg,
    #733052 157.5deg 180deg,
    #d9a644 180deg 202.5deg,
    #55235f 202.5deg 225deg,
    #f1d28b 225deg 247.5deg,
    #80365f 247.5deg 270deg,
    #bd7940 270deg 292.5deg,
    #44204f 292.5deg 315deg,
    #e6bc61 315deg 337.5deg,
    #733052 337.5deg 360deg
  );
  box-shadow: 0 0 0 4px #55234c, 0 10px 30px #16091b77;
  transition: transform 5s cubic-bezier(.12,.72,.12,1);
}

.sectorLabel {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 43%;
  height: 24px;
  margin-left: -21.5%;
  margin-top: -12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(10px, 2.7vw, 14px);
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 3px #16091b;
  white-space: nowrap;
  pointer-events: none;
}

#hub {
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  width: 19%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #fff0b4;
  border-radius: 50%;
  background: #35183d;
  box-shadow: 0 2px 10px #16091b88;
  font-size: clamp(18px, 4vw, 27px);
}

#question {
  min-height: 85px;
  padding: 14px 8px;
  font-size: clamp(19px, 4vw, 25px);
  font-weight: bold;
  line-height: 1.8;
}

#status { line-height: 1.8; }

ol { padding-right: 28px; }

li {
  padding: 7px;
  margin: 6px 0;
  text-align: right;
  border-bottom: 1px solid #ffffff20;
}

.hint { font-size: 13px; color: #f8dfad; }

@media (max-width: 400px) {
  body { padding: 10px; }
  .panel { padding: 12px; }
  .sectorLabel { font-size: 10px; }
}
</style>
</head>
<body>
<main>
<h1>🕌 عجلة تحدي القرآن</h1>
<p class="subtitle">مسابقة قرآنية جماعية — بالعلم والتدبر نتنافس</p>

<div class="panel">
  <p>اكتب اسمك للدخول إلى المسابقة:</p>
  <input id="name" maxlength="30" placeholder="اسم المشاركة">
  <button id="join">دخول</button>
  <p id="status">أدخل اسمك ثم اضغط دخول</p>
</div>

<div class="panel">
  <div id="wheelWrap">
    <div id="pointer"></div>
    <div id="wheel"></div>
    <div id="hub">📖</div>
  </div>

  <button id="spin" disabled>🎡 أدر العجلة</button>
  <div id="question" aria-live="polite">سيظهر السؤال هنا عند تدوير العجلة</div>
  <button id="correct" disabled>إجابة صحيحة + نقطة</button>
  <button id="next" disabled>السؤال التالي</button>
  <p class="hint">العجلة والأسئلة والنتائج مشتركة بين المشاركين المتصلين.</p>
</div>

<div class="panel">
  <h2>🏆 لوحة النتائج المشتركة</h2>
  <ol id="scores"></ol>
</div>
</main>

<script>
const socket = io();

const sectors = ${JSON.stringify(questions.map(q => q.label))};
const wheel = document.getElementById("wheel");
const nameInput = document.getElementById("name");
const joinButton = document.getElementById("join");
const spinButton = document.getElementById("spin");
const correctButton = document.getElementById("correct");
const nextButton = document.getElementById("next");
const questionBox = document.getElementById("question");
const statusBox = document.getElementById("status");

let myName = "";
let spinning = false;
let rotation = 0;
let pendingQuestion = null;
let pendingIndex = -1;
let animationTimer = null;
let lastRound = 0;

sectors.forEach((label, i) => {
  const item = document.createElement("div");
  item.className = "sectorLabel";
  const angle = i * 22.5 + 11.25;
  item.textContent = label;
  item.style.transform =
    "rotate(" + angle + "deg) translateY(-" +
    "32%" + ") rotate(-" + angle + "deg)";
  wheel.appendChild(item);
});

// Position the labels at a radius relative to the wheel's size.
function positionLabels() {
  const radius = wheel.clientWidth * 0.33;
  wheel.querySelectorAll(".sectorLabel").forEach((item, i) => {
    const angle = i * 22.5 + 11.25;
    item.style.transform =
      "rotate(" + angle + "deg) translateY(-" +
      radius + "px) rotate(-" + angle + "deg)";
  });
}

positionLabels();
window.addEventListener("resize", positionLabels);

joinButton.onclick = () => {
  const value = nameInput.value.trim();
  if (!value) {
    statusBox.textContent = "اكتب اسمك أولًا.";
    return;
  }

  myName = value;
  socket.emit("join", myName);
  nameInput.disabled = true;
  joinButton.disabled = true;
  spinButton.disabled = false;
  statusBox.textContent = "أنت مشارك في المسابقة.";
};

spinButton.onclick = () => {
  if (myName && !spinning) socket.emit("spin");
};

correctButton.onclick = () => {
  if (myName) socket.emit("award", myName);
};

nextButton.onclick = () => {
  if (myName && !spinning) socket.emit("next");
};

socket.on("spinResult", (result) => {
  if (spinning) return;

  spinning = true;
  pendingQuestion = result.question;
  pendingIndex = result.index;
  lastRound = result.round;

  spinButton.disabled = true;
  correctButton.disabled = true;
  nextButton.disabled = true;
  questionBox.textContent = "🎡 العجلة تدور...";

  const sliceAngle = 360 / sectors.length;
  const targetAngle = (360 - (pendingIndex * sliceAngle + sliceAngle / 2)) % 360;
  const currentAngle = ((rotation % 360) + 360) % 360;
  const extra = (targetAngle - currentAngle + 360) % 360;

  rotation += 360 * 6 + extra;
  wheel.style.transform = "rotate(" + rotation + "deg)";

  if (animationTimer) clearTimeout(animationTimer);
  animationTimer = setTimeout(() => {
    spinning = false;
    questionBox.textContent = pendingQuestion;
    spinButton.disabled = !myName;
    correctButton.disabled = !pendingQuestion;
    nextButton.disabled = !pendingQuestion;
  }, 5300);
};

socket.on("state", (state) => {
  if (!spinning) {
    questionBox.textContent =
      state.question || "اضغط أدر العجلة لبدء المسابقة";
    correctButton.disabled = !state.question || !myName;
    nextButton.disabled = !state.question || !myName;
  }

  const list = document.getElementById("scores");
  list.replaceChildren();

  Object.entries(state.scores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, score]) => {
      const item = document.createElement("li");
      item.textContent = name + " — " + score + " نقطة";
      list.appendChild(item);
    });
});

socket.on("notice", (message) => {
  statusBox.textContent = message;
});
</script>
</body>
</html>`);
});

function getState() {
  return {
    question: currentQuestion ? currentQuestion.question : null,
    index: currentIndex,
    scores
  };
}

function broadcastState() {
  io.emit("state", getState());
}

io.on("connection", (socket) => {
  socket.emit("state", getState());

  socket.on("join", (name) => {
    if (typeof name !== "string") return;

    name = name.trim().slice(0, 30);
    if (!name) return;

    if (!(name in scores)) scores[name] = 0;

    socket.emit("notice", "أهلًا بك في عجلة تحدي القرآن!");
    broadcastState();
  });

  socket.on("spin", () => {
    if (isSpinning) return;

    let available = questions
      .map((question, index) => ({ question, index }))
      .filter(item => !usedQuestions.includes(item.index));

    if (available.length === 0) {
      usedQuestions = [];
      available = questions.map((question, index) => ({ question, index }));
    }

    const selected = available[Math.floor(Math.random() * available.length)];

    currentQuestion = selected.question;
    currentIndex = selected.index;
    usedQuestions.push(currentIndex);
    isSpinning = true;

    io.emit("spinResult", {
      question: currentQuestion.question,
      index: currentIndex,
      round: Date.now()
    });

    broadcastState();

    setTimeout(() => {
      isSpinning = false;
    }, 5300);
  });

  socket.on("next", () => {
    if (isSpinning) return;
    currentQuestion = null;
    currentIndex = -1;
    broadcastState();
  });

  socket.on("award", (name) => {
    if (typeof name !== "string" || !(name in scores)) return;
    if (!currentQuestion || isSpinning) return;

    scores[name] += 1;
    broadcastState();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Quran Challenge Wheel is running on port " + PORT);
});
