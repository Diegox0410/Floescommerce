const projectId = "floes-commercial-sandbox-2026";
const values = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
const appIdProjectNumber = /^1:(\d+):web:[A-Za-z0-9_-]+$/.exec(values.appId ?? "")?.[1];
const configValues = Object.values(values).filter((value) => typeof value === "string");
const result = {
  allSixFieldsPresent: Object.values(values).every((value) => Boolean(value && value === value.trim())),
  apiKeyPresent: Boolean(values.apiKey),
  projectIdMatchesSandbox: values.projectId === projectId,
  authDomainMatchesSandbox: values.authDomain === `${projectId}.firebaseapp.com`,
  storageBucketMatchesSandbox: values.storageBucket === `${projectId}.firebasestorage.app`
    || values.storageBucket === `${projectId}.appspot.com`,
  senderIdMatchesAppId: Boolean(appIdProjectNumber && values.messagingSenderId === appIdProjectNumber),
  legacyFirebaseHostAbsent: !configValues.some((value) => /floes-commerce\.(?:firebaseapp\.com|appspot\.com|firebasestorage\.app)/i.test(value)),
};
console.log(JSON.stringify(result));
if (Object.values(result).some((value) => value !== true)) process.exitCode = 1;
