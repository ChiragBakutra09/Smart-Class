import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import api from "./api";

export async function signUp(email, password, name, role, inviteToken) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await cred.user.getIdToken();
  const { data } = await api.post("/auth/register", { name, role, inviteToken });
  return data.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}
