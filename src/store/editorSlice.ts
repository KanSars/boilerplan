import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type EditorState = {
  selectedEquipmentInstanceId: string;
  selectedEquipmentDefinitionId: string;
  activeView: "split" | "layout" | "schematic";
  viewLayout: "row" | "column";
  showClearanceZones: boolean;
  showPhysicalRoutes: boolean;
};

const initialState: EditorState = {
  selectedEquipmentInstanceId: "inst_boiler_1",
  selectedEquipmentDefinitionId: "boiler-250kw",
  activeView: "split",
  viewLayout: "row",
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
  setActiveView,
  setViewLayout,
  setShowClearanceZones,
  setShowPhysicalRoutes,
} = editorSlice.actions;
