import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { PipingRoute } from "@/domain/piping/PipingRoute";
import type { Room } from "@/domain/room/Room";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

export type Project = {
  id: string;
  name: string;
  units: "mm";
  room: Room;
  equipmentInstances: EquipmentInstance[];
  pipingRoutes: PipingRoute[];
  validationIssues: ValidationIssue[];
  metadata: Record<string, unknown>;
};
