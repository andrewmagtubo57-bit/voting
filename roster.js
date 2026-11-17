// "Heroes in the game" list. Edit here. Photos use the same folder rules as heroes.js.
import { HEROES } from "./heroes.js";

// The first four reuse the photos already set in heroes.js
const pick = (id, key) => (HEROES.find(h => h.id === id) || {})[key] || "";

export const ROSTER = [
  { name: "Aldric", cls: "Fighter",  college: "COED",            power: "Creation staff",    image: pick("hero1", "image"), before: pick("hero1", "imageBefore") },
  { name: "Seren",  cls: "Mage",     college: "CHTM",            power: "Fire manipulation", image: pick("hero2", "image"), before: pick("hero2", "imageBefore") },
  { name: "Kaito",  cls: "Assassin", college: "CICS",            power: "Camouflage",        image: pick("hero3", "image"), before: pick("hero3", "imageBefore") },
  { name: "Mira",   cls: "Support",  college: "COM (Midwifery)", power: "Shield maker",      image: pick("hero4", "image"), before: pick("hero4", "imageBefore") },
  // New to the list. Replace "0" with the real name and set the photo file name.
  { name: "Taniel",   cls: "Marksman",            college: "CIT",              power: "Gun maker",          image: "taniel.png", isNew: true },
  { name: "Regor",   cls: "Fighter/ Assassin", college: "COE",              power: "Werewolf morphing",  image: "regor.png", isNew: true },
  { name: "janice", cls: "Mage",                college: "COM (Management)", power: "Metal manipulation", image: "janice.png", isNew: true }
];
