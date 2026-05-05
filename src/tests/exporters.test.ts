import { describe, expect, it } from "vitest";
import { CsvEquipmentScheduleExporter } from "@/infrastructure/exporters/CsvEquipmentScheduleExporter";
import { DxfProjectExporter } from "@/infrastructure/exporters/DxfProjectExporter";
import { JsonProjectExporter } from "@/infrastructure/exporters/JsonProjectExporter";
import { SvgProjectExporter } from "@/infrastructure/exporters/SvgProjectExporter";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { definitions, makeProject } from "@/tests/testFixtures";

const context = { equipmentDefinitions: definitions };

describe("exporters", () => {
  it("returns valid project JSON", () => {
    const output = new JsonProjectExporter().export(makeProject(), context);
    expect(JSON.parse(output).id).toBe("test-project");
    expect(JSON.parse(output).catalogSnapshot[0].connectionPoints.length).toBeGreaterThan(0);
  });

  it("includes equipment rows in CSV", () => {
    const output = new CsvEquipmentScheduleExporter().export(makeProject(), context);
    expect(output).toContain("\"B-1\"");
    expect(output).toContain("\"Котёл 250 кВт\"");
  });

  it("returns an SVG string", () => {
    const output = new SvgProjectExporter().export(makeProject(), context);
    expect(output.startsWith("<svg")).toBe(true);
    expect(output).toContain("B-1");
  });

  it("returns an AutoCAD 2000 ASCII DXF with printable sheet CAD layers and entities", () => {
    const project = makeProject();
    project.equipmentInstances.push(
      { id: "supply-header", definitionId: "supply-header", position: { xMm: 500, yMm: 3000 }, rotationDeg: 0, label: "Коллектор подачи" },
      { id: "return-header", definitionId: "return-header", position: { xMm: 500, yMm: 3500 }, rotationDeg: 0, label: "Коллектор обратки" },
    );
    project.pipingRoutes = new SimpleOrthogonalPipeRouter().generateRoutes(project, context);

    const output = new DxfProjectExporter().export(project, context);
    expect(output).toContain("$ACADVER");
    expect(output).toContain("AC1015");
    expect(output).toContain("SHEET_FRAME");
    expect(output).toContain("TITLE_BLOCK");
    expect(output).toContain("ME_EQ_BODY");
    expect(output).toContain("ME_CONN_POINT");
    expect(output).toContain("ME_PIPE_SUPPLY");
    expect(output).toContain("ME_PIPE_RETURN");
    expect(output).toContain("ME_VALVE");
    expect(output).toContain("LWPOLYLINE");
    expect(output).toContain("CIRCLE");
    expect(output).toContain("TEXT");
    expect(output).toContain("AcDbPolyline");
    expect(output).toContain("AcDbCircle");
    expect(output).toContain("AcDbText");
    expect(output).toContain("\\U+043F\\U+0440\\U+0435");
    expect(output).toContain("\r\n");
  });

  it("exports the A3 sheet into CAD orientation in DXF export", () => {
    const output = new DxfProjectExporter().export(makeProject(), context);
    expect(output).toContain("292");
  });
});
