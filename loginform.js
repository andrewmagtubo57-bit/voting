import {
  onUser, validateRegister, registerUser, loginUser, resetPassword, friendlyError, PASSWORD_RULES, SERVERS
} from "./firebase.js";

const $ = s => document.querySelector(s);
const views = ["login", "register", "forgot"];
let busy = false; // stops the redirect while a new account is still being saved

function route() {
  const name = views.includes(location.hash.slice(1)) ? location.hash.slice(1) : "login";
  views.forEach(v => { $("#" + v).hidden = v !== name; });
  document.querySelectorAll(".msg,.err").forEach(el => { el.textContent = ""; });
}
addEventListener("hashchange", route);
route();

const msg = (f, text, ok) => { const m = f.querySelector(".msg"); m.textContent = text; m.classList.toggle("ok", !!ok); };
const showErrors = (f, errs) => f.querySelectorAll(".err").forEach(el => { el.textContent = errs[el.dataset.for] || ""; });

// Show/hide password eye buttons
const EYE = '<button type="button" class="eye" aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path class="slash" d="M3 3l18 18"/></svg></button>';
document.querySelectorAll(".pw").forEach(w => w.insertAdjacentHTML("beforeend", EYE));
document.addEventListener("click", e => {
  const b = e.target.closest(".eye");
  if (!b) return;
  const input = b.parentElement.querySelector("input");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  b.setAttribute("aria-pressed", show);
  b.setAttribute("aria-label", show ? "Hide password" : "Show password");
});

/* ---------- Create account form ---------- */
const rf = $("#register");
rf.server.insertAdjacentHTML("beforeend", SERVERS.map(s => "<option>" + s + "</option>").join(""));

// Password checklist: one line per rule, ticked live as you type
const checks = $("#checks");
checks.innerHTML = PASSWORD_RULES.map(r => "<li>" + r.label + "</li>").join("");
function updateChecks() {
  [...checks.children].forEach((li, i) => li.classList.toggle("ok", PASSWORD_RULES[i].test(rf.password.value, rf.confirm.value)));
  rf.querySelector('[data-for="confirm"]').textContent =
    rf.confirm.value && rf.confirm.value !== rf.password.value ? "Passwords don’t match." : "";
}
rf.addEventListener("input", e => {
  if (e.target.name === "mobile") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11); // digits only, max 11
  if (e.target.name === "ingameId") e.target.value = e.target.value.replace(/\D/g, "");
  if (e.target.name === "password" || e.target.name === "confirm") updateChecks();
});
updateChecks();

rf.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = rf.querySelector("[type=submit]");
  const d = {
    username: rf.username.value.trim(), email: rf.email.value.trim(), ingameId: rf.ingameId.value.trim(),
    mobile: rf.mobile.value.trim(), gender: rf.gender.value, address: rf.address.value.trim(),
    server: rf.server.value, password: rf.password.value, confirm: rf.confirm.value, terms: rf.terms.checked
  };
  const errors = validateRegister(d);
  showErrors(rf, errors);
  if (Object.keys(errors).length) return msg(rf, "Fix the highlighted fields and try again.");
  msg(rf, "");
  btn.disabled = true; busy = true;
  try { await registerUser(d); location.href = "vote.html"; }
  catch (err) { busy = false; msg(rf, friendlyError(err)); btn.disabled = false; }
});

/* ---------- Log in and forgot password ---------- */
$("#login").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector("[type=submit]");
  const email = f.email.value.trim(), pw = f.password.value;
  if (!email || !pw) return msg(f, "Enter your email and password.");
  btn.disabled = true;
  try { await loginUser(email, pw); location.href = "vote.html"; }
  catch (err) { msg(f, friendlyError(err)); btn.disabled = false; }
});

$("#forgot").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, email = f.email.value.trim();
  if (!email) return msg(f, "Enter your email.");
  try { await resetPassword(email); msg(f, "If that email is registered, a reset link is on its way.", true); }
  catch (err) { msg(f, friendlyError(err)); }
});

// Already signed in? Go straight to the vote page.
onUser(user => { if (user && !busy) location.replace("vote.html"); });
