// Change this to the 4-digit passkey you want.
const PASSKEY = "0603";

const screens = {
  lock: document.getElementById("lockScreen"),
  welcome: document.getElementById("welcomeScreen"),
  memories: document.getElementById("memoriesScreen")
};

let entered = "";

function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateDots() {
  document.querySelectorAll("#dots span").forEach((dot, i) => {
    dot.classList.toggle("filled", i < entered.length);
  });
}

function clearCode() {
  entered = "";
  updateDots();
  document.getElementById("error").textContent = "";
}

function submitCode() {
  if (entered === PASSKEY) {
    clearCode();
    showScreen(screens.welcome);
  } else {
    document.getElementById("error").textContent = "Wrong passkey. Try again.";
    entered = "";
    updateDots();
  }
}

document.querySelectorAll(".keypad button").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.key;

    if (key === "clear") {
      clearCode();
      return;
    }

    if (key === "enter") {
      submitCode();
      return;
    }

    if (entered.length < 4) {
      entered += key;
      updateDots();
      if (entered.length === 4) setTimeout(submitCode, 220);
    }
  });
});

document.getElementById("hintButton").addEventListener("click", () => {
  const hint = document.getElementById("hintText");
  hint.textContent = `Passkey hint: ${PASSKEY.split("").join(" • ")}`;
  hint.style.color = "#ff8eab";
});

document.getElementById("memoriesButton").addEventListener("click", () => {
  showScreen(screens.memories);
});

const modal = document.getElementById("messageModal");

document.getElementById("messageButton").addEventListener("click", () => {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
});

document.getElementById("closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.getElementById("restartButton").addEventListener("click", () => {
  closeModal();
  showScreen(screens.lock);
});

document.getElementById("celebrateButton").addEventListener("click", () => {
  launchConfetti();
});

function launchConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * .2,
    size: 5 + Math.random() * 8,
    speed: 2 + Math.random() * 5,
    rotation: Math.random() * 360,
    spin: -5 + Math.random() * 10,
    hue: Math.random() * 360
  }));

  let start = performance.now();

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach(p => {
      p.y += p.speed;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .55);
      ctx.restore();
    });

    if (now - start < 4500) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(frame);
}
