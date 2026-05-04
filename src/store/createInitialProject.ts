import type { Project } from "@/domain/project/Project";

export const createInitialProject = (): Project => ({
  id: "project_v0",
  name: "Котельная v0",
  units: "mm",
  room: { widthMm: 8000, lengthMm: 6000, heightMm: 3000, origin: { xMm: 0, yMm: 0 } },
  equipmentInstances: [
    { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
    { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
    { id: "inst_boiler_1", definitionId: "boiler-250kw", position: { xMm: 1400, yMm: 3300 }, rotationDeg: 0, label: "B-1" },
  ],
  pipingRoutes: [],
  validationIssues: [],
  metadata: { version: "v0", catalog: "mock" },
});
