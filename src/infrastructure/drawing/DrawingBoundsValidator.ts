import type { DrawingEntity, DrawingViewport, EngineeringDrawing } from "@/domain/drawing";

export type DrawingBoundsIssue = {
  id: string;
  message: string;
};

export class DrawingBoundsValidator {
  validateSheet(drawing: EngineeringDrawing): DrawingBoundsIssue[] {
    return this.validateEntities(drawing.entities, {
      name: "frame",
      x: 0,
      y: 0,
      width: drawing.sheet.width,
      height: drawing.sheet.height,
    });
  }

  validateViewport(entities: DrawingEntity[], viewport: DrawingViewport): DrawingBoundsIssue[] {
    return this.validateEntities(entities, viewport);
  }

  private validateEntities(entities: DrawingEntity[], viewport: DrawingViewport): DrawingBoundsIssue[] {
    return entities.flatMap((entity, index) => {
      const bounds = getEntityBounds(entity);
      if (
        bounds.xMin < viewport.x - tolerance ||
        bounds.yMin < viewport.y - tolerance ||
        bounds.xMax > viewport.x + viewport.width + tolerance ||
        bounds.yMax > viewport.y + viewport.height + tolerance
      ) {
        return [{
          id: `${viewport.name}:${index}`,
          message: `${entity.type} is outside ${viewport.name}: ${JSON.stringify(bounds)}`,
        }];
      }
      return [];
    });
  }
}

const tolerance = 0.01;

const getEntityBounds = (entity: DrawingEntity) => {
  if (entity.type === "rect") {
    return {
      xMin: entity.x,
      yMin: entity.y,
      xMax: entity.x + entity.width,
      yMax: entity.y + entity.height,
    };
  }
  if (entity.type === "circle") {
    return {
      xMin: entity.center.x - entity.radius,
      yMin: entity.center.y - entity.radius,
      xMax: entity.center.x + entity.radius,
      yMax: entity.center.y + entity.radius,
    };
  }
  if (entity.type === "polyline") {
    const xs = entity.points.map((point) => point.x);
    const ys = entity.points.map((point) => point.y);
    return {
      xMin: Math.min(...xs),
      yMin: Math.min(...ys),
      xMax: Math.max(...xs),
      yMax: Math.max(...ys),
    };
  }

  const estimatedWidth = entity.value.length * entity.height * 0.58;
  const xMin = entity.align === "middle"
    ? entity.at.x - estimatedWidth / 2
    : entity.align === "end"
      ? entity.at.x - estimatedWidth
      : entity.at.x;

  return {
    xMin,
    yMin: entity.at.y - entity.height,
    xMax: xMin + estimatedWidth,
    yMax: entity.at.y + entity.height * 0.25,
  };
};
