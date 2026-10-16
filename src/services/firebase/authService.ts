import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { authenticateOwner, OwnerLoginError, type OwnerLoginUser } from "./ownerLogin";

export const OWNER_UID = import.meta.env.VITE_OWNER_UID;

export const loginOwner = (email: string, password: string) =>
  authenticateOwner<OwnerLoginUser & User>(email, password, {
    expectedUid: OWNER_UID,
    signIn: (normalizedEmail, rawPassword) =>
      signInWithEmailAndPassword(auth, normalizedEmail, rawPassword),
    signOut: () => signOut(auth),
    verifyServerAccess: async (user) => {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ operation: "verifyOwnerAccess" }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as { code?: unknown };
      if (response.ok) return;
      const code = result.code;
      if (code === "FLOES_OWNER_CONFIG" || code === "FLOES_OWNER_PROJECT_MISMATCH") {
        throw new OwnerLoginError("OWNER_SERVER_CONFIG");
      }
      if (code === "FLOES_OWNER_UID_NOT_ALLOWED") {
        throw new OwnerLoginError("OWNER_SERVER_UID_UNAUTHORIZED");
      }
      throw new OwnerLoginError("OWNER_SERVER_TOKEN_INVALID");
    },
  });

export const logoutOwner = () => signOut(auth);

export const isOwnerUser = (user: User | null) =>
  user?.uid === OWNER_UID;

export const observeAuth = (
  callback: (user: User | null) => void,
) =>
  onAuthStateChanged(auth, callback);
