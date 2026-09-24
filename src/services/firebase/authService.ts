import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export const OWNER_UID = import.meta.env.VITE_OWNER_UID;

export const loginOwner = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  if (credential.user.uid !== OWNER_UID) {
    await signOut(auth);
    throw new Error("Esta cuenta no tiene acceso al panel administrativo.");
  }

  return credential.user;
};

export const logoutOwner = () => signOut(auth);

export const isOwnerUser = (user: User | null) =>
  user?.uid === OWNER_UID;

export const observeAuth = (
  callback: (user: User | null) => void,
) =>
  onAuthStateChanged(auth, callback);