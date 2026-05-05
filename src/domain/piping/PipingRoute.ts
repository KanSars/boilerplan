import type { PointMm } from "@/domain/geometry/geometryTypes";

export type PipingSystemType = "supply" | "return" | "gas" | "drain" | "unknown";

export type PipingRoute = {
  id: string;
  systemType: PipingSystemType;
  from: {
    equipmentInstanceId: string;
    connectionPointId: string;
  };
  to: {
    equipmentInstanceId: string;
    connectionPointId: string;
  };
  polylinePoints: PointMm[];
  nominalDiameterMm?: number;
  metadata?: Record<string, unknown>;
  calculationStatus: "not_calculated" | "preliminary" | "calculated";
  warnings: string[];
};
