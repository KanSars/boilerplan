"use client";

import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { SystemConnection } from "@/domain/piping/SystemConnection";

type Props = {
  equipmentInstances: EquipmentInstance[];
  definitions: EquipmentDefinition[];
  systemConnections: SystemConnection[];
};

type NodePosition = {
  x: number;
  y: number;
};

export function PrincipleSchematicView({ equipmentInstances, definitions, systemConnections }: Props) {
  const boilers = equipmentInstances.filter((instance) => getCategory(instance, definitions) === "boiler");
  const supplyHeader = equipmentInstances.find((instance) =>
    getCategory(instance, definitions) === "header" && hasConnection(instance, definitions, "supply"),
  );
  const returnHeader = equipmentInstances.find((instance) =>
    getCategory(instance, definitions) === "header" && hasConnection(instance, definitions, "return"),
  );

  const nodePositions = new Map<string, NodePosition>();
  boilers.forEach((boiler, index) => {
    nodePositions.set(boiler.id, { x: 90, y: 110 + index * 115 });
  });
  if (supplyHeader) nodePositions.set(supplyHeader.id, { x: 575, y: 95 });
  if (returnHeader) nodePositions.set(returnHeader.id, { x: 575, y: Math.max(280, 120 + boilers.length * 95) });

  const height = Math.max(430, 230 + boilers.length * 115);

  return (
    <div className="schematic-frame">
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
                  <text className="schematic-warning" x={(from.x + to.x) / 2 + 35} y={(from.y + to.y) / 2 + 82}>выбран первый коллектор</text>
                )}
              </g>
            );
          }

          if (!boilerPosition) return null;
          return (
            <g key={connection.id} className="schematic-missing">
              <text x={boilerPosition.x + 170} y={boilerPosition.y + (isSupply ? 30 : 68)} className="schematic-cross">x</text>
              <text x={boilerPosition.x + 192} y={boilerPosition.y + (isSupply ? 30 : 68)} className="schematic-missing-text">
                {connection.issueMessage ?? (isSupply ? "Нет коллектора подачи" : "Нет коллектора обратки")}
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

        {supplyHeader ? <HeaderNode instance={supplyHeader} position={nodePositions.get(supplyHeader.id)} type="supply" /> : <MissingHeader x={565} y={95} label="Нет коллектора подачи" />}
        {returnHeader ? <HeaderNode instance={returnHeader} position={nodePositions.get(returnHeader.id)} type="return" /> : <MissingHeader x={565} y={Math.max(280, 120 + boilers.length * 95)} label="Нет коллектора обратки" />}

        {boilers.length === 0 && (
          <text x="90" y="130" className="schematic-empty">Добавьте котёл, чтобы увидеть логические соединения.</text>
        )}
      </svg>
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
