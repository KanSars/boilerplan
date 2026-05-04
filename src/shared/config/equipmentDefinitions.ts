import { MockEquipmentCatalog } from "@/infrastructure/equipment-catalogs/MockEquipmentCatalog";

const catalog = new MockEquipmentCatalog();

export const equipmentDefinitions = catalog.listDefinitions();
