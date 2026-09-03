const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../portfolio.json"), "utf8"));

// Load the actual browser functions without starting audio, animation loops or fetch.
function fixture() {
  const elements = new Map();
  const timers = [];
  let time = 0;
  const document = {
    activeElement: null,
    querySelectorAll: () => [],
    getElementById(id) {
      if (elements.has(id)) return elements.get(id);
      const classes = new Set();
      const attributes = new Map();
      const children = new Map();
      const element = {
        innerHTML: "", textContent: "", inert: false, style: {}, listeners: {},
        classList: {
          add: (...names) => names.forEach(name => classes.add(name)),
          remove: (...names) => names.forEach(name => classes.delete(name)),
          contains: name => classes.has(name),
          toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
        },
        setAttribute: (name, value) => attributes.set(name, String(value)),
        getAttribute: name => attributes.get(name),
        addEventListener: (name, callback) => { element.listeners[name] = callback; },
        querySelectorAll: () => [],
        querySelector(selector) {
          if (!children.has(selector)) children.set(selector, document.getElementById(`${id} ${selector}`));
          return children.get(selector);
        },
        focus: () => { document.activeElement = element; },
        getBoundingClientRect: () => ({ top: 16, bottom: 650 })
      };
      elements.set(id, element);
      return element;
    }
  };
  const context = vm.createContext({
    document, URLSearchParams, location: { search: "" },
    window: {
      innerHeight: 900, scrollY: 0, scrollTo: () => {},
      matchMedia: () => ({ matches: false }),
      setTimeout: (callback, delay) => timers.push({ callback, at: time + delay })
    }
  });
  vm.runInContext(source.slice(0, source.indexOf("\ninitMechanicalAudio();")), context);
  // Audio and scroll geometry are separate from the navigation state under test.
  vm.runInContext("machineClack = () => {}; initRecordScroll = () => {};", context);
  const run = code => vm.runInContext(code, context);
  function flush() {
    while (timers.length) {
      timers.sort((a, b) => a.at - b.at);
      const timer = timers.shift();
      time = timer.at;
      timer.callback();
    }
  }
  return { document, context, run, flush, timers };
}

function ordered(modeKey) {
  const order = new Map(data.modes[modeKey].order.map((category, index) => [category, index]));
  const routeOrder = project => Math.min(...(project.routingCategories?.length
    ? project.routingCategories : [project.category]).map(category => order.get(category) ?? 99));
  const expression = source.match(/projects = (data\.projects\.filter[\s\S]*?\n    \}\));/)[1];
  return new Function("data", "modeKey", "routeOrder", `return ${expression}`)(data, modeKey, routeOrder);
}

test("main and quick dials share the order; NULL is last without renumbering records", () => {
  for (const modeKey of Object.keys(data.modes)) {
    const f = fixture();
    f.context.records = ordered(modeKey);
    f.run("projects = records; renderGearNodes(); quickDial = cardSlotDial(0);");
    const labels = f.context.records.map(project => project.entryType === "null" ? "NULL" : String(project.slotNumber).padStart(2, "0"));
    assert.equal(labels.at(-1), "NULL");
    if (modeKey === "all") assert.deepEqual(labels, ["01", "02", "03", "04", "05", "06", "07", "08", "10", "NULL"]);
    for (const html of [f.document.getElementById("gear-nodes").innerHTML, f.context.quickDial]) {
      assert.deepEqual([...html.matchAll(/<span>([^<]+)<\/span>/g)].map(match => match[1]), labels);
    }
    assert.match(f.context.quickDial, /<button type="button" class="card-slot-core/);
    assert.match(f.context.quickDial, /aria-label="[^"]+ 金庫を閉じる"/);
  }
  assert.equal(data.projects.find(project => project.entryType === "null").slotNumber, 9);
  assert.equal(data.projects.find(project => project.id === "rhythm-chain").slotNumber, 10);
});

test("central number closes the vault, restores focus and allows reopening the same record", () => {
  for (const index of [0, 4, 8, 9]) {
    const f = fixture();
    f.context.records = ordered("all");
    f.run(`projects = records; activeIndex = ${index}; archiveOpen = true; switching = false; initCardSlotDial();`);
    const stage = f.document.getElementById("project-stage");
    const shell = f.document.getElementById("mechanism-shell");
    const toggle = f.document.getElementById("archive-toggle");
    shell.classList.add("is-open");
    stage.listeners.click({ target: { closest: selector => selector === ".card-slot-core" ? {} : null } });
    assert.equal(f.run("archiveOpen"), false);
    assert.equal(f.run("activeIndex"), index);
    assert.equal(stage.inert, true);
    assert.equal(shell.classList.contains("is-open"), false);
    assert.equal(shell.getAttribute("aria-busy"), "true");
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(f.document.activeElement, toggle);
    const pending = f.timers.length;
    f.run("closeArchive();");
    assert.equal(f.timers.length, pending, "rapid repeat clicks do not queue more transitions");
    f.flush();
    assert.equal(f.run("switching"), false);
    assert.equal(shell.getAttribute("aria-busy"), "false");
    assert.equal(toggle.querySelector("b").textContent, "指定番号を開錠");
    f.run("selectProject(activeIndex);");
    f.flush();
    assert.equal(f.run("archiveOpen"), true);
    assert.equal(f.run("activeIndex"), index);
    assert.equal(stage.inert, false);
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    assert.equal(shell.classList.contains("is-open"), true);
  }
});

test("NEXT/PREV moves between slot 10 and NULL in the new order", () => {
  const f = fixture();
  f.context.records = ordered("all");
  f.run("projects = records; activeIndex = 8; moveProject(1);");
  f.flush();
  assert.equal(f.run("projects[activeIndex].entryType"), "null");
  f.run("moveProject(-1);");
  f.flush();
  assert.equal(f.run("projects[activeIndex].id"), "rhythm-chain");
});

test("Lesath previews use the supplied videos, real thumbnails and safe external links", () => {
  const f = fixture();
  const project = data.projects.find(item => item.id === "lesath-production");
  f.context.project = project;
  const html = f.run("projectGallery(project)");
  assert.equal(project.gallery.length, 4);
  assert.equal([...html.matchAll(/class="work-preview"/g)].length, 4);
  assert.equal([...html.matchAll(/loading="lazy"/g)].length, 4);
  assert.equal([...html.matchAll(/rel="noopener noreferrer"/g)].length, 4);
  for (const item of project.gallery) {
    const videoId = new URL(item.url).pathname.slice(1);
    assert.equal(item.image, `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
    assert.ok(project.evidence.some(link => link.url === item.url));
    assert.ok(html.includes(item.image));
    assert.ok(html.includes(item.title));
  }
  assert.ok(project.technologies.includes("Thumbnail Design"));
  assert.equal(project.galleryLabel, "動画編集・サムネイル制作");
  assert.ok(project.description.includes("動画編集とサムネイル制作の両方を担当"));
  assert.equal(f.run("projectGallery({})"), "");
  assert.equal(f.run("projectGallery({ gallery: [] })"), "");
  const escaped = f.run('projectGallery({ galleryLabel: "<test>", gallery: [{ title: "<script> & \\\"", url: "https://example.com/?a=1&b=2", image: "https://example.com/image.jpg" }] })');
  assert.ok(!escaped.includes("<script>"));
  assert.ok(escaped.includes("&lt;script&gt; &amp; &quot;"));
});
