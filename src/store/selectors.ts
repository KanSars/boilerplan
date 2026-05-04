import { createSelector } from "@reduxjs/toolkit";
import { getAllWorldConnectionPoints } from "@/domain/geometry/transforms";
import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import { equipmentDefinitions } from "@/shared/config/equipmentDefinitions";
import type { RootState } from "@/store/store";

const validationEngine = new ValidationEngine(DemoInternalStandardsProfile);
const systemConnectionResolver = new SystemConnectionResolver();
const validationContext = { equipmentDefinitions };

export const selectProject = (state: RootState) => state.project;
export const selectEditor = (state: RootState) => state.editor;
export const selectSelectedEquipmentInstanceId = (state: RootState) => state.editor.selectedEquipmentInstanceId;
export const selectViewLayout = (state: RootState) => state.editor.viewLayout;
export const selectEquipmentDefinitions = () => equipmentDefinitions;

export const selectValidationIssues = createSelector([selectProject], (project) =>
  validationEngine.validate(project, validationContext),
);

export const selectSystemConnections = createSelector([selectProject], (project) =>
  systemConnectionResolver.resolve(project, validationContext),
);

export const selectWorldConnectionPoints = createSelector([selectProject], (project) =>
  getAllWorldConnectionPoints(project, equipmentDefinitions),
);

export const selectSelectedEquipmentInstance = createSelector(
  [selectProject, selectSelectedEquipmentInstanceId],
  (project, selectedId) => project.equipmentInstances.find((instance) => instance.id === selectedId),
);

export const selectSelectedEquipmentDefinition = createSelector(
  [selectSelectedEquipmentInstance],
  (instance) => instance
    ? equipmentDefinitions.find((definition) => definition.id === instance.definitionId)
    : undefined,
);
