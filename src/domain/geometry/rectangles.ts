import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { RectMm } from "@/domain/geometry/geometryTypes";
import type { Room } from "@/domain/room/Room";

export const getRotatedSize = (
  instance: EquipmentInstance,
  definition: EquipmentDefinition,
): { widthMm: number; depthMm: number } => {
  const rotated = instance.rotationDeg === 90 || instance.rotationDeg === 270;
  return {
    widthMm: rotated ? definition.dimensionsMm.depth : definition.dimensionsMm.width,
    depthMm: rotated ? definition.dimensionsMm.width : definition.dimensionsMm.depth,
  };
};

export const getEquipmentBodyRect = (
  instance: EquipmentInstance,
  definition: EquipmentDefinition,
): RectMm => {
  const size = getRotatedSize(instance, definition);
  return {
    xMm: instance.position.xMm,
    yMm: instance.position.yMm,
    widthMm: size.widthMm,
    depthMm: size.depthMm,
  };
};

export const getEquipmentClearanceRect = (
  instance: EquipmentInstance,
  definition: EquipmentDefinition,
): RectMm => {
  const body = getEquipmentBodyRect(instance, definition);
  const clearance = definition.serviceClearancesMm;

  // v0 maps service clearance to world axes for 0/180/90/270 rotations.
  const rotated = instance.rotationDeg === 90 || instance.rotationDeg === 270;
  const left = rotated ? clearance.back : clearance.left;
  const right = rotated ? clearance.front : clearance.right;
  const back = rotated ? clearance.left : clearance.back;
  const front = rotated ? clearance.right : clearance.front;

  return {
    xMm: body.xMm - left,
    yMm: body.yMm - back,
    widthMm: body.widthMm + left + right,
    depthMm: body.depthMm + back + front,
  };
};

export const rectanglesOverlap = (a: RectMm, b: RectMm): boolean =>
  a.xMm < b.xMm + b.widthMm &&
  a.xMm + a.widthMm > b.xMm &&
  a.yMm < b.yMm + b.depthMm &&
  a.yMm + a.depthMm > b.yMm;

export const rectangleInsideRoom = (rect: RectMm, room: Room): boolean =>
  rect.xMm >= room.origin.xMm &&
  rect.yMm >= room.origin.yMm &&
  rect.xMm + rect.widthMm <= room.origin.xMm + room.widthMm &&
  rect.yMm + rect.depthMm <= room.origin.yMm + room.lengthMm;
