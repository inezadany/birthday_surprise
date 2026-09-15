let currentPin = "";
const correctPin = "2026";

function pressKey(num) {
  if (currentPin.length < 4) {
    currentPin += num;
    updatePinDisplay();
  }
}

function clearPin() {
  currentPin = currentPin.slice(0, -1);
  updatePinDisplay();
}

function updatePinDisplay() {
  let display = "";

  for (let i = 0; i < 4; i++) {
    display += i < currentPin.length ? currentPin[i] + " " : "_ ";
  }

  document.getElementById("pinDisplay").innerText = display.trim();
}

function submitPin() {
  if (currentPin === correctPin) {
    goToScreen("screen-loading");

    setTimeout(() => {
      goToScreen("screen-welcome");
    }, 2000);

    return;
  }

  alert("Incorrect PIN! Tap 'Click here to view passkey' for the code.");
  currentPin = "";
  updatePinDisplay();
}

function openHint() {
  document.getElementById("hintModal").style.display = "flex";
}

function closeHint() {
  document.getElementById("hintModal").style.display = "none";
}

function goToScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const nextScreen = document.getElementById(screenId);

  if (nextScreen) {
    nextScreen.classList.add("active");
    window.scrollTo(0, 0);
  }
}

function openLetter() {
  document.getElementById("letterStatus").innerText = "OPENING LETTER...";

  setTimeout(() => {
    goToScreen("screen-message");
  }, 700);
}

function triggerCelebrate() {
  confetti({
    particleCount: 180,
    spread: 100,
    origin: { y: 0.55 },
    zIndex: 99999,
    scalar: 1.2,
    ticks: 300
  });

  setTimeout(() => {
    goToScreen("screen-celebration");
  }, 900);
}

function restartApp() {
  if (typeof confetti !== "undefined") {
    confetti.reset();
  }

  currentPin = "";
  updatePinDisplay();

  document.getElementById("hintModal").style.display = "none";
  document.getElementById("letterStatus").innerText = "TAP TO OPEN";

  goToScreen("screen-lock");
}

document.addEventListener("keydown", event => {
  if (/^[0-9]$/.test(event.key)) pressKey(event.key);
  if (event.key === "Backspace") clearPin();
  if (event.key === "Enter") submitPin();
  if (event.key === "Escape") closeHint();
});
