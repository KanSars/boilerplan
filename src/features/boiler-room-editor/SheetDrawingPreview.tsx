"use client";

import type { EngineeringDrawing, DrawingEntity } from "@/domain/drawing";

type Props = {
  drawing: EngineeringDrawing;
  zoom: number;
};

export function SheetDrawingPreview({ drawing, zoom }: Props) {
  const layerByName = new Map(drawing.layers.map((layer) => [layer.name, layer]));

  return (
    <div className="sheet-preview-frame">
      <div className="sheet-preview-viewport" style={{ width: `${drawing.sheet.width * zoom * 2.4}px` }}>
        <svg
          className="sheet-preview-svg"
          viewBox={`0 0 ${drawing.sheet.width} ${drawing.sheet.height}`}
          role="img"
          aria-label="Предпросмотр листа чертежа"
        >
          <rect x="0" y="0" width={drawing.sheet.width} height={drawing.sheet.height} fill="#ffffff" />
          {drawing.entities.map((entity, index) => (
            <DrawingEntityView key={`${entity.type}-${index}`} entity={entity} layer={layerByName.get(entity.layer)} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function DrawingEntityView({
  entity,
  layer,
}: {
  entity: DrawingEntity;
  layer: EngineeringDrawing["layers"][number] | undefined;
}) {
  const stroke = layer?.stroke ?? "#111827";
  const strokeWidth = layer?.strokeWidth ?? 0.25;
  const dashArray = layer?.lineType === "dashed" ? "3 2" : layer?.lineType === "dashdot" ? "5 2 1 2" : undefined;
  const fill = "fill" in entity && entity.fill !== undefined ? entity.fill : layer?.fill ?? "none";

  if (entity.type === "rect") {
    return (
      <rect
        x={entity.x}
        y={entity.y}
        width={entity.width}
        height={entity.height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />
    );
  }

  if (entity.type === "circle") {
    return (
      <circle
        cx={entity.center.x}
        cy={entity.center.y}
        r={entity.radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />
    );
  }

  if (entity.type === "polyline") {
    const points = entity.points.map((point) => `${point.x},${point.y}`).join(" ");
    if (entity.closed) {
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
      );
    }
    return (
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />
    );
  }

  return (
    <text
      x={entity.at.x}
      y={entity.at.y}
      fill={layer?.fill ?? stroke}
      fontSize={entity.height}
      fontWeight={entity.weight ?? "normal"}
      textAnchor={entity.align ?? "start"}
      transform={entity.rotationDeg ? `rotate(${entity.rotationDeg} ${entity.at.x} ${entity.at.y})` : undefined}
    >
      {entity.value}
    </text>
  );
}
