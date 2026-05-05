"use client";

type Props = {
  onGenerateRoutes: () => void;
  onValidate: () => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onExportSheetSvg: () => void;
  onExportCsv: () => void;
  onExportDxf: () => void;
  onToggleMissingQuestions: () => void;
  onExportMissingQuestions: () => void;
  missingQuestionsOpen: boolean;
  canExportMissingQuestions: boolean;
};

export function ExportPanel({
  onGenerateRoutes,
  onValidate,
  onExportJson,
  onExportSvg,
  onExportSheetSvg,
  onExportCsv,
  onExportDxf,
  onToggleMissingQuestions,
  onExportMissingQuestions,
  missingQuestionsOpen,
  canExportMissingQuestions,
}: Props) {
  return (
    <div className="action-bar">
      <button onClick={onGenerateRoutes}>Соединить автоматически</button>
      <button onClick={onValidate}>Проверить</button>
      <button className={missingQuestionsOpen ? "active" : ""} onClick={onToggleMissingQuestions}>Вопросы для закрытия</button>
      <button disabled={!canExportMissingQuestions} onClick={onExportMissingQuestions}>Выгрузить вопросы</button>
      <button onClick={onExportJson}>Экспорт JSON</button>
      <button onClick={onExportSvg}>Экспорт SVG плана</button>
      <button onClick={onExportSheetSvg}>Экспорт SVG листа</button>
      <button onClick={onExportCsv}>Экспорт CSV</button>
      <button onClick={onExportDxf}>Экспорт DXF</button>
    </div>
  );
}
