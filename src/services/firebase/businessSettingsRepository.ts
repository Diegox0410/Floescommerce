import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  defaultBusinessSettings,
  normalizeBusinessSettings,
  type BusinessSettings,
} from "../../store/businessSettingsStore";

import {
  db,
} from "./firebase";

const settingsRef =
  doc(
    db,
    "businessSettings",
    "main",
  );

export const getRemoteBusinessSettings =
  async (): Promise<BusinessSettings> => {
    const snapshot =
      await getDoc(
        settingsRef,
      );

    if (!snapshot.exists()) {
      return defaultBusinessSettings;
    }

    return normalizeBusinessSettings(
      snapshot.data(),
    );
  };

export const saveRemoteBusinessSettings =
  async (
    settings: BusinessSettings,
  ): Promise<BusinessSettings> => {
    const normalized =
      normalizeBusinessSettings(
        settings,
      );

    await setDoc(
      settingsRef,
      normalized,
    );

    return normalized;
  };