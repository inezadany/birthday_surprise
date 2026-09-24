"use strict";

/* ==========================================================
   EDIT THIS PART TO PERSONALISE THE SURPRISE
   ========================================================== */
const CONFIG = {
  // The 4-digit code she needs to unlock the surprise
  passkey: "2026",

  // Her name (optional). Empty = uses "my love" / "love"
  herName: "Ariane",

  // Your name for the end of the letter (optional). Empty = no name
  fromName: "Dany",

  // Type her birth date as "YYYY-MM-DD" to calculate her age automatically.
  // Leave empty to use fixedAge below.
  birthDate: "2004-03-06",
  fixedAge: { years: 23, months: 0, days: 1 },

  // Your WhatsApp number for the "Send me a message" button on the last screen.
  // Use country code, digits only, no + or spaces (example: "250788123456").
  // Leave empty to hide the button. Note: it will be visible in this public file.
  whatsappNumber: "+250798259996",
  replyText: "Thank you for my birthday surprise. I love you!",

  // The day you got together, as "YYYY-MM-DD" (or "YYYY-MM-DDTHH:MM" for an exact time).
  // Leave empty and the "Our time together" screen is skipped.
  togetherSince: "2022-02-14",

  // To receive her quiz answers by email: create a free key at web3forms.com
  // (it is emailed to you) and paste it here. Empty = answers are not sent automatically.
  web3formsKey: "3dd92bca-7ad7-48c4-af10-6868dd182796",

  // Quiz about you two. A question with "options" shows buttons; without them she types an answer.
  // There are no wrong answers: every answer gets a sweet reaction (optional "reaction" per question).
  quiz: {
    questions: [
      { q: "Where did we first meet?" },
      {
        q: "What is my favourite thing about you?",
        options: ["Your smile", "Your kindness", "Your laugh", "Everything"]
      },
      {
        q: "What would be our perfect date?",
        options: ["Dinner out", "Movie night at home", "A long walk", "Somewhere new"]
      },
      { q: "What is one thing you want us to do this year?" }
    ],
    endMessage: "There are no wrong answers with you. Every single one made me smile."
  },

  // Love coupons she scratches to reveal. "icon" is any Bootstrap Icons name (icons.getbootstrap.com).
  coupons: [
    { icon: "bi-egg-fried", text: "One free dinner" },
    { icon: "bi-suit-heart-fill", text: "One long hug" },
    { icon: "bi-film", text: "Movie night, your pick" },
    { icon: "bi-cup-hot-fill", text: "Breakfast in bed" }
  ],

  // The surprise inside the gift box. "photo" is optional, e.g. "assets/photo3.JPG".
  gift: {
    message: "You are my favourite person in the whole world. Happy birthday, my love.",
    photo: ""
  },

  // Seconds the "Loading something special" screen stays up (in milliseconds)
  loadingMs: 2200,

  // Photos for the Memories screen. Add or remove as many as you like.
  // File names are CASE-SENSITIVE on GitHub Pages (photo1.JPG is not photo1.jpg).
  photos: [
    { src: "assets/photo1.JPG", caption: "Your beautiful smile" },
    { src: "assets/photo2.JPG", caption: "One of my favourite moments" },
    { src: "assets/photo3.JPG", caption: "Forever in my heart" },
    { src: "assets/photo2.JPG", caption: "Simply beautiful" }
  ],

  // Reasons shown one by one on the "Why I love you" screen
  reasons: [
    "Your smile makes my whole day better.",
    "You make ordinary moments feel special.",
    "Your kindness is something I admire every day.",
    "You make me want to be a better person.",
    "Being with you feels like home.",
    "You are beautiful inside and out.",
    "Because you are you, and that is more than enough."
  ]
};

/* ==========================================================
   HELPERS
   ========================================================== */
const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PALETTE = ["#ff4d6d", "#ff758f", "#ffc2d1", "#b5179e", "#f7d794", "#ffffff"];

function fireConfetti(options) {
  if (typeof confetti !== "function") return;
  confetti(Object.assign({ colors: PALETTE, zIndex: 99999, disableForReducedMotion: true }, options));
}

/* Swap a broken image for a soft heart placeholder (e.g. wrong file name) */
function guardImage(img) {
  const swap = () => {
    if (!img.isConnected) return;
    const placeholder = document.createElement("span");
    placeholder.className = (img.className + " img-fallback").trim();
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.innerHTML = '<i class="bi bi-heart-fill"></i>';
    img.replaceWith(placeholder);
  };
  img.addEventListener("error", swap, { once: true });
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) swap();
}

/* ==========================================================
   SCREEN NAVIGATION + PROGRESS
   ========================================================== */
const SCREENS = [
  "screen-lock",
  "screen-loading",
  "screen-welcome",
  "screen-counter",
  "screen-together",
  "screen-wish",
  "screen-gallery",
  "screen-reasons",
  "screen-quiz",
  "screen-scratch",
  "screen-letter-intro",
  "screen-message",
  "screen-gift",
  "screen-celebration"
];
const PROGRESS_START = 2; // progress bar appears from the welcome screen on

let currentScreen = "screen-lock";

const onEnter = {
  "screen-counter": animateCounter,
  "screen-together": startTogether,
  "screen-wish": resetWish,
  "screen-quiz": focusQuiz,
  "screen-scratch": buildScratch,
  "screen-message": startLetter,
  "screen-gift": resetGift,
  "screen-celebration": startCelebration
};

/* Screens that have nothing to show (e.g. no date or questions set) are skipped */
function shouldSkip(screenId) {
  if (screenId === "screen-together") return !togetherDate();
  if (screenId === "screen-quiz") return !(CONFIG.quiz && CONFIG.quiz.questions && CONFIG.quiz.questions.length);
  if (screenId === "screen-scratch") return !(CONFIG.coupons && CONFIG.coupons.length);
  return false;
}

function goToScreen(screenId) {
  const next = $(screenId);
  if (!next) return;

  if (shouldSkip(screenId)) {
    const after = SCREENS[SCREENS.indexOf(screenId) + 1];
    if (after) goToScreen(after);
    return;
  }

  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  next.classList.add("active");
  currentScreen = screenId;
  window.scrollTo(0, 0);

  next.setAttribute("tabindex", "-1");
  next.focus({ preventScroll: true });

  $("app").classList.toggle("celebrating", screenId === "screen-celebration");
  updateProgress(screenId);

  if (onEnter[screenId]) onEnter[screenId]();
}

function updateProgress(screenId) {
  const index = SCREENS.indexOf(screenId);
  const show = index >= PROGRESS_START;
  $("topbar").classList.toggle("visible", show);
  if (show) {
    const total = SCREENS.length - PROGRESS_START;
    $("progressFill").style.width = ((index - PROGRESS_START + 1) / total) * 100 + "%";
  }
}

/* ==========================================================
   LOCK SCREEN
   ========================================================== */
const PIN_LENGTH = CONFIG.passkey.length;
let currentPin = "";
let inputLocked = false;
let autoSubmitTimer = null;

function buildPinDots() {
  const box = $("pinDisplay");
  box.innerHTML = "";
  for (let i = 0; i < PIN_LENGTH; i++) {
    const dot = document.createElement("span");
    dot.className = "pin-dot";
    box.appendChild(dot);
  }
}

function renderPin() {
  const dots = $("pinDisplay").children;
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle("filled", i < currentPin.length);
  }
  $("pinDisplay").setAttribute("aria-label", currentPin.length + " of " + PIN_LENGTH + " digits entered");
}

function setPinMessage(text) {
  $("pinError").textContent = text;
}

function shakeLock() {
  const card = $("lockCard");
  card.classList.remove("shake");
  void card.offsetWidth; // restart the animation
  card.classList.add("shake");
}

function pressKey(digit) {
  if (inputLocked || currentPin.length >= PIN_LENGTH) return;
  currentPin += digit;
  setPinMessage("");
  renderPin();

  if (currentPin.length === PIN_LENGTH) {
    autoSubmitTimer = setTimeout(submitPin, 240);
  }
}

function clearPin() {
  if (inputLocked) return;
  clearTimeout(autoSubmitTimer);
  currentPin = currentPin.slice(0, -1);
  setPinMessage("");
  renderPin();
}

function submitPin() {
  if (inputLocked) return;
  clearTimeout(autoSubmitTimer);

  if (currentPin.length < PIN_LENGTH) {
    setPinMessage("Enter all " + PIN_LENGTH + " digits.");
    shakeLock();
    return;
  }

  if (currentPin === CONFIG.passkey) {
    inputLocked = true;
    $("lockIcon").className = "bi bi-unlock-fill";
    $("lockCard").classList.add("unlocked");
    startMusic(); // runs inside a tap, so browsers allow audio

    setTimeout(() => {
      goToScreen("screen-loading");
      setTimeout(() => goToScreen("screen-welcome"), CONFIG.loadingMs);
    }, 500);
    return;
  }

  inputLocked = true;
  setPinMessage("That passkey isn't right. Tap the photo link for a hint.");
  shakeLock();
  setTimeout(() => {
    currentPin = "";
    renderPin();
    inputLocked = false;
  }, 450);
}

/* Hint modal */
let hintOpener = null;

function openHint() {
  hintOpener = document.activeElement;
  $("hintModal").classList.add("open");
  $("hintClose").focus();
}

function closeHint() {
  $("hintModal").classList.remove("open");
  if (hintOpener && hintOpener.focus) hintOpener.focus();
}

const isHintOpen = () => $("hintModal").classList.contains("open");

/* ==========================================================
   MUSIC (optional: add assets/music.mp3)
   ========================================================== */
const audio = $("bgMusic");
const musicBtn = $("musicBtn");

function startMusic() {
  audio.volume = 0.5;
  const attempt = audio.play();
  if (attempt && attempt.catch) attempt.catch(() => { musicBtn.hidden = true; });
}

audio.addEventListener("playing", () => { musicBtn.hidden = false; });
audio.addEventListener("play", () => {
  $("musicIcon").className = "bi bi-volume-up-fill";
  musicBtn.setAttribute("aria-label", "Pause music");
});
audio.addEventListener("pause", () => {
  $("musicIcon").className = "bi bi-volume-mute-fill";
  musicBtn.setAttribute("aria-label", "Play music");
});
audio.addEventListener("error", () => { musicBtn.hidden = true; });

musicBtn.addEventListener("click", () => {
  if (audio.paused) {
    const attempt = audio.play();
    if (attempt && attempt.catch) attempt.catch(() => {});
  } else {
    audio.pause();
  }
});

/* ==========================================================
   BIRTHDAY COUNTER
   ========================================================== */
function computeAge() {
  if (!CONFIG.birthDate) return CONFIG.fixedAge;

  const birth = new Date(CONFIG.birthDate + "T00:00:00");
  if (isNaN(birth.getTime())) return CONFIG.fixedAge;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: months, days: days };
}

function countUp(elementId, target, duration, onDone) {
  const el = $(elementId);
  if (reduceMotion || target === 0) {
    el.textContent = target;
    if (onDone) onDone();
    return;
  }
  const start = performance.now();
  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased);
    if (t < 1) requestAnimationFrame(frame);
    else if (onDone) onDone();
  }
  requestAnimationFrame(frame);
}

function animateCounter() {
  const age = computeAge();
  $("lblYears").textContent = age.years === 1 ? "Year" : "Years";
  $("lblMonths").textContent = age.months === 1 ? "Month" : "Months";
  $("lblDays").textContent = age.days === 1 ? "Day" : "Days";
  countUp("cntYears", age.years, 1400);
  countUp("cntMonths", age.months, 900);
  countUp("cntDays", age.days, 900);
}

/* ==========================================================
   MAKE A WISH
   ========================================================== */
let candlesOut = false;

function resetWish() {
  candlesOut = false;
  $("cake").classList.remove("out");
  $("wishStatus").textContent = "Tap the cake or the button below.";
  $("wishBtn").innerHTML = '<i class="bi bi-wind"></i> Blow out the candles';
}

function blowCandles() {
  if (candlesOut) return;
  candlesOut = true;
  $("cake").classList.add("out");
  $("wishStatus").textContent = "Your wish is on its way.";
  $("wishBtn").innerHTML = 'Continue <i class="bi bi-arrow-right"></i>';
  fireConfetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
}

function handleWishButton() {
  if (!candlesOut) blowCandles();
  else goToScreen("screen-gallery");
}

/* ==========================================================
   GALLERY + PHOTO VIEWER
   ========================================================== */
function buildGallery() {
  const grid = $("galleryGrid");
  grid.innerHTML = "";

  CONFIG.photos.forEach((photo, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-card";
    card.setAttribute("aria-label", "Open photo " + (index + 1) + ": " + photo.caption);

    const img = document.createElement("img");
    img.className = "gallery-img";
    img.src = photo.src;
    img.alt = photo.caption;
    img.decoding = "async";
    guardImage(img);

    const zoom = document.createElement("span");
    zoom.className = "zoom";
    zoom.setAttribute("aria-hidden", "true");
    zoom.innerHTML = '<i class="bi bi-zoom-in"></i>';

    card.append(img, zoom);
    card.addEventListener("click", () => openLightbox(index, card));
    grid.appendChild(card);
  });
}

const lightbox = $("lightbox");
const lbFigure = $("lbFigure");
const lbImg = $("lbImg");
let lbIndex = 0;
let lbOpener = null;
let lbSwapTimer = null;
let touchStartX = null;

const isLightboxOpen = () => lightbox.classList.contains("open");

function showPhoto(immediate) {
  const total = CONFIG.photos.length;
  const photo = CONFIG.photos[lbIndex];

  const apply = () => {
    lbImg.src = photo.src;
    lbImg.alt = photo.caption;
    $("lbCaption").textContent = photo.caption;
    $("lbCount").textContent = lbIndex + 1 + " / " + total;
    requestAnimationFrame(() => lbFigure.classList.add("show"));
  };

  clearTimeout(lbSwapTimer);
  lbFigure.classList.remove("show");
  if (immediate || reduceMotion) apply();
  else lbSwapTimer = setTimeout(apply, 140);

  // Warm up the neighbours so swiping feels instant
  [1, -1].forEach((step) => {
    const neighbour = CONFIG.photos[(lbIndex + step + total) % total];
    if (neighbour) new Image().src = neighbour.src;
  });
}

function openLightbox(index, opener) {
  lbOpener = opener;
  lbIndex = index;
  const many = CONFIG.photos.length > 1;
  $("lbPrev").hidden = !many;
  $("lbNext").hidden = !many;

  showPhoto(true);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  $("lbClose").focus();
}

function closeLightbox() {
  clearTimeout(lbSwapTimer);
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lbFigure.classList.remove("show");
  document.body.classList.remove("no-scroll");
  if (lbOpener && lbOpener.focus) lbOpener.focus();
}

function stepPhoto(direction) {
  const total = CONFIG.photos.length;
  if (total < 2) return;
  lbIndex = (lbIndex + direction + total) % total;
  showPhoto(false);
}

/* ==========================================================
   WHY I LOVE YOU
   ========================================================== */
let reasonIndex = 0;

function buildReasonDots() {
  const box = $("reasonDots");
  box.innerHTML = "";
  CONFIG.reasons.forEach(() => box.appendChild(document.createElement("span")));
}

function resetReasons() {
  reasonIndex = 0;
  $("reasonText").textContent = "Your first reason is waiting...";
  $("reasonText").classList.remove("pop");
  $("reasonNum").textContent = "";
  $("reasonHint").textContent = "Tap the heart to read them one by one.";
  $("reasonBtn").disabled = false;
  $("reasonBtn").hidden = false;
  $("reasonNext").hidden = true;
  buildReasonDots();
}

function showNextReason() {
  const total = CONFIG.reasons.length;
  if (reasonIndex >= total) return;

  const text = $("reasonText");
  text.textContent = CONFIG.reasons[reasonIndex];
  text.classList.remove("pop");
  void text.offsetWidth;
  text.classList.add("pop");

  $("reasonNum").textContent = reasonIndex + 1 + " of " + total;
  $("reasonDots").children[reasonIndex].classList.add("on");
  reasonIndex += 1;

  const rect = $("reasonBtn").getBoundingClientRect();
  fireConfetti({
    particleCount: 14,
    spread: 60,
    startVelocity: 24,
    scalar: 0.7,
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight
    }
  });

  if (reasonIndex >= total) {
    $("reasonHint").textContent = "And so many more that I couldn't fit here.";
    $("reasonBtn").hidden = true;
    $("reasonNext").hidden = false;
  }
}

/* ==========================================================
   LETTER (typewriter)
   ========================================================== */
const letterParagraphs = Array.from(document.querySelectorAll("#letterText p")).map((el) => ({
  el: el,
  text: el.textContent.trim().replace(/\s+/g, " ")
}));
let typingTimer = null;
let typingDone = false;

function openLetter() {
  $("letterStatus").textContent = "Opening your letter...";
  $("envelopeBtn").disabled = true;

  setTimeout(() => {
    goToScreen("screen-message");
    $("envelopeBtn").disabled = false;
  }, 700);
}

function finishLetter() {
  clearInterval(typingTimer);
  typingDone = true;
  letterParagraphs.forEach((p) => {
    p.el.textContent = p.text;
    p.el.classList.remove("typing");
  });
  $("letterEnd").hidden = false;
  $("letterActions").hidden = false;
  const page = $("letterPage");
  page.scrollTop = page.scrollHeight;
}

function startLetter() {
  clearInterval(typingTimer);
  typingDone = false;
  $("letterEnd").hidden = true;
  $("letterActions").hidden = true;
  $("letterPage").scrollTop = 0;
  letterParagraphs.forEach((p) => {
    p.el.textContent = "";
    p.el.classList.remove("typing");
  });

  if (reduceMotion) {
    finishLetter();
    return;
  }

  let paragraph = 0;
  let char = 0;

  typingTimer = setInterval(() => {
    const current = letterParagraphs[paragraph];
    if (!current) {
      finishLetter();
      return;
    }
    char += 1;
    current.el.classList.add("typing");
    current.el.textContent = current.text.slice(0, char);
    const page = $("letterPage");
    page.scrollTop = page.scrollHeight;

    if (char >= current.text.length) {
      current.el.classList.remove("typing");
      paragraph += 1;
      char = 0;
    }
  }, 24);
}

/* ==========================================================
   CELEBRATION
   ========================================================== */
let confettiFrame = null;

function triggerCelebrate() {
  fireConfetti({ particleCount: 180, spread: 100, origin: { y: 0.55 }, scalar: 1.2, ticks: 300 });
  setTimeout(() => goToScreen("screen-gift"), 900);
}

function celebrationConfetti() {
  cancelAnimationFrame(confettiFrame);
  const end = Date.now() + 3000;

  (function frame() {
    fireConfetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    fireConfetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
    if (Date.now() < end) confettiFrame = requestAnimationFrame(frame);
  })();
}

function startCelebration() {
  celebrationConfetti();
}

function buildBalloons() {
  const box = $("balloons");
  const colors = ["#ff4d6d", "#ff758f", "#ffc2d1", "#b5179e", "#f7d794", "#e63946"];
  for (let i = 0; i < 9; i++) {
    const balloon = document.createElement("i");
    balloon.className = "bi bi-balloon-heart-fill balloon";
    balloon.style.setProperty("--x", 4 + i * 11 + "%");
    balloon.style.setProperty("--c", colors[i % colors.length]);
    balloon.style.setProperty("--s", 1.6 + (i % 3) * 0.5 + "rem");
    balloon.style.setProperty("--dur", 9 + (i % 4) * 2 + "s");
    balloon.style.setProperty("--delay", i * 0.9 + "s");
    box.appendChild(balloon);
  }
}

/* ==========================================================
   FLOATING HEARTS BACKGROUND
   ========================================================== */
function spawnHeart() {
  const box = $("floaters");
  if (document.hidden || box.children.length > 14) return;

  const heart = document.createElement("i");
  const duration = 9 + Math.random() * 7;
  heart.className = "bi bi-heart-fill floater";
  heart.style.left = Math.random() * 100 + "%";
  heart.style.fontSize = 10 + Math.random() * 16 + "px";
  heart.style.setProperty("--dur", duration + "s");
  heart.style.setProperty("--o", (0.12 + Math.random() * 0.22).toFixed(2));
  heart.style.setProperty("--dx", Math.random() * 80 - 40 + "px");
  box.appendChild(heart);
  setTimeout(() => heart.remove(), duration * 1000 + 200);
}

/* ==========================================================
   TOGETHER COUNTER
   ========================================================== */
let togetherTimer = null;
let daysReady = false;

function togetherDate() {
  const value = String(CONFIG.togetherSince || "").trim();
  if (!value) return null;
  const date = new Date(value.length === 10 ? value + "T00:00:00" : value);
  return isNaN(date.getTime()) ? null : date;
}

function togetherParts() {
  const start = togetherDate();
  let ms = start ? Math.max(0, Date.now() - start.getTime()) : 0;
  const days = Math.floor(ms / 86400000);
  ms -= days * 86400000;
  const hours = Math.floor(ms / 3600000);
  ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000);
  ms -= minutes * 60000;
  return { days: days, hours: hours, minutes: minutes, seconds: Math.floor(ms / 1000) };
}

function renderTogether() {
  const t = togetherParts();
  if (daysReady) $("tgDays").textContent = t.days;
  $("tgHours").textContent = t.hours;
  $("tgMinutes").textContent = t.minutes;
  $("tgSeconds").textContent = t.seconds;
}

function startTogether() {
  clearInterval(togetherTimer);
  daysReady = false;
  renderTogether();
  countUp("tgDays", togetherParts().days, 1400, () => {
    daysReady = true;
    renderTogether();
  });
  togetherTimer = setInterval(() => {
    if (currentScreen !== "screen-together") {
      clearInterval(togetherTimer);
      return;
    }
    renderTogether();
  }, 1000);
}

/* ==========================================================
   QUIZ ABOUT US
   ========================================================== */
const DEFAULT_REACTIONS = [
  "I love that answer.",
  "That is so you.",
  "You always know how to make me smile.",
  "Perfect answer, just like you."
];
let quizIndex = 0;
let quizAnswers = [];
let quizPicked = null;
let quizBusy = false;
let quizSent = false;
let quizRun = 0;

function whatsappLink(text) {
  const number = String(CONFIG.whatsappNumber).replace(/\D/g, "");
  return number ? "https://wa.me/" + number + "?text=" + encodeURIComponent(text) : "";
}

function answersText() {
  const lines = ["Her answers to my birthday quiz:", ""];
  quizAnswers.forEach((item, i) => {
    lines.push(i + 1 + ". " + item.q);
    lines.push("   " + item.a);
    lines.push("");
  });
  return lines.join("\n").trim();
}

function renderQuestion() {
  const questions = CONFIG.quiz.questions;
  const question = questions[quizIndex];
  const isChoice = Array.isArray(question.options) && question.options.length > 0;
  const options = $("quizOptions");

  quizPicked = null;
  $("quizCount").textContent = "Question " + (quizIndex + 1) + " of " + questions.length;
  $("quizQ").textContent = question.q;
  $("quizReaction").textContent = "";
  $("quizNext").disabled = true;
  $("quizNext").innerHTML =
    (quizIndex === questions.length - 1 ? "Finish" : "Next") + ' <i class="bi bi-arrow-right"></i>';

  options.innerHTML = "";
  options.hidden = !isChoice;
  $("quizTextWrap").hidden = isChoice;
  $("quizInput").value = "";

  if (isChoice) {
    question.options.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = text;
      button.addEventListener("click", () => pickOption(button, text));
      options.appendChild(button);
    });
  }
}

function pickOption(button, text) {
  if (quizBusy) return;
  Array.from($("quizOptions").children).forEach((child) => child.classList.remove("chosen"));
  button.classList.add("chosen");
  quizPicked = text;
  $("quizNext").disabled = false;
}

function submitQuestion() {
  if (quizBusy) return;
  const question = CONFIG.quiz.questions[quizIndex];
  const isChoice = Array.isArray(question.options) && question.options.length > 0;
  const answer = isChoice ? quizPicked : $("quizInput").value.trim();
  if (!answer) return;

  quizBusy = true;
  quizAnswers.push({ q: question.q, a: answer });
  $("quizNext").disabled = true;
  Array.from($("quizOptions").children).forEach((child) => { child.disabled = true; });
  $("quizReaction").textContent = question.reaction || DEFAULT_REACTIONS[quizIndex % DEFAULT_REACTIONS.length];

  const run = quizRun;
  setTimeout(() => {
    if (run !== quizRun) return; // the app was restarted meanwhile
    quizBusy = false;
    quizIndex += 1;
    if (quizIndex >= CONFIG.quiz.questions.length) finishQuiz();
    else renderQuestion();
  }, reduceMotion ? 300 : 1000);
}

async function submitAnswers() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject: "Her birthday quiz answers",
        from_name: "Birthday surprise",
        message: answersText()
      }),
      signal: controller.signal
    });
    const data = await response.json();
    return response.ok && data.success !== false;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function deliverAnswers() {
  if (quizSent) return;
  quizSent = true;
  const run = quizRun;
  const status = $("quizStatus");
  const link = whatsappLink(answersText());

  if (CONFIG.web3formsKey) {
    status.textContent = "Sending your answers to me...";
    const ok = await submitAnswers();
    if (run !== quizRun) return;
    if (ok) {
      status.textContent = "Sent! I can't wait to read them.";
      return;
    }
    status.textContent = "I couldn't send your answers automatically.";
  } else if (link) {
    status.textContent = "Want to share your answers with me?";
  }

  if (link) {
    $("quizWhatsapp").href = link;
    $("quizWhatsapp").hidden = false;
  }
}

function finishQuiz() {
  $("quizStage").hidden = true;
  $("quizEnd").hidden = false;
  $("quizContinue").hidden = false;
  $("quizEndText").textContent = CONFIG.quiz.endMessage;
  fireConfetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
  deliverAnswers();
}

function resetQuiz() {
  quizRun += 1;
  quizIndex = 0;
  quizAnswers = [];
  quizPicked = null;
  quizBusy = false;
  quizSent = false;

  $("quizNote").hidden = !CONFIG.web3formsKey;
  $("quizStage").hidden = false;
  $("quizEnd").hidden = true;
  $("quizContinue").hidden = true;
  $("quizStatus").textContent = "";
  $("quizWhatsapp").hidden = true;

  if (CONFIG.quiz && CONFIG.quiz.questions && CONFIG.quiz.questions.length) renderQuestion();
}

function focusQuiz() {
  // Nothing to do on entry; the first question is already rendered.
}

/* ==========================================================
   SCRATCH CARDS
   ========================================================== */
let scratchBuilt = false;
let revealedCount = 0;

function paintCover(ctx, w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#f4c2c2");
  gradient.addColorStop(0.5, "#d98ca0");
  gradient.addColorStop(1, "#f7d794");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#5a1330";
  ctx.font = '600 14px Poppins, "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Scratch here", w / 2, h / 2);
}

function revealCard(card, quiet) {
  if (card.classList.contains("revealed")) return;
  card.classList.add("revealed");
  revealedCount += 1;

  if (!quiet) {
    const rect = card.getBoundingClientRect();
    fireConfetti({
      particleCount: 30,
      spread: 60,
      scalar: 0.8,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight
      }
    });
  }

  if (revealedCount >= CONFIG.coupons.length) {
    $("scratchHint").textContent = "All yours. I'll honour every single one.";
    $("scratchRevealAll").hidden = true;
    $("scratchNext").hidden = false;
  }
}

function setupScratchCanvas(card) {
  const canvas = card.querySelector("canvas");
  const cssW = card.clientWidth;
  const cssH = card.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.scale(dpr, dpr);
  paintCover(ctx, cssW, cssH);

  let drawing = false;
  let last = null;
  let moves = 0;

  const position = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (cssW / rect.width),
      y: (event.clientY - rect.top) * (cssH / rect.height)
    };
  };

  const scratch = (from, to) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 34;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const check = () => {
    if (card.classList.contains("revealed")) return;
    const w = canvas.width;
    const h = canvas.height;
    const data = ctx.getImageData(0, 0, w, h).data;
    let cleared = 0;
    let total = 0;
    for (let y = 0; y < h; y += 6) {
      for (let x = 0; x < w; x += 6) {
        total += 1;
        if (data[(y * w + x) * 4 + 3] < 40) cleared += 1;
      }
    }
    if (cleared / total > 0.45) revealCard(card);
  };

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    last = position(event);
    scratch(last, last);
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const point = position(event);
    scratch(last, point);
    last = point;
    moves += 1;
    if (moves % 6 === 0) check();
  });
  const stop = () => {
    if (!drawing) return;
    drawing = false;
    check();
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
}

function buildScratch() {
  if (scratchBuilt) return;
  scratchBuilt = true;
  revealedCount = 0;

  const grid = $("scratchGrid");
  grid.innerHTML = "";
  $("scratchHint").textContent = "Scratch each card to reveal a gift from me.";
  $("scratchRevealAll").hidden = false;
  $("scratchNext").hidden = true;

  CONFIG.coupons.forEach((coupon) => {
    const card = document.createElement("div");
    card.className = "scratch-card";
    card.tabIndex = 0;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Scratch card: " + coupon.text);

    const face = document.createElement("div");
    face.className = "coupon-face";
    const icon = document.createElement("i");
    icon.className = "bi " + (coupon.icon || "bi-heart-fill");
    const label = document.createElement("span");
    label.textContent = coupon.text;
    face.append(icon, label);

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");

    card.append(face, canvas);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        revealCard(card);
      }
    });
    grid.appendChild(card);
    setupScratchCanvas(card);
  });
}

function revealAllCards() {
  document.querySelectorAll(".scratch-card").forEach((card) => revealCard(card, true));
}

/* ==========================================================
   GIFT BOX
   ========================================================== */
let giftOpened = false;

function resetGift() {
  giftOpened = false;
  $("giftBox").hidden = false;
  $("giftBox").classList.remove("open");
  $("giftReveal").hidden = true;
  $("giftNext").hidden = true;
  $("giftHint").textContent = "Tap the gift to open it.";
}

function openGift() {
  if (giftOpened) return;
  giftOpened = true;
  $("giftBox").classList.add("open");
  fireConfetti({ particleCount: 160, spread: 100, origin: { y: 0.5 }, scalar: 1.1 });

  setTimeout(() => {
    $("giftBox").hidden = true;
    $("giftReveal").hidden = false;
    $("giftNext").hidden = false;
    $("giftHint").textContent = "This one is all yours.";
  }, reduceMotion ? 0 : 900);
}

/* ==========================================================
   RESTART
   ========================================================== */
function restartApp() {
  if (typeof confetti !== "undefined" && confetti.reset) confetti.reset();
  cancelAnimationFrame(confettiFrame);
  clearInterval(typingTimer);
  clearTimeout(autoSubmitTimer);

  currentPin = "";
  inputLocked = false;
  renderPin();
  setPinMessage("");
  $("lockIcon").className = "bi bi-lock-fill";
  $("lockCard").classList.remove("unlocked", "shake");

  if (isHintOpen()) closeHint();
  if (isLightboxOpen()) closeLightbox();
  $("letterStatus").textContent = "Tap to open";
  resetWish();
  resetReasons();
  resetQuiz();
  resetGift();
  clearInterval(togetherTimer);
  scratchBuilt = false;
  $("scratchGrid").innerHTML = "";

  goToScreen("screen-lock");
}

/* ==========================================================
   EVENTS + INIT
   ========================================================== */
function bindEvents() {
  // Any button with data-go="screen-id" moves to that screen
  document.addEventListener("click", (event) => {
    const goButton = event.target.closest("[data-go]");
    if (goButton) {
      goToScreen(goButton.dataset.go);
      return;
    }
    if (event.target.closest('[data-action="restart"]')) restartApp();
  });

  // Keypad
  $("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.key) pressKey(button.dataset.key);
    else if (button.dataset.action === "clear") clearPin();
    else if (button.dataset.action === "submit") submitPin();
  });

  // Hint modal
  $("hintBtn").addEventListener("click", openHint);
  $("hintClose").addEventListener("click", closeHint);
  $("hintModal").addEventListener("click", (event) => {
    if (event.target === $("hintModal")) closeHint();
  });

  // Wish
  $("cake").addEventListener("click", blowCandles);
  $("wishBtn").addEventListener("click", handleWishButton);

  // Reasons + letter
  $("reasonBtn").addEventListener("click", showNextReason);
  $("envelopeBtn").addEventListener("click", openLetter);
  $("letterText").addEventListener("click", () => { if (!typingDone) finishLetter(); });
  $("celebrateBtn").addEventListener("click", triggerCelebrate);

  // Quiz, scratch cards, gift
  $("quizNext").addEventListener("click", submitQuestion);
  $("quizInput").addEventListener("input", () => {
    $("quizNext").disabled = quizBusy || !$("quizInput").value.trim();
  });
  $("quizInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!$("quizNext").disabled) submitQuestion();
    }
  });
  $("scratchRevealAll").addEventListener("click", revealAllCards);
  $("giftBox").addEventListener("click", openGift);
  $("replayBtn").addEventListener("click", celebrationConfetti);

  // Photo viewer
  $("lbClose").addEventListener("click", closeLightbox);
  $("lbPrev").addEventListener("click", () => stepPhoto(-1));
  $("lbNext").addEventListener("click", () => stepPhoto(1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lb-stage")) closeLightbox();
  });
  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) > 50) stepPhoto(deltaX < 0 ? 1 : -1);
  }, { passive: true });

  // Keyboard
  document.addEventListener("keydown", (event) => {
    if (isLightboxOpen()) {
      if (event.key === "Escape") closeLightbox();
      else if (event.key === "ArrowRight") stepPhoto(1);
      else if (event.key === "ArrowLeft") stepPhoto(-1);
      else if (event.key === "Tab") {
        const focusable = [$("lbClose"), $("lbPrev"), $("lbNext")].filter((el) => !el.hidden);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (isHintOpen()) {
      if (event.key === "Escape") closeHint();
      return;
    }

    if (currentScreen !== "screen-lock") return;

    if (/^[0-9]$/.test(event.key)) {
      pressKey(event.key);
    } else if (event.key === "Backspace") {
      clearPin();
    } else if (event.key === "Enter") {
      if (event.target.closest && event.target.closest("#hintBtn")) return;
      event.preventDefault();
      submitPin();
    }
  });
}

function init() {
  // Names
  document.querySelectorAll("[data-her-name]").forEach((el) => {
    if (CONFIG.herName) el.textContent = CONFIG.herName;
  });
  if (CONFIG.fromName) $("fromName").textContent = ", " + CONFIG.fromName;

  // Passkey hint text
  $("modalPasskey").textContent = "Passkey: " + CONFIG.passkey;

  // WhatsApp reply button (only when a number is set)
  const replyLink = whatsappLink(CONFIG.replyText);
  if (replyLink) {
    $("replyBtn").href = replyLink;
    $("replyBtn").hidden = false;
  }

  // Gift box content
  $("giftMessage").textContent = CONFIG.gift.message;
  if (CONFIG.gift.photo) {
    $("giftPhoto").src = CONFIG.gift.photo;
    $("giftPhoto").hidden = false;
  }

  // Images already in the page get the same fallback protection
  document.querySelectorAll("img:not([data-no-fallback])").forEach(guardImage);

  buildPinDots();
  renderPin();
  buildGallery();
  resetReasons();
  resetQuiz();
  buildBalloons();
  bindEvents();
  updateProgress(currentScreen);

  if (!reduceMotion) setInterval(spawnHeart, 1100);
}

init();
