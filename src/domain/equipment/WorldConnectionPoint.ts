import type {
  ConnectionDirection,
  ConnectionPointSource,
  ConnectionPointSystemRole,
  ConnectionPointType,
} from "@/domain/equipment/ConnectionPoint";

export type WorldConnectionPoint = {
  equipmentInstanceId: string;
  definitionId: string;
  connectionPointId: string;
  type: ConnectionPointType;
  label: string;
  worldPosition: {
    xMm: number;
    yMm: number;
    zMm?: number;
  };
  nominalDiameterMm?: number;
  direction?: ConnectionDirection;
  systemRole?: ConnectionPointSystemRole;
  source: ConnectionPointSource;
  confidence?: number;
};
