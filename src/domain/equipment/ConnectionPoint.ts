import type { PointMm } from "@/domain/geometry/geometryTypes";

export type ConnectionPointType =
  | "supply"
  | "return"
  | "gas"
  | "drain"
  | "flue"
  | "electrical"
  | "signal";

export type ConnectionDirection = "left" | "right" | "top" | "bottom";

export type ConnectionPoint = {
  id: string;
  type: ConnectionPointType;
  position: PointMm;
  nominalDiameterMm?: number;
  direction?: ConnectionDirection;
};
