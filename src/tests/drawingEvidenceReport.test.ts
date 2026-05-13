import { describe, expect, it } from "vitest";
import { BoilerRoomSheetDrawingService } from "@/infrastructure/drawing/BoilerRoomSheetDrawingService";
import { PilotDrawingEvidenceReportService } from "@/infrastructure/evidence/PilotDrawingEvidenceReportService";
import { typicalStandaloneBoilerRoomEvidenceDataset } from "@/infrastructure/evidence/typicalStandaloneBoilerRoomEvidence";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { definitions, makeProject } from "@/tests/testFixtures";

const context = { equipmentDefinitions: definitions };

describe("pilot drawing evidence report", () => {
  it("summarizes source status for equipment, pipes, valves, and drawing", () => {
    const project = makeProject();
    project.equipmentInstances = [
      { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
      { id: "inst_boiler_1", definitionId: "rgt-100-ksva-100", position: { xMm: 1550, yMm: 2850 }, rotationDeg: 0, label: "К1" },
      makeSupplyValve(),
    ];
    project.pipingRoutes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);

    const drawing = new BoilerRoomSheetDrawingService().create(project, definitions);
    const report = new PilotDrawingEvidenceReportService().create(
      drawing,
      project,
      definitions,
      typicalStandaloneBoilerRoomEvidenceDataset,
    );

    expect(report.status).toBe("review_required");
    expect(report.disclaimer).toContain("не подтверждает соответствие ГОСТ/СП");
    expect(report.sourceDocumentIds).toContain("src-rgt-100-500-passport");
    expect(report.sourceDocumentIds).toContain("src-stout-steel-manifold-dn32");
    expect(report.sourceDocumentIds).toContain("src-gost-3262-75");
    expect(report.sourceDocumentIds).toContain("src-dn-ball-valve-bv3232p");
    expect(report.items.some((item) => item.kind === "equipment" && item.label.includes("RGT-100"))).toBe(true);
    expect(report.items.some((item) => item.kind === "pipe" && item.label === "T1 DN32")).toBe(true);
    expect(report.items.some((item) => item.kind === "valve" && item.label.includes("DN32"))).toBe(true);
    expect(report.items.some((item) => item.kind === "calculation" && item.id === "calculation-calc-hydronic-flow")).toBe(true);
    expect(report.items.some((item) => item.kind === "calculation" && item.id === "calculation-calc-gas-velocity")).toBe(true);
    expect(report.items.some((item) => item.kind === "project" && item.id === "project-passport")).toBe(true);
    expect(report.items.every((item) => item.status === "review_required")).toBe(true);
    expect(report.projectPassport.jurisdiction).toBe("РФ");
    expect(report.projectPassport.circulationType).toBe("принудительная");
    expect(report.structuredMissingData.some((item) => item.id === "gap-boiler-geometry" && item.answerStatus === "unknown")).toBe(true);
    expect(report.structuredMissingData.some((item) => item.id === "gap-collector-applicability" && item.answerStatus === "closed_from_source")).toBe(true);
  });

  it("links report items back to evidence requirements and citations", () => {
    const project = makeProject();
    project.equipmentInstances.push(makeSupplyValve());
    const drawing = new BoilerRoomSheetDrawingService().create(project, definitions);
    const report = new PilotDrawingEvidenceReportService().create(
      drawing,
      project,
      definitions,
      typicalStandaloneBoilerRoomEvidenceDataset,
    );

    const pipeItem = report.items.find((item) => item.id === "pipe-pipe-vgp-dn32-supply");
    const calculationItem = report.items.find((item) => item.id === "calculation-calc-hydronic-flow");
    const drawingItem = report.items.find((item) => item.id === "drawing-pilot-sheet");

    expect(pipeItem?.requirementIds).toContain("req-pilot-pipe-spec-source-required");
    expect(pipeItem?.citationIds).toContain("cit-gost-3262-75-vgp-scope");
    expect(calculationItem?.facts.volumeFlowM3H).toBeCloseTo(4.26, 2);
    expect(drawingItem?.requirementIds).toEqual(expect.arrayContaining([
      "req-drawing-dn-labels-required",
      "req-valve-symbol-source-required",
    ]));
  });
});

const makeSupplyValve = () => ({
  id: "inst_valve_supply_1",
  definitionId: "ball-valve-dn32-supply",
  rotationDeg: 0 as const,
  label: "Кран T1",
  position: { xMm: 1800, yMm: 2500 },
});
