import { getEquipmentBodyRect, getEquipmentClearanceRect } from "@/domain/geometry/rectangles";
import { transformConnectionPoint } from "@/domain/geometry/transforms";
import type { Exporter } from "@/domain/export/Exporter";
import type { ExportContext } from "@/domain/export/Exporter";
import type { Project } from "@/domain/project/Project";

export class SvgProjectExporter implements Exporter<string> {
  id = "svg-project-exporter";
  name = "SVG project exporter";

  export(project: Project, context: ExportContext): string {
    const margin = 250;
    const viewBox = `${-margin} ${-margin} ${project.room.widthMm + margin * 2} ${project.room.lengthMm + margin * 2}`;
    const equipment = project.equipmentInstances.map((instance) => {
      const definition = context.equipmentDefinitions.find((item) => item.id === instance.definitionId);
      if (!definition) return "";
      const body = getEquipmentBodyRect(instance, definition);
      const clearance = getEquipmentClearanceRect(instance, definition);
      const points = definition.connectionPoints.map((point) => {
        const world = transformConnectionPoint(instance, definition, point);
        return `<circle cx="${world.xMm}" cy="${world.yMm}" r="45" fill="#ffffff" stroke="#111827" stroke-width="18"><title>${point.type}</title></circle>`;
      }).join("");
      return `<g data-equipment-id="${instance.id}">
  <rect x="${clearance.xMm}" y="${clearance.yMm}" width="${clearance.widthMm}" height="${clearance.depthMm}" fill="#fef3c7" stroke="#f59e0b" stroke-width="14" stroke-dasharray="70 45"/>
  <rect x="${body.xMm}" y="${body.yMm}" width="${body.widthMm}" height="${body.depthMm}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="20"/>
  <text x="${body.xMm + 80}" y="${body.yMm + 150}" font-family="Arial" font-size="150" fill="#111827">${escapeXml(instance.label)}</text>
  ${points}
</g>`;
    }).join("\n");

    const routes = project.pipingRoutes.map((route) => {
      const points = route.polylinePoints.map((point) => `${point.xMm},${point.yMm}`).join(" ");
      const color = route.systemType === "supply" ? "#dc2626" : "#2563eb";
      const dash = route.systemType === "return" ? "120 70" : "";
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="45" stroke-linecap="round" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ""}><title>${route.systemType} - ${route.calculationStatus}</title></polyline>`;
    }).join("\n");

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${escapeXml(project.name)}: план котельной">
  <rect x="${project.room.origin.xMm}" y="${project.room.origin.yMm}" width="${project.room.widthMm}" height="${project.room.lengthMm}" fill="#ffffff" stroke="#111827" stroke-width="30"/>
  ${routes}
  ${equipment}
</svg>`;
  }
}

const escapeXml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
