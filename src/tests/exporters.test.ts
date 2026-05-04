import { describe, expect, it } from "vitest";
import { CsvEquipmentScheduleExporter } from "@/infrastructure/exporters/CsvEquipmentScheduleExporter";
import { JsonProjectExporter } from "@/infrastructure/exporters/JsonProjectExporter";
import { SvgProjectExporter } from "@/infrastructure/exporters/SvgProjectExporter";
import { definitions, makeProject } from "@/tests/testFixtures";

const context = { equipmentDefinitions: definitions };

describe("exporters", () => {
  it("returns valid project JSON", () => {
    const output = new JsonProjectExporter().export(makeProject(), context);
    expect(JSON.parse(output).id).toBe("test-project");
    expect(JSON.parse(output).equipmentDefinitionsPreview[0].connectionPoints.length).toBeGreaterThan(0);
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
});
