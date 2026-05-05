import { createSelector } from "@reduxjs/toolkit";
import { getAllWorldConnectionPoints } from "@/domain/geometry/transforms";
import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import type { RootState } from "@/store/store";

const validationEngine = new ValidationEngine(DemoInternalStandardsProfile);
const systemConnectionResolver = new SystemConnectionResolver();

export const selectProject = (state: RootState) => state.project;
export const selectEditor = (state: RootState) => state.editor;
export const selectCatalog = (state: RootState) => state.catalog;
export const selectSelectedEquipmentInstanceId = (state: RootState) => state.editor.selectedEquipmentInstanceId;
export const selectSelectedEquipmentDefinitionId = (state: RootState) => state.editor.selectedEquipmentDefinitionId;
export const selectViewLayout = (state: RootState) => state.editor.viewLayout;
export const selectLayoutZoom = (state: RootState) => state.editor.layoutZoom;
export const selectSchematicZoom = (state: RootState) => state.editor.schematicZoom;
export const selectSheetZoom = (state: RootState) => state.editor.sheetZoom;
export const selectRightSidebarCollapsed = (state: RootState) => state.editor.rightSidebarCollapsed;
export const selectEquipmentDefinitions = (state: RootState) => state.catalog.equipmentDefinitions;

export const selectValidationIssues = createSelector([selectProject, selectEquipmentDefinitions], (project, equipmentDefinitions) =>
  validationEngine.validate(project, { equipmentDefinitions }),
);

export const selectSystemConnections = createSelector([selectProject, selectEquipmentDefinitions], (project, equipmentDefinitions) =>
  systemConnectionResolver.resolve(project, { equipmentDefinitions }),
);

export const selectWorldConnectionPoints = createSelector([selectProject, selectEquipmentDefinitions], (project, equipmentDefinitions) =>
  getAllWorldConnectionPoints(project, equipmentDefinitions),
);

export const selectSelectedEquipmentInstance = createSelector(
  [selectProject, selectSelectedEquipmentInstanceId],
  (project, selectedId) => project.equipmentInstances.find((instance) => instance.id === selectedId),
);

export const selectSelectedEquipmentDefinition = createSelector(
  [selectSelectedEquipmentInstance, selectEquipmentDefinitions],
  (instance, equipmentDefinitions) => instance
    ? equipmentDefinitions.find((definition) => definition.id === instance.definitionId)
    : undefined,
);

export const selectEditedEquipmentDefinition = createSelector(
  [selectSelectedEquipmentDefinitionId, selectEquipmentDefinitions],
  (definitionId, equipmentDefinitions) => equipmentDefinitions.find((definition) => definition.id === definitionId),
);
