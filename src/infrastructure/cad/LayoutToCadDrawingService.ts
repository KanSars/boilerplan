import type { CadDrawing, CadEntity, CadLayer } from "@/domain/cad/CadDrawing";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { getEquipmentBodyRect, getEquipmentClearanceRect } from "@/domain/geometry/rectangles";
import { getWorldConnectionPointsForInstance } from "@/domain/geometry/transforms";
import type { PointMm, RectMm } from "@/domain/geometry/geometryTypes";
import type { Project } from "@/domain/project/Project";

const layers: CadLayer[] = [
  { name: "AR_ROOM_WALL", color: 7 },
  { name: "ME_EQ_BODY", color: 5 },
  { name: "ME_EQ_CLEARANCE", color: 30, lineType: "DASHED" },
  { name: "ME_CONN_POINT", color: 2 },
  { name: "ME_PIPE_SUPPLY", color: 1 },
  { name: "ME_PIPE_RETURN", color: 5 },
  { name: "AN_TEXT", color: 7 },
];

export class LayoutToCadDrawingService {
  create(project: Project, equipmentDefinitions: EquipmentDefinition[]): CadDrawing {
    const entities: CadEntity[] = [];
    const toCadPoint = (point: PointMm): PointMm => ({
      xMm: point.xMm,
      yMm: project.room.lengthMm - point.yMm,
    });

    entities.push({
      type: "polyline",
      layer: "AR_ROOM_WALL",
      points: rectToPoints({
        xMm: project.room.origin.xMm,
        yMm: project.room.origin.yMm,
        widthMm: project.room.widthMm,
        depthMm: project.room.lengthMm,
      }).map(toCadPoint),
      closed: true,
    });

    for (const instance of project.equipmentInstances) {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      if (!definition) continue;
      const body = getEquipmentBodyRect(instance, definition);
      const clearance = getEquipmentClearanceRect(instance, definition);

      entities.push({
        type: "polyline",
        layer: "ME_EQ_CLEARANCE",
        points: rectToPoints(clearance).map(toCadPoint),
        closed: true,
      });
      entities.push({
        type: "polyline",
        layer: "ME_EQ_BODY",
        points: rectToPoints(body).map(toCadPoint),
        closed: true,
      });
      entities.push({
        type: "text",
        layer: "AN_TEXT",
        insertionPoint: toCadPoint({ xMm: body.xMm + 80, yMm: body.yMm + 180 }),
        heightMm: 180,
        value: instance.label,
      });

      for (const point of getWorldConnectionPointsForInstance(instance, definition)) {
        entities.push({
          type: "circle",
          layer: "ME_CONN_POINT",
          center: toCadPoint(point.worldPosition),
          radiusMm: 55,
        });
      }
    }

    for (const route of project.pipingRoutes) {
      entities.push({
        type: "polyline",
        layer: route.systemType === "return" ? "ME_PIPE_RETURN" : "ME_PIPE_SUPPLY",
        points: route.polylinePoints.map(toCadPoint),
      });
    }

    entities.push({
      type: "text",
      layer: "AN_TEXT",
      insertionPoint: { xMm: 0, yMm: project.room.lengthMm + 450 },
      heightMm: 220,
      value: `${project.name} - предварительный CAD-чертеж`,
    });

    return {
      version: "AC1015",
      units: "mm",
      layers,
      entities,
      metadata: {
        title: project.name,
      },
    };
  }
}

const rectToPoints = (rect: RectMm): PointMm[] => [
  { xMm: rect.xMm, yMm: rect.yMm },
  { xMm: rect.xMm + rect.widthMm, yMm: rect.yMm },
  { xMm: rect.xMm + rect.widthMm, yMm: rect.yMm + rect.depthMm },
  { xMm: rect.xMm, yMm: rect.yMm + rect.depthMm },
];
