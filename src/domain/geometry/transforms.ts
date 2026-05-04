import type { ConnectionPoint } from "@/domain/equipment/ConnectionPoint";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { PointMm } from "@/domain/geometry/geometryTypes";

export const transformConnectionPoint = (
  instance: EquipmentInstance,
  definition: EquipmentDefinition,
  connectionPoint: ConnectionPoint,
): PointMm => {
  const { width, depth } = definition.dimensionsMm;
  const local = connectionPoint.position;

  switch (instance.rotationDeg) {
    case 90:
      return {
        xMm: instance.position.xMm + depth - local.yMm,
        yMm: instance.position.yMm + local.xMm,
      };
    case 180:
      return {
        xMm: instance.position.xMm + width - local.xMm,
        yMm: instance.position.yMm + depth - local.yMm,
      };
    case 270:
      return {
        xMm: instance.position.xMm + local.yMm,
        yMm: instance.position.yMm + width - local.xMm,
      };
    case 0:
    default:
      return {
        xMm: instance.position.xMm + local.xMm,
        yMm: instance.position.yMm + local.yMm,
      };
  }
};
