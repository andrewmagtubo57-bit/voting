import {
  onUser, getProfile, logout, checkAdmin,
  subscribeVotes, subscribeNext, subscribeVoting, castVote, castNext
} from "./firebase.js";
import { HEROES } from "./heroes.js";
import { buildChart, updateChart } from "./chart.js";
import { ROSTER } from "./roster.js";
import { fmtDate, fmtLeft } from "./time.js";

const $ = (s, r) => (r || document).querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let uid = null, openId = null;
let voting = { open: true, closesAt: null }; // from Firestore (set by the admin)
let votingOpen = true;                        // open switch AND the deadline not passed
let votes = [], nextVotes = [];

const computeOpen = () => voting.open && (!voting.closesAt || Date.now() < voting.closesAt.getTime());

function art(h, src, cls) {
  return '<span class="' + cls + '"><span class="initial">' + esc(h.name.charAt(0)) + "</span>" +
    (src ? '<img src="' + esc(src) + '" alt="" onerror="this.remove()">' : "") + "</span>";
}
const zoomBtn = (h, which, src, label) =>
  '<button class="zoom" type="button" data-id="' + h.id + '" data-which="' + which + '" aria-label="Enlarge ' + label.toLowerCase() + " picture of " + esc(h.name) + '">' +
  art(h, src, "thumb") + "</button>";

// Build the cards once, then update() only changes classes and numbers, so the expand animation stays smooth.
function build() {
  $("#row").innerHTML = HEROES.map(h =>
    '<article class="card" data-id="' + h.id + '">' +
      '<button class="face" type="button" aria-expanded="false" aria-controls="d-' + h.id + '">' +
        art(h, h.image, "art") +
        '<span class="badge">Your vote</span>' +
        '<span class="cap"><b>' + esc(h.name) + "</b><small>" + esc(h.role) + '</small><em class="pct">0%</em></span>' +
      "</button>" +
      '<div class="detail" id="d-' + h.id + '">' +
        "<h2>" + esc(h.name) + " <small>" + esc(h.role) + "</small></h2>" +
        '<p class="sum">' + esc(h.summary) + "</p>" +
        '<div class="looks">' +
          "<figure>" + zoomBtn(h, "before", h.imageBefore, "Before") + "<figcaption>Before</figcaption></figure>" +
          "<figure>" + zoomBtn(h, "revamp", h.image, "Revamp") + "<figcaption>Revamp</figcaption></figure>" +
          '<span class="zoom-hint">Click a picture to enlarge</span>' +
        "</div>" +
        '<div class="changes"><div class="th"></div><div class="th">Before</div><div class="th">Revamp</div>' +
          h.changes.map(c =>
            '<div class="part">' + esc(c.part) + '</div><div data-l="Before">' + esc(c.before) +
            '</div><div class="new" data-l="Revamp">' + esc(c.revamp) + "</div>").join("") +
        "</div>" +
        '<div class="tally"><div class="bar"><i></i></div>' +
          '<div class="stat"><b class="p">0%</b><span class="n">0 votes</span></div>' +
          '<button class="vote" type="button" data-id="' + h.id + '"></button></div>' +
      "</div></article>").join("");
}

const tally = (list, key) => list.reduce((c, v) => { c[v[key]] = (c[v[key]] || 0) + 1; return c; }, {});

function update() {
  const counts = tally(votes, "heroId");
  const total = HEROES.reduce((n, h) => n + (counts[h.id] || 0), 0);
  const mineId = (votes.find(v => v.uid === uid) || {}).heroId || null;
  $("#total").textContent = total;
  $("#closed").hidden = votingOpen;

  HEROES.forEach(h => {
    const card = $('[data-id="' + h.id + '"]', $("#row"));
    const n = counts[h.id] || 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    const mine = mineId === h.id;
    card.classList.toggle("open", openId === h.id);
    card.classList.toggle("mine", mine);
    $(".face", card).setAttribute("aria-expanded", openId === h.id);
    $(".pct", card).textContent = pct + "%";
    $(".p", card).textContent = pct + "%";
    $(".n", card).textContent = n + (n === 1 ? " vote" : " votes");
    $(".bar i", card).style.width = pct + "%";
    const b = $(".vote", card);
    b.textContent = mine ? "Your vote" : !votingOpen ? "Voting closed" : (mineId ? "Switch vote to " : "Vote for ") + h.name;
    b.disabled = mine || !votingOpen;
    b.classList.toggle("switch", !mine && !!mineId);
  });

  updateChart($("#chart"), HEROES, counts, mineId);

  // "What do you want to revamp next?"
  const nc = tally(nextVotes, "choice");
  const nTotal = Object.values(nc).reduce((a, b) => a + b, 0);
  const nMine = (nextVotes.find(v => v.uid === uid) || {}).choice || null;
  document.querySelectorAll(".tile").forEach(t => {
    const k = t.dataset.choice, n = nc[k] || 0;
    t.querySelector(".n").textContent = n + (n === 1 ? " vote" : " votes") + " · " + (nTotal ? Math.round((n / nTotal) * 100) : 0) + "%";
    t.classList.toggle("mine", nMine === k);
    t.setAttribute("aria-pressed", nMine === k);
    t.disabled = !votingOpen;
  });
}

/* ---------- Countdown (deadline is set by the admin) ---------- */
function renderCountdown() {
  const el = $("#countdown");
  if (!voting.closesAt || !voting.open) { el.hidden = true; return; } // no deadline, or voting was switched off
  const ms = voting.closesAt.getTime() - Date.now();
  $("#cdText").textContent = ms > 0
    ? "The voting will close in " + fmtLeft(ms) + " (" + fmtDate(voting.closesAt) + ")"
    : "Voting closed on " + fmtDate(voting.closesAt);
  el.hidden = false;
}
function refreshVoting() { votingOpen = computeOpen(); update(); renderCountdown(); }
setInterval(() => {
  const o = computeOpen();
  if (o !== votingOpen) { votingOpen = o; update(); }
  renderCountdown();
}, 1000);

/* ---------- Messages ---------- */
let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
}
const saveError = e => {
  console.error(e);
  toast(e && e.code === "permission-denied" ? "Voting is closed or not allowed for this account." : "Couldn’t save your vote. Try again.");
};

async function vote(id) {
  if (!uid || !votingOpen) return;
  try { await castVote(uid, id); } catch (e) { saveError(e); }
}
async function pickNext(choice) {
  if (!uid || !votingOpen) return;
  try { await castNext(uid, choice); } catch (e) { saveError(e); }
}

/* ---------- Big picture viewer ---------- */
const initial = n => (/^[A-Za-z]/.test(n) ? n.charAt(0).toUpperCase() : "?");
let lbReturn = null;
function openLightbox(title, items) {
  lbReturn = document.activeElement;
  $("#lbTitle").textContent = title;
  $("#lbBody").innerHTML = items.map(it =>
    "<figure><span class=\"big\"><span class=\"initial\">" + initial(it.name) + "</span>" +
    (it.src ? '<img src="' + esc(it.src) + '" alt="' + esc(it.name + " – " + it.caption) + '" onerror="this.remove()">' : "") +
    "</span><figcaption>" + esc(it.caption) + "</figcaption></figure>").join("");
  $("#lightbox").hidden = false;
  document.body.classList.add("noscroll");
  $("#lbClose").focus();
}
function closeLightbox() {
  if ($("#lightbox").hidden) return;
  $("#lightbox").hidden = true;
  document.body.classList.remove("noscroll");
  if (lbReturn && lbReturn.focus) lbReturn.focus();
}
$("#lbClose").addEventListener("click", closeLightbox);
$("#lightbox").addEventListener("click", e => { if (e.target === $("#lightbox")) closeLightbox(); });
addEventListener("keydown", e => {
  if ($("#lightbox").hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "Tab") { e.preventDefault(); $("#lbClose").focus(); } // keep focus inside the viewer
});

$("#row").addEventListener("click", e => {
  const z = e.target.closest(".zoom");
  if (z) {
    const h = HEROES.find(x => x.id === z.dataset.id);
    return openLightbox(h.name + " · " + h.role, [
      { name: h.name, src: h.imageBefore, caption: "Before" },
      { name: h.name, src: h.image, caption: "Revamp" }
    ]);
  }
  const v = e.target.closest(".vote");
  if (v) return vote(v.dataset.id);
  const f = e.target.closest(".face");
  if (f) {
    const id = f.closest(".card").dataset.id;
    openId = openId === id ? null : id;
    update();
  }
});
$("#nextRow").addEventListener("click", e => {
  const t = e.target.closest(".tile");
  if (t) pickNext(t.dataset.choice);
});

/* ---------- Heroes in the game (small name tiles that expand) ---------- */
function buildRoster() {
  $("#roster").innerHTML = ROSTER.map((r, i) =>
    '<div class="rc" data-i="' + i + '">' +
      '<button class="rc-name" type="button" aria-expanded="false" aria-controls="r-' + i + '">' + esc(r.name) + "</button>" +
      '<div class="rc-body" id="r-' + i + '" hidden>' +
        '<button class="rc-photo" type="button" data-zoom="' + i + '" aria-label="Enlarge photo of ' + esc(r.name) + '"><span class="initial">' + initial(r.name) + "</span>" +
          (r.image ? '<img src="' + esc(r.image) + '" alt="Photo of ' + esc(r.name) + '" onerror="this.remove()">' : "") + "</button>" +
        '<div class="rc-info">' + (r.isNew ? '<span class="new-tag">New</span>' : "") +
          "<dl><dt>Name</dt><dd>" + esc(r.name) + "</dd><dt>Class</dt><dd>" + esc(r.cls) +
          "</dd><dt>College</dt><dd>" + esc(r.college) + "</dd><dt>Power / Weapon</dt><dd>" + esc(r.power) + "</dd></dl>" +
        "</div>" +
      "</div></div>").join("");
}
let rosterOpen = null;
$("#roster").addEventListener("click", e => {
  const p = e.target.closest(".rc-photo");
  if (p) {
    const r = ROSTER[p.dataset.zoom];
    return openLightbox(r.name + " · " + r.cls, r.before
      ? [{ name: r.name, src: r.before, caption: "Before" }, { name: r.name, src: r.image, caption: "Revamp" }]
      : [{ name: r.name, src: r.image, caption: r.college + " · " + r.power }]);
  }
  const b = e.target.closest(".rc-name");
  if (!b) return;
  const i = b.closest(".rc").dataset.i;
  rosterOpen = rosterOpen === i ? null : i;
  document.querySelectorAll(".rc").forEach(rc => {
    const open = rc.dataset.i === rosterOpen;
    rc.classList.toggle("open", open);
    rc.querySelector(".rc-name").setAttribute("aria-expanded", open);
    rc.querySelector(".rc-body").hidden = !open;
  });
});

/* ---------- Profile (top right) ---------- */
const FIELDS = [["Username", "username"], ["Email", "email"], ["In-game ID", "ingameId"], ["Mobile", "mobile"],
                ["Gender", "gender"], ["Address", "address"], ["Server", "server"]];
const btn = $("#profileBtn"), pop = $("#profilePop");
function setPop(open) { pop.hidden = !open; btn.setAttribute("aria-expanded", open); }
btn.addEventListener("click", e => { e.stopPropagation(); setPop(pop.hidden); });
document.addEventListener("click", e => { if (!pop.hidden && !pop.contains(e.target)) setPop(false); });
addEventListener("keydown", e => { if (e.key === "Escape") setPop(false); });
$("#logout").addEventListener("click", () => logout());

function fillProfile(user, profile) {
  const data = Object.assign({ email: user.email }, profile || {});
  const name = data.username || user.email;
  $("#avatarLetter").textContent = name.charAt(0).toUpperCase();
  $("#pName").textContent = name;
  $("#pData").innerHTML = FIELDS.filter(f => data[f[1]])
    .map(f => "<dt>" + f[0] + "</dt><dd>" + esc(data[f[1]]) + "</dd>").join("");
}

/* ---------- Start ---------- */
buildChart($("#chart"), HEROES);
build();
buildRoster();
update();

let started = false;
// Only signed-in users see the vote page; everyone else goes to the login page.
onUser(async user => {
  if (!user) { location.replace("loginform.html"); return; }
  uid = user.uid;
  const [profile, admin] = await Promise.all([getProfile(uid).catch(() => null), checkAdmin(uid).catch(() => false)]);
  fillProfile(user, profile);
  $("#adminLink").hidden = !admin;
  $(".wrap").hidden = false;
  if (started) return;
  started = true;
  const fail = e => { console.error(e); toast("Couldn’t load live votes. Check your Firestore rules."); };
  subscribeVoting(v => { voting = v; refreshVoting(); }, fail);
  subscribeVotes(v => { votes = v; update(); }, fail);
  subscribeNext(v => { nextVotes = v; update(); }, fail);
});
