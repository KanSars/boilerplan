import { describe, expect, it } from "vitest";
import { BoilerRoomSheetDrawingService } from "@/infrastructure/drawing/BoilerRoomSheetDrawingService";
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
    expect(text).toContain("Технологическая схема подключений");
    expect(text).toContain("DN32");
    expect(text).toContain("Дымоход DN200");
    expect(drawing.entities.some((entity) => entity.layer === "VALVE_SYMBOL")).toBe(true);
  });

  it("exports the same sheet drawing to SVG and CAD primitives", () => {
    const drawing = new BoilerRoomSheetDrawingService().create(makeProject(), definitions);
    const svg = new EngineeringSheetSvgExporter().export(drawing);
    const cad = new EngineeringDrawingToCadService().convert(drawing);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("Пилотный чертеж");
    expect(cad.layers.some((layer) => layer.name === "SHEET_FRAME")).toBe(true);
    expect(cad.layers.some((layer) => layer.name === "ME_VALVE")).toBe(true);
    expect(cad.entities.some((entity) => entity.type === "text" && entity.value.includes("DN"))).toBe(true);
  });
});
