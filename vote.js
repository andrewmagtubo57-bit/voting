import { onUser, getProfile, logout } from "./firebase.js";

// Edit this list. "image" is the revamped hero and "imageBefore" is the old look.
// Paste direct image links (.jpg, .png, .webp). Empty or broken images show the first letter instead.
// The names and changes below are placeholders. Replace them with the real ones.
const HEROES = [
  { id: "hero1", name: "Aldric", role: "Fighter", image: "", imageBefore: "",
    summary: "Heavier combos and a rebuilt ultimate.",
    changes: [
      { part: "Skill 1",  before: "Single slash, 6 s cooldown",  revamp: "Triple slash combo, 5 s cooldown" },
      { part: "Ultimate", before: "Leap with a small impact",    revamp: "Leap that pulls nearby enemies in" },
      { part: "Look",     before: "Plain steel armor",           revamp: "Armor with glowing runes" }
    ] },
  { id: "hero2", name: "Seren", role: "Mage", image: "", imageBefore: "",
    summary: "Faster casting and a clearer skill kit.",
    changes: [
      { part: "Skill 1",  before: "Slow fireball",               revamp: "Quick fireball that splits in two" },
      { part: "Passive",  before: "Small mana regen",            revamp: "Mana returns after each kill" },
      { part: "Look",     before: "Dull gray robe",              revamp: "Flowing robe with ember effects" }
    ] },
  { id: "hero3", name: "Kaito", role: "Assassin", image: "", imageBefore: "",
    summary: "A new dash skill and updated visuals.",
    changes: [
      { part: "Skill 2",  before: "Short blink",                 revamp: "Dash that resets on a kill" },
      { part: "Ultimate", before: "Marks one enemy",             revamp: "Marks and strikes up to three enemies" },
      { part: "Look",     before: "Black cloth outfit",          revamp: "Light armor with a new mask" }
    ] },
  { id: "hero4", name: "Mira", role: "Support", image: "", imageBefore: "",
    summary: "Stronger shields and a new passive.",
    changes: [
      { part: "Skill 1",  before: "Shield on one ally",          revamp: "Shield that bounces to a second ally" },
      { part: "Passive",  before: "None",                        revamp: "Allies nearby heal slowly" },
      { part: "Look",     before: "Plain white dress",           revamp: "Gold trimmed dress with a staff" }
    ] }
];

const KEY = "heroRevampVotes";
let state = load();
let openId = null;
const $ = (s, r) => (r || document).querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.counts) return s;
  } catch (e) {}
  return { counts: {}, mine: null };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

function art(h, src, cls) {
  return '<span class="' + cls + '"><span class="initial">' + esc(h.name.charAt(0)) + "</span>" +
    (src ? '<img src="' + esc(src) + '" alt="" onerror="this.remove()">' : "") + "</span>";
}

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
          "<figure>" + art(h, h.imageBefore, "thumb") + "<figcaption>Before</figcaption></figure>" +
          "<figure>" + art(h, h.image, "thumb") + "<figcaption>Revamp</figcaption></figure>" +
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

function update() {
  const total = HEROES.reduce((n, h) => n + (state.counts[h.id] || 0), 0);
  $("#total").textContent = total;
  HEROES.forEach(h => {
    const card = $('[data-id="' + h.id + '"]', $("#row"));
    const n = state.counts[h.id] || 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    const mine = state.mine === h.id;
    card.classList.toggle("open", openId === h.id);
    card.classList.toggle("mine", mine);
    $(".face", card).setAttribute("aria-expanded", openId === h.id);
    $(".pct", card).textContent = pct + "%";
    $(".p", card).textContent = pct + "%";
    $(".n", card).textContent = n + (n === 1 ? " vote" : " votes");
    $(".bar i", card).style.width = pct + "%";
    const b = $(".vote", card);
    b.textContent = mine ? "Your vote" : (state.mine ? "Switch vote to " : "Vote for ") + h.name;
    b.disabled = mine;
    b.classList.toggle("switch", !mine && !!state.mine);
  });
}

function vote(id) {
  if (state.mine === id) return;
  if (state.mine) state.counts[state.mine] = Math.max(0, (state.counts[state.mine] || 0) - 1);
  state.counts[id] = (state.counts[id] || 0) + 1;
  state.mine = id;
  save();
  update();
}

$("#row").addEventListener("click", e => {
  const v = e.target.closest(".vote");
  if (v) return vote(v.dataset.id);
  const f = e.target.closest(".face");
  if (f) {
    const id = f.closest(".card").dataset.id;
    openId = openId === id ? null : id;
    update();
  }
});

$("#reset").addEventListener("click", () => {
  state = { counts: {}, mine: null };
  save();
  update();
});

build();
update();


// Only signed-in users see the vote page; everyone else goes to the login page.
onUser(async user => {
  if (!user) { location.replace("loginform.html"); return; }
  const profile = await getProfile(user.uid).catch(() => null);
  document.getElementById("who").textContent = profile ? profile.username : user.email;
  document.querySelector(".wrap").hidden = false;
});
document.getElementById("logout").addEventListener("click", () => logout());
