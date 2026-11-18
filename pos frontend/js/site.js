/* Global behaviour: hamburger + sidebar */
(function () {
  const btn = document.getElementById("menuToggle");
  const nav = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  if (!btn || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    btn.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.setAttribute("aria-hidden", !open);
    if (open) { scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add("is-visible")); }
    else { scrim.classList.remove("is-visible"); setTimeout(() => (scrim.hidden = true), 380); }
  }
  btn.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  scrim.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
})();
