import assert from "node:assert/strict";
import test from "node:test";
import {
  authenticateOwner,
  classifyOwnerLoginError,
  ownerLoginMessage,
  OwnerLoginError,
} from "../src/services/firebase/ownerLogin.ts";

test("wrong password and missing account keep distinct internal Firebase categories", () => {
  assert.equal(classifyOwnerLoginError({ code: "auth/wrong-password" }).code, "AUTH_PASSWORD_INCORRECT");
  assert.equal(classifyOwnerLoginError({ code: "auth/user-not-found" }).code, "AUTH_USER_NOT_FOUND");
  assert.equal(classifyOwnerLoginError({ code: "auth/invalid-credential" }).code, "AUTH_INVALID_CREDENTIALS");
  assert.equal(ownerLoginMessage({ code: "auth/wrong-password" }), ownerLoginMessage({ code: "auth/user-not-found" }));
});

test("disabled Email/Password provider is distinct from invalid credentials", () => {
  assert.equal(classifyOwnerLoginError({ code: "auth/operation-not-allowed" }).code, "AUTH_EMAIL_PASSWORD_DISABLED");
  assert.match(ownerLoginMessage({ code: "auth/operation-not-allowed" }), /Email\/Password.*deshabilitado/);
});

test("missing Owner UID configuration fails before Firebase sign-in", async () => {
  let attempted = false;
  await assert.rejects(() => authenticateOwner("owner@example.test", "synthetic-password", {
    expectedUid: " ",
    signIn: async () => { attempted = true; return { user: { uid: "owner-uid" } }; },
    signOut: async () => undefined,
  }), (error: unknown) => error instanceof OwnerLoginError && error.code === "OWNER_CONFIG_MISSING");
  assert.equal(attempted, false);
});

test("authenticated but non-allowlisted UID signs out and is rejected", async () => {
  let signedOut = false;
  await assert.rejects(() => authenticateOwner(" owner@example.test ", "synthetic-password", {
    expectedUid: "expected-owner",
    signIn: async (email) => {
      assert.equal(email, "owner@example.test");
      return { user: { uid: "different-owner" } };
    },
    signOut: async () => { signedOut = true; },
  }), (error: unknown) => error instanceof OwnerLoginError && error.code === "OWNER_UID_UNAUTHORIZED");
  assert.equal(signedOut, true);
});

test("valid client UID still requires server-side Owner authorization", async () => {
  let verified = false;
  const user = await authenticateOwner("owner@example.test", "synthetic-password", {
    expectedUid: "expected-owner",
    signIn: async () => ({ user: { uid: "expected-owner" } }),
    signOut: async () => undefined,
    verifyServerAccess: async () => { verified = true; },
  });
  assert.equal(user.uid, "expected-owner");
  assert.equal(verified, true);
  await assert.rejects(() => authenticateOwner("owner@example.test", "synthetic-password", {
    expectedUid: "expected-owner",
    signIn: async () => ({ user: { uid: "expected-owner" } }),
    signOut: async () => undefined,
    verifyServerAccess: async () => { throw new OwnerLoginError("OWNER_SERVER_CONFIG"); },
  }), (error: unknown) => error instanceof OwnerLoginError && error.code === "OWNER_SERVER_CONFIG");
});
