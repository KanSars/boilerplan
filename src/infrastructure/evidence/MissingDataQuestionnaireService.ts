import type {
  DrawingEvidenceReport,
  DrawingEvidenceReportItem,
  MissingDataQuestion,
  MissingDataQuestionnaire,
} from "@/domain/evidence";

export class MissingDataQuestionnaireService {
  create(report: DrawingEvidenceReport): MissingDataQuestionnaire {
    const fullReportQuestions = [
      ...report.missingData.map((item, index) => ({
        id: `missing-data-${index + 1}`,
        topic: classifyTopic(item),
        text: toQuestionText(item),
        reason: item,
        target: { kind: "drawing_element" as const, id: report.drawingId },
        status: "review_required" as const,
        answerStatus: "unknown" as const,
        suggestedAnswerFormat: guessAnswerFormat(item),
      })),
      ...report.items.flatMap((item) => createItemQuestions(item)),
    ];
    const grouped = groupQuestions(fullReportQuestions);
    const closedQuestions = grouped.filter((question) => question.answerStatus === "closed_from_model" || question.answerStatus === "closed_from_source");
    const questions = grouped.filter((question) => question.answerStatus !== "closed_from_model" && question.answerStatus !== "closed_from_source");

    return {
      id: `${report.id}_questions`,
      title: "Вопросы для закрытия перед инженерной проверкой",
      status: "review_required",
      questions,
      closedQuestions,
      fullReportQuestions,
    };
  }
}

export const formatMissingDataQuestionnaireText = (questionnaire: MissingDataQuestionnaire): string => {
  const openQuestions = questionnaire.questions;
  const closedQuestions = questionnaire.closedQuestions;
  const lines = [
    questionnaire.title,
    "",
    "Статус: требуется проверка",
    "Назначение: заполнить недостающие исходные данные. Это не подтверждение соответствия ГОСТ/СП.",
    "",
    "Нужно ответить",
    "",
    ...(openQuestions.length > 0 ? openQuestions.flatMap((question, index) => [
      `${index + 1}. ${question.text}`,
      `   Причина: ${question.reason}`,
      `   К чему относится: ${question.target.kind}:${question.target.id}`,
      `   Формат ответа: ${translateAnswerFormat(question.suggestedAnswerFormat)}`,
      "   Ответ:",
      "",
    ]) : ["Нет открытых вопросов.", ""]),
    "Закрыто автоматически",
    "",
    ...(closedQuestions.length > 0 ? closedQuestions.flatMap((question, index) => [
      `${index + 1}. ${question.text}`,
      `   Статус: ${translateAnswerStatus(question.answerStatus)}`,
      `   Основание: ${question.reason}`,
      `   К чему относится: ${question.target.kind}:${question.target.id}`,
      "",
    ]) : ["Нет автоматически закрытых вопросов.", ""]),
    "Полный отчет",
    "",
    ...questionnaire.fullReportQuestions.flatMap((question, index) => [
      `${index + 1}. [${translateTopic(question.topic)}] ${question.text}`,
      `   Статус: ${translateAnswerStatus(question.answerStatus)}`,
      `   Причина: ${question.reason}`,
      `   К чему относится: ${question.target.kind}:${question.target.id}`,
      "",
    ]),
  ];
  return `${lines.join("\n")}\n`;
};

const createItemQuestions = (item: DrawingEvidenceReportItem): MissingDataQuestion[] =>
  item.limitations.map((limitation, index) => ({
    id: `${item.id}-limitation-${index + 1}`,
    topic: classifyTopic(limitation),
    text: toQuestionText(limitation),
    reason: limitation,
    target: item.target,
    status: "review_required",
    answerStatus: resolveAnswerStatus(item, limitation),
    suggestedAnswerFormat: guessAnswerFormat(limitation),
  }));

const groupQuestions = (questions: MissingDataQuestion[]): MissingDataQuestion[] => {
  const byTopic = new Map<string, MissingDataQuestion[]>();
  for (const question of questions) {
    const key = getGroupKey(question);
    byTopic.set(key, [...(byTopic.get(key) ?? []), question]);
  }
  return Array.from(byTopic.entries()).map(([key, group]) => {
    const open = group.find((question) => question.answerStatus === "unknown");
    const base = open ?? group[0];
    return {
      ...base,
      id: `group-${key}`,
      reason: summarizeReasons(group),
      target: getGroupTarget(group),
      answerStatus: open ? "unknown" : getBestClosedStatus(group),
    };
  });
};

const getGroupKey = (question: MissingDataQuestion): string => {
  if (question.topic === "connection_geometry") return `${question.topic}:${question.target.kind}:${question.target.id}`;
  return question.topic;
};

const getGroupTarget = (questions: MissingDataQuestion[]): MissingDataQuestion["target"] => {
  const [first] = questions;
  if (questions.every((question) => question.target.kind === first.target.kind && question.target.id === first.target.id)) {
    return first.target;
  }
  return { kind: "project", id: "pilot-kit" };
};

const summarizeReasons = (questions: MissingDataQuestion[]): string =>
  unique(questions.map((question) => question.reason)).join(" / ");

const getBestClosedStatus = (questions: MissingDataQuestion[]): MissingDataQuestion["answerStatus"] =>
  questions.some((question) => question.answerStatus === "closed_from_model") ? "closed_from_model" : "closed_from_source";

const resolveAnswerStatus = (
  item: DrawingEvidenceReportItem,
  limitation: string,
): MissingDataQuestion["answerStatus"] => {
  const topic = classifyTopic(limitation);
  if (item.kind === "calculation" && item.facts.status === "calculated_review_required") return "closed_from_model";
  if (topic === "pipe_hydraulic_calculation" && hasPipeModelFacts(item)) return "closed_from_model";
  if (topic === "valve_selection" && hasSourceDocuments(item)) return "closed_from_source";
  if (topic === "standards_applicability" && hasSourceDocuments(item)) return "closed_from_source";
  return "unknown";
};

const hasPipeModelFacts = (item: DrawingEvidenceReportItem): boolean =>
  item.kind === "pipe" &&
  typeof item.facts.nominalDiameterMm === "number" &&
  typeof item.facts.material === "string" &&
  hasSourceDocuments(item);

const hasSourceDocuments = (item: DrawingEvidenceReportItem): boolean => item.sourceDocumentIds.length > 0;

const classifyTopic = (value: string): MissingDataQuestion["topic"] => {
  const lower = value.toLowerCase();
  if (lower.includes("координат") || lower.includes("габарит")) return "connection_geometry";
  if (lower.includes("коллектор") || lower.includes("применимость stout")) return "collector_applicability";
  if (lower.includes("гидравличес") || lower.includes("dn/тип труб") || lower.includes("потери давления") || lower.includes("насос")) return "pipe_hydraulic_calculation";
  if (lower.includes("газ")) return "gas_system_review";
  if (lower.includes("гост") || lower.includes("сп") || lower.includes("норматив")) return "standards_applicability";
  if (lower.includes("арматур")) return "valve_selection";
  return "standards_applicability";
};

const toQuestionText = (value: string): string => {
  const lower = value.toLowerCase();
  if (lower.includes("координат")) return "Подтверждены ли координаты патрубков по заводскому чертежу? Укажите документ/страницу или корректные координаты.";
  if (lower.includes("применимость")) return "Подтверждена ли применимость выбранного элемента к этой котельной? Укажите источник или комментарий инженера.";
  if (lower.includes("гидравличес")) return "Выполнен ли гидравлический расчет и подтверждены ли DN/тип труб?";
  if (lower.includes("газ")) return "Подтверждены ли требования и исходные данные по газовой части?";
  if (lower.includes("арматур")) return "Какая конкретная модель арматуры выбрана и подтверждена?";
  if (lower.includes("гост") || lower.includes("сп")) return "Какие нормативные документы и пункты применимы к этому случаю?";
  return value.endsWith("?") ? value : `${value} Что нужно указать для закрытия вопроса?`;
};

const guessAnswerFormat = (value: string): MissingDataQuestion["suggestedAnswerFormat"] => {
  const lower = value.toLowerCase();
  if (lower.includes("координат") || lower.includes("dn") || lower.includes("давлен")) return "document_reference";
  if (lower.includes("подтвержден") || lower.includes("есть ли")) return "yes_no";
  return "text";
};

const translateAnswerFormat = (format: MissingDataQuestion["suggestedAnswerFormat"]): string => {
  const labels: Record<MissingDataQuestion["suggestedAnswerFormat"], string> = {
    text: "текст",
    number: "число",
    yes_no: "да/нет + комментарий",
    document_reference: "документ/страница/пункт + комментарий",
  };
  return labels[format];
};

const translateAnswerStatus = (status: MissingDataQuestion["answerStatus"]): string => {
  const labels: Record<MissingDataQuestion["answerStatus"], string> = {
    unknown: "нужно ответить",
    closed_from_model: "закрыто из модели",
    closed_from_source: "закрыто источником",
    provided_by_user: "заполнено пользователем",
    provided_by_customer: "заполнено заказчиком",
    requires_engineer_review: "требуется инженерная проверка",
  };
  return labels[status];
};

const translateTopic = (topic: MissingDataQuestion["topic"]): string => {
  const labels: Record<MissingDataQuestion["topic"], string> = {
    connection_geometry: "геометрия подключений",
    collector_applicability: "применимость коллектора",
    pipe_hydraulic_calculation: "трубы и расчет",
    gas_system_review: "газовая часть",
    standards_applicability: "нормативная применимость",
    valve_selection: "арматура",
  };
  return labels[topic];
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));
