import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type EditorState = {
  selectedEquipmentInstanceId: string;
  selectedEquipmentDefinitionId: string;
  activeView: "split" | "layout" | "schematic";
  viewLayout: "row" | "column";
  layoutZoom: number;
  schematicZoom: number;
  showClearanceZones: boolean;
  showPhysicalRoutes: boolean;
};

const initialState: EditorState = {
  selectedEquipmentInstanceId: "inst_boiler_1",
  selectedEquipmentDefinitionId: "boiler-250kw",
  activeView: "split",
  viewLayout: "row",
  layoutZoom: 1,
  schematicZoom: 1,
  showClearanceZones: true,
  showPhysicalRoutes: true,
};

export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    selectEquipmentInstance(state, action: PayloadAction<string>) {
      state.selectedEquipmentInstanceId = action.payload;
    },
    clearSelection(state) {
      state.selectedEquipmentInstanceId = "";
    },
    selectEquipmentDefinition(state, action: PayloadAction<string>) {
      state.selectedEquipmentDefinitionId = action.payload;
    },
    setActiveView(state, action: PayloadAction<EditorState["activeView"]>) {
      state.activeView = action.payload;
    },
    setViewLayout(state, action: PayloadAction<EditorState["viewLayout"]>) {
      state.viewLayout = action.payload;
    },
    setLayoutZoom(state, action: PayloadAction<number>) {
      state.layoutZoom = clampZoom(action.payload);
    },
    setSchematicZoom(state, action: PayloadAction<number>) {
      state.schematicZoom = clampZoom(action.payload);
    },
    setShowClearanceZones(state, action: PayloadAction<boolean>) {
      state.showClearanceZones = action.payload;
    },
    setShowPhysicalRoutes(state, action: PayloadAction<boolean>) {
      state.showPhysicalRoutes = action.payload;
    },
  },
});

export const {
  clearSelection,
  selectEquipmentDefinition,
  selectEquipmentInstance,
  setLayoutZoom,
  setSchematicZoom,
  setActiveView,
  setViewLayout,
  setShowClearanceZones,
  setShowPhysicalRoutes,
} = editorSlice.actions;

function clampZoom(value: number): number {
  return Math.min(2.5, Math.max(0.6, Math.round(value * 10) / 10));
}
