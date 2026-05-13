import { describe, expect, it } from "vitest";
import type { DrawingEvidenceReport } from "@/domain/evidence";
import { MissingDataQuestionnaireService, formatMissingDataQuestionnaireText } from "@/infrastructure/evidence/MissingDataQuestionnaireService";

describe("missing data questionnaire", () => {
  it("turns evidence report gaps into questions for customer or engineer", () => {
    const report: DrawingEvidenceReport = {
      id: "report-1",
      drawingId: "drawing-1",
      title: "Pilot drawing report",
      status: "review_required",
      disclaimer: "not compliance",
      projectPassport: { jurisdiction: "РФ", boilerRoomType: "standalone_block" },
      sourceDocumentIds: [],
      items: [
        {
          id: "pipe-1",
          kind: "pipe",
          label: "T1 DN32",
          target: { kind: "drawing_element", id: "pilot-sheet-pipe-specs" },
          status: "review_required",
          sourceDocumentIds: ["src-gost-3262-75"],
          requirementIds: ["req-pilot-pipe-spec-source-required"],
          citationIds: ["cit-gost-3262-75-vgp-scope"],
          facts: { nominalDiameterMm: 32 },
          limitations: ["Pilot pipe spec не является гидравлическим расчетом."],
        },
      ],
      structuredMissingData: [
        {
          id: "gap-1",
          topic: "connection_geometry",
          text: "Подтверждены ли координаты патрубков по заводскому чертежу?",
          reason: "Координаты патрубков котла и коллекторов требуют сверки с заводскими чертежами.",
          target: { kind: "drawing_element", id: "drawing-1" },
          status: "review_required",
          answerStatus: "unknown",
          suggestedAnswerFormat: "document_reference",
        },
      ],
      missingData: [
        "Координаты патрубков котла и коллекторов требуют сверки с заводскими чертежами.",
      ],
    };

    const questionnaire = new MissingDataQuestionnaireService().create(report);
    const text = formatMissingDataQuestionnaireText(questionnaire);

    expect(questionnaire.questions.length).toBe(2);
    expect(questionnaire.closedQuestions).toEqual([]);
    expect(questionnaire.fullReportQuestions.length).toBe(2);
    expect(questionnaire.questions[0].text).toContain("координаты патрубков");
    expect(questionnaire.questions.every((question) => question.answerStatus === "unknown")).toBe(true);
    expect(text).toContain("Вопросы для закрытия");
    expect(text).toContain("Нужно ответить");
    expect(text).toContain("Паспорт текущего сценария");
    expect(text).toContain("Юрисдикция: РФ");
    expect(text).toContain("Полный отчет");
    expect(text).toContain("Ответ:");
    expect(text).toContain("не подтверждение соответствия ГОСТ/СП");
  });

  it("closes questions automatically when model facts and sources already answer them", () => {
    const report: DrawingEvidenceReport = {
      id: "report-2",
      drawingId: "drawing-2",
      title: "Pilot drawing report",
      status: "review_required",
      disclaimer: "not compliance",
      projectPassport: { jurisdiction: "РФ", boilerRoomType: "standalone_block" },
      sourceDocumentIds: [],
      items: [
        {
          id: "calculation-calc-hydronic-flow",
          kind: "calculation",
          label: "Расчет расхода теплоносителя и скорости T1/T2",
          target: { kind: "drawing_element", id: "calc-hydronic-flow" },
          status: "review_required",
          sourceDocumentIds: ["src-sp-89-13330-2016"],
          requirementIds: [],
          citationIds: [],
          facts: { status: "calculated_review_required", volumeFlowM3H: 4.26, velocityMS: 1.17 },
          limitations: ["Потери давления, насос, местные сопротивления, арматура и балансировка не рассчитаны."],
        },
        {
          id: "calculation-calc-gas-velocity",
          kind: "calculation",
          label: "Предварительная скорость газа в DN25",
          target: { kind: "drawing_element", id: "calc-gas-velocity" },
          status: "review_required",
          sourceDocumentIds: ["src-sp-89-13330-2016"],
          requirementIds: [],
          citationIds: [],
          facts: { status: "calculated_review_required", velocityMS: 5.78 },
          limitations: ["Это только расчет скорости по паспортному расходу газа, без расчета падения давления и без проверки требований газоснабжения."],
        },
        {
          id: "pipe-1",
          kind: "pipe",
          label: "T1 DN32",
          target: { kind: "drawing_element", id: "pilot-sheet-pipe-specs" },
          status: "review_required",
          sourceDocumentIds: ["src-gost-3262-75"],
          requirementIds: ["req-pilot-pipe-spec-source-required"],
          citationIds: ["cit-gost-3262-75-vgp-scope"],
          facts: { nominalDiameterMm: 32, material: "Стальная ВГП труба" },
          limitations: ["Pilot pipe spec не является гидравлическим расчетом или подтверждением применимости к газовой/тепломеханической части."],
        },
        {
          id: "valve-1",
          kind: "valve",
          label: "Запорная арматура T1 DN32",
          target: { kind: "drawing_element", id: "pilot-sheet-valve-specs" },
          status: "review_required",
          sourceDocumentIds: ["src-dn-ball-valve-bv3232p"],
          requirementIds: ["req-pilot-valve-spec-source-required"],
          citationIds: ["cit-dn-ball-valve-bv3232p-du32"],
          facts: { nominalDiameterMm: 32, valveType: "ball_valve" },
          limitations: ["Конкретная модель арматуры и ее применимость должны быть выбраны и проверены инженером."],
        },
      ],
      structuredMissingData: [],
      missingData: [],
    };

    const questionnaire = new MissingDataQuestionnaireService().create(report);
    const text = formatMissingDataQuestionnaireText(questionnaire);

    expect(questionnaire.questions).toEqual([]);
    expect(questionnaire.closedQuestions.map((question) => question.answerStatus)).toContain("closed_from_model");
    expect(questionnaire.closedQuestions.map((question) => question.answerStatus)).toContain("closed_from_source");
    expect(questionnaire.fullReportQuestions.some((question) => question.target.id === "calc-hydronic-flow")).toBe(true);
    expect(text).toContain("Закрыто автоматически");
    expect(text).toContain("закрыто из модели");
    expect(text).toContain("закрыто источником");
  });
});
