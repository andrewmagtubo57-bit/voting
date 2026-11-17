// "Heroes in the game" list. Edit here. Photos use the same folder rules as heroes.js.
import { HEROES } from "./heroes.js";

// The first four reuse the revamp photo already set in heroes.js
const img = id => (HEROES.find(h => h.id === id) || {}).image || "";

export const ROSTER = [
  { name: "Aldric", cls: "Fighter",  college: "COED",            power: "Creation staff",     image: img("hero1") },
  { name: "Seren",  cls: "Mage",     college: "CHTM",            power: "Fire manipulation",  image: img("hero2") },
  { name: "Kaito",  cls: "Assassin", college: "CICS",            power: "Camouflage",         image: img("hero3") },
  { name: "Mira",   cls: "Support",  college: "COM (Midwifery)", power: "Shield maker",       image: img("hero4") },
  // New to the list. Replace "0" with the real name and set the photo file name.
  { name: "Taniel",   cls: "Marksman",            college: "CIT",              power: "Gun maker",          image: "hero5.png", isNew: true },
  { name: "Regor",   cls: "Marksman / Assassin", college: "COE",              power: "Werewolf morphing",  image: "hero6.png", isNew: true },
  { name: "Janice", cls: "Mage",                college: "COM (Management)", power: "Metal manipulation", image: "hero7.png", isNew: true }
];
