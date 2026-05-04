import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type EditorState = {
  selectedEquipmentInstanceId: string;
  activeView: "split" | "layout" | "schematic";
  viewLayout: "row" | "column";
  showClearanceZones: boolean;
  showPhysicalRoutes: boolean;
};

const initialState: EditorState = {
  selectedEquipmentInstanceId: "inst_boiler_1",
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
  selectEquipmentInstance,
  setActiveView,
  setViewLayout,
  setShowClearanceZones,
  setShowPhysicalRoutes,
} = editorSlice.actions;
