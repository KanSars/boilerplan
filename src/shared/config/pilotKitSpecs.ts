export type PilotPipeSpec = {
  id: string;
  system: "supply" | "return" | "gas" | "flue";
  label: string;
  nominalDiameterMm: number;
  outerDiameterMm?: number;
  wallThicknessMm?: number;
  material: string;
  sourceDocumentId: string;
  reviewStatus: "review_required";
};

export const pilotPipeSpecs: PilotPipeSpec[] = [
  {
    id: "pipe-vgp-dn32-supply",
    system: "supply",
    label: "T1",
    nominalDiameterMm: 32,
    outerDiameterMm: 42.3,
    wallThicknessMm: 3.2,
    material: "Стальная ВГП труба",
    sourceDocumentId: "src-gost-3262-75",
    reviewStatus: "review_required",
  },
  {
    id: "pipe-vgp-dn32-return",
    system: "return",
    label: "T2",
    nominalDiameterMm: 32,
    outerDiameterMm: 42.3,
    wallThicknessMm: 3.2,
    material: "Стальная ВГП труба",
    sourceDocumentId: "src-gost-3262-75",
    reviewStatus: "review_required",
  },
  {
    id: "pipe-vgp-dn25-gas",
    system: "gas",
    label: "Г",
    nominalDiameterMm: 25,
    outerDiameterMm: 33.5,
    wallThicknessMm: 3.2,
    material: "Стальная ВГП труба",
    sourceDocumentId: "src-gost-3262-75",
    reviewStatus: "review_required",
  },
  {
    id: "flue-dn200-rgt",
    system: "flue",
    label: "Дымоход",
    nominalDiameterMm: 200,
    material: "Дымоходный канал по паспорту котла",
    sourceDocumentId: "src-rgt-100-500-passport",
    reviewStatus: "review_required",
  },
];
