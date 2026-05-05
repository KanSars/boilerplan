import type { ExportContext, Exporter } from "@/domain/export/Exporter";
import type { Project } from "@/domain/project/Project";
import { BoilerRoomSheetDrawingService } from "@/infrastructure/drawing/BoilerRoomSheetDrawingService";
import { EngineeringDrawingToCadService } from "@/infrastructure/drawing/EngineeringDrawingToCadService";
import { AsciiDxfWriter } from "@/infrastructure/exporters/AsciiDxfWriter";

export class DxfProjectExporter implements Exporter<string> {
  id = "dxf-project-exporter";
  name = "DXF project exporter";
  private readonly sheetDrawing = new BoilerRoomSheetDrawingService();
  private readonly drawingToCad = new EngineeringDrawingToCadService();
  private readonly writer = new AsciiDxfWriter();

  export(project: Project, context: ExportContext): string {
    return this.writer.write(this.drawingToCad.convert(this.sheetDrawing.create(project, context.equipmentDefinitions)));
  }
}
