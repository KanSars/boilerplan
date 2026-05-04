"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import { ExportPanel } from "@/features/boiler-room-editor/ExportPanel";
import { EquipmentCatalogPanel } from "@/features/boiler-room-editor/EquipmentCatalogPanel";
import { LayoutSvgEditor } from "@/features/boiler-room-editor/LayoutSvgEditor";
import { PrincipleSchematicView } from "@/features/boiler-room-editor/PrincipleSchematicView";
import { PropertiesPanel } from "@/features/boiler-room-editor/PropertiesPanel";
import { RoomSettingsPanel } from "@/features/boiler-room-editor/RoomSettingsPanel";
import { ValidationPanel } from "@/features/boiler-room-editor/ValidationPanel";
import { MockAiValidationExplainer } from "@/infrastructure/ai/MockAiValidationExplainer";
import { CsvEquipmentScheduleExporter } from "@/infrastructure/exporters/CsvEquipmentScheduleExporter";
import { JsonProjectExporter } from "@/infrastructure/exporters/JsonProjectExporter";
import { SvgProjectExporter } from "@/infrastructure/exporters/SvgProjectExporter";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { downloadTextFile } from "@/lib/download";
import { createId } from "@/lib/ids";
import { equipmentDefinitions } from "@/shared/config/equipmentDefinitions";
import { clearSelection, selectEquipmentInstance, setViewLayout } from "@/store/editorSlice";
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
const csvExporter = new CsvEquipmentScheduleExporter();
const aiExplainer = new MockAiValidationExplainer();
const exportContext = { equipmentDefinitions };

export function BoilerRoomEditor() {
  const dispatch = useAppDispatch();
  const project = useAppSelector(selectProject);
  const selectedId = useAppSelector(selectSelectedEquipmentInstanceId);
  const selectedInstance = useAppSelector(selectSelectedEquipmentInstance);
  const selectedDefinition = useAppSelector(selectSelectedEquipmentDefinition);
  const validationIssues = useAppSelector(selectValidationIssues);
  const systemConnections = useAppSelector(selectSystemConnections);
  const viewLayout = useAppSelector(selectViewLayout);
  const projectWithValidation = useMemo(() => ({ ...project, validationIssues }), [project, validationIssues]);
  const aiExplanation = useMemo(() => aiExplainer.explain(validationIssues), [validationIssues]);

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
      label: definition.category === "boiler" ? `B-${boilerCount}` : `${definition.name} ${sameDefinitionCount}`,
    };
    dispatch(addEquipmentInstance(instance));
    dispatch(selectEquipmentInstance(instance.id));
  };

  return (
    <main className="app-shell">
      <aside className="sidebar left-sidebar">
        <RoomSettingsPanel
          projectName={project.name}
          room={project.room}
          onProjectNameChange={(name) => dispatch(setProjectName(name))}
          onRoomChange={(room) => dispatch(setRoom(room))}
        />
        <EquipmentCatalogPanel definitions={equipmentDefinitions} onAddEquipment={addEquipment} />
      </aside>

      <section className="workspace">
        <ExportPanel
          onGenerateRoutes={() => dispatch(setPipingRoutes(pipeRouter.generateRoutes(project, exportContext)))}
          onValidate={() => undefined}
          onExportJson={() => downloadTextFile("boiler-room-project.json", jsonExporter.export(projectWithValidation, exportContext), "application/json")}
          onExportSvg={() => downloadTextFile("boiler-room-layout.svg", svgExporter.export(projectWithValidation, exportContext), "image/svg+xml")}
          onExportCsv={() => downloadTextFile("equipment-schedule.csv", csvExporter.export(projectWithValidation, exportContext), "text/csv")}
        />
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
            <h2>План помещения</h2>
            <LayoutSvgEditor
              project={projectWithValidation}
              definitions={equipmentDefinitions}
              selectedId={selectedId}
              validationIssues={validationIssues}
              onSelect={(id) => dispatch(selectEquipmentInstance(id))}
              onMove={(id, position) => dispatch(updateEquipmentInstance({ id, patch: { position } }))}
            />
          </section>
          <section className="engineering-view">
            <h2>Принципиальная схема</h2>
            <PrincipleSchematicView
              equipmentInstances={project.equipmentInstances}
              definitions={equipmentDefinitions}
              systemConnections={systemConnections}
            />
          </section>
        </div>
      </section>

      <aside className="sidebar right-sidebar">
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
        <ValidationPanel issues={validationIssues} aiExplanation={aiExplanation} />
      </aside>
    </main>
  );
}
