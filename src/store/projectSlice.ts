import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { PipingRoute } from "@/domain/piping/PipingRoute";
import type { Project } from "@/domain/project/Project";
import { removeEquipmentInstance } from "@/domain/project/removeEquipmentInstance";
import type { Room } from "@/domain/room/Room";
import { createInitialProject } from "@/store/createInitialProject";

const initialState: Project = createInitialProject();

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjectName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setRoom(state, action: PayloadAction<Room>) {
      state.room = action.payload;
    },
    addEquipmentInstance(state, action: PayloadAction<EquipmentInstance>) {
      state.equipmentInstances.push(action.payload);
      state.pipingRoutes = [];
    },
    updateEquipmentInstance(
      state,
      action: PayloadAction<{ id: string; patch: Partial<EquipmentInstance> }>,
    ) {
      const instance = state.equipmentInstances.find((item) => item.id === action.payload.id);
      if (!instance) return;
      Object.assign(instance, action.payload.patch);
    },
    deleteEquipmentInstance(state, action: PayloadAction<string>) {
      return removeEquipmentInstance(state, action.payload);
    },
    setPipingRoutes(state, action: PayloadAction<PipingRoute[]>) {
      state.pipingRoutes = action.payload;
    },
  },
});

export const {
  addEquipmentInstance,
  deleteEquipmentInstance,
  setPipingRoutes,
  setProjectName,
  setRoom,
  updateEquipmentInstance,
} = projectSlice.actions;
