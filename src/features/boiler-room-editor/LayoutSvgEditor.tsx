"use client";

import type { PointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import { getWorldConnectionPointsForInstance } from "@/domain/geometry/transforms";
import { getEquipmentBodyRect, getEquipmentClearanceRect } from "@/domain/geometry/rectangles";
import type { Project } from "@/domain/project/Project";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

type Props = {
  project: Project;
  definitions: EquipmentDefinition[];
  selectedId?: string;
  validationIssues: ValidationIssue[];
  onSelect: (id: string) => void;
  onMove: (id: string, position: { xMm: number; yMm: number }) => void;
};

type DragState = {
  id: string;
  offsetMm: { xMm: number; yMm: number };
};

export function LayoutSvgEditor({ project, definitions, selectedId, validationIssues, onSelect, onMove }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const margin = 1600;
  const viewBox = `${-margin} ${-margin} ${project.room.widthMm + margin * 2} ${project.room.lengthMm + margin * 2}`;

  const issueEntityIds = useMemo(() => new Set(validationIssues.flatMap((issue) => issue.entityIds)), [validationIssues]);

  const pointFromEvent = (event: PointerEvent<SVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { xMm: 0, yMm: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
    return { xMm: transformed.x, yMm: transformed.y };
  };

  const handlePointerDown = (event: PointerEvent<SVGGElement>, instance: EquipmentInstance) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const pointer = pointFromEvent(event);
    onSelect(instance.id);
    setDrag({
      id: instance.id,
      offsetMm: {
        xMm: pointer.xMm - instance.position.xMm,
        yMm: pointer.yMm - instance.position.yMm,
      },
    });
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    const pointer = pointFromEvent(event);
    onMove(drag.id, {
      xMm: Math.round((pointer.xMm - drag.offsetMm.xMm) / 25) * 25,
      yMm: Math.round((pointer.yMm - drag.offsetMm.yMm) / 25) * 25,
    });
  };

  return (
    <div className="editor-frame">
      <svg
        ref={svgRef}
        className="layout-svg"
        viewBox={viewBox}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
        role="img"
        aria-label="План котельной"
      >
        <defs>
          <pattern id="grid" width="500" height="500" patternUnits="userSpaceOnUse">
            <path d="M 500 0 L 0 0 0 500" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          </pattern>
        </defs>
        <rect x={-margin} y={-margin} width={project.room.widthMm + margin * 2} height={project.room.lengthMm + margin * 2} fill="#f8fafc" />
        <rect x={0} y={0} width={project.room.widthMm} height={project.room.lengthMm} fill="url(#grid)" stroke="#111827" strokeWidth={35} />
        <text x={0} y={-260} className="svg-scale-text">Котельная {project.room.widthMm} x {project.room.lengthMm} мм · сетка 500 мм</text>

        {project.pipingRoutes.map((route) => (
          <polyline
            key={route.id}
            points={route.polylinePoints.map((point) => `${point.xMm},${point.yMm}`).join(" ")}
            fill="none"
            stroke={route.systemType === "supply" ? "#dc2626" : "#2563eb"}
            strokeWidth={70}
            strokeDasharray={route.systemType === "return" ? "150 90" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {project.equipmentInstances.map((instance) => {
          const definition = definitions.find((item) => item.id === instance.definitionId);
          if (!definition) return null;
          const body = getEquipmentBodyRect(instance, definition);
          const clearance = getEquipmentClearanceRect(instance, definition);
          const selected = selectedId === instance.id;
          const invalid = issueEntityIds.has(instance.id);
          const equipmentClassName = [
            "equipment",
            selected ? "selected" : "",
            invalid ? "invalid" : "",
          ].filter(Boolean).join(" ");
          return (
            <g key={instance.id} onPointerDown={(event) => handlePointerDown(event, instance)} className="equipment-group">
              <rect x={clearance.xMm} y={clearance.yMm} width={clearance.widthMm} height={clearance.depthMm} className={invalid ? "clearance invalid" : "clearance"} />
              <rect x={body.xMm} y={body.yMm} width={body.widthMm} height={body.depthMm} className={equipmentClassName} />
              <text x={body.xMm + 90} y={body.yMm + 180} className="equipment-label">{instance.label}</text>
              {getWorldConnectionPointsForInstance(instance, definition).map((point) => {
                return (
                  <circle
                    key={point.connectionPointId}
                    cx={point.worldPosition.xMm}
                    cy={point.worldPosition.yMm}
                    r={65}
                    className={`connection ${point.type}`}
                  >
                    <title>{`${point.label} · ${point.type}`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
