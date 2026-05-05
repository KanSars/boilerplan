import type { Project } from "@/domain/project/Project";

export const createInitialProject = (): Project => ({
  id: "project_v0",
  name: "Котельная v0",
  units: "mm",
  room: { widthMm: 6000, lengthMm: 4500, heightMm: 3000, origin: { xMm: 0, yMm: 0 } },
  equipmentInstances: [
    { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
    { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
    { id: "inst_boiler_1", definitionId: "rgt-100-ksva-100", position: { xMm: 1550, yMm: 2850 }, rotationDeg: 0, label: "К1" },
    { id: "inst_valve_supply_1", definitionId: "ball-valve-dn32-supply", position: { xMm: 1860, yMm: 2500 }, rotationDeg: 0, label: "Кран T1 DN32" },
    { id: "inst_valve_return_1", definitionId: "ball-valve-dn32-return", position: { xMm: 1680, yMm: 2600 }, rotationDeg: 0, label: "Кран T2 DN32" },
    { id: "inst_valve_gas_1", definitionId: "ball-valve-dn25-gas", position: { xMm: 1450, yMm: 3700 }, rotationDeg: 0, label: "Кран Г DN25" },
  ],
  pipingRoutes: [],
  validationIssues: [],
  metadata: {
    version: "v0",
    catalog: "pilot_real_sources_review_required",
    boilerRoomType: "standalone_block",
    fuelType: "natural_gas",
    totalHeatPowerKw: 99,
  },
});
