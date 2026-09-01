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
let accessRoutes = [];

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

function initCrestControl() {
  const control = document.getElementById("crest-control");
  const shell = document.getElementById("mechanism-shell");
  const status = document.getElementById("crest-power-state");
  const mainspring = document.getElementById("mainspring-state");
  const escapement = document.getElementById("escapement-state");
  let impulseTimer;
  if (!control || !shell) return;

  const setPower = engaged => {
    document.body.classList.toggle("crest-overdrive", engaged);
    control.setAttribute("aria-pressed", String(engaged));
    control.setAttribute("aria-label", engaged ? "SCIENTIA主動力を通常出力へ戻す" : "SCIENTIA主動力を起動");
    if (status) status.textContent = engaged ? "OVERDRIVE" : "STANDBY";
    if (mainspring) mainspring.textContent = engaged ? "MAX TORQUE" : "WOUND";
    if (escapement) escapement.textContent = engaged ? "HIGH BEAT" : "RUNNING";

    shell.classList.remove("crest-impulse");
    window.requestAnimationFrame(() => shell.classList.add("crest-impulse"));
    window.clearTimeout(impulseTimer);
    impulseTimer = window.setTimeout(() => shell.classList.remove("crest-impulse"), 820);

    machineClack("heavy");
    if (engaged) [85, 160, 235, 310].forEach(delay => window.setTimeout(() => machineClack("switch"), delay));
  };

  control.addEventListener("click", () => setPower(control.getAttribute("aria-pressed") !== "true"));
}

function initSecretLatch() {
  const shell = document.getElementById("mechanism-shell");
  const ring = document.querySelector(".crosslock-ring");
  const toggle = document.getElementById("archive-toggle");
  const live = document.getElementById("secret-live");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let latchReady = false;
  let secretNavigating = false;
  let lastSignal = 0;
  if (!shell || !ring || !toggle) return;

  const horizontalDistance = () => {
    if (reducedMotion.matches) return 0;
    const transform = window.getComputedStyle(ring).transform;
    if (!transform || transform === "none") return 180;
    const matrix = new DOMMatrixReadOnly(transform);
    const angle = (Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + 360) % 360;
    return Math.min(angle, Math.abs(angle - 180), 360 - angle);
  };

  const monitorLatch = now => {
    const nextReady = document.body.classList.contains("crest-overdrive") && horizontalDistance() <= 11;
    if (nextReady !== latchReady) {
      latchReady = nextReady;
      shell.classList.toggle("secret-latch-ready", latchReady);
      if (latchReady && now - lastSignal > 650) {
        lastSignal = now;
        machineClack("light");
      }
    }
    window.requestAnimationFrame(monitorLatch);
  };

  toggle.addEventListener("click", event => {
    if (!latchReady || switching || secretNavigating) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    secretNavigating = true;
    document.body.classList.add("secret-route-engaged");
    shell.classList.add("secret-latch-coupled");
    toggle.querySelector("b").textContent = "第零機関 接続";
    toggle.querySelector("small").textContent = "UNLISTED ROUTE FOUND";
    if (live) live.textContent = "隠しラッチが接続されました。第零書庫へ移動します。";
    try { window.sessionStorage.setItem("ea000-entry", "horizontal-latch"); } catch (_) { /* Storage is optional. */ }
    machineClack("heavy");
    [110, 220, 330, 470, 620].forEach(delay => window.setTimeout(() => machineClack("switch"), delay));
    window.setTimeout(() => window.location.assign(new URL("null-archive/", window.location.href)), 1450);
  }, true);

  window.requestAnimationFrame(monitorLatch);
}

function initHorologiumRoute() {
  const transition = document.getElementById("horologium-transition");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let navigating = false;
  if (!transition) return;

  document.addEventListener("click", event => {
    const link = event.target.closest?.('a[href*="horologium/"]');
    if (!link || event.defaultPrevented || link.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || !destination.pathname.endsWith("/horologium/")) return;
    destination.searchParams.set("from", document.body.dataset.mode || selectedMode || "all");
    link.href = destination.href;
    if (reducedMotion.matches || navigating) return;

    event.preventDefault();
    navigating = true;
    transition.setAttribute("aria-hidden", "false");
    document.body.classList.add("horologium-route-engaged");
    machineClack("heavy");
    [120, 240, 390, 560].forEach(delay => window.setTimeout(() => machineClack("switch"), delay));
    window.setTimeout(() => window.location.assign(destination), 1050);
  });

  window.addEventListener("pageshow", () => {
    navigating = false;
    document.body.classList.remove("horologium-route-engaged");
    transition.setAttribute("aria-hidden", "true");
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

function mechanismNumber(project, index) {
  const configured = Number(project?.slotNumber);
  const number = Number.isInteger(configured) && configured > 0 ? configured : index + 1;
  return String(number).padStart(2, "0");
}

function mechanismLabel(project, index) {
  return project?.entryType === "null" ? "NULL" : mechanismNumber(project, index);
}

function cardSlotDial(index) {
  const current = projects[index];
  const count = Math.max(projects.length, 1);
  const nodes = projects.map((project, projectIndex) => {
    const angle = (360 / count) * projectIndex;
    const label = mechanismLabel(project, projectIndex);
    return `<button type="button" class="card-slot-node ${project.entryType === "null" ? "null-node" : ""} ${projectIndex === index ? "active" : ""}" style="--angle:${angle}deg;--counter:${-angle}deg" data-card-slot-index="${projectIndex}" aria-label="${label} ${escapeHtml(project.title)}へ切り替え" ${projectIndex === index ? 'aria-current="true"' : ""}><span>${label}</span></button>`;
  }).join("");

  return `<div class="card-slot-dial" role="group" aria-label="実績スロット切替ダイヤル">
    <span class="card-slot-caption">QUICK SLOT</span>
    <div class="card-slot-ratchet" aria-hidden="true"><i></i><b></b></div>
    <div class="card-slot-nodes">${nodes}</div>
    <div class="card-slot-core ${current?.entryType === "null" ? "is-null" : ""}" aria-hidden="true"><small>SLOT</small><strong>${mechanismLabel(current, index)}</strong><em>${current?.entryType === "null" ? "VACANT" : "ONLINE"}</em></div>
  </div>`;
}

function projectCard(project, index) {
  if (project.entryType === "null") return nullSlotCard(project, index);
  if (project.entryType === "passphrase") return passphraseCard(project, index);
  const media = project.media
    ? `<figure class="card-media"><img src="${escapeHtml(project.media.src)}" alt="${escapeHtml(project.media.alt)}" loading="lazy"><figcaption>${escapeHtml(project.media.caption || "")}</figcaption></figure>`
    : "";
  const evidenceNote = project.evidenceNote
    ? `<p class="evidence-note">${escapeHtml(project.evidenceNote)}</p>`
    : "";
  const evidence = project.evidence?.length
    ? `<div class="evidence-links">${project.evidence.map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} ↗</a>`).join("")}</div>${evidenceNote}`
    : evidenceNote || '<p class="evidence-note">証拠リンク準備中</p>';
  const primaryUrl = project.primaryLink?.url || "";
  const primaryTarget = /^https?:\/\//i.test(primaryUrl) ? ' target="_blank" rel="noopener noreferrer"' : "";
  const primaryLink = primaryUrl
    ? `<a class="primary-project-link" href="${escapeHtml(primaryUrl)}"${primaryTarget}><span>EXTERNAL SITE</span><b>${escapeHtml(project.primaryLink.label || "サイトを開く")}</b><i aria-hidden="true">↗</i></a>`
    : "";

  return `<article class="card mechanism-card ${project.publicationStatus === "draft" ? "draft" : ""}">
    <div class="module-serial">MECHANISM ${mechanismNumber(project, index)} <i></i> ${escapeHtml(project.verification || "recorded")}</div>
    <div class="card-top"><span class="category">${escapeHtml(project.category)}</span>${project.publicationStatus === "draft" ? '<span class="status">要確認・非公開</span>' : ""}</div>
    <h3>${escapeHtml(project.title)}</h3>
    ${primaryLink}
    ${media}
    <p>${escapeHtml(project.description)}</p>
    <div class="tech-list">${project.technologies.map(tech => `<span>${escapeHtml(tech)}</span>`).join("")}</div>
    <div class="evidence"><span class="evidence-label">EVIDENCE PORT</span>${evidence}</div>
    ${cardSlotDial(index)}
  </article>`;
}

function nullSlotCard(project, index) {
  return `<article class="card mechanism-card null-slot-card">
    <div class="module-serial">MECHANISM ${mechanismNumber(project, index)} <i></i> PERMANENT NULL</div>
    <div class="null-slot-chamber" role="img" aria-label="永久欠番 NULL">
      <span>NO MODULE ASSIGNED</span>
      <div class="null-aperture" aria-hidden="true"><i></i><b></b><em></em></div>
      <strong>NULL</strong>
      <small>EA–009 // PERMANENTLY UNASSIGNED</small>
    </div>
    ${cardSlotDial(index)}
  </article>`;
}

function passphraseCard(project, index) {
  return `<article class="card mechanism-card passphrase-card">
    <div class="module-serial">MECHANISM ${mechanismNumber(project, index)} <i></i> ACCESS TERMINAL</div>
    <h3>${escapeHtml(project.title)}</h3>
    <form id="passphrase-form" class="passphrase-console" autocomplete="off">
      <div class="passphrase-reader" aria-hidden="true"><i></i><b></b><span>EA–009 / PHRASE READER</span></div>
      <label class="visually-hidden" for="passphrase-input">合言葉</label>
      <div class="passphrase-entry">
        <input id="passphrase-input" name="passphrase" type="password" inputmode="text" autocapitalize="characters" spellcheck="false" required aria-describedby="passphrase-status">
        <button type="submit"><i></i><span>接続</span><small>CONNECT</small></button>
      </div>
      <p id="passphrase-status" class="passphrase-status" aria-live="polite"></p>
    </form>
    ${cardSlotDial(index)}
  </article>`;
}

function initCardSlotDial() {
  const stage = document.getElementById("project-stage");
  if (!stage) return;
  stage.addEventListener("click", event => {
    const button = event.target.closest?.(".card-slot-node");
    if (!button) return;
    const index = Number(button.dataset.cardSlotIndex);
    if (Number.isInteger(index)) selectProject(index);
  });
}

function initPassphraseGateway() {
  const stage = document.getElementById("project-stage");
  if (!stage) return;

  stage.addEventListener("submit", async event => {
    if (event.target.id !== "passphrase-form") return;
    event.preventDefault();
    const form = event.target;
    const input = form.elements.passphrase;
    const status = form.querySelector(".passphrase-status");
    const phrase = input.value.trim().normalize("NFKC").toUpperCase();
    if (!phrase) return;

    form.classList.add("is-reading");
    status.textContent = "VERIFYING…";
    machineClack("heavy");

    let digest = "";
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(phrase);
      const result = await window.crypto.subtle.digest("SHA-256", bytes);
      digest = [...new Uint8Array(result)].map(value => value.toString(16).padStart(2, "0")).join("");
    }
    const route = accessRoutes.find(item => item.digest?.toLowerCase() === digest);

    window.setTimeout(() => {
      form.classList.remove("is-reading", "is-accepted", "is-denied");
      if (route?.destination) {
        form.classList.add("is-accepted");
        status.textContent = `AUTHORIZED // ${route.label || "DOSSIER"}`;
        try { window.sessionStorage.setItem("ea009-clearance", route.label || "AUTHORIZED"); } catch (_) { /* Storage is optional. */ }
        machineClack("heavy");
        window.setTimeout(() => window.location.assign(new URL(route.destination, window.location.href)), 900);
        return;
      }
      form.classList.add("is-denied");
      status.textContent = accessRoutes.length
        ? "ACCESS DENIED"
        : "NO ROUTE ASSIGNED";
      machineClack("switch");
      input.select();
    }, 680);
  });
}

function renderGearNodes() {
  const nodes = document.getElementById("gear-nodes");
  nodes.innerHTML = projects.map((project, index) => {
    const angle = (360 / projects.length) * index;
    return `<button type="button" role="tab" class="gear-node ${project.entryType === "null" ? "null-node" : ""} ${index === activeIndex ? "active" : ""}" style="--angle:${angle}deg;--counter:${-angle}deg" aria-selected="${index === activeIndex}" aria-label="${escapeHtml(project.title)}" data-index="${index}"><span>${mechanismLabel(project, index)}</span></button>`;
  }).join("");
  nodes.querySelectorAll(".gear-node").forEach(button => button.addEventListener("click", () => selectProject(Number(button.dataset.index))));
}

function updateModuleLabels() {
  const project = projects[activeIndex];
  const label = mechanismLabel(project, activeIndex);
  document.getElementById("module-count").textContent = `${label} / ${String(projects.length).padStart(2, "0")}`;
  document.getElementById("module-title").textContent = project.title;
  const dialNumber = document.getElementById("dial-number");
  dialNumber.textContent = label;
  dialNumber.classList.toggle("null-label", project.entryType === "null");
  document.querySelectorAll(".gear-node").forEach((button, index) => {
    button.classList.toggle("active", index === activeIndex);
    button.setAttribute("aria-selected", String(index === activeIndex));
  });
}

function revealArchive() {
  const shell = document.getElementById("mechanism-shell");
  const toggle = document.getElementById("archive-toggle");
  shell.classList.remove("is-switching", "is-open", "is-unbolted");
  shell.classList.add("is-unlocking");
  toggle.setAttribute("aria-expanded", "false");
  toggle.querySelector("b").textContent = "主錠解除中";
  toggle.querySelector("small").textContent = "RETRACTING BOLTS";
  machineClack("heavy");
  [120, 240, 360, 480].forEach(delay => window.setTimeout(() => machineClack("switch"), delay));

  window.setTimeout(() => {
    shell.classList.add("is-unbolted");
    toggle.querySelector("b").textContent = "開扉機関 接続";
    toggle.querySelector("small").textContent = "HINGE DRIVE ENGAGED";
    machineClack("heavy");
  }, 520);

  window.setTimeout(() => {
    archiveOpen = true;
    shell.classList.remove("is-unlocking", "is-unbolted");
    shell.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.querySelector("b").textContent = "記憶庫 稼働中";
    toggle.querySelector("small").textContent = "ARCHIVE ONLINE";
    machineClack("heavy");
  }, 880);
}

function selectProject(index) {
  if (!projects.length || switching) return;
  const targetIndex = (index + projects.length) % projects.length;
  switching = true;
  const shell = document.getElementById("mechanism-shell");
  const toggle = document.getElementById("archive-toggle");
  const dialNumber = document.getElementById("dial-number");
  shell.classList.remove("is-open", "is-unlocking", "is-unbolted");
  shell.classList.add("is-switching");
  archiveOpen = false;
  toggle.setAttribute("aria-expanded", "false");
  toggle.querySelector("b").textContent = "番号照合中";
  toggle.querySelector("small").textContent = "DIALING MODULE";
  dialNumber.textContent = mechanismLabel(projects[targetIndex], targetIndex);
  dialNumber.classList.toggle("null-label", projects[targetIndex].entryType === "null");
  const step = targetIndex === activeIndex ? 1 : targetIndex - activeIndex;
  gearTurns += step * (360 / projects.length);
  document.getElementById("gear-core").style.transform = `translate(-50%, -50%) rotate(${gearTurns}deg)`;
  machineClack("heavy");

  window.setTimeout(() => {
    activeIndex = targetIndex;
    document.getElementById("project-stage").innerHTML = projectCard(projects[activeIndex], activeIndex);
    updateModuleLabels();
    window.setTimeout(() => {
      revealArchive();
      machineClack("light");
      window.setTimeout(() => { switching = false; }, 1450);
    }, 120);
  }, 760);
}

function moveProject(direction) {
  selectProject((activeIndex + direction + projects.length) % projects.length);
}

async function init() {
  try {
    const response = await fetch("portfolio.json?v=20260901-sequential-slots", { cache: "no-store" });
    if (!response.ok) throw new Error(`portfolio.json: ${response.status}`);
    const data = await response.json();
    const modeKey = data.modes[selectedMode] ? selectedMode : "all";
    const mode = data.modes[modeKey];
    accessRoutes = Array.isArray(data.accessRoutes) ? data.accessRoutes : [];

    document.getElementById("headline").textContent = data.profile.headline;
    document.getElementById("summary").textContent = data.profile.summary;
    document.getElementById("activities").innerHTML = data.profile.activities.map(item => `<li>${escapeHtml(item)}</li>`).join("");
    document.getElementById("work-title").textContent = mode.archiveTitle || `${mode.label}実績機関`;
    document.getElementById("mode-route").textContent = mode.route || "GENERAL ARCHIVE ROUTE";
    document.getElementById("section-intro").textContent = mode.intro || "番号を選び、中央機構を開錠してください。";
    document.body.dataset.mode = modeKey;
    document.getElementById("year").textContent = new Date().getFullYear();
    document.title = `${data.profile.name} — ${mode.label} Portfolio`;
    document.getElementById("mode-nav").innerHTML = Object.entries(data.modes).map(([key, item]) => `<a class="mode-link" href="?mode=${encodeURIComponent(key)}" ${key === modeKey ? 'aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`).join("");

    const order = new Map(mode.order.map((category, index) => [category, index]));
    const routeOrder = project => {
      const categories = Array.isArray(project.routingCategories) && project.routingCategories.length
        ? project.routingCategories
        : [project.category];
      return Math.min(...categories.map(category => order.get(category) ?? 99));
    };
    projects = data.projects.filter(project => project.publicationStatus === "published").sort((a, b) => routeOrder(a) - routeOrder(b));
    document.getElementById("project-stage").innerHTML = projectCard(projects[0], 0);
    renderGearNodes();
    updateModuleLabels();

    document.getElementById("archive-toggle").addEventListener("click", () => selectProject(activeIndex));
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
initCrestControl();
initSecretLatch();
initHorologiumRoute();
initMovementRig();
initPageMachine();
initPassphraseGateway();
initCardSlotDial();
init();
