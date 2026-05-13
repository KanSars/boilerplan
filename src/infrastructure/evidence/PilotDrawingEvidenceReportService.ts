import type {
  DrawingEvidenceGap,
  DrawingEvidenceReport,
  DrawingEvidenceReportItem,
  EvidenceDataset,
  EvidenceLink,
  EvidenceStatus,
  EvidenceTarget,
} from "@/domain/evidence";
import type { EngineeringDrawing } from "@/domain/drawing";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { SystemConnectionResolver } from "@/domain/piping/SystemConnectionResolver";
import type { Project } from "@/domain/project/Project";
import { PilotKitCalculationService } from "@/infrastructure/calculation/PilotKitCalculationService";
import { pilotPipeSpecs } from "@/shared/config/pilotKitSpecs";

export class PilotDrawingEvidenceReportService {
  private readonly calculationService = new PilotKitCalculationService();
  private readonly connectionResolver = new SystemConnectionResolver();

  create(
    drawing: EngineeringDrawing,
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
    dataset: EvidenceDataset,
  ): DrawingEvidenceReport {
    const projectPassport = createProjectPassport(project, equipmentDefinitions);
    const calculationItems = this.createCalculationItems(equipmentDefinitions);
    const items = [
      this.createProjectItem(projectPassport, dataset),
      ...this.createEquipmentItems(project, equipmentDefinitions, dataset),
      ...this.createPipeItems(dataset),
      ...this.createValveItems(project, equipmentDefinitions, dataset),
      ...calculationItems,
      this.createConnectionReviewItem(project, equipmentDefinitions),
      this.createDrawingItem(drawing, dataset),
    ];
    const structuredMissingData = createStructuredMissingData(equipmentDefinitions, calculationItems);

    return {
      id: `${drawing.id}_evidence_report`,
      drawingId: drawing.id,
      title: `${drawing.metadata.title}. Отчет по источникам pilot kit`,
      status: "review_required",
      disclaimer: "Это evidence/status report: он показывает источники и недостающие данные, но не подтверждает соответствие ГОСТ/СП и не заменяет инженерную проверку.",
      projectPassport,
      sourceDocumentIds: unique([
        ...drawing.metadata.sourceDocumentIds,
        ...items.flatMap((item) => item.sourceDocumentIds),
      ]),
      items,
      structuredMissingData,
      missingData: structuredMissingData.map((item) => item.reason),
    };
  }

  private createProjectItem(projectPassport: Record<string, string | number | boolean>, dataset: EvidenceDataset): DrawingEvidenceReportItem {
    const evidence = collectEvidence(dataset, { kind: "project", id: "typical-standalone-boiler-room" });
    return {
      id: "project-passport",
      kind: "project",
      label: "Паспорт проекта и сценарий применимости",
      target: { kind: "project", id: "pilot-kit" },
      status: "review_required",
      sourceDocumentIds: unique(["src-sp-89-13330-2016", ...evidence.sourceDocumentIds]),
      requirementIds: evidence.requirementIds,
      citationIds: evidence.citationIds,
      facts: projectPassport,
      limitations: [],
    };
  }

  private createEquipmentItems(
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
    dataset: EvidenceDataset,
  ): DrawingEvidenceReportItem[] {
    return project.equipmentInstances.map((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      const target: EvidenceTarget = { kind: "equipment_definition", id: instance.definitionId };
      const evidence = collectEvidence(dataset, target);
      const sourceDocumentId = getMetadataString(definition?.metadata, "sourceDocumentId");
      return {
        id: `equipment-${instance.id}`,
        kind: "equipment",
        label: `${instance.label}: ${definition?.manufacturer ?? ""} ${definition?.model ?? definition?.name ?? instance.definitionId}`.trim(),
        target,
        status: getMetadataStatus(definition?.metadata),
        sourceDocumentIds: unique([sourceDocumentId, ...evidence.sourceDocumentIds].filter(isString)),
        requirementIds: evidence.requirementIds,
        citationIds: evidence.citationIds,
        facts: {
          category: definition?.category ?? "unknown",
          widthMm: definition?.dimensionsMm.width ?? 0,
          depthMm: definition?.dimensionsMm.depth ?? 0,
          connectionPointCount: definition?.connectionPoints.length ?? 0,
          source: definition?.source ?? "unknown",
        },
        limitations: [
          getMetadataString(definition?.metadata, "notes") ?? "Данные карточки требуют инженерной проверки.",
        ],
      };
    });
  }

  private createPipeItems(dataset: EvidenceDataset): DrawingEvidenceReportItem[] {
    return pilotPipeSpecs.map((spec) => {
      const target: EvidenceTarget = { kind: "drawing_element", id: "pilot-sheet-pipe-specs" };
      const evidence = collectEvidence(dataset, target);
      return {
        id: `pipe-${spec.id}`,
        kind: "pipe",
        label: `${spec.label} DN${spec.nominalDiameterMm}`,
        target,
        status: spec.reviewStatus,
        sourceDocumentIds: unique([spec.sourceDocumentId, ...evidence.sourceDocumentIds]),
        requirementIds: evidence.requirementIds,
        citationIds: evidence.citationIds,
        facts: {
          system: spec.system,
          nominalDiameterMm: spec.nominalDiameterMm,
          material: spec.material,
          outerDiameterMm: spec.outerDiameterMm ?? 0,
          wallThicknessMm: spec.wallThicknessMm ?? 0,
        },
        limitations: [
          "Pilot pipe spec не является гидравлическим расчетом или подтверждением применимости к газовой/тепломеханической части.",
        ],
      };
    });
  }

  private createValveItems(project: Project, equipmentDefinitions: EquipmentDefinition[], dataset: EvidenceDataset): DrawingEvidenceReportItem[] {
    return project.equipmentInstances.filter((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "valve";
    }).map((component) => {
      const definition = equipmentDefinitions.find((item) => item.id === component.definitionId);
      const target: EvidenceTarget = { kind: "drawing_element", id: "pilot-sheet-valve-specs" };
      const evidence = collectEvidence(dataset, target);
      const sourceDocumentId = getMetadataString(definition?.metadata, "sourceDocumentId");
      const nominalDiameterMm = definition?.connectionPoints.find((point) => point.nominalDiameterMm)?.nominalDiameterMm;
      return {
        id: `valve-${component.id}`,
        kind: "valve",
        label: nominalDiameterMm ? `${component.label} DN${nominalDiameterMm}` : component.label,
        target,
        status: getMetadataStatus(definition?.metadata),
        sourceDocumentIds: unique([sourceDocumentId, ...evidence.sourceDocumentIds].filter(isString)),
        requirementIds: evidence.requirementIds,
        citationIds: evidence.citationIds,
        facts: {
          definitionId: component.definitionId,
          nominalDiameterMm: nominalDiameterMm ?? 0,
          componentType: definition?.category ?? "unknown",
          manufacturer: definition?.manufacturer ?? "unknown",
          model: definition?.model ?? "unknown",
        },
        limitations: [
          "Арматура существует в Project model; конкретная применимость и характеристики должны быть проверены по источнику.",
        ],
      };
    });
  }

  private createCalculationItems(equipmentDefinitions: EquipmentDefinition[]): DrawingEvidenceReportItem[] {
    return this.calculationService.calculate(equipmentDefinitions).map((calculation) => ({
      id: `calculation-${calculation.id}`,
      kind: "calculation",
      label: calculation.title,
      target: { kind: "drawing_element", id: calculation.id },
      status: "review_required",
      sourceDocumentIds: calculation.sourceDocumentIds,
      requirementIds: [],
      citationIds: [],
      facts: {
        formula: calculation.formula,
        status: calculation.status,
        ...calculation.inputs,
        ...calculation.outputs,
      },
      limitations: calculation.limitations,
    }));
  }

  private createConnectionReviewItem(project: Project, equipmentDefinitions: EquipmentDefinition[]): DrawingEvidenceReportItem {
    const systemConnections = this.connectionResolver.resolve(project, { equipmentDefinitions });
    const connected = systemConnections.filter((connection) => connection.status === "connected").length;
    const unresolved = systemConnections.filter((connection) => connection.status !== "connected").length;
    return {
      id: "connection-review",
      kind: "connection_review",
      label: "Логическая проверка соединений текущего состава",
      target: { kind: "project", id: "pilot-kit" },
      status: "review_required",
      sourceDocumentIds: [],
      requirementIds: [],
      citationIds: [],
      facts: {
        connectionCount: systemConnections.length,
        connectedCount: connected,
        unresolvedCount: unresolved,
      },
      limitations: unresolved > 0 ? ["Есть логически незавершенные соединения; нужно проверить состав и связи проекта."] : [],
    };
  }

  private createDrawingItem(drawing: EngineeringDrawing, dataset: EvidenceDataset): DrawingEvidenceReportItem {
    const targets: EvidenceTarget[] = [
      { kind: "drawing_element", id: "pilot-sheet-pipes" },
      { kind: "drawing_element", id: "pilot-sheet-valves" },
    ];
    const evidence = targets.map((target) => collectEvidence(dataset, target));
    return {
      id: "drawing-pilot-sheet",
      kind: "drawing",
      label: drawing.metadata.title,
      target: { kind: "drawing_element", id: drawing.id },
      status: getDraftEvidenceStatus(),
      sourceDocumentIds: unique([
        ...drawing.metadata.sourceDocumentIds,
        ...evidence.flatMap((item) => item.sourceDocumentIds),
      ]),
      requirementIds: unique(evidence.flatMap((item) => item.requirementIds)),
      citationIds: unique(evidence.flatMap((item) => item.citationIds)),
      facts: {
        sheetFormat: drawing.sheet.format,
        entityCount: drawing.entities.length,
        viewportCount: drawing.viewports.length,
      },
      limitations: drawing.metadata.notes,
    };
  }
}

type CollectedEvidence = {
  sourceDocumentIds: string[];
  requirementIds: string[];
  citationIds: string[];
};

const collectEvidence = (dataset: EvidenceDataset, target: EvidenceTarget): CollectedEvidence => {
  const links = dataset.evidenceLinks.filter((link) => targetsEqual(link.target, target));
  const requirements = links
    .map((link) => dataset.requirements.find((requirement) => requirement.id === link.requirementId))
    .filter((requirement): requirement is NonNullable<typeof requirement> => Boolean(requirement));
  return {
    sourceDocumentIds: unique(requirements.flatMap((requirement) => requirement.citations.map((citation) => citation.sourceDocumentId))),
    requirementIds: unique(links.map((link) => link.requirementId)),
    citationIds: unique(links.flatMap((link) => link.citationIds)),
  };
};

const targetsEqual = (left: EvidenceLink["target"], right: EvidenceTarget): boolean =>
  left.kind === right.kind && left.id === right.id;

const getMetadataString = (
  metadata: EquipmentDefinition["metadata"] | undefined,
  key: string,
): string | undefined => {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
};

const getMetadataStatus = (metadata: EquipmentDefinition["metadata"] | undefined): EvidenceStatus => {
  const value = metadata?.reviewStatus;
  return value === "extracted" || value === "review_required" || value === "verified" || value === "conflict" || value === "deprecated"
    ? value
    : "review_required";
};

const getDraftEvidenceStatus = (): EvidenceStatus => "review_required";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const isString = (value: string | undefined): value is string => typeof value === "string";

const createProjectPassport = (
  project: Project,
  equipmentDefinitions: EquipmentDefinition[],
): Record<string, string | number | boolean> => {
  const boiler = equipmentDefinitions.find((definition) => definition.id === "rgt-100-ksva-100");
  const boilerFacts = getEquipmentFacts(boiler);
  return {
    jurisdiction: "РФ",
    boilerRoomType: stringifyMetadata(project.metadata.boilerRoomType) ?? "standalone_block",
    objectPlacement: "отдельно стоящий блок",
    boilerPlantType: "газовая водогрейная котельная",
    reviewScope: "котел + 2 коллектора + трубы + запорная арматура",
    fuelType: stringifyMetadata(project.metadata.fuelType) ?? stringifyFact(boilerFacts.fuelType) ?? "natural_gas",
    heatCarrier: stringifyMetadata(project.metadata.heatCarrier) ?? "вода",
    circulationType: stringifyMetadata(project.metadata.circulationType) ?? "принудительная",
    totalHeatPowerKw: toNumber(project.metadata.totalHeatPowerKw) ?? toNumber(boilerFacts.nominalPowerKw) ?? 0,
    designSupplyTemperatureC: toNumber(project.metadata.designSupplyTemperatureC) ?? 80,
    designReturnTemperatureC: toNumber(project.metadata.designReturnTemperatureC) ?? 60,
    designDeltaTC: (toNumber(project.metadata.designSupplyTemperatureC) ?? 80) - (toNumber(project.metadata.designReturnTemperatureC) ?? 60),
    boilerCount: project.equipmentInstances.filter((instance) => instance.definitionId === "rgt-100-ksva-100").length,
    headerCount: project.equipmentInstances.filter((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "header";
    }).length,
    valveCount: project.equipmentInstances.filter((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "valve";
    }).length,
  };
};

const createStructuredMissingData = (
  equipmentDefinitions: EquipmentDefinition[],
  calculationItems: DrawingEvidenceReportItem[],
): DrawingEvidenceGap[] => {
  const boiler = equipmentDefinitions.find((definition) => definition.id === "rgt-100-ksva-100");
  const supplyHeader = equipmentDefinitions.find((definition) => definition.id === "supply-header");
  const returnHeader = equipmentDefinitions.find((definition) => definition.id === "return-header");
  const hydronicCalculation = calculationItems.find((item) => item.id === "calculation-calc-hydronic-flow");

  return [
    {
      id: "gap-project-passport",
      topic: "standards_applicability",
      text: "Подтверждён ли базовый сценарий проверки для этого проекта?",
      reason: "Сценарий проекта уже определён в модели: РФ, отдельно стоящий блок, газовая водогрейная котельная, один котёл, принудительная циркуляция, график 80/60 °C.",
      target: { kind: "project", id: "pilot-kit" },
      status: "review_required",
      answerStatus: "closed_from_model",
      suggestedAnswerFormat: "text",
    },
    {
      id: "gap-boiler-geometry",
      topic: "connection_geometry",
      text: "Подтверждены ли координаты патрубков котла по заводскому чертежу? Укажите документ/страницу или корректные координаты.",
      reason: getMetadataString(boiler?.metadata, "notes") ?? "Координаты патрубков котла требуют сверки с заводским чертежом.",
      target: { kind: "equipment_definition", id: "rgt-100-ksva-100" },
      status: "review_required",
      answerStatus: "unknown",
      suggestedAnswerFormat: "document_reference",
    },
    {
      id: "gap-supply-header-geometry",
      topic: "connection_geometry",
      text: "Подтверждены ли координаты патрубков коллектора подачи по паспорту/чертежу производителя?",
      reason: getMetadataString(supplyHeader?.metadata, "notes") ?? "Координаты патрубков коллектора подачи требуют сверки.",
      target: { kind: "equipment_definition", id: "supply-header" },
      status: "review_required",
      answerStatus: "unknown",
      suggestedAnswerFormat: "document_reference",
    },
    {
      id: "gap-return-header-geometry",
      topic: "connection_geometry",
      text: "Подтверждены ли координаты патрубков коллектора обратки по паспорту/чертежу производителя?",
      reason: getMetadataString(returnHeader?.metadata, "notes") ?? "Координаты патрубков коллектора обратки требуют сверки.",
      target: { kind: "equipment_definition", id: "return-header" },
      status: "review_required",
      answerStatus: "unknown",
      suggestedAnswerFormat: "document_reference",
    },
    {
      id: "gap-collector-applicability",
      topic: "collector_applicability",
      text: "Подтверждена ли применимость выбранного коллектора к текущему сценарию котельной?",
      reason: "Источник STOUT описывает распределительный коллектор для приема теплоносителя от источника тепловой энергии и распределения между системами теплопотребления здания; это закрывает тип изделия, но не заменяет инженерный выбор именно для данного объекта.",
      target: { kind: "project", id: "pilot-kit" },
      status: "review_required",
      answerStatus: "closed_from_source",
      suggestedAnswerFormat: "document_reference",
    },
    {
      id: "gap-valve-source",
      topic: "valve_selection",
      text: "Подтверждён ли тип арматуры для текущих трубопроводов?",
      reason: "Публичный паспорт кранов подтверждает наличие типоразмеров Ду25/Ду32 и применение в системах теплоснабжения, но не заменяет окончательный инженерный выбор способа присоединения и серии.",
      target: { kind: "drawing_element", id: "pilot-sheet-valve-specs" },
      status: "review_required",
      answerStatus: "closed_from_source",
      suggestedAnswerFormat: "document_reference",
    },
    {
      id: "gap-hydronic-calculation",
      topic: "pipe_hydraulic_calculation",
      text: "Выполнен ли полный гидравлический расчёт с потерями давления и подбором насоса/арматуры?",
      reason: hydronicCalculation?.limitations.join(" / ") ?? "Есть только предварительный расчёт расхода и скорости, без полного гидравлического расчёта.",
      target: { kind: "project", id: "pilot-kit" },
      status: "review_required",
      answerStatus: "unknown",
      suggestedAnswerFormat: "document_reference",
    },
    {
      id: "gap-standards-set",
      topic: "standards_applicability",
      text: "Определён ли базовый набор нормативных и паспортных источников для этой проверки?",
      reason: "Для текущего состава уже подобраны источники по котлу, коллектору, трубам, арматуре и чертёжным обозначениям; их применимость остаётся review_required, но базовый набор документов сформирован.",
      target: { kind: "project", id: "pilot-kit" },
      status: "review_required",
      answerStatus: "closed_from_source",
      suggestedAnswerFormat: "text",
    },
  ];
};

type BoilerFacts = {
  nominalPowerKw?: number;
  fuelType?: string;
};

const getEquipmentFacts = (definition: EquipmentDefinition | undefined): BoilerFacts => {
  const facts = definition?.metadata?.extractedFacts;
  return typeof facts === "object" && facts !== null ? facts as BoilerFacts : {};
};

const stringifyMetadata = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const stringifyFact = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const toNumber = (value: unknown): number | undefined => typeof value === "number" ? value : undefined;
