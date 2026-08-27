const params = new URLSearchParams(location.search);
const selectedMode = params.get("mode") || "all";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
})[char]);

let projects = [];
let activeIndex = 0;
let archiveOpen = false;
let switching = false;
let gearTurns = 0;
let scrollTicking = false;

function machineClack(kind = "light") {
  document.dispatchEvent(new CustomEvent("machine-clack", { detail: { kind } }));
  document.body.classList.add("machine-clack");
  window.setTimeout(() => document.body.classList.remove("machine-clack"), kind === "heavy" ? 150 : 75);
}

function initMechanicalAudio() {
  const toggle = document.getElementById("sound-toggle");
  if (!toggle) return;
  let context;
  let enabled = false;

  const ensureContext = () => {
    if (!context) {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (AudioEngine) context = new AudioEngine();
    }
    if (context?.state === "suspended") context.resume();
    return context;
  };

  const playClack = kind => {
    const audio = ensureContext();
    if (!audio) return;
    const now = audio.currentTime;
    const heavy = kind === "heavy";
    const duration = heavy ? 0.11 : 0.055;

    const oscillator = audio.createOscillator();
    const toneGain = audio.createGain();
    oscillator.type = heavy ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(heavy ? 150 : 330, now);
    oscillator.frequency.exponentialRampToValueAtTime(heavy ? 48 : 120, now + duration);
    toneGain.gain.setValueAtTime(heavy ? 0.12 : 0.045, now);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(toneGain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);

    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    const noise = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const noiseGain = audio.createGain();
    filter.type = "bandpass";
    filter.frequency.value = heavy ? 720 : 1450;
    filter.Q.value = 1.8;
    noiseGain.gain.setValueAtTime(heavy ? 0.11 : 0.055, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    noise.buffer = buffer;
    noise.connect(filter).connect(noiseGain).connect(audio.destination);
    noise.start(now);
  };

  document.addEventListener("machine-clack", event => {
    if (enabled) playClack(event.detail?.kind || "light");
  });
  toggle.addEventListener("click", () => {
    enabled = !enabled;
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.setAttribute("aria-label", enabled ? "機械音を切る" : "機械音を入れる");
    if (enabled) {
      ensureContext();
      playClack("heavy");
    }
  });
}

function initMovementRig() {
  const rig = document.getElementById("movement-rig");
  const windControl = document.getElementById("wind-control");
  const state = document.getElementById("movement-state");
  const reserve = document.getElementById("reserve-value");
  const status = document.getElementById("mechanical-status");
  const startLever = document.querySelector(".start-lever");
  if (!rig || !windControl) return;

  const setOverdrive = enabled => {
    rig.classList.toggle("is-overdrive", enabled);
    windControl.setAttribute("aria-pressed", String(enabled));
    windControl.querySelector(":scope > span:last-child b").textContent = enabled ? "ゼンマイ解放中" : "主ゼンマイを巻く";
    state.textContent = enabled ? "OVERDRIVE" : "RUNNING";
    reserve.textContent = enabled ? "120 %" : "42 H";
    status.textContent = enabled ? "全歯車を接続。可能性出力を最大化。" : "機関同調。創作回路は正常です。";
  };

  windControl.addEventListener("click", () => {
    const enabled = !rig.classList.contains("is-overdrive");
    setOverdrive(enabled);
    machineClack("heavy");
    if (enabled) [80, 155, 225, 290].forEach(delay => window.setTimeout(() => machineClack("light"), delay));
  });

  document.querySelectorAll("[data-rig-action]").forEach(button => {
    button.addEventListener("click", () => {
      const enabled = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(enabled));
      rig.classList.toggle(`is-${button.dataset.rigAction}-off`, !enabled);
      if (button.dataset.rigAction === "rotor") rig.classList.toggle("is-rotor-locked", !enabled);
      const labels = { expose: "透過機構", rotor: "自動巻きローター", pulse: "動力脈動" };
      status.textContent = `${labels[button.dataset.rigAction]}を${enabled ? "接続" : "切断"}しました。`;
      machineClack("switch");
    });
  });

  if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    rig.addEventListener("pointermove", event => {
      const rect = rig.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rig.style.setProperty("--tilt-x", `${(x * 7).toFixed(2)}deg`);
      rig.style.setProperty("--tilt-y", `${(y * -6).toFixed(2)}deg`);
    });
    rig.addEventListener("pointerleave", () => {
      rig.style.setProperty("--tilt-x", "0deg");
      rig.style.setProperty("--tilt-y", "0deg");
    });
  }

  startLever?.addEventListener("click", () => setOverdrive(true));
}

function initPageMachine() {
  const root = document.documentElement;
  const driveTrain = document.getElementById("drive-train");
  const scrollPercent = document.getElementById("scroll-percent");
  const masterPressure = document.getElementById("master-pressure");
  const routeStatus = document.getElementById("route-status");
  const transmissionStatus = document.getElementById("transmission-status");
  const channelButtons = [...document.querySelectorAll("[data-channel]")];
  const manualCrank = document.getElementById("manual-crank");
  const crankCount = document.getElementById("crank-count");
  let crankAngle = 0;
  let crankClicks = 0;
  let burstTimer;

  const updateScrollMachine = () => {
    const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / range));
    root.style.setProperty("--scroll-ratio", ratio.toFixed(4));
    root.style.setProperty("--scroll-turn", `${(ratio * 1440).toFixed(1)}deg`);
    if (scrollPercent) scrollPercent.textContent = String(Math.round(ratio * 100)).padStart(3, "0");
    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollMachine);
  }, { passive: true });
  updateScrollMachine();

  const syncChannels = () => {
    const active = channelButtons.filter(button => button.getAttribute("aria-pressed") === "true");
    channelButtons.forEach(button => {
      const enabled = button.getAttribute("aria-pressed") === "true";
      driveTrain?.classList.toggle(`channel-${button.dataset.channel}-off`, !enabled);
    });
    document.body.classList.toggle("has-full-power", active.length === channelButtons.length);
    const pressure = ["000.0", "034.1", "062.4", "088.8"][active.length];
    if (masterPressure) masterPressure.textContent = pressure;
    if (routeStatus) routeStatus.textContent = active.length === 3 ? "FULL POWER" : active.length ? `${active.length} / 3 COUPLED` : "SYSTEM HALTED";
    if (transmissionStatus) transmissionStatus.textContent = active.length === 3 ? "ALL CHANNELS COUPLED" : active.length ? "PARTIAL TRANSMISSION" : "POWER DISCONNECTED";
  };

  channelButtons.forEach(button => {
    button.addEventListener("click", () => {
      const next = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(next));
      syncChannels();
      machineClack("switch");
    });
  });
  syncChannels();

  manualCrank?.addEventListener("click", () => {
    crankAngle += 120;
    crankClicks += 3;
    manualCrank.style.setProperty("--crank-angle", `${crankAngle}deg`);
    if (crankCount) crankCount.textContent = String(crankClicks).padStart(3, "0");
    document.body.classList.remove("manual-burst");
    window.requestAnimationFrame(() => document.body.classList.add("manual-burst"));
    if (masterPressure) masterPressure.textContent = "120.0";
    if (routeStatus) routeStatus.textContent = "MANUAL IMPULSE";
    if (transmissionStatus) transmissionStatus.textContent = "RATCHET DRIVE ENGAGED";
    machineClack("heavy");
    [70, 135, 195].forEach(delay => window.setTimeout(() => machineClack("light"), delay));
    window.clearTimeout(burstTimer);
    burstTimer = window.setTimeout(() => {
      document.body.classList.remove("manual-burst");
      syncChannels();
    }, 520);
  });

  const chambers = [...document.querySelectorAll(".machine-chamber")];
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle("chamber-active", entry.isIntersecting));
    }, { rootMargin: "-12% 0px -12%", threshold: 0.08 });
    chambers.forEach(chamber => observer.observe(chamber));
  } else {
    chambers.forEach(chamber => chamber.classList.add("chamber-active"));
  }
}

function projectCard(project, index) {
  const media = project.media
    ? `<figure class="card-media"><img src="${escapeHtml(project.media.src)}" alt="${escapeHtml(project.media.alt)}" loading="lazy"><figcaption>${escapeHtml(project.media.caption || "")}</figcaption></figure>`
    : "";
  const evidence = project.evidence?.length
    ? `<div class="evidence-links">${project.evidence.map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} ↗</a>`).join("")}</div>`
    : `<p class="evidence-note">${escapeHtml(project.evidenceNote || "証拠リンク準備中")}</p>`;

  return `<article class="card mechanism-card ${project.publicationStatus === "draft" ? "draft" : ""}">
    <div class="module-serial">MECHANISM ${String(index + 1).padStart(2, "0")} <i></i> ${escapeHtml(project.verification || "recorded")}</div>
    <div class="card-top"><span class="category">${escapeHtml(project.category)}</span>${project.publicationStatus === "draft" ? '<span class="status">要確認・非公開</span>' : ""}</div>
    <h3>${escapeHtml(project.title)}</h3>
    ${media}
    <p>${escapeHtml(project.description)}</p>
    <div class="tech-list">${project.technologies.map(tech => `<span>${escapeHtml(tech)}</span>`).join("")}</div>
    <div class="evidence"><span class="evidence-label">EVIDENCE PORT</span>${evidence}</div>
  </article>`;
}

function renderGearNodes() {
  const nodes = document.getElementById("gear-nodes");
  nodes.innerHTML = projects.map((project, index) => {
    const angle = (360 / projects.length) * index;
    return `<button type="button" role="tab" class="gear-node ${index === activeIndex ? "active" : ""}" style="--angle:${angle}deg;--counter:${-angle}deg" aria-selected="${index === activeIndex}" aria-label="${escapeHtml(project.title)}" data-index="${index}"><span>${String(index + 1).padStart(2, "0")}</span></button>`;
  }).join("");
  nodes.querySelectorAll(".gear-node").forEach(button => button.addEventListener("click", () => selectProject(Number(button.dataset.index))));
}

function updateModuleLabels() {
  const project = projects[activeIndex];
  document.getElementById("module-count").textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
  document.getElementById("module-title").textContent = project.title;
  document.querySelectorAll(".gear-node").forEach((button, index) => {
    button.classList.toggle("active", index === activeIndex);
    button.setAttribute("aria-selected", String(index === activeIndex));
  });
}

function revealArchive() {
  archiveOpen = true;
  const shell = document.getElementById("mechanism-shell");
  const toggle = document.getElementById("archive-toggle");
  shell.classList.add("is-open");
  toggle.setAttribute("aria-expanded", "true");
  toggle.querySelector("b").textContent = "記憶庫 稼働中";
  toggle.querySelector("small").textContent = "ARCHIVE ONLINE";
  machineClack("heavy");
}

function selectProject(index) {
  if (!projects.length || switching || index === activeIndex) {
    if (!archiveOpen) revealArchive();
    return;
  }
  if (!archiveOpen) revealArchive();
  switching = true;
  const shell = document.getElementById("mechanism-shell");
  shell.classList.add("is-switching");
  gearTurns += index > activeIndex ? 72 : -72;
  document.getElementById("gear-core").style.transform = `translate(-50%, -50%) rotate(${gearTurns}deg)`;
  machineClack("heavy");

  window.setTimeout(() => {
    activeIndex = (index + projects.length) % projects.length;
    document.getElementById("project-stage").innerHTML = projectCard(projects[activeIndex], activeIndex);
    updateModuleLabels();
    window.setTimeout(() => {
      shell.classList.remove("is-switching");
      switching = false;
      machineClack("light");
    }, 60);
  }, 360);
}

function moveProject(direction) {
  if (!archiveOpen) revealArchive();
  selectProject((activeIndex + direction + projects.length) % projects.length);
}

async function init() {
  try {
    const response = await fetch("portfolio.json");
    if (!response.ok) throw new Error(`portfolio.json: ${response.status}`);
    const data = await response.json();
    const modeKey = data.modes[selectedMode] ? selectedMode : "all";
    const mode = data.modes[modeKey];

    document.getElementById("headline").textContent = data.profile.headline;
    document.getElementById("summary").textContent = data.profile.summary;
    document.getElementById("activities").innerHTML = data.profile.activities.map(item => `<li>${escapeHtml(item)}</li>`).join("");
    document.getElementById("work-title").textContent = mode.archiveTitle || `${mode.label}実績機関`;
    document.getElementById("year").textContent = new Date().getFullYear();
    document.title = `${data.profile.name} — ${mode.label} Portfolio`;
    document.getElementById("mode-nav").innerHTML = Object.entries(data.modes).map(([key, item]) => `<a class="mode-link" href="?mode=${encodeURIComponent(key)}" ${key === modeKey ? 'aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`).join("");

    const order = new Map(mode.order.map((category, index) => [category, index]));
    projects = data.projects.filter(project => project.publicationStatus === "published").sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99));
    document.getElementById("project-stage").innerHTML = projectCard(projects[0], 0);
    renderGearNodes();
    updateModuleLabels();

    document.getElementById("archive-toggle").addEventListener("click", revealArchive);
    document.getElementById("prev-project").addEventListener("click", () => moveProject(-1));
    document.getElementById("next-project").addEventListener("click", () => moveProject(1));
    document.getElementById("mechanism-shell").addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") moveProject(-1);
      if (event.key === "ArrowRight") moveProject(1);
    });
    document.body.classList.add("is-ready");
  } catch (error) {
    document.getElementById("mechanism-shell").innerHTML = `<p class="error">データを読み込めませんでした。<br>${escapeHtml(error.message)}</p>`;
  }
}

initMechanicalAudio();
initMovementRig();
initPageMachine();
init();
