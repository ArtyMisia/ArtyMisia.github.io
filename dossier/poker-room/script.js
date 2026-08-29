const accessState = document.getElementById("access-state");
const progressNeedle = document.getElementById("progress-needle");

try {
  const clearance = window.sessionStorage.getItem("ea009-clearance");
  if (clearance === "POKER ROOM") {
    accessState.classList.add("is-authorized");
    accessState.querySelector("span").textContent = "PHRASE VERIFIED";
  }
} catch (_) { /* Storage is optional. */ }

const updateProgress = () => {
  const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const ratio = Math.min(1, Math.max(0, window.scrollY / range));
  progressNeedle?.style.setProperty("--depth", `${(ratio * 100).toFixed(1)}%`);
};

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

const revealTargets = [...document.querySelectorAll("[data-reveal]")];
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: .08 });
  revealTargets.forEach(target => observer.observe(target));
} else {
  revealTargets.forEach(target => target.classList.add("is-visible"));
}
