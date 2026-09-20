import {
  useState,
} from "react";

import {
  useBusinessMetrics,
} from "../../analytics/useBusinessMetrics";

import {
  useBusinessSettingsStore,
} from "../../store/businessSettingsStore";

import {
  goalStatusLabels,
} from "../../analytics/projectionEngine";

import {
  AdminSectionHeader,
} from "../components/AdminSectionHeader";

import {
  Field,
  DataTable,
  OperationStats,
  EmptyState,
} from "../components/OperationsUI";

import {
  BusinessSection,
  SalesPolicyNote,
} from "../components/BusinessUI";

import {
  money,
  number,
} from "../components/format";

export function AdminProjection() {
  const m =
    useBusinessMetrics();

  const monthlySalesGoal =
    useBusinessSettingsStore(
      (state) =>
        state.monthlySalesGoal,
    );

  const storedScenarios =
    useBusinessSettingsStore(
      (state) =>
        state.scenarios,
    );

  const updateSettings =
    useBusinessSettingsStore(
      (state) =>
        state.updateSettings,
    );

  const saving =
    useBusinessSettingsStore(
      (state) =>
        state.saving,
    );

  const remoteError =
    useBusinessSettingsStore(
      (state) =>
        state.remoteError,
    );

  const clearRemoteError =
    useBusinessSettingsStore(
      (state) =>
        state.clearRemoteError,
    );

  const p =
    m.projection;

  const input =
    m.projectionInput;

  const [
    goal,
    setGoal,
  ] = useState(
    monthlySalesGoal,
  );

  const [
    goalSaved,
    setGoalSaved,
  ] = useState(false);

  const [
    scenariosSaved,
    setScenariosSaved,
  ] = useState(false);

  const [
    scenarios,
    setScenarios,
  ] = useState(
    storedScenarios,
  );

  const setScenario = (
    index: number,
    key:
      | "volumeVariation"
      | "averageTicket"
      | "margin",
    value: string,
  ) => {
    setScenarios(
      (rows) =>
        rows.map(
          (
            row,
            rowIndex,
          ) =>
            rowIndex ===
            index
              ? {
                  ...row,

                  [key]:
                    value === "" &&
                    key !==
                      "volumeVariation"
                      ? null
                      : Number(
                          value,
                        ),
                }
              : row,
        ),
    );

    setScenariosSaved(
      false,
    );

    clearRemoteError();
  };

  const available =
    m.inventory.rows
      .filter(
        (row) =>
          row.active &&
          row.stock > 0,
      )
      .sort(
        (a, b) =>
          b.retailValue -
            a.retailValue ||
          a.id.localeCompare(
            b.id,
          ),
      );

  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / INTELIGENCIA COMERCIAL"
        title="Proyección"
        description="Convierte tus metas comerciales en objetivos diarios y decisiones de inventario."
      />

      <SalesPolicyNote />

      {remoteError && (
        <p
          role="alert"
          className="admin-error"
        >
          {remoteError}
        </p>
      )}

      <BusinessSection
        title="Meta mensual de ventas"
        description="La configuración se guarda en Firebase; los resultados se recalculan con los pedidos."
      >
        <form
          className="admin-business-goal-form"
          onSubmit={async (
            event,
          ) => {
            event.preventDefault();

            setGoalSaved(
              false,
            );

            clearRemoteError();

            try {
              await updateSettings({
                monthlySalesGoal:
                  goal,
              });

              setGoalSaved(
                true,
              );
            } catch {
              setGoalSaved(
                false,
              );
            }
          }}
        >
          <Field label="Meta mensual (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              disabled={
                saving
              }
              value={
                goal
              }
              onChange={(
                event,
              ) => {
                setGoal(
                  Number(
                    event.target
                      .value,
                  ),
                );

                setGoalSaved(
                  false,
                );

                clearRemoteError();
              }}
            />
          </Field>

          <button
            type="submit"
            className="admin-button admin-button-primary"
            disabled={
              saving
            }
          >
            {saving
              ? "Guardando..."
              : "Guardar meta"}
          </button>

          {goalSaved &&
            !saving &&
            !remoteError && (
              <span
                role="status"
                className="admin-footnote"
              >
                Meta guardada en Firebase.
              </span>
            )}
        </form>

        {monthlySalesGoal ===
          0 && (
          <p className="admin-footnote">
            Configura una meta mayor que cero para evaluar avance y cobertura.
          </p>
        )}
      </BusinessSection>

      <OperationStats
        items={[
          {
            label: "Meta",
            value: money(
              input.monthlyGoal,
            ),
          },
          {
            label:
              "Ventas actuales",
            value: money(
              input.currentRevenue,
            ),
          },
          {
            label: "Avance",
            value: `${number(
              p.goalProgress,
            )}%`,
          },
          {
            label: "Faltante",
            value: money(
              p.remainingRevenue,
            ),
          },
          {
            label:
              "Días transcurridos",
            value: number(
              input.daysElapsed,
            ),
          },
          {
            label:
              "Días restantes",
            value: number(
              input.daysRemaining,
            ),
          },
          {
            label:
              "Venta diaria necesaria",
            value:
              p.requiredDailyRevenue ===
              null
                ? "Periodo cerrado"
                : money(
                    p.requiredDailyRevenue,
                  ),
          },
          {
            label:
              "Ticket promedio",
            value: money(
              input.averageTicket,
            ),
          },
          {
            label:
              "Pedidos estimados necesarios",
            value:
              p.requiredOrders ===
              null
                ? "Sin ticket disponible"
                : number(
                    p.requiredOrders,
                  ),
          },
          {
            label:
              "Proyección de cierre",
            value:
              p.projectedEndRevenue ===
              null
                ? "Sin datos suficientes"
                : money(
                    p.projectedEndRevenue,
                  ),
          },
          {
            label:
              "Utilidad proyectada",
            value:
              p.projectedProfit ===
              null
                ? "Sin datos suficientes"
                : money(
                    p.projectedProfit,
                  ),
          },
          {
            label:
              "Estado de meta",
            value:
              p.status
                ? goalStatusLabels[
                    p.status
                  ]
                : "Sin meta configurada",
          },
        ]}
      />

      <BusinessSection
        title="Ritmo actual"
        description="Extrapolación lineal del mes, incluyendo hoy como día transcurrido."
      >
        <div className="admin-business-result">
          <span>
            Promedio vendido por día
          </span>

          <strong>
            {p.averageDailyRevenue ===
            null
              ? "Sin datos suficientes"
              : money(
                  p.averageDailyRevenue,
                )}
          </strong>
        </div>

        <p>
          {p.projectedEndRevenue ===
          null
            ? "Registra pedidos válidos para construir un escenario basado en datos."
            : `Al ritmo actual cerrarías aproximadamente en ${money(
                p.projectedEndRevenue,
              )}.`}
        </p>

        <p className="admin-footnote">
          No es una predicción de demanda. El día actual puede estar incompleto y pocos pedidos aportan una base limitada.
        </p>
      </BusinessSection>

      <BusinessSection
        title="Escenarios de cierre"
        description="Supuestos editables sobre las ventas futuras; conserva las ventas ya registradas."
      >
        <form
          onSubmit={async (
            event,
          ) => {
            event.preventDefault();

            setScenariosSaved(
              false,
            );

            clearRemoteError();

            try {
              await updateSettings({
                scenarios,
              });

              setScenariosSaved(
                true,
              );
            } catch {
              setScenariosSaved(
                false,
              );
            }
          }}
        >
          <div className="admin-business-scenarios">
            {scenarios.map(
              (
                scenario,
                index,
              ) => (
                <fieldset
                  key={
                    scenario.name
                  }
                  disabled={
                    saving
                  }
                >
                  <legend>
                    {
                      scenario.name
                    }
                  </legend>

                  <Field
                    label={`Variación de volumen ${scenario.name.toLowerCase()} (%)`}
                  >
                    <input
                      type="number"
                      min="-100"
                      step="0.1"
                      required
                      value={
                        scenario.volumeVariation
                      }
                      onChange={(
                        event,
                      ) =>
                        setScenario(
                          index,
                          "volumeVariation",
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </Field>

                  <Field
                    label={`Ticket ${scenario.name.toLowerCase()} (USD)`}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={number(
                        input.averageTicket,
                      )}
                      value={
                        scenario.averageTicket ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        setScenario(
                          index,
                          "averageTicket",
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </Field>

                  <Field
                    label={`Margen ${scenario.name.toLowerCase()} (%)`}
                  >
                    <input
                      type="number"
                      max="100"
                      step="0.1"
                      placeholder={number(
                        input.averageMargin,
                      )}
                      value={
                        scenario.margin ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        setScenario(
                          index,
                          "margin",
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </Field>
                </fieldset>
              ),
            )}
          </div>

          <button
            type="submit"
            className="admin-button admin-button-primary"
            disabled={
              saving
            }
          >
            {saving
              ? "Guardando..."
              : "Aplicar escenarios"}
          </button>

          {scenariosSaved &&
            !saving &&
            !remoteError && (
              <span
                role="status"
                className="admin-footnote"
              >
                Escenarios guardados en Firebase.
              </span>
            )}
        </form>

        <p className="admin-footnote">
          Ticket y margen vacíos usan los observados. Volumen modifica pedidos por día únicamente en los días restantes. Los supuestos se aplican al guardar.
        </p>

        <DataTable
          columns={[
            "Escenario",
            "Ventas de cierre",
            "Pedidos de cierre",
            "Utilidad de cierre",
            "Margen futuro",
          ]}
        >
          {m.scenarios.map(
            (scenario) => (
              <tr
                key={
                  scenario.name
                }
              >
                <th scope="row">
                  {
                    scenario.name
                  }
                </th>

                <td>
                  {scenario.revenue ===
                  null
                    ? "Sin datos suficientes"
                    : money(
                        scenario.revenue,
                      )}
                </td>

                <td>
                  {scenario.orders ===
                  null
                    ? "Sin datos suficientes"
                    : number(
                        scenario.orders,
                      )}
                </td>

                <td>
                  {scenario.profit ===
                  null
                    ? "Sin datos suficientes"
                    : money(
                        scenario.profit,
                      )}
                </td>

                <td>
                  {number(
                    scenario.margin,
                  )}
                  %
                </td>
              </tr>
            ),
          )}
        </DataTable>
      </BusinessSection>

      <BusinessSection
        title="Potencial actual de inventario"
        description="Productos activos con existencias. Potencial a precios y costos actuales, sin asegurar ventas."
      >
        <OperationStats
          items={[
            {
              label:
                "Venta potencial disponible",
              value: money(
                m.inventory
                  .activeRetailValue,
              ),
            },
            {
              label:
                "Utilidad potencial disponible",
              value: money(
                m.inventory
                  .activePotentialProfit,
              ),
            },
          ]}
        />

        {available.length ? (
          <DataTable
            columns={[
              "Producto",
              "Stock disponible",
              "Precio",
              "Venta potencial",
              "Utilidad potencial",
              "Margen",
            ]}
          >
            {available.map(
              (row) => (
                <tr
                  key={
                    row.id
                  }
                >
                  <th scope="row">
                    {
                      row.name
                    }
                  </th>

                  <td>
                    {
                      row.stock
                    }
                  </td>

                  <td>
                    {money(
                      row.price,
                    )}
                  </td>

                  <td>
                    {money(
                      row.retailValue,
                    )}
                  </td>

                  <td>
                    {money(
                      row.potentialProfit,
                    )}
                  </td>

                  <td>
                    {number(
                      row.margin,
                    )}
                    %
                  </td>
                </tr>
              ),
            )}
          </DataTable>
        ) : (
          <EmptyState title="Sin inventario activo disponible" />
        )}
      </BusinessSection>

      <BusinessSection
        title="Combinación orientativa para alcanzar la meta"
        description="Plan matemático priorizado por margen, utilidad unitaria y stock; no reserva ni modifica inventario."
      >
        <OperationStats
          items={[
            {
              label:
                "Venta estimada del plan",
              value: money(
                m.plan.revenue,
              ),
            },
            {
              label:
                "Utilidad estimada del plan",
              value: money(
                m.plan.profit,
              ),
            },
            {
              label:
                "Cobertura del faltante",
              value: `${number(
                m.plan.coverage,
              )}%`,
            },
            {
              label:
                "Faltante sin cubrir",
              value: money(
                m.plan.uncovered,
              ),
            },
          ]}
        />

        {m.plan.rows.length ? (
          <DataTable
            columns={[
              "Producto",
              "Unidades sugeridas",
              "Stock",
              "Venta estimada",
              "Utilidad estimada",
            ]}
          >
            {m.plan.rows.map(
              (row) => (
                <tr
                  key={
                    row.id
                  }
                >
                  <th scope="row">
                    {
                      row.name
                    }
                  </th>

                  <td>
                    {
                      row.units
                    }
                  </td>

                  <td>
                    {
                      row.stock
                    }
                  </td>

                  <td>
                    {money(
                      row.revenue,
                    )}
                  </td>

                  <td>
                    {money(
                      row.estimatedProfit,
                    )}
                  </td>
                </tr>
              ),
            )}
          </DataTable>
        ) : (
          <EmptyState
            title={
              p.remainingRevenue ===
              0
                ? "Sin faltante para planificar"
                : "Sin productos elegibles"
            }
            description="Solo utiliza productos activos, con stock, precio positivo y utilidad positiva."
          />
        )}

        <p className="admin-footnote">
          Prioridad: 50% margen + 35% utilidad unitaria normalizada + 15% stock normalizado. Asigna unidades enteras sin superar stock; puede exceder el faltante por redondeo ({money(
            m.plan.overage,
          )}). Combinación orientativa, sin pronóstico de venta.
        </p>
      </BusinessSection>
    </>
  );
}