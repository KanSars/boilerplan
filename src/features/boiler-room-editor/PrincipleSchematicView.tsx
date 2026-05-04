"use client";

import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { SystemConnection } from "@/domain/piping/SystemConnection";

type Props = {
  equipmentInstances: EquipmentInstance[];
  definitions: EquipmentDefinition[];
  systemConnections: SystemConnection[];
  zoom: number;
};

type NodePosition = {
  x: number;
  y: number;
};

export function PrincipleSchematicView({ equipmentInstances, definitions, systemConnections, zoom }: Props) {
  const boilers = equipmentInstances.filter((instance) => getCategory(instance, definitions) === "boiler");
  const supplyHeaders = equipmentInstances.filter((instance) =>
    getCategory(instance, definitions) === "header" && hasConnection(instance, definitions, "supply"),
  );
  const returnHeaders = equipmentInstances.filter((instance) =>
    getCategory(instance, definitions) === "header" && hasConnection(instance, definitions, "return"),
  );

  const nodePositions = new Map<string, NodePosition>();
  boilers.forEach((boiler, index) => {
    nodePositions.set(boiler.id, { x: 90, y: 110 + index * 115 });
  });
  supplyHeaders.forEach((header, index) => {
    nodePositions.set(header.id, { x: 575, y: 95 + index * 105 });
  });
  const returnHeaderStartY = Math.max(300, 130 + Math.max(boilers.length, supplyHeaders.length) * 105);
  returnHeaders.forEach((header, index) => {
    nodePositions.set(header.id, { x: 575, y: returnHeaderStartY + index * 105 });
  });

  const height = Math.max(430, returnHeaderStartY + Math.max(1, returnHeaders.length) * 110 + 40);

  return (
    <div className="schematic-frame">
      <div className="zoom-viewport">
        <div className="zoom-content" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <svg className="schematic-svg" viewBox={`0 0 760 ${height}`} role="img" aria-label="Принципиальная схема котельной">
            <text x="24" y="34" className="schematic-title">Логические соединения</text>

            {systemConnections.map((connection) => {
          const from = nodePositions.get(connection.from.equipmentInstanceId);
          const to = connection.to ? nodePositions.get(connection.to.equipmentInstanceId) : undefined;
          const isSupply = connection.systemType === "supply";
          const boiler = equipmentInstances.find((instance) => instance.id === connection.from.equipmentInstanceId);
          const boilerPosition = from ?? (boiler ? nodePositions.get(boiler.id) : undefined);

          if (connection.status === "connected" || connection.status === "ambiguous") {
            if (!from || !to) return null;
            return (
              <g key={connection.id}>
                <path
                  className={isSupply ? "schematic-line supply" : "schematic-line return"}
                  d={`M ${from.x + 150} ${from.y + (isSupply ? 26 : 58)} C ${from.x + 290} ${from.y + (isSupply ? 26 : 58)}, ${to.x - 150} ${to.y + 45}, ${to.x} ${to.y + 45}`}
                />
                <text
                  className={isSupply ? "schematic-line-label supply" : "schematic-line-label return"}
                  x={(from.x + to.x) / 2 + 40}
                  y={(from.y + to.y) / 2 + (isSupply ? 22 : 58)}
                >
                  {isSupply ? "Подача" : "Обратка"}
                </text>
                {connection.status === "ambiguous" && (
                  <text className="schematic-warning" x={(from.x + to.x) / 2 + 35} y={(from.y + to.y) / 2 + 82}>Несколько вариантов подключения</text>
                )}
              </g>
            );
          }

          if (!boilerPosition) return null;
          return (
            <g key={connection.id} className="schematic-missing">
              <text x={boilerPosition.x + 170} y={boilerPosition.y + (isSupply ? 30 : 68)} className="schematic-cross">x</text>
              <text x={boilerPosition.x + 192} y={boilerPosition.y + (isSupply ? 30 : 68)} className="schematic-missing-text">
                {connection.issueMessage ?? (isSupply ? "Нет подходящей цели" : "Нет подходящей цели")}
              </text>
            </g>
          );
            })}

            {boilers.map((boiler) => {
          const position = nodePositions.get(boiler.id);
          if (!position) return null;
          return (
            <g key={boiler.id}>
              <rect className="schematic-node boiler" x={position.x} y={position.y} width="150" height="82" rx="6" />
              <text className="schematic-node-title" x={position.x + 16} y={position.y + 32}>{boiler.label}</text>
              <text className="schematic-node-subtitle" x={position.x + 16} y={position.y + 58}>котёл</text>
            </g>
          );
            })}

            {supplyHeaders.length > 0
              ? supplyHeaders.map((header) => <HeaderNode key={header.id} instance={header} position={nodePositions.get(header.id)} type="supply" />)
              : <MissingHeader x={565} y={95} label="Нет точки подключения" />}
            {returnHeaders.length > 0
              ? returnHeaders.map((header) => <HeaderNode key={header.id} instance={header} position={nodePositions.get(header.id)} type="return" />)
              : <MissingHeader x={565} y={returnHeaderStartY} label="Нет точки подключения" />}

            {boilers.length === 0 && (
              <text x="90" y="130" className="schematic-empty">Добавьте котёл, чтобы увидеть логические соединения.</text>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

function HeaderNode({ instance, position, type }: { instance: EquipmentInstance; position?: NodePosition; type: "supply" | "return" }) {
  if (!position) return null;
  return (
    <g>
      <rect className={`schematic-node header ${type}`} x={position.x} y={position.y} width="155" height="88" rx="6" />
      <text className="schematic-node-title" x={position.x + 14} y={position.y + 35}>{type === "supply" ? "Коллектор подачи" : "Коллектор обратки"}</text>
      <text className="schematic-node-subtitle" x={position.x + 14} y={position.y + 62}>{instance.label}</text>
    </g>
  );
}

function MissingHeader({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect className="schematic-node missing" x={x} y={y} width="165" height="78" rx="6" />
      <text className="schematic-cross" x={x + 16} y={y + 45}>x</text>
      <text className="schematic-missing-text" x={x + 42} y={y + 45}>{label}</text>
    </g>
  );
}

const getCategory = (instance: EquipmentInstance, definitions: EquipmentDefinition[]) =>
  definitions.find((definition) => definition.id === instance.definitionId)?.category;

const hasConnection = (
  instance: EquipmentInstance,
  definitions: EquipmentDefinition[],
  type: "supply" | "return",
) =>
  definitions
    .find((definition) => definition.id === instance.definitionId)
    ?.connectionPoints.some((point) => point.type === type) ?? false;
