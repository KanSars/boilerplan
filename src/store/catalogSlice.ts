import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ConnectionPoint } from "@/domain/equipment/ConnectionPoint";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { equipmentDefinitions as mockEquipmentDefinitions } from "@/shared/config/equipmentDefinitions";

type CatalogState = {
  equipmentDefinitions: EquipmentDefinition[];
};

const cloneDefinitions = (definitions: EquipmentDefinition[]): EquipmentDefinition[] =>
  definitions.map((definition) => ({
    ...definition,
    dimensionsMm: { ...definition.dimensionsMm },
    serviceClearancesMm: { ...definition.serviceClearancesMm },
    connectionPoints: definition.connectionPoints.map((point) => ({
      ...point,
      position: { ...point.position },
      metadata: point.metadata ? { ...point.metadata } : undefined,
    })),
    metadata: definition.metadata ? { ...definition.metadata } : undefined,
  }));

const initialState: CatalogState = {
  equipmentDefinitions: cloneDefinitions(mockEquipmentDefinitions),
};

export const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    updateEquipmentDefinition(state, action: PayloadAction<EquipmentDefinition>) {
      const index = state.equipmentDefinitions.findIndex((definition) => definition.id === action.payload.id);
      if (index === -1) return;
      state.equipmentDefinitions[index] = action.payload;
    },
    addConnectionPointToDefinition(
      state,
      action: PayloadAction<{ definitionId: string; connectionPoint: ConnectionPoint }>,
    ) {
      const definition = state.equipmentDefinitions.find((item) => item.id === action.payload.definitionId);
      if (!definition) return;
      definition.connectionPoints.push(action.payload.connectionPoint);
    },
    updateConnectionPointInDefinition(
      state,
      action: PayloadAction<{ definitionId: string; connectionPoint: ConnectionPoint }>,
    ) {
      const definition = state.equipmentDefinitions.find((item) => item.id === action.payload.definitionId);
      if (!definition) return;
      const index = definition.connectionPoints.findIndex((point) => point.id === action.payload.connectionPoint.id);
      if (index === -1) return;
      definition.connectionPoints[index] = action.payload.connectionPoint;
    },
    removeConnectionPointFromDefinition(
      state,
      action: PayloadAction<{ definitionId: string; connectionPointId: string }>,
    ) {
      const definition = state.equipmentDefinitions.find((item) => item.id === action.payload.definitionId);
      if (!definition) return;
      definition.connectionPoints = definition.connectionPoints.filter((point) => point.id !== action.payload.connectionPointId);
    },
    resetEquipmentCatalogToMockDefaults(state) {
      state.equipmentDefinitions = cloneDefinitions(mockEquipmentDefinitions);
    },
  },
});

export const {
  addConnectionPointToDefinition,
  removeConnectionPointFromDefinition,
  resetEquipmentCatalogToMockDefaults,
  updateConnectionPointInDefinition,
  updateEquipmentDefinition,
} = catalogSlice.actions;
