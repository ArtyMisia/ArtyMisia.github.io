const ROTOR_TARGET = [1, 13, 8];
const X_PROFILE_URL = "";

const rotors = [...document.querySelectorAll(".rotor")];
const values = [0, 0, 0];
let attempts = 0;
let audioEnabled = false;
let audioContext;

function relayClack(kind = "light") {
  if (!audioEnabled) return;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  if (!audioContext) audioContext = new AudioEngine();
  if (audioContext.state === "suspended") audioContext.resume();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = kind === "heavy" ? "triangle" : "square";
  oscillator.frequency.setValueAtTime(kind === "heavy" ? 118 : 310, now);
  oscillator.frequency.exponentialRampToValueAtTime(kind === "heavy" ? 42 : 105, now + .07);
  gain.gain.setValueAtTime(kind === "heavy" ? .12 : .04, now);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .08);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + .08);
}

function formatValue(value) {
  return String(value).padStart(2, "0");
}

function setState(message) {
  document.getElementById("machine-state").textContent = message;
}

function stepRotor(rotor, delta) {
  const index = Number(rotor.dataset.rotor);
  values[index] = (values[index] + delta + 100) % 100;
  rotor.querySelector(".rotor-window span").textContent = formatValue(values[index]);
  rotor.classList.remove("is-stepping");
  window.requestAnimationFrame(() => rotor.classList.add("is-stepping"));
  window.setTimeout(() => rotor.classList.remove("is-stepping"), 190);
  setState(`ROTOR ${index + 1} // ${formatValue(values[index])}`);
  relayClack("light");
}

function revealClue() {
  const clue = document.querySelectorAll("#clue-bank li")[Math.min(attempts - 1, 2)];
  clue?.classList.add("revealed");
}

function alignRotors() {
  attempts += 1;
  document.getElementById("attempt-count").textContent = `ATTEMPTS ${formatValue(attempts)}`;
  const aligned = values.every((value, index) => value === ROTOR_TARGET[index]);
  if (!aligned) {
    document.body.classList.remove("rotor-error");
    window.requestAnimationFrame(() => document.body.classList.add("rotor-error"));
    window.setTimeout(() => document.body.classList.remove("rotor-error"), 390);
    document.getElementById("cipher-register").textContent = "ROTOR DESYNCHRONIZED";
    setState("ALIGNMENT REJECTED");
    revealClue();
    relayClack("heavy");
    return;
  }

  document.body.classList.add("rotors-aligned");
  document.getElementById("cipher-register").textContent = "THE CREST IS THE KEY";
  document.getElementById("key-phase").hidden = false;
  document.getElementById("decrypt-rotors").disabled = true;
  setState("ROTOR BANK ALIGNED");
  relayClack("heavy");
  [100, 190, 280].forEach(delay => window.setTimeout(() => relayClack("light"), delay));
  window.setTimeout(() => document.getElementById("key-input").focus(), 520);
}

function authorizeKey(event) {
  event.preventDefault();
  const input = document.getElementById("key-input");
  const key = input.value.trim().toUpperCase();
  const status = document.getElementById("key-status");
  if (key !== "SCIENTIA") {
    status.textContent = "KEY REJECTED // READ THE CREST";
    input.select();
    relayClack("heavy");
    return;
  }

  status.textContent = "CLEARANCE EA–000 GRANTED";
  document.body.classList.add("key-authorized");
  document.getElementById("transmission-phase").hidden = false;
  setState("BLACK CHANNEL OPEN");
  try { window.localStorage.setItem("ea000-clearance", "granted"); } catch (_) { /* Storage is optional. */ }

  const link = document.getElementById("x-transmission");
  const nodeStatus = document.getElementById("node-status");
  if (X_PROFILE_URL) {
    link.href = X_PROFILE_URL;
    link.hidden = false;
    nodeStatus.textContent = "EXTERNAL SIGNAL ACQUIRED";
    document.getElementById("node-message").textContent = "暗号経路は開通した。外部通信端子NODE Xを確認。";
  } else {
    nodeStatus.textContent = "CHANNEL NOT ASSIGNED // AWAITING ENDPOINT";
  }
  relayClack("heavy");
  [100, 180, 260, 340].forEach(delay => window.setTimeout(() => relayClack("light"), delay));
  window.setTimeout(() => document.getElementById("transmission-phase").scrollIntoView({ behavior: "smooth", block: "center" }), 420);
}

function resetCipher() {
  values.fill(0);
  attempts = 0;
  rotors.forEach(rotor => rotor.querySelector(".rotor-window span").textContent = "00");
  document.querySelectorAll("#clue-bank li").forEach(clue => clue.classList.remove("revealed"));
  document.body.classList.remove("rotor-error", "rotors-aligned", "key-authorized");
  document.getElementById("key-phase").hidden = true;
  document.getElementById("transmission-phase").hidden = true;
  document.getElementById("decrypt-rotors").disabled = false;
  document.getElementById("cipher-register").textContent = "XLIWI · MW · XLI · OIC";
  document.getElementById("attempt-count").textContent = "ATTEMPTS 00";
  document.getElementById("key-input").value = "";
  setState("WAITING FOR SETTINGS");
  relayClack("heavy");
}

document.querySelectorAll("[data-delta]").forEach(button => {
  button.addEventListener("click", () => stepRotor(button.closest(".rotor"), Number(button.dataset.delta)));
});
document.getElementById("decrypt-rotors").addEventListener("click", alignRotors);
document.getElementById("key-form").addEventListener("submit", authorizeKey);
document.getElementById("reset-cipher").addEventListener("click", resetCipher);
document.getElementById("cipher-sound").addEventListener("click", event => {
  audioEnabled = !audioEnabled;
  event.currentTarget.setAttribute("aria-pressed", String(audioEnabled));
  if (audioEnabled) relayClack("heavy");
});

try {
  if (window.sessionStorage.getItem("ea000-entry") === "horizontal-latch") {
    document.getElementById("entry-vector").textContent = "HORIZONTAL LATCH / VERIFIED";
  }
} catch (_) { /* Storage is optional. */ }
