import type { EngineeringDrawing } from "@/domain/drawing";

export class EngineeringSheetSvgExporter {
  export(drawing: EngineeringDrawing): string {
    const layerByName = new Map(drawing.layers.map((layer) => [layer.name, layer]));
    const entities = drawing.entities.map((entity) => {
      const layer = layerByName.get(entity.layer);
      const stroke = layer?.stroke ?? "#111827";
      const fill = entity.type === "text"
        ? layer?.fill ?? stroke
        : "fill" in entity && entity.fill !== undefined
          ? entity.fill
          : layer?.fill ?? "none";
      const dash = layer?.lineType === "dashed" ? " stroke-dasharray=\"3 2\"" : layer?.lineType === "dashdot" ? " stroke-dasharray=\"5 2 1 2\"" : "";
      if (entity.type === "rect") {
        return `<rect x="${entity.x}" y="${entity.y}" width="${entity.width}" height="${entity.height}" stroke="${stroke}" fill="${fill}" stroke-width="${layer?.strokeWidth ?? 0.25}"${dash}/>`;
      }
      if (entity.type === "circle") {
        return `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.radius}" stroke="${stroke}" fill="${fill}" stroke-width="${layer?.strokeWidth ?? 0.25}"${dash}/>`;
      }
      if (entity.type === "polyline") {
        const points = entity.points.map((point) => `${point.x},${point.y}`).join(" ");
        const tag = entity.closed ? "polygon" : "polyline";
        return `<${tag} points="${points}" stroke="${stroke}" fill="${entity.closed ? fill : "none"}" stroke-width="${layer?.strokeWidth ?? 0.25}"${dash}/>`;
      }
      return `<text x="${entity.at.x}" y="${entity.at.y}" font-size="${entity.height}" text-anchor="${anchor(entity.align)}" font-weight="${entity.weight ?? "normal"}" fill="${fill}">${escapeXml(entity.value)}</text>`;
    }).join("\n  ");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${drawing.sheet.width}mm" height="${drawing.sheet.height}mm" viewBox="0 0 ${drawing.sheet.width} ${drawing.sheet.height}">
  <rect x="0" y="0" width="${drawing.sheet.width}" height="${drawing.sheet.height}" fill="#ffffff"/>
  ${entities}
</svg>`;
  }
}

const anchor = (align: "start" | "middle" | "end" | undefined): string =>
  align === "middle" ? "middle" : align === "end" ? "end" : "start";

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
