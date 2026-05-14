import { describe, expect, it } from "vitest";
import { BoilerRoomSheetDrawingService } from "@/infrastructure/drawing/BoilerRoomSheetDrawingService";
import { PilotDrawingEvidenceReportService } from "@/infrastructure/evidence/PilotDrawingEvidenceReportService";
import { typicalStandaloneBoilerRoomEvidenceDataset } from "@/infrastructure/evidence/typicalStandaloneBoilerRoomEvidence";
import { EngineeringReviewService, formatEngineeringReviewReportText } from "@/infrastructure/review/EngineeringReviewService";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import { definitions, makeProject } from "@/tests/testFixtures";

const validationEngine = new ValidationEngine(DemoInternalStandardsProfile);

describe("engineering review", () => {
  it("builds a review report with findings and CAD manual actions", () => {
    const project = makeProject();
    project.name = "Pilot";
    project.room = { widthMm: 6000, lengthMm: 4500, heightMm: 3000, origin: { xMm: 0, yMm: 0 } };
    project.equipmentInstances = [
      { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
      { id: "inst_boiler_1", definitionId: "rgt-100-ksva-100", position: { xMm: 1550, yMm: 2850 }, rotationDeg: 0, label: "К1" },
      { id: "inst_valve_supply_1", definitionId: "ball-valve-dn32-supply", position: { xMm: 1860, yMm: 2500 }, rotationDeg: 0, label: "Кран T1 DN32" },
      { id: "inst_valve_return_1", definitionId: "ball-valve-dn32-return", position: { xMm: 1680, yMm: 2600 }, rotationDeg: 0, label: "Кран T2 DN32" },
      { id: "inst_valve_gas_1", definitionId: "ball-valve-dn25-gas", position: { xMm: 1450, yMm: 3700 }, rotationDeg: 0, label: "Кран Г DN25" },
    ];
    project.metadata = {
      boilerRoomType: "standalone_block",
      fuelType: "natural_gas",
      totalHeatPowerKw: 99,
      heatCarrier: "water",
      circulationType: "принудительная",
      designSupplyTemperatureC: 80,
      designReturnTemperatureC: 60,
    };

    const validationIssues = validationEngine.validate(project, { equipmentDefinitions: definitions });
    const drawing = new BoilerRoomSheetDrawingService().create(project, definitions);
    const evidenceReport = new PilotDrawingEvidenceReportService().create(
      drawing,
      project,
      definitions,
      typicalStandaloneBoilerRoomEvidenceDataset,
    );
    const review = new EngineeringReviewService().create(project, definitions, validationIssues, evidenceReport);
    const text = formatEngineeringReviewReportText(review);

    expect(review.findings.some((finding) => finding.title.includes("Сценарий объекта"))).toBe(true);
    expect(review.findings.some((finding) => finding.status === "requires_document")).toBe(true);
    expect(review.findings.some((finding) => finding.status === "requires_calculation")).toBe(true);
    expect(review.manualCadActions.length).toBeGreaterThan(3);
    expect(text).toContain("Ручные действия в CAD");
    expect(text).toContain("координаты патрубков");
  });
});
