import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { Project } from "@/domain/project/Project";
import { mockEquipmentDefinitions } from "@/infrastructure/equipment-catalogs/MockEquipmentCatalog";

export const definitions: EquipmentDefinition[] = mockEquipmentDefinitions;

export const makeProject = (): Project => ({
  id: "test-project",
  name: "Test project",
  units: "mm",
  room: { widthMm: 5000, lengthMm: 5000, origin: { xMm: 0, yMm: 0 } },
  equipmentInstances: [
    { id: "b1", definitionId: "boiler-250kw", position: { xMm: 500, yMm: 500 }, rotationDeg: 0, label: "B-1" },
    { id: "b2", definitionId: "boiler-250kw", position: { xMm: 2200, yMm: 500 }, rotationDeg: 0, label: "B-2" },
  ],
  pipingRoutes: [],
  validationIssues: [],
  metadata: {},
});
