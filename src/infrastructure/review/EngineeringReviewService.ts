import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { DrawingEvidenceReport, DrawingEvidenceGap } from "@/domain/evidence";
import type {
  CadManualAction,
  EngineeringReviewFinding,
  EngineeringReviewFindingStatus,
  EngineeringReviewOverallStatus,
  EngineeringReviewReport,
} from "@/domain/review/EngineeringReviewReport";
import type { Project } from "@/domain/project/Project";
import type { ValidationIssue } from "@/domain/validation/ValidationIssue";

export class EngineeringReviewService {
  create(
    project: Project,
    equipmentDefinitions: EquipmentDefinition[],
    validationIssues: ValidationIssue[],
    evidenceReport: DrawingEvidenceReport,
  ): EngineeringReviewReport {
    const findings = [
      this.createScenarioFinding(evidenceReport),
      this.createMinimalKitFinding(project, equipmentDefinitions),
      this.createLogicalConnectionsFinding(validationIssues),
      ...evidenceReport.structuredMissingData.map((gap) => this.createGapFinding(gap)),
    ];
    const manualCadActions = createCadManualActions(project, equipmentDefinitions, evidenceReport);
    const overallStatus = getOverallStatus(validationIssues, findings);

    return {
      id: `${project.id}_engineering_review`,
      title: "Инженерный review текущего проекта",
      overallStatus,
      summary: getSummary(overallStatus, findings),
      findings,
      manualCadActions,
    };
  }

  private createScenarioFinding(evidenceReport: DrawingEvidenceReport): EngineeringReviewFinding {
    const passport = evidenceReport.projectPassport;
    return {
      id: "review-scenario",
      title: "Сценарий объекта и исходные рамки",
      status: "confirmed_by_model",
      summary: `${String(passport.jurisdiction)}; ${String(passport.objectPlacement)}; ${String(passport.boilerPlantType)}; ${String(passport.totalHeatPowerKw)} кВт; график ${String(passport.designSupplyTemperatureC)}/${String(passport.designReturnTemperatureC)} °C.`,
      targetLabel: "Проект",
    };
  }

  private createMinimalKitFinding(project: Project, equipmentDefinitions: EquipmentDefinition[]): EngineeringReviewFinding {
    const missing = getMissingMinimalKit(project, equipmentDefinitions);
    if (missing.length === 0) {
      return {
        id: "review-minimal-kit",
        title: "Минимальный инженерный состав",
        status: "confirmed_by_model",
        summary: "В проекте есть котёл, коллекторы подачи/обратки и базовая запорная арматура для текущего демо-сценария.",
        targetLabel: "Состав проекта",
      };
    }

    return {
      id: "review-minimal-kit",
      title: "Минимальный инженерный состав",
      status: "requires_engineer",
      summary: `Для текущего сценария не хватает: ${missing.join(", ")}.`,
      targetLabel: "Состав проекта",
    };
  }

  private createLogicalConnectionsFinding(validationIssues: ValidationIssue[]): EngineeringReviewFinding {
    const connectionIssues = validationIssues.filter((issue) =>
      issue.ruleId === "missing_required_connection_target" || issue.ruleId === "ambiguous_connection",
    );
    if (connectionIssues.length === 0) {
      return {
        id: "review-logical-connections",
        title: "Логическая связность схемы",
        status: "confirmed_by_model",
        summary: "На текущем составе проект проходит базовую логическую проверку связи подачи и обратки.",
        targetLabel: "Схема соединений",
      };
    }

    return {
      id: "review-logical-connections",
      title: "Логическая связность схемы",
      status: "requires_engineer",
      summary: connectionIssues.map((issue) => issue.message).join(" / "),
      targetLabel: "Схема соединений",
    };
  }

  private createGapFinding(gap: DrawingEvidenceGap): EngineeringReviewFinding {
    return {
      id: `review-${gap.id}`,
      title: gap.text,
      status: mapGapToFindingStatus(gap),
      summary: gap.reason,
      targetLabel: `${gap.target.kind}:${gap.target.id}`,
    };
  }
}

export const formatEngineeringReviewReportText = (report: EngineeringReviewReport): string => {
  const lines = [
    report.title,
    "",
    `Итоговый статус: ${translateOverallStatus(report.overallStatus)}`,
    `Сводка: ${report.summary}`,
    "",
    "Результаты review",
    "",
    ...report.findings.flatMap((finding, index) => [
      `${index + 1}. ${finding.title}`,
      `   Статус: ${translateFindingStatus(finding.status)}`,
      `   Что это значит: ${finding.summary}`,
      `   К чему относится: ${finding.targetLabel}`,
      "",
    ]),
    "Ручные действия в CAD",
    "",
    ...report.manualCadActions.flatMap((action, index) => [
      `${index + 1}. ${action.title}`,
      `   Приоритет: ${translatePriority(action.priority)}`,
      `   Что сделать: ${action.details}`,
      "",
    ]),
  ];
  return `${lines.join("\n")}\n`;
};

const getMissingMinimalKit = (project: Project, equipmentDefinitions: EquipmentDefinition[]): string[] => {
  const findByCategory = (category: EquipmentDefinition["category"]) =>
    project.equipmentInstances.filter((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === category;
    });
  const findValveByType = (type: "supply" | "return" | "gas") =>
    project.equipmentInstances.some((instance) => {
      const definition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return definition?.category === "valve" && definition.connectionPoints.some((point) => point.type === type);
    });

  const missing: string[] = [];
  if (findByCategory("boiler").length === 0) missing.push("котёл");
  if (!project.equipmentInstances.some((instance) => instance.definitionId === "supply-header")) missing.push("коллектор подачи");
  if (!project.equipmentInstances.some((instance) => instance.definitionId === "return-header")) missing.push("коллектор обратки");
  if (!findValveByType("supply")) missing.push("кран подачи");
  if (!findValveByType("return")) missing.push("кран обратки");
  if (!findValveByType("gas")) missing.push("газовый кран");
  return missing;
};

const mapGapToFindingStatus = (gap: DrawingEvidenceGap): EngineeringReviewFindingStatus => {
  if (gap.answerStatus === "closed_from_model") return "confirmed_by_model";
  if (gap.topic === "connection_geometry") return "requires_document";
  if (gap.topic === "pipe_hydraulic_calculation") return "requires_calculation";
  if (gap.topic === "collector_applicability" || gap.topic === "valve_selection") return "requires_engineer";
  if (gap.answerStatus === "closed_from_source") return "confirmed_by_source";
  return "requires_engineer";
};

const createCadManualActions = (
  project: Project,
  equipmentDefinitions: EquipmentDefinition[],
  evidenceReport: DrawingEvidenceReport,
): CadManualAction[] => {
  const boilerDefinition = equipmentDefinitions.find((definition) => definition.id === "rgt-100-ksva-100");
  const supplyHeaderDefinition = equipmentDefinitions.find((definition) => definition.id === "supply-header");
  const returnHeaderDefinition = equipmentDefinitions.find((definition) => definition.id === "return-header");
  const boiler = project.equipmentInstances.find((instance) => instance.definitionId === "rgt-100-ksva-100");
  const supplyHeader = project.equipmentInstances.find((instance) => instance.definitionId === "supply-header");
  const returnHeader = project.equipmentInstances.find((instance) => instance.definitionId === "return-header");

  const actions: CadManualAction[] = [
    {
      id: "cad-room-dimensions",
      title: "Проставить габариты помещения",
      details: `Нанести общие размеры помещения ${project.room.widthMm} x ${project.room.lengthMm} мм и высоту ${project.room.heightMm ?? "не задана"} мм.`,
      priority: "required",
    },
    {
      id: "cad-equipment-anchors",
      title: "Проставить привязки оборудования к стенам",
      details: `Поставить линейные размеры от стен/осей до котла (${formatPosition(boiler)}) и коллекторов (${formatPosition(supplyHeader)}, ${formatPosition(returnHeader)}).`,
      priority: "required",
    },
    {
      id: "cad-equipment-sizes",
      title: "Проставить габариты оборудования",
      details: `Нанести габариты котла ${formatDimensions(boilerDefinition)} и коллекторов ${formatDimensions(supplyHeaderDefinition)} / ${formatDimensions(returnHeaderDefinition)}.`,
      priority: "required",
    },
    {
      id: "cad-nozzle-geometry",
      title: "Проверить и нанести координаты патрубков",
      details: "После сверки с заводскими чертежами котла и коллектора вручную поставить привязки патрубков и не использовать текущие условные координаты как окончательные.",
      priority: "required",
    },
    {
      id: "cad-dn-and-labels",
      title: "Проверить DN и подписи на листе",
      details: "Сверить и при необходимости руками довести подписи T1/T2 DN32, газ DN25, дымоход DN200, обозначения подачи/обратки и марки элементов.",
      priority: "required",
    },
    {
      id: "cad-valve-symbols",
      title: "Финально сверить условные обозначения арматуры",
      details: "Проверить условные знаки арматуры в CAD и вручную довести их до принятого оформления по действующей таблице условных обозначений.",
      priority: "recommended",
    },
    {
      id: "cad-route-annotations",
      title: "Добавить недостающие чертёжные размеры и примечания",
      details: "Вручную поставить размеры участков трасс, поясняющие выноски и примечания, которых нет в автоматическом preview листа.",
      priority: "recommended",
    },
  ];

  if (evidenceReport.structuredMissingData.some((gap) => gap.topic === "pipe_hydraulic_calculation" && gap.answerStatus === "unknown")) {
    actions.push({
      id: "cad-hydraulic-note",
      title: "Добавить пометку о неполном гидравлическом расчёте",
      details: "Перед выпуском листа в работу вручную проверить потери давления, подбор насоса и окончательные DN; текущий расчёт закрывает только расход и скорость.",
      priority: "required",
    });
  }

  return actions;
};

const getOverallStatus = (
  validationIssues: ValidationIssue[],
  findings: EngineeringReviewFinding[],
): EngineeringReviewOverallStatus => {
  const hasBlockingErrors = validationIssues.some((issue) => issue.severity === "error");
  const hasMissingKit = findings.some((finding) => finding.id === "review-minimal-kit" && finding.status === "requires_engineer");
  return hasBlockingErrors || hasMissingKit ? "blocked" : "ready_with_limitations";
};

const getSummary = (overallStatus: EngineeringReviewOverallStatus, findings: EngineeringReviewFinding[]): string => {
  const documents = findings.filter((finding) => finding.status === "requires_document").length;
  const calculations = findings.filter((finding) => finding.status === "requires_calculation").length;
  const engineers = findings.filter((finding) => finding.status === "requires_engineer").length;
  if (overallStatus === "blocked") {
    return `Проект нельзя считать готовым к передаче в CAD без доработки: документов ${documents}, расчётов ${calculations}, инженерных решений ${engineers}.`;
  }
  return `Проект можно передавать в CAD как предварительный лист с ограничениями: документов ${documents}, расчётов ${calculations}, инженерных решений ${engineers}.`;
};

const formatPosition = (instance: Project["equipmentInstances"][number] | undefined): string =>
  instance ? `${instance.label} @ (${instance.position.xMm}; ${instance.position.yMm}) мм` : "не размещено";

const formatDimensions = (definition: EquipmentDefinition | undefined): string =>
  definition ? `${definition.dimensionsMm.width} x ${definition.dimensionsMm.depth} x ${definition.dimensionsMm.height ?? "?"} мм` : "не задано";

const translateFindingStatus = (status: EngineeringReviewFindingStatus): string => {
  const labels: Record<EngineeringReviewFindingStatus, string> = {
    confirmed_by_model: "подтверждено моделью",
    confirmed_by_source: "подтверждено источником",
    requires_document: "нужен документ",
    requires_calculation: "нужен расчет",
    requires_engineer: "нужен инженер",
  };
  return labels[status];
};

const translateOverallStatus = (status: EngineeringReviewOverallStatus): string =>
  status === "blocked" ? "заблокировано до доработки" : "можно передать в CAD с ограничениями";

const translatePriority = (priority: CadManualAction["priority"]): string =>
  priority === "required" ? "обязательно" : "рекомендуется";
