import type {
  DrawingEvidenceReport,
  DrawingEvidenceReportItem,
  EvidenceDataset,
  EvidenceLink,
  EvidenceStatus,
  EvidenceTarget,
} from "@/domain/evidence";
import type { EngineeringDrawing } from "@/domain/drawing";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { Project } from "@/domain/project/Project";
import { PilotKitCalculationService } from "@/infrastructure/calculation/PilotKitCalculationService";
import { pilotPipeSpecs } from "@/shared/config/pilotKitSpecs";

export class PilotDrawingEvidenceReportService {
  private readonly calculationService = new PilotKitCalculationService();

  create(
    drawing: EngineeringDrawing,
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
    dataset: EvidenceDataset,
  ): DrawingEvidenceReport {
    const items = [
      ...this.createEquipmentItems(project, equipmentDefinitions, dataset),
      ...this.createPipeItems(dataset),
      ...this.createValveItems(project, equipmentDefinitions, dataset),
      ...this.createCalculationItems(equipmentDefinitions),
      this.createDrawingItem(drawing, dataset),
    ];

    return {
      id: `${drawing.id}_evidence_report`,
      drawingId: drawing.id,
      title: `${drawing.metadata.title}. Отчет по источникам pilot kit`,
      status: "review_required",
      disclaimer: "Это evidence/status report: он показывает источники и недостающие данные, но не подтверждает соответствие ГОСТ/СП и не заменяет инженерную проверку.",
      sourceDocumentIds: unique([
        ...drawing.metadata.sourceDocumentIds,
        ...items.flatMap((item) => item.sourceDocumentIds),
      ]),
      items,
      missingData: [
        "Координаты патрубков котла и коллекторов требуют сверки с заводскими чертежами.",
        "Применимость STOUT DN32 как коллектора котельной требует инженерного подтверждения.",
        "Трубы и арматура рассчитаны частично: есть расход/скорости, но нет потерь давления, насоса, прочностного расчета и полной газовой проверки.",
        "Нормативная применимость ГОСТ/СП к конкретному объекту не оценивалась.",
      ],
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
