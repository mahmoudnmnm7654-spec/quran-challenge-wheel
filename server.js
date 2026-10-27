const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const questions = [
  "ما السورة التي تبدأ بـ الحمد لله رب العالمين؟",
  "كم عدد سور القرآن الكريم؟",
  "ما أطول سورة في القرآن الكريم؟",
  "ما أقصر سورة في القرآن الكريم؟",
  "في أي سورة توجد آية الكرسي؟",
  "ما السورة التي لا تبدأ بالبسملة؟",
  "ما أول سورة في المصحف الشريف؟",
  "ما آخر سورة في المصحف الشريف؟",
  "كم عدد أجزاء القرآن الكريم؟",
  "ما السورة التي تسمى قلب القرآن؟",
  "ما اسم أم النبي عيسى عليه السلام؟",
  "ما السورة التي نقرأها في كل ركعة من الصلاة؟",
  "في أي شهر نزل القرآن الكريم؟",
  "ما السورة التي تتحدث عن أصحاب الفيل؟",
  "ما اسم الليلة التي نزل فيها القرآن؟",
  "ما السورة التي تبدأ بـ قل هو الله أحد؟"
];

let currentQuestion = null;
let scores = {};
let usedQuestions = [];

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>عجلة تحدي القرآن</title>
<script src="/socket.io/socket.io.js"></script>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;text-align:center;
background:linear-gradient(135deg,#3b174d,#792c65,#bd8b45);
color:white;min-height:100vh;padding:20px}
main{max-width:650px;margin:auto}
h1{font-size:30px}
.panel{background:#ffffff18;border:1px solid #ffffff50;
border-radius:20px;padding:20px;margin:18px 0}
input,button{font-size:17px;padding:12px;border-radius:10px;
border:0;margin:5px}
input{max-width:100%;width:230px}
button{cursor:pointer;background:#f2c66d;color:#351638;font-weight:bold}
button:disabled{opacity:.5;cursor:not-allowed}
#wheel{width:210px;height:210px;border-radius:50%;margin:20px auto;
display:flex;align-items:center;justify-content:center;
background:conic-gradient(#f2c66d 0 45deg,#742d70 45deg 90deg,
#f7e5b2 90deg 135deg,#4b235e 135deg 180deg,
#f2c66d 180deg 225deg,#742d70 225deg 270deg,
#f7e5b2 270deg 315deg,#4b235e 315deg);
border:6px solid #fff2c9;box-shadow:0 0 20px #0005;
font-size:25px;color:white}
#question{font-size:23px;line-height:1.8;min-height:70px}
li{margin:10px;text-align:right}
small{opacity:.9}
</style>
</head>
<body>
<main>
<h1>🕌 عجلة تحدي القرآن</h1>
<p>مسابقة قرآنية جماعية</p>

<div class="panel">
  <p>اكتب اسمك للدخول إلى المسابقة:</p>
  <input id="name" maxlength="30" placeholder="اسم المشاركة">
  <button id="join">دخول</button>
  <p id="status">أدخل اسمك ثم اضغط دخول</p>
</div>

<div class="panel">
  <div id="wheel">📖 القرآن الكريم</div>
  <button id="spin" disabled>🎡 أدر العجلة</button>
  <div id="question">سيظهر السؤال هنا عند تدوير العجلة</div>
  <button id="correct" disabled>إجابة صحيحة + نقطة</button>
  <button id="next" disabled>السؤال التالي</button>
  <p><small>تظهر الأسئلة والنتائج نفسها لجميع المتصلين.</small></p>
</div>

<div class="panel">
<h2>🏆 لوحة النتائج المشتركة</h2>
<ol id="scores"></ol>
</div>
</main>

<script>
const socket = io();
let myName = "";
const nameInput = document.getElementById("name");
const joinButton = document.getElementById("join");
const spinButton = document.getElementById("spin");
const correctButton = document.getElementById("correct");
const nextButton = document.getElementById("next");
const questionBox = document.getElementById("question");
const statusBox = document.getElementById("status");

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
  if (myName) socket.emit("spin");
};

correctButton.onclick = () => {
  if (myName) socket.emit("award", myName);
};

nextButton.onclick = () => {
  if (myName) socket.emit("next");
};

socket.on("state", (state) => {
  questionBox.textContent = state.question || "اضغط أدر العجلة لبدء المسابقة";
  correctButton.disabled = !state.question;
  nextButton.disabled = !state.question;

  const list = document.getElementById("scores");
  list.innerHTML = "";
  Object.entries(state.scores)
    .sort((a,b) => b[1] - a[1])
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
    question: currentQuestion,
    scores: scores
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
    let available = questions.filter(q => !usedQuestions.includes(q));
    if (available.length === 0) {
      usedQuestions = [];
      available = questions.slice();
    }
    currentQuestion = available[Math.floor(Math.random() * available.length)];
    usedQuestions.push(currentQuestion);
    broadcastState();
  });

  socket.on("next", () => {
    currentQuestion = null;
    broadcastState();
  });

  socket.on("award", (name) => {
    if (typeof name !== "string" || !(name in scores)) return;
    scores[name] += 1;
    broadcastState();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Quran Challenge Wheel is running on port " + PORT);
});
