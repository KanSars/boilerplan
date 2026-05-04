import type {
  CompiledRule,
  EvidenceLink,
  Requirement,
  RuleEvaluation,
  SourceDocument,
} from "@/domain/evidence";

export const demoSourceDocuments: SourceDocument[] = [
  {
    id: "demo-source-boiler-clearance",
    kind: "demo",
    title: "Demo source for evidence model shape",
    version: "v0-demo",
    language: "ru",
    status: "review_required",
    notes: "Фиктивный источник только для проверки формы данных. Не является ГОСТ, СП или паспортом производителя.",
  },
];

export const demoRequirements: Requirement[] = [
  {
    id: "demo-req-boiler-front-clearance",
    title: "Demo: минимальная зона обслуживания перед котлом",
    text: "Фиктивное требование: перед demo-котлом должна быть зона обслуживания не менее 1000 мм.",
    category: "demo",
    status: "review_required",
    extractionMethod: "demo_fixture",
    confidence: 0,
    citations: [
      {
        id: "demo-citation-boiler-front-clearance",
        sourceDocumentId: "demo-source-boiler-clearance",
        section: "Demo section",
        clause: "Demo clause 1",
        quote: "Фиктивная цитата для тестирования evidence model.",
      },
    ],
    applicability: [
      {
        id: "demo-applicability-boiler-definition",
        subject: "equipment_definition",
        fieldPath: "category",
        operator: "equals",
        value: "boiler",
        description: "Применяется к demo-карточкам оборудования категории boiler.",
      },
    ],
    notes: "Не использовать как инженерное правило. Это только fixture для будущего pipeline документов.",
  },
];

export const demoCompiledRules: CompiledRule[] = [
  {
    id: "demo-rule-boiler-front-clearance",
    requirementId: "demo-req-boiler-front-clearance",
    kind: "minimum_distance",
    status: "review_required",
    severity: "warning",
    parameters: {
      distanceMm: 1000,
      direction: "front",
    },
    description: "Фиктивное правило для проверки связи Requirement -> CompiledRule.",
  },
];

export const demoRuleEvaluations: RuleEvaluation[] = [
  {
    id: "demo-evaluation-b1-front-clearance",
    compiledRuleId: "demo-rule-boiler-front-clearance",
    requirementId: "demo-req-boiler-front-clearance",
    outcome: "manual_review_required",
    severity: "warning",
    status: "review_required",
    target: {
      kind: "equipment_instance",
      id: "b1",
    },
    message: "Demo evaluation требует ручной проверки и не подтверждает нормативное соответствие.",
    citationIds: ["demo-citation-boiler-front-clearance"],
  },
];

export const demoEvidenceLinks: EvidenceLink[] = [
  {
    id: "demo-evidence-link-b1-front-clearance",
    target: {
      kind: "equipment_instance",
      id: "b1",
    },
    requirementId: "demo-req-boiler-front-clearance",
    citationIds: ["demo-citation-boiler-front-clearance"],
    relation: "requires_review",
    status: "review_required",
    note: "Фиктивная связь элемента проекта с demo requirement.",
  },
];
