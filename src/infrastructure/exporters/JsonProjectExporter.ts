import type { Exporter } from "@/domain/export/Exporter";
import type { ExportContext } from "@/domain/export/Exporter";
import type { Project } from "@/domain/project/Project";

export class JsonProjectExporter implements Exporter<string> {
  id = "json-project-exporter";
  name = "Project JSON exporter";

  export(project: Project, context?: ExportContext): string {
    const equipmentDefinitionsPreview = context?.equipmentDefinitions.map((definition) => ({
      id: definition.id,
      category: definition.category,
      name: definition.name,
      source: definition.source,
      connectionPoints: definition.connectionPoints,
    }));

    return JSON.stringify({
      ...project,
      ...(equipmentDefinitionsPreview ? { equipmentDefinitionsPreview } : {}),
    }, null, 2);
  }
}
