import type { ExportContext, Exporter } from "@/domain/export/Exporter";
import type { Project } from "@/domain/project/Project";
import { LayoutToCadDrawingService } from "@/infrastructure/cad/LayoutToCadDrawingService";
import { AsciiDxfWriter } from "@/infrastructure/exporters/AsciiDxfWriter";

export class DxfProjectExporter implements Exporter<string> {
  id = "dxf-project-exporter";
  name = "DXF project exporter";
  private readonly layoutToCad = new LayoutToCadDrawingService();
  private readonly writer = new AsciiDxfWriter();

  export(project: Project, context: ExportContext): string {
    return this.writer.write(this.layoutToCad.create(project, context.equipmentDefinitions));
  }
}
