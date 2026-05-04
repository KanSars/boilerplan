"use client";

type Props = {
  onGenerateRoutes: () => void;
  onValidate: () => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onExportCsv: () => void;
};

export function ExportPanel({ onGenerateRoutes, onValidate, onExportJson, onExportSvg, onExportCsv }: Props) {
  return (
    <div className="action-bar">
      <button onClick={onGenerateRoutes}>Соединить автоматически</button>
      <button onClick={onValidate}>Проверить</button>
      <button onClick={onExportJson}>Экспорт JSON</button>
      <button onClick={onExportSvg}>Экспорт SVG</button>
      <button onClick={onExportCsv}>Экспорт CSV</button>
    </div>
  );
}
