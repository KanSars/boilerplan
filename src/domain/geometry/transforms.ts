import type { ConnectionPoint } from "@/domain/equipment/ConnectionPoint";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { WorldConnectionPoint } from "@/domain/equipment/WorldConnectionPoint";
import type { PointMm } from "@/domain/geometry/geometryTypes";
import type { Project } from "@/domain/project/Project";

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

export const transformConnectionDirection = (
  direction: ConnectionPoint["direction"],
  rotationDeg: EquipmentInstance["rotationDeg"],
): ConnectionPoint["direction"] => {
  if (!direction) return direction;
  if (direction === "up" || direction === "down" || direction === "front" || direction === "back") {
    return direction;
  }

  const order: Array<NonNullable<ConnectionPoint["direction"]>> = ["top", "right", "bottom", "left"];
  const index = order.indexOf(direction);
  if (index === -1) return direction;
  const shift = rotationDeg / 90;
  return order[(index + shift) % order.length];
};

export const getWorldConnectionPoint = (
  instance: EquipmentInstance,
  definition: EquipmentDefinition,
  connectionPoint: ConnectionPoint,
): WorldConnectionPoint => ({
  equipmentInstanceId: instance.id,
  definitionId: definition.id,
  connectionPointId: connectionPoint.id,
  type: connectionPoint.type,
  label: connectionPoint.label,
  worldPosition: {
    ...transformConnectionPoint(instance, definition, connectionPoint),
    zMm: connectionPoint.position.zMm,
  },
  nominalDiameterMm: connectionPoint.nominalDiameterMm,
  direction: transformConnectionDirection(connectionPoint.direction, instance.rotationDeg),
  systemRole: connectionPoint.systemRole,
  source: connectionPoint.source,
  confidence: connectionPoint.confidence,
});

export const getWorldConnectionPointsForInstance = (
  instance: EquipmentInstance,
  definition: EquipmentDefinition,
): WorldConnectionPoint[] => definition.connectionPoints.map((point) =>
  getWorldConnectionPoint(instance, definition, point),
);

export const getAllWorldConnectionPoints = (
  project: Project,
  equipmentDefinitions: EquipmentDefinition[],
): WorldConnectionPoint[] =>
  project.equipmentInstances.flatMap((instance) => {
    const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
    return definition ? getWorldConnectionPointsForInstance(instance, definition) : [];
  });
