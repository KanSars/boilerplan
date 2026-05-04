import type { ConnectionPoint } from "@/domain/equipment/ConnectionPoint";

export type EquipmentCategory =
  | "boiler"
  | "pump"
  | "header"
  | "tank"
  | "sensor"
  | "cabinet"
  | "other";

export type EquipmentDefinition = {
  id: string;
  category: EquipmentCategory;
  name: string;
  manufacturer?: string;
  model?: string;
  dimensionsMm: {
    width: number;
    depth: number;
    height?: number;
  };
  connectionPoints: ConnectionPoint[];
  serviceClearancesMm: {
    front: number;
    back: number;
    left: number;
    right: number;
  };
  metadata?: Record<string, unknown>;
  source: "mock" | "manual" | "manufacturer_catalog";
};
