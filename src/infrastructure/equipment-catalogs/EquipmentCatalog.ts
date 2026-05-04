import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";

export interface EquipmentCatalog {
  id: string;
  name: string;
  listDefinitions(): EquipmentDefinition[];
  getDefinition(id: string): EquipmentDefinition | undefined;
}
