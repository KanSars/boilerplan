import { describe, expect, it } from "vitest";
import { BoilerRoomSheetDrawingService } from "@/infrastructure/drawing/BoilerRoomSheetDrawingService";
import { DrawingBoundsValidator } from "@/infrastructure/drawing/DrawingBoundsValidator";
import { EngineeringDrawingToCadService } from "@/infrastructure/drawing/EngineeringDrawingToCadService";
import { EngineeringSheetSvgExporter } from "@/infrastructure/exporters/EngineeringSheetSvgExporter";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { definitions, makeProject } from "@/tests/testFixtures";

const context = { equipmentDefinitions: definitions };

describe("pilot sheet drawing", () => {
  it("creates a printable A3 drawing with equipment, pipes, DN labels, and warning status", () => {
    const project = makeProject();
    project.equipmentInstances = [
      { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
      { id: "inst_boiler_1", definitionId: "rgt-100-ksva-100", position: { xMm: 1550, yMm: 2850 }, rotationDeg: 0, label: "К1" },
    ];
    project.pipingRoutes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);

    const drawing = new BoilerRoomSheetDrawingService().create(project, definitions);
    const text = drawing.entities
      .filter((entity) => entity.type === "text")
      .map((entity) => entity.value)
      .join(" ");

    expect(drawing.sheet.format).toBe("A3");
    expect(drawing.metadata.status).toBe("review_required");
    expect(drawing.viewports.some((viewport) => viewport.name === "schematic")).toBe(true);
    expect(text).toContain("Технологическая схема подключений");
    expect(text).toContain("DN32");
    expect(text).toContain("Дымоход DN200");
    expect(text).toContain("N=99 кВт");
    expect(text).toContain("src-rgt-100-500-passport");
    expect(drawing.entities.some((entity) => entity.layer === "VALVE_SYMBOL")).toBe(true);
  });

  it("drives schematic labels from equipment connection points and passport facts", () => {
    const pilotDefinitions = definitions.map((definition) => ({
      ...definition,
      metadata: definition.metadata ? { ...definition.metadata } : undefined,
      connectionPoints: definition.connectionPoints.map((point) => ({ ...point, position: { ...point.position } })),
    }));
    const boiler = pilotDefinitions.find((definition) => definition.id === "rgt-100-ksva-100");
    if (!boiler) throw new Error("Expected pilot boiler definition");
    boiler.connectionPoints = boiler.connectionPoints.map((point) =>
      point.id === "supply" ? { ...point, nominalDiameterMm: 40 } : point,
    );
    boiler.metadata = {
      ...boiler.metadata,
      extractedFacts: {
        nominalPowerKw: 123,
        fuelType: "natural_gas",
        gasPressureKpaMax: 4,
        flueDiameterMm: 210,
      },
    };

    const project = makeProject();
    project.equipmentInstances = [
      { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
      { id: "inst_boiler_1", definitionId: "rgt-100-ksva-100", position: { xMm: 1550, yMm: 2850 }, rotationDeg: 0, label: "К1" },
    ];

    const drawing = new BoilerRoomSheetDrawingService().create(project, pilotDefinitions);
    const text = drawing.entities
      .filter((entity) => entity.type === "text")
      .map((entity) => entity.value)
      .join(" ");

    expect(text).toContain("T1 DN40");
    expect(text).toContain("N=123 кВт");
    expect(text).toContain("p газа до 4 кПа");
  });

  it("keeps generated drawing entities inside the sheet and viewports", () => {
    const drawing = new BoilerRoomSheetDrawingService().create(makeProject(), definitions);
    const validator = new DrawingBoundsValidator();
    const schematicViewport = drawing.viewports.find((viewport) => viewport.name === "schematic");
    const planViewport = drawing.viewports.find((viewport) => viewport.name === "plan");
    if (!schematicViewport || !planViewport) throw new Error("Expected drawing viewports");

    const sheetIssues = validator.validateSheet(drawing);
    const schematicEntities = drawing.entities.filter((entity) => {
      if (entity.layer === "TITLE_BLOCK" || entity.layer === "SHEET_FRAME") return false;
      if (entity.type === "text" && entity.at.y >= 245) return false;
      if (entity.type === "text") return entity.at.x >= schematicViewport.x;
      if (entity.type === "rect") return entity.x >= schematicViewport.x;
      if (entity.type === "circle") return entity.center.x >= schematicViewport.x;
      return entity.points.some((point) => point.x >= schematicViewport.x);
    });
    const schematicIssues = validator.validateViewport(schematicEntities, schematicViewport);

    expect(sheetIssues).toEqual([]);
    expect(schematicIssues).toEqual([]);
  });

  it("exports the same sheet drawing to SVG and CAD primitives", () => {
    const drawing = new BoilerRoomSheetDrawingService().create(makeProject(), definitions);
    const svg = new EngineeringSheetSvgExporter().export(drawing);
    const cad = new EngineeringDrawingToCadService().convert(drawing);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("Пилотный чертеж");
    expect(cad.layers.some((layer) => layer.name === "SHEET_FRAME")).toBe(true);
    expect(cad.layers.some((layer) => layer.name === "ME_VALVE")).toBe(true);
    expect(cad.entities.some((entity) => entity.type === "line")).toBe(true);
    expect(cad.entities.some((entity) => entity.type === "text" && entity.value.includes("DN"))).toBe(true);
  });
});
