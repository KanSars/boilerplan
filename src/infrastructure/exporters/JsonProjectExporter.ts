import type { Exporter } from "@/domain/export/Exporter";
import type { Project } from "@/domain/project/Project";

export class JsonProjectExporter implements Exporter<string> {
  id = "json-project-exporter";
  name = "Project JSON exporter";

  export(project: Project): string {
    return JSON.stringify(project, null, 2);
  }
}
