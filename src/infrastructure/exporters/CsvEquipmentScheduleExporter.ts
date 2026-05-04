import type { Exporter } from "@/domain/export/Exporter";
import type { Project } from "@/domain/project/Project";
import type { ExportContext } from "@/domain/export/Exporter";

const csvCell = (value: unknown): string => {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
};

export class CsvEquipmentScheduleExporter implements Exporter<string> {
  id = "csv-equipment-schedule-exporter";
  name = "CSV equipment schedule exporter";

  export(project: Project, context: ExportContext): string {
    const rows = [
      ["обозначение", "категория", "оборудование", "производитель", "модель", "widthMm", "depthMm", "heightMm", "источник"],
      ...project.equipmentInstances.map((instance) => {
        const definition = context.equipmentDefinitions.find((item) => item.id === instance.definitionId);
        return [
          instance.label,
          definition?.category,
          definition?.name,
          definition?.manufacturer,
          definition?.model,
          definition?.dimensionsMm.width,
          definition?.dimensionsMm.depth,
          definition?.dimensionsMm.height,
          definition?.source,
        ];
      }),
    ];
    return rows.map((row) => row.map(csvCell).join(",")).join("\n");
  }
}
