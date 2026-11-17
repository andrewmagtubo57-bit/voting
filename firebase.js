// firebase.js: Firebase setup, validation rules and auth helpers for Hero Revamp Vote
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Paste the same config object from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyA5kUAmjKr269ut8Gg5Sr4FuyKh0DYlD2M",
  authDomain: "voting-e0e70.firebaseapp.com",
  projectId: "voting-e0e70",
  storageBucket: "voting-e0e70.firebasestorage.app",
  messagingSenderId: "564239907198",
  appId: "1:564239907198:web:5865176bd932b54b8b1b2f",
  measurementId: "G-EJJ2RG3GBN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ---------- Validation rules (edit here) ---------- */
export function passwordProblem(p) {
  if (p.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return "Include at least one letter and one number.";
  return "";
}

export function validateRegister(d) {
  const errors = {};
  if (!/^[A-Za-z0-9_]{3,20}$/.test(d.username)) errors.username = "Use 3–20 letters, numbers or underscores.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.email = "Enter a valid email address.";
  if (!d.birthday) errors.birthday = "Enter your birthday.";
  else if (new Date(d.birthday) > new Date()) errors.birthday = "Birthday can’t be in the future.";
  if (!/^\+?[0-9]{10,13}$/.test(d.mobile.replace(/[\s-]/g, ""))) errors.mobile = "Enter a valid mobile number (10–13 digits).";
  if (!d.gender) errors.gender = "Choose an option.";
  const pw = passwordProblem(d.password);
  if (pw) errors.password = pw;
  if (d.password !== d.confirm) errors.confirm = "Passwords don’t match.";
  return errors;
}

/* ---------- Auth ---------- */
// Creates the account, then reserves the username and saves the profile in one transaction.
export async function registerUser(d) {
  const cred = await createUserWithEmailAndPassword(auth, d.email, d.password);
  const uid = cred.user.uid;
  try {
    await runTransaction(db, async tx => {
      const nameRef = doc(db, "usernames", d.username.toLowerCase());
      if ((await tx.get(nameRef)).exists()) throw new Error("username-taken");
      tx.set(nameRef, { uid });
      tx.set(doc(db, "users", uid), {
        username: d.username,
        email: d.email,
        birthday: d.birthday,
        mobile: d.mobile.replace(/[\s-]/g, ""),
        gender: d.gender,
        createdAt: serverTimestamp()
      });
    });
  } catch (e) {
    await deleteUser(cred.user); // undo the half-made account
    throw e;
  }
  return cred.user;
}

export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const resetPassword = email => sendPasswordResetEmail(auth, email);
export const logout = () => signOut(auth);
export const onUser = callback => onAuthStateChanged(auth, callback);

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export function friendlyError(e) {
  if (e && e.message === "username-taken") return "That username is taken. Try another one.";
  const map = {
    "auth/email-already-in-use": "That email is already registered.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "That password is too weak.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "permission-denied": "Saving your profile was blocked. Check your Firestore rules."
  };
  return map[e && e.code] || "Something went wrong. Please try again.";
}
