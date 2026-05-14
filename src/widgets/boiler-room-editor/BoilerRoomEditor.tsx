"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import { EquipmentDefinitionEditorPanel } from "@/features/boiler-room-editor/EquipmentDefinitionEditorPanel";
import { ExportPanel } from "@/features/boiler-room-editor/ExportPanel";
import { EquipmentCatalogPanel } from "@/features/boiler-room-editor/EquipmentCatalogPanel";
import { LayoutSvgEditor } from "@/features/boiler-room-editor/LayoutSvgEditor";
import { MissingQuestionsPanel } from "@/features/boiler-room-editor/MissingQuestionsPanel";
import { PrincipleSchematicView } from "@/features/boiler-room-editor/PrincipleSchematicView";
import { PropertiesPanel } from "@/features/boiler-room-editor/PropertiesPanel";
import { RoomSettingsPanel } from "@/features/boiler-room-editor/RoomSettingsPanel";
import { SheetDrawingPreview } from "@/features/boiler-room-editor/SheetDrawingPreview";
import { ValidationPanel } from "@/features/boiler-room-editor/ValidationPanel";
import { MockAiValidationExplainer } from "@/infrastructure/ai/MockAiValidationExplainer";
import { BoilerRoomSheetDrawingService } from "@/infrastructure/drawing/BoilerRoomSheetDrawingService";
import { MissingDataQuestionnaireService, formatMissingDataQuestionnaireText } from "@/infrastructure/evidence/MissingDataQuestionnaireService";
import { PilotDrawingEvidenceReportService } from "@/infrastructure/evidence/PilotDrawingEvidenceReportService";
import { typicalStandaloneBoilerRoomEvidenceDataset } from "@/infrastructure/evidence/typicalStandaloneBoilerRoomEvidence";
import { EngineeringSheetSvgExporter } from "@/infrastructure/exporters/EngineeringSheetSvgExporter";
import { CsvEquipmentScheduleExporter } from "@/infrastructure/exporters/CsvEquipmentScheduleExporter";
import { DxfProjectExporter } from "@/infrastructure/exporters/DxfProjectExporter";
import { JsonProjectExporter } from "@/infrastructure/exporters/JsonProjectExporter";
import { SvgProjectExporter } from "@/infrastructure/exporters/SvgProjectExporter";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { EngineeringReviewService, formatEngineeringReviewReportText } from "@/infrastructure/review/EngineeringReviewService";
import { downloadTextFile } from "@/lib/download";
import { createId } from "@/lib/ids";
import { resetEquipmentCatalogToMockDefaults, updateEquipmentDefinition } from "@/store/catalogSlice";
import {
  clearSelection,
  selectEquipmentDefinition,
  selectEquipmentInstance,
  setLayoutZoom,
  setSchematicZoom,
  setSheetZoom,
  setRightSidebarCollapsed,
  setViewLayout,
} from "@/store/editorSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addEquipmentInstance,
  deleteEquipmentInstance,
  setPipingRoutes,
  setProjectName,
  setRoom,
  updateEquipmentInstance,
} from "@/store/projectSlice";
import {
  selectProject,
  selectEditedEquipmentDefinition,
  selectEquipmentDefinitions,
  selectLayoutZoom,
  selectRightSidebarCollapsed,
  selectSchematicZoom,
  selectSheetZoom,
  selectSelectedEquipmentDefinition,
  selectSelectedEquipmentInstance,
  selectSelectedEquipmentInstanceId,
  selectSystemConnections,
  selectValidationIssues,
  selectViewLayout,
} from "@/store/selectors";

const pipeRouter = new SimpleOrthogonalPipeRouter();
const jsonExporter = new JsonProjectExporter();
const svgExporter = new SvgProjectExporter();
const sheetDrawingService = new BoilerRoomSheetDrawingService();
const sheetSvgExporter = new EngineeringSheetSvgExporter();
const csvExporter = new CsvEquipmentScheduleExporter();
const dxfExporter = new DxfProjectExporter();
const aiExplainer = new MockAiValidationExplainer();
const evidenceReportService = new PilotDrawingEvidenceReportService();
const missingDataQuestionnaireService = new MissingDataQuestionnaireService();
const engineeringReviewService = new EngineeringReviewService();

export function BoilerRoomEditor() {
  const dispatch = useAppDispatch();
  const [missingQuestionsOpen, setMissingQuestionsOpen] = useState(false);
  const project = useAppSelector(selectProject);
  const equipmentDefinitions = useAppSelector(selectEquipmentDefinitions);
  const editedDefinition = useAppSelector(selectEditedEquipmentDefinition);
  const selectedId = useAppSelector(selectSelectedEquipmentInstanceId);
  const selectedInstance = useAppSelector(selectSelectedEquipmentInstance);
  const selectedDefinition = useAppSelector(selectSelectedEquipmentDefinition);
  const validationIssues = useAppSelector(selectValidationIssues);
  const systemConnections = useAppSelector(selectSystemConnections);
  const viewLayout = useAppSelector(selectViewLayout);
  const layoutZoom = useAppSelector(selectLayoutZoom);
  const schematicZoom = useAppSelector(selectSchematicZoom);
  const sheetZoom = useAppSelector(selectSheetZoom);
  const rightSidebarCollapsed = useAppSelector(selectRightSidebarCollapsed);
  const projectWithValidation = useMemo(() => ({ ...project, validationIssues }), [project, validationIssues]);
  const exportContext = useMemo(() => ({ equipmentDefinitions }), [equipmentDefinitions]);
  const aiExplanation = useMemo(() => aiExplainer.explain(validationIssues), [validationIssues]);
  const sheetDrawing = useMemo(
    () => sheetDrawingService.create(projectWithValidation, equipmentDefinitions),
    [equipmentDefinitions, projectWithValidation],
  );
  const drawingEvidenceReport = useMemo(
    () => evidenceReportService.create(sheetDrawing, projectWithValidation, equipmentDefinitions, typicalStandaloneBoilerRoomEvidenceDataset),
    [equipmentDefinitions, projectWithValidation, sheetDrawing],
  );
  const missingDataQuestionnaire = useMemo(
    () => missingDataQuestionnaireService.create(drawingEvidenceReport),
    [drawingEvidenceReport],
  );
  const engineeringReviewReport = useMemo(
    () => engineeringReviewService.create(projectWithValidation, equipmentDefinitions, validationIssues, drawingEvidenceReport),
    [drawingEvidenceReport, equipmentDefinitions, projectWithValidation, validationIssues],
  );

  const deleteSelectedEquipment = useCallback(() => {
    if (!selectedId) return;
    dispatch(deleteEquipmentInstance(selectedId));
    dispatch(clearSelection());
  }, [dispatch, selectedId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (isTextInput || !selectedId) return;
      event.preventDefault();
      deleteSelectedEquipment();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedEquipment, selectedId]);

  const addEquipment = (definition: EquipmentDefinition) => {
    const sameDefinitionCount = project.equipmentInstances.filter((instance) => instance.definitionId === definition.id).length + 1;
    const boilerCount = project.equipmentInstances.filter((instance) => {
      const instanceDefinition = equipmentDefinitions.find((item) => item.id === instance.definitionId);
      return instanceDefinition?.category === "boiler";
    }).length + 1;
    const instance: EquipmentInstance = {
      id: createId("equipment"),
      definitionId: definition.id,
      position: { xMm: 900 + sameDefinitionCount * 350, yMm: definition.category === "header" ? 450 + sameDefinitionCount * 900 : 3000 + boilerCount * 350 },
      rotationDeg: 0,
      label: definition.category === "boiler" ? `B-${boilerCount}` : definition.category === "valve" ? `Кран ${sameDefinitionCount}` : `${definition.name} ${sameDefinitionCount}`,
    };
    dispatch(addEquipmentInstance(instance));
    dispatch(selectEquipmentInstance(instance.id));
  };

  const saveEquipmentDefinition = (definition: EquipmentDefinition) => {
    dispatch(updateEquipmentDefinition(definition));
    dispatch(setPipingRoutes([]));
  };

  const resetCatalog = () => {
    dispatch(resetEquipmentCatalogToMockDefaults());
    dispatch(setPipingRoutes([]));
  };

  return (
    <main className={`app-shell ${rightSidebarCollapsed ? "right-sidebar-collapsed" : ""}`}>
      <aside className="sidebar left-sidebar">
        <RoomSettingsPanel
          projectName={project.name}
          room={project.room}
          onProjectNameChange={(name) => dispatch(setProjectName(name))}
          onRoomChange={(room) => dispatch(setRoom(room))}
        />
        <EquipmentCatalogPanel
          definitions={equipmentDefinitions}
          onAddEquipment={addEquipment}
          onSelectDefinition={(definitionId) => dispatch(selectEquipmentDefinition(definitionId))}
        />
        <EquipmentDefinitionEditorPanel
          key={editedDefinition?.id ?? "no-definition"}
          definition={editedDefinition}
          onResetCatalog={resetCatalog}
          onSave={saveEquipmentDefinition}
        />
      </aside>

      <section className="workspace">
        <ExportPanel
          onGenerateRoutes={() => dispatch(setPipingRoutes(pipeRouter.generateRoutes(project, exportContext)))}
          onValidate={() => setMissingQuestionsOpen(true)}
          onExportJson={() => downloadTextFile("boiler-room-project.json", jsonExporter.export(projectWithValidation, exportContext), "application/json")}
          onExportSvg={() => downloadTextFile("boiler-room-layout.svg", svgExporter.export(projectWithValidation, exportContext), "image/svg+xml")}
          onExportSheetSvg={() => downloadTextFile("boiler-room-sheet.svg", sheetSvgExporter.export(sheetDrawing), "image/svg+xml")}
          onExportCsv={() => downloadTextFile("equipment-schedule.csv", csvExporter.export(projectWithValidation, exportContext), "text/csv")}
          onExportDxf={() => downloadTextFile("boiler-room-sheet.dxf", dxfExporter.export(projectWithValidation, exportContext), "application/dxf")}
          onExportReview={() => downloadTextFile("boiler-room-engineering-review.txt", formatEngineeringReviewReportText(engineeringReviewReport), "text/plain;charset=utf-8")}
          onToggleMissingQuestions={() => setMissingQuestionsOpen((open) => !open)}
          onExportMissingQuestions={() => downloadTextFile("boiler-room-open-questions.txt", formatMissingDataQuestionnaireText(missingDataQuestionnaire), "text/plain;charset=utf-8")}
          missingQuestionsOpen={missingQuestionsOpen}
          canExportMissingQuestions={missingDataQuestionnaire.questions.length > 0}
        />
        {missingQuestionsOpen && <MissingQuestionsPanel questionnaire={missingDataQuestionnaire} />}
        <div className="view-layout-toolbar" aria-label="Расположение инженерных видов">
          <span>Расположение экранов</span>
          <button
            className={viewLayout === "row" ? "active" : ""}
            type="button"
            onClick={() => dispatch(setViewLayout("row"))}
          >
            В линию
          </button>
          <button
            className={viewLayout === "column" ? "active" : ""}
            type="button"
            onClick={() => dispatch(setViewLayout("column"))}
          >
            Один под другим
          </button>
        </div>
        <div className={`engineering-views ${viewLayout === "column" ? "column" : "row"}`}>
          <section className="engineering-view">
            <ViewHeader
              title="План помещения"
              zoom={layoutZoom}
              onZoomOut={() => dispatch(setLayoutZoom(layoutZoom - 0.1))}
              onZoomIn={() => dispatch(setLayoutZoom(layoutZoom + 0.1))}
            />
            <LayoutSvgEditor
              project={projectWithValidation}
              definitions={equipmentDefinitions}
              selectedId={selectedId}
              validationIssues={validationIssues}
              zoom={layoutZoom}
              onSelect={(id) => dispatch(selectEquipmentInstance(id))}
              onMove={(id, position) => dispatch(updateEquipmentInstance({ id, patch: { position } }))}
            />
          </section>
          <section className="engineering-view">
            <ViewHeader
              title="Принципиальная схема"
              zoom={schematicZoom}
              onZoomOut={() => dispatch(setSchematicZoom(schematicZoom - 0.1))}
              onZoomIn={() => dispatch(setSchematicZoom(schematicZoom + 0.1))}
            />
            <PrincipleSchematicView
              equipmentInstances={project.equipmentInstances}
              definitions={equipmentDefinitions}
              systemConnections={systemConnections}
              zoom={schematicZoom}
            />
          </section>
          <section className="engineering-view sheet-engineering-view">
            <ViewHeader
              title="Чертёж / Предпросмотр листа"
              zoom={sheetZoom}
              onZoomOut={() => dispatch(setSheetZoom(sheetZoom - 0.1))}
              onZoomIn={() => dispatch(setSheetZoom(sheetZoom + 0.1))}
            />
            <SheetDrawingPreview drawing={sheetDrawing} zoom={sheetZoom} />
          </section>
        </div>
      </section>

      <aside className={`sidebar right-sidebar ${rightSidebarCollapsed ? "collapsed" : ""}`}>
        {rightSidebarCollapsed ? (
          <button
            className="sidebar-rail-button"
            type="button"
            aria-label="Показать панель выбранного объекта"
            title="Показать панель"
            onClick={() => dispatch(setRightSidebarCollapsed(false))}
          >
            <span>‹</span>
            <span>Панель</span>
          </button>
        ) : (
          <>
            <div className="right-sidebar-actions">
              <button
                className="sidebar-collapse-button"
                type="button"
                onClick={() => dispatch(setRightSidebarCollapsed(true))}
                aria-label="Свернуть панель выбранного объекта"
                title="Свернуть панель"
              >
                ›
              </button>
            </div>
            <PropertiesPanel
              selectedInstance={selectedInstance}
              selectedDefinition={selectedDefinition}
              onUpdateLabel={(label) => selectedId && dispatch(updateEquipmentInstance({ id: selectedId, patch: { label } }))}
              onRotate={() => {
                if (!selectedInstance) return;
                const rotations = [0, 90, 180, 270] as const;
                const next = rotations[(rotations.indexOf(selectedInstance.rotationDeg) + 1) % rotations.length];
                dispatch(updateEquipmentInstance({ id: selectedInstance.id, patch: { rotationDeg: next } }));
              }}
              onDelete={deleteSelectedEquipment}
            />
            <ValidationPanel issues={validationIssues} aiExplanation={aiExplanation} reviewReport={engineeringReviewReport} />
          </>
        )}
      </aside>
    </main>
  );
}

function ViewHeader({
  title,
  zoom,
  onZoomIn,
  onZoomOut,
}: {
  title: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="engineering-view-header">
      <h2>{title}</h2>
      <div className="zoom-toolbar" aria-label={`Масштаб: ${title}`}>
        <button type="button" onClick={onZoomOut} aria-label="Уменьшить масштаб">-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} aria-label="Увеличить масштаб">+</button>
      </div>
    </div>
  );
}
