import type { CadDrawing, CadEntity, CadLayer } from "@/domain/cad/CadDrawing";
import type { EngineeringDrawing, DrawingLayerName } from "@/domain/drawing";

const layerColor: Record<DrawingLayerName, number> = {
  SHEET_FRAME: 7,
  TITLE_BLOCK: 7,
  ROOM_OUTLINE: 7,
  EQUIPMENT_SYMBOL: 7,
  PIPE_SUPPLY: 1,
  PIPE_RETURN: 5,
  PIPE_GAS: 30,
  PIPE_FLUE: 8,
  VALVE_SYMBOL: 7,
  PORT_MARK: 7,
  ANNOTATION: 7,
  WARNING: 30,
};

const cadLayerName: Record<DrawingLayerName, CadLayer["name"]> = {
  SHEET_FRAME: "SHEET_FRAME",
  TITLE_BLOCK: "TITLE_BLOCK",
  ROOM_OUTLINE: "AR_ROOM_WALL",
  EQUIPMENT_SYMBOL: "ME_EQ_BODY",
  PIPE_SUPPLY: "ME_PIPE_SUPPLY",
  PIPE_RETURN: "ME_PIPE_RETURN",
  PIPE_GAS: "ME_PIPE_GAS",
  PIPE_FLUE: "ME_PIPE_FLUE",
  VALVE_SYMBOL: "ME_VALVE",
  PORT_MARK: "ME_CONN_POINT",
  ANNOTATION: "AN_TEXT",
  WARNING: "AN_TEXT",
};

export class EngineeringDrawingToCadService {
  convert(drawing: EngineeringDrawing): CadDrawing {
    const layers: CadLayer[] = drawing.layers.map((layer) => ({
      name: cadLayerName[layer.name],
      color: layerColor[layer.name],
      lineType: layer.lineType === "dashed" || layer.lineType === "dashdot" ? "DASHED" : "CONTINUOUS",
    }));
    const uniqueLayers = Array.from(new Map(layers.map((layer) => [layer.name, layer])).values());

    const entities: CadEntity[] = drawing.entities.flatMap((entity): CadEntity[] => {
      const layer = cadLayerName[entity.layer];
      if (entity.type === "rect") {
        return [{
          type: "polyline" as const,
          layer,
          points: [
            { xMm: entity.x, yMm: toCadY(drawing, entity.y) },
            { xMm: entity.x + entity.width, yMm: toCadY(drawing, entity.y) },
            { xMm: entity.x + entity.width, yMm: toCadY(drawing, entity.y + entity.height) },
            { xMm: entity.x, yMm: toCadY(drawing, entity.y + entity.height) },
          ],
          closed: true,
        }];
      }
      if (entity.type === "polyline") {
        return [{
          type: "polyline" as const,
          layer,
          points: entity.points.map((point) => ({ xMm: point.x, yMm: toCadY(drawing, point.y) })),
          closed: entity.closed,
        }];
      }
      if (entity.type === "circle") {
        return [{
          type: "circle" as const,
          layer,
          center: { xMm: entity.center.x, yMm: toCadY(drawing, entity.center.y) },
          radiusMm: entity.radius,
        }];
      }
      return [{
        type: "text" as const,
        layer,
        insertionPoint: { xMm: entity.at.x, yMm: toCadY(drawing, entity.at.y) },
        heightMm: entity.height,
        value: entity.value,
        rotationDeg: entity.rotationDeg,
      }];
    });

    return {
      version: "AC1015",
      units: "mm",
      layers: uniqueLayers,
      entities,
      metadata: {
        title: drawing.metadata.title,
      },
    };
  }
}

const toCadY = (drawing: EngineeringDrawing, y: number): number => drawing.sheet.height - y;
