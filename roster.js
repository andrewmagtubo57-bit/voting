// roster.js: the "Heroes in the game" list on vote.html. Edit this file to add or change heroes.
//
// name    = hero name (shown on the small tile)
// cls     = class, e.g. Fighter, Mage
// college = college or faction
// power   = power or weapon
// image   = photo path inside the "images" folder, or a direct https:// link
// isNew   = true shows a "New" tag
// before  = (optional) old-look image. If set, the big viewer shows Before and Revamp side by side.
export const ROSTER = [
  { name: "Aldric", cls: "Fighter",  college: "Your College", power: "Sword",
    image: "images/aldric.png", isNew: false },
  { name: "Seren",  cls: "Mage",     college: "Your College", power: "Fire staff",
    image: "images/seren.png",  isNew: false },
  { name: "Kaito",  cls: "Assassin", college: "Your College", power: "Twin daggers",
    image: "images/kaito.png",  isNew: false },
  { name: "Mira",   cls: "Support",  college: "Your College", power: "Healing staff",
    image: "images/mira.png",   isNew: false }
];
