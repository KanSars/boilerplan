import type { PointMm, RotationDeg } from "@/domain/geometry/geometryTypes";

export type EquipmentInstance = {
  id: string;
  definitionId: string;
  position: PointMm;
  rotationDeg: RotationDeg;
  label: string;
  customParameters?: Record<string, unknown>;
};
