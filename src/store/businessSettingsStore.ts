import {
  create,
} from "zustand";

import {
  safeNumber,
} from "../utils/productMetrics";

import {
  record,
} from "../utils/normalization";

import {
  signedNumber,
} from "../analytics/projectionEngine";

import {
  getRemoteBusinessSettings,
  saveRemoteBusinessSettings,
} from "../services/firebase/businessSettingsRepository";

export interface ScenarioConfig {
  name: string;
  volumeVariation: number;
  averageTicket: number | null;
  margin: number | null;
}

export interface BusinessSettings {
  monthlySalesGoal: number;
  fixedCosts: number;
  contributionMargin: number | null;
  scenarios: ScenarioConfig[];
}

export const defaultBusinessSettings:
  BusinessSettings = {
    monthlySalesGoal: 0,
    fixedCosts: 0,
    contributionMargin: null,

    scenarios: [
      {
        name: "Conservador",
        volumeVariation: -15,
        averageTicket: null,
        margin: null,
      },
      {
        name: "Base",
        volumeVariation: 0,
        averageTicket: null,
        margin: null,
      },
      {
        name: "Agresivo",
        volumeVariation: 25,
        averageTicket: null,
        margin: null,
      },
    ],
  };

export function normalizeBusinessSettings(
  value: unknown,
): BusinessSettings {
  const settings =
    record(value);

  return {
    monthlySalesGoal:
      safeNumber(
        settings.monthlySalesGoal,
      ),

    fixedCosts:
      safeNumber(
        settings.fixedCosts,
      ),

    contributionMargin:
      typeof settings.contributionMargin ===
        "number" &&
      Number.isFinite(
        settings.contributionMargin,
      ) &&
      settings.contributionMargin >
        0 &&
      settings.contributionMargin <=
        100
        ? settings.contributionMargin
        : null,

    scenarios:
      defaultBusinessSettings.scenarios.map(
        (
          fallback,
          index,
        ) => {
          const scenario =
            record(
              Array.isArray(
                settings.scenarios,
              )
                ? settings.scenarios[
                    index
                  ]
                : null,
            );

          return {
            ...fallback,

            volumeVariation:
              Math.max(
                -100,
                signedNumber(
                  scenario.volumeVariation,
                  fallback.volumeVariation,
                ),
              ),

            averageTicket:
              typeof scenario.averageTicket ===
              "number"
                ? safeNumber(
                    scenario.averageTicket,
                  )
                : null,

            margin:
              typeof scenario.margin ===
              "number"
                ? Math.min(
                    100,
                    signedNumber(
                      scenario.margin,
                    ),
                  )
                : null,
          };
        },
      ),
  };
}

interface SettingsStore
  extends BusinessSettings {
  remoteLoading: boolean;
  remoteReady: boolean;
  remoteError: string | null;
  saving: boolean;

  loadRemoteSettings:
    () => Promise<void>;

  updateSettings: (
    input: Partial<BusinessSettings>,
  ) => Promise<void>;

  clearRemoteError:
    () => void;
}

export const useBusinessSettingsStore =
  create<SettingsStore>()(
    (set, get) => ({
      ...defaultBusinessSettings,

      remoteLoading: false,
      remoteReady: false,
      remoteError: null,
      saving: false,

      loadRemoteSettings:
        async () => {
          set({
            remoteLoading: true,
            remoteError: null,
          });

          try {
            const settings =
              await getRemoteBusinessSettings();

            set({
              ...settings,

              remoteLoading: false,
              remoteReady: true,
              remoteError: null,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudo cargar la configuración empresarial.";

            set({
              remoteLoading: false,
              remoteReady: false,
              remoteError:
                message,
            });

            throw error;
          }
        },

      updateSettings:
        async (
          input,
        ) => {
          set({
            saving: true,
            remoteError: null,
          });

          try {
            const current: BusinessSettings = {
              monthlySalesGoal:
                get().monthlySalesGoal,

              fixedCosts:
                get().fixedCosts,

              contributionMargin:
                get().contributionMargin,

              scenarios:
                get().scenarios,
            };

            const next =
              normalizeBusinessSettings({
                ...current,
                ...input,
              });

            const saved =
              await saveRemoteBusinessSettings(
                next,
              );

            set({
              ...saved,
              saving: false,
              remoteReady: true,
              remoteError: null,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudo guardar la configuración empresarial.";

            set({
              saving: false,
              remoteError:
                message,
            });

            throw error;
          }
        },

      clearRemoteError:
        () =>
          set({
            remoteError: null,
          }),
    }),
  );