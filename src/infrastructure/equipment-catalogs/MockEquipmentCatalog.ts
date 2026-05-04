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
      { id: "supply", type: "supply", label: "Подача", position: { xMm: 780, yMm: 150, zMm: 900 }, nominalDiameterMm: 80, direction: "top", systemRole: "source", source: "mock", confidence: 1 },
      { id: "return", type: "return", label: "Обратка", position: { xMm: 120, yMm: 150, zMm: 900 }, nominalDiameterMm: 80, direction: "top", systemRole: "source", source: "mock", confidence: 1 },
      { id: "gas", type: "gas", label: "Газ", position: { xMm: 450, yMm: 1200, zMm: 500 }, nominalDiameterMm: 50, direction: "bottom", systemRole: "target", source: "mock", confidence: 1 },
      { id: "flue", type: "flue", label: "Дымоход", position: { xMm: 450, yMm: 80, zMm: 1500 }, nominalDiameterMm: 180, direction: "up", systemRole: "source", source: "mock", confidence: 1 },
      { id: "electrical", type: "electrical", label: "Электропитание", position: { xMm: 860, yMm: 620, zMm: 1400 }, direction: "right", systemRole: "target", source: "mock", confidence: 1 },
      { id: "signal", type: "signal", label: "Сигнал", position: { xMm: 860, yMm: 720, zMm: 1400 }, direction: "right", systemRole: "bidirectional", source: "mock", confidence: 1 },
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
      { id: "supply", type: "supply", label: "Подача", position: { xMm: 1040, yMm: 180, zMm: 950 }, nominalDiameterMm: 100, direction: "top", systemRole: "source", source: "mock", confidence: 1 },
      { id: "return", type: "return", label: "Обратка", position: { xMm: 160, yMm: 180, zMm: 950 }, nominalDiameterMm: 100, direction: "top", systemRole: "source", source: "mock", confidence: 1 },
      { id: "gas", type: "gas", label: "Газ", position: { xMm: 600, yMm: 1600, zMm: 600 }, nominalDiameterMm: 65, direction: "bottom", systemRole: "target", source: "mock", confidence: 1 },
      { id: "flue", type: "flue", label: "Дымоход", position: { xMm: 600, yMm: 80, zMm: 1700 }, nominalDiameterMm: 250, direction: "up", systemRole: "source", source: "mock", confidence: 1 },
      { id: "electrical", type: "electrical", label: "Электропитание", position: { xMm: 1160, yMm: 850, zMm: 1500 }, direction: "right", systemRole: "target", source: "mock", confidence: 1 },
      { id: "signal", type: "signal", label: "Сигнал", position: { xMm: 1160, yMm: 960, zMm: 1500 }, direction: "right", systemRole: "bidirectional", source: "mock", confidence: 1 },
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
    connectionPoints: [
      { id: "supply-main", type: "supply", label: "Патрубок подачи", position: { xMm: 1000, yMm: 125, zMm: 1200 }, nominalDiameterMm: 150, direction: "left", systemRole: "target", source: "mock", confidence: 1 },
    ],
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
    connectionPoints: [
      { id: "return-main", type: "return", label: "Патрубок обратки", position: { xMm: 1000, yMm: 125, zMm: 1200 }, nominalDiameterMm: 150, direction: "left", systemRole: "target", source: "mock", confidence: 1 },
    ],
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
