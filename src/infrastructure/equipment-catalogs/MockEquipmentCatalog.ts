import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentCatalog } from "@/infrastructure/equipment-catalogs/EquipmentCatalog";

export const mockEquipmentDefinitions: EquipmentDefinition[] = [
  {
    id: "boiler-250kw",
    category: "boiler",
    name: "Котёл 250 кВт",
    manufacturer: "MockHeat",
    model: "BH-250",
    dimensionsMm: { width: 900, depth: 1200, height: 1600 },
    serviceClearancesMm: { front: 1000, back: 600, left: 500, right: 500 },
    connectionPoints: [
      { id: "supply", type: "supply", position: { xMm: 780, yMm: 150 }, nominalDiameterMm: 80, direction: "top" },
      { id: "return", type: "return", position: { xMm: 120, yMm: 150 }, nominalDiameterMm: 80, direction: "top" },
    ],
    source: "mock",
  },
  {
    id: "boiler-500kw",
    category: "boiler",
    name: "Котёл 500 кВт",
    manufacturer: "MockHeat",
    model: "BH-500",
    dimensionsMm: { width: 1200, depth: 1600, height: 1800 },
    serviceClearancesMm: { front: 1200, back: 800, left: 600, right: 600 },
    connectionPoints: [
      { id: "supply", type: "supply", position: { xMm: 1040, yMm: 180 }, nominalDiameterMm: 100, direction: "top" },
      { id: "return", type: "return", position: { xMm: 160, yMm: 180 }, nominalDiameterMm: 100, direction: "top" },
    ],
    source: "mock",
  },
  {
    id: "supply-header",
    category: "header",
    name: "Коллектор подачи",
    manufacturer: "MockPipe",
    model: "SH-2000",
    dimensionsMm: { width: 2000, depth: 250 },
    serviceClearancesMm: { front: 150, back: 150, left: 150, right: 150 },
    connectionPoints: [{ id: "supply-main", type: "supply", position: { xMm: 1000, yMm: 125 }, nominalDiameterMm: 150 }],
    source: "mock",
  },
  {
    id: "return-header",
    category: "header",
    name: "Коллектор обратки",
    manufacturer: "MockPipe",
    model: "RH-2000",
    dimensionsMm: { width: 2000, depth: 250 },
    serviceClearancesMm: { front: 150, back: 150, left: 150, right: 150 },
    connectionPoints: [{ id: "return-main", type: "return", position: { xMm: 1000, yMm: 125 }, nominalDiameterMm: 150 }],
    source: "mock",
  },
];

export class MockEquipmentCatalog implements EquipmentCatalog {
  id = "mock-equipment-catalog";
  name = "Тестовый каталог оборудования";

  listDefinitions(): EquipmentDefinition[] {
    return mockEquipmentDefinitions;
  }

  getDefinition(id: string): EquipmentDefinition | undefined {
    return mockEquipmentDefinitions.find((definition) => definition.id === id);
  }
}
