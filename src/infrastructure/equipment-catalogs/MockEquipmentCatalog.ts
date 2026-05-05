import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentCatalog } from "@/infrastructure/equipment-catalogs/EquipmentCatalog";

export const mockEquipmentDefinitions: EquipmentDefinition[] = [
  {
    id: "rgt-100-ksva-100",
    category: "boiler",
    name: "Котёл RGT-100 / КСВА-100",
    manufacturer: "КОМПАС",
    model: "RGT-100",
    dimensionsMm: { width: 689, depth: 720, height: 1100 },
    serviceClearancesMm: { front: 1000, back: 600, left: 500, right: 500 },
    connectionPoints: [
      { id: "supply", type: "supply", label: "Подача DN32", position: { xMm: 560, yMm: 120, zMm: 950 }, nominalDiameterMm: 32, direction: "top", systemRole: "source", source: "manufacturer_catalog", confidence: 0.65 },
      { id: "return", type: "return", label: "Обратка DN32", position: { xMm: 130, yMm: 120, zMm: 950 }, nominalDiameterMm: 32, direction: "top", systemRole: "source", source: "manufacturer_catalog", confidence: 0.65 },
      { id: "gas", type: "gas", label: "Газ DN25", position: { xMm: 345, yMm: 720, zMm: 420 }, nominalDiameterMm: 25, direction: "bottom", systemRole: "target", source: "manufacturer_catalog", confidence: 0.55 },
      { id: "flue", type: "flue", label: "Дымоход DN200", position: { xMm: 345, yMm: 70, zMm: 1100 }, nominalDiameterMm: 200, direction: "up", systemRole: "source", source: "manufacturer_catalog", confidence: 0.55 },
      { id: "electrical", type: "electrical", label: "Электропитание", position: { xMm: 665, yMm: 360, zMm: 900 }, direction: "right", systemRole: "target", source: "manual_catalog", confidence: 0.35 },
      { id: "signal", type: "signal", label: "Аварийный сигнал", position: { xMm: 665, yMm: 455, zMm: 900 }, direction: "right", systemRole: "bidirectional", source: "manual_catalog", confidence: 0.35 },
    ],
    metadata: {
      sourceDocumentId: "src-rgt-100-500-passport",
      reviewStatus: "review_required",
      extractedFacts: {
        nominalPowerKw: 99,
        fuelType: "natural_gas",
        gasPressureKpaMax: 3,
        nominalWaterFlowM3h: 4.3,
        flueDiameterMm: 200,
      },
      notes: "Габариты и DN взяты из публичного паспорта RGT-100/КСВА-100; координаты патрубков условные и требуют проверки по заводскому чертежу.",
    },
    source: "manufacturer_catalog",
  },
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
    name: "Коллектор подачи DN32/DN80",
    manufacturer: "PilotPipe",
    model: "SH-2000-review",
    dimensionsMm: { width: 2000, depth: 250 },
    serviceClearancesMm: { front: 150, back: 150, left: 150, right: 150 },
    connectionPoints: [
      { id: "supply-main", type: "supply", label: "Патрубок подачи DN32", position: { xMm: 1000, yMm: 125, zMm: 1200 }, nominalDiameterMm: 32, direction: "left", systemRole: "target", source: "manual_catalog", confidence: 0.4 },
    ],
    metadata: {
      sourceDocumentId: "src-sanext-steel-manifold-passport",
      reviewStatus: "review_required",
      notes: "Пилотный коллектор для отрисовки; источник-кандидат требует замены на паспорт коллектора котельной.",
    },
    source: "manual",
  },
  {
    id: "return-header",
    category: "header",
    name: "Коллектор обратки DN32/DN80",
    manufacturer: "PilotPipe",
    model: "RH-2000-review",
    dimensionsMm: { width: 2000, depth: 250 },
    serviceClearancesMm: { front: 150, back: 150, left: 150, right: 150 },
    connectionPoints: [
      { id: "return-main", type: "return", label: "Патрубок обратки DN32", position: { xMm: 1000, yMm: 125, zMm: 1200 }, nominalDiameterMm: 32, direction: "left", systemRole: "target", source: "manual_catalog", confidence: 0.4 },
    ],
    metadata: {
      sourceDocumentId: "src-sanext-steel-manifold-passport",
      reviewStatus: "review_required",
      notes: "Пилотный коллектор для отрисовки; источник-кандидат требует замены на паспорт коллектора котельной.",
    },
    source: "manual",
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
