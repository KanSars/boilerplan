"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";
import type { Project } from "@/domain/project/Project";
import { removeEquipmentInstance } from "@/domain/project/removeEquipmentInstance";
import { ValidationEngine } from "@/domain/validation/ValidationEngine";
import { ExportPanel } from "@/features/boiler-room-editor/ExportPanel";
import { EquipmentCatalogPanel } from "@/features/boiler-room-editor/EquipmentCatalogPanel";
import { LayoutSvgEditor } from "@/features/boiler-room-editor/LayoutSvgEditor";
import { PropertiesPanel } from "@/features/boiler-room-editor/PropertiesPanel";
import { RoomSettingsPanel } from "@/features/boiler-room-editor/RoomSettingsPanel";
import { ValidationPanel } from "@/features/boiler-room-editor/ValidationPanel";
import { MockAiValidationExplainer } from "@/infrastructure/ai/MockAiValidationExplainer";
import { MockEquipmentCatalog } from "@/infrastructure/equipment-catalogs/MockEquipmentCatalog";
import { CsvEquipmentScheduleExporter } from "@/infrastructure/exporters/CsvEquipmentScheduleExporter";
import { JsonProjectExporter } from "@/infrastructure/exporters/JsonProjectExporter";
import { SvgProjectExporter } from "@/infrastructure/exporters/SvgProjectExporter";
import { SimpleOrthogonalPipeRouter } from "@/infrastructure/piping/SimpleOrthogonalPipeRouter";
import { DemoInternalStandardsProfile } from "@/infrastructure/standards/DemoInternalStandardsProfile";
import { downloadTextFile } from "@/lib/download";
import { createId } from "@/lib/ids";

const catalog = new MockEquipmentCatalog();
const equipmentDefinitions = catalog.listDefinitions();
const validationEngine = new ValidationEngine(DemoInternalStandardsProfile);
const pipeRouter = new SimpleOrthogonalPipeRouter();
const jsonExporter = new JsonProjectExporter();
const svgExporter = new SvgProjectExporter();
const csvExporter = new CsvEquipmentScheduleExporter();
const aiExplainer = new MockAiValidationExplainer();

const createInitialProject = (): Project => ({
  id: "project_v0",
  name: "Котельная v0",
  units: "mm",
  room: { widthMm: 8000, lengthMm: 6000, heightMm: 3000, origin: { xMm: 0, yMm: 0 } },
  equipmentInstances: [
    { id: "inst_supply_header", definitionId: "supply-header", position: { xMm: 900, yMm: 700 }, rotationDeg: 0, label: "Коллектор подачи" },
    { id: "inst_return_header", definitionId: "return-header", position: { xMm: 900, yMm: 1250 }, rotationDeg: 0, label: "Коллектор обратки" },
    { id: "inst_boiler_1", definitionId: "boiler-250kw", position: { xMm: 1400, yMm: 3300 }, rotationDeg: 0, label: "B-1" },
  ],
  pipingRoutes: [],
  validationIssues: [],
  metadata: { version: "v0", catalog: "mock" },
});

export function BoilerRoomEditor() {
  const [project, setProject] = useState<Project>(() => {
    const initial = createInitialProject();
    return { ...initial, validationIssues: validationEngine.validate(initial, { equipmentDefinitions }) };
  });
  const [selectedId, setSelectedId] = useState<string>("inst_boiler_1");

  const selectedInstance = project.equipmentInstances.find((instance) => instance.id === selectedId);
  const selectedDefinition = selectedInstance
    ? equipmentDefinitions.find((definition) => definition.id === selectedInstance.definitionId)
    : undefined;
  const aiExplanation = useMemo(() => aiExplainer.explain(project.validationIssues), [project.validationIssues]);

  const updateProject = (next: Project) => {
    const validationIssues = validationEngine.validate(next, { equipmentDefinitions });
    setProject({ ...next, validationIssues });
  };

  const deleteSelectedEquipment = useCallback(() => {
    if (!selectedId) return;
    updateProject(removeEquipmentInstance(project, selectedId));
    setSelectedId("");
  }, [project, selectedId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (isTextInput) return;
      if (!selectedId) return;
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
      position: { xMm: 900 + sameDefinitionCount * 350, yMm: definition.category === "header" ? 550 + sameDefinitionCount * 500 : 3000 + boilerCount * 350 },
      rotationDeg: 0,
      label: definition.category === "boiler" ? `B-${boilerCount}` : `${definition.name} ${sameDefinitionCount}`,
    };
    setSelectedId(instance.id);
    updateProject({ ...project, equipmentInstances: [...project.equipmentInstances, instance], pipingRoutes: [] });
  };

  const updateInstance = (id: string, patch: Partial<EquipmentInstance>) => {
    updateProject({
      ...project,
      equipmentInstances: project.equipmentInstances.map((instance) => instance.id === id ? { ...instance, ...patch } : instance),
    });
  };

  const exportContext = { equipmentDefinitions };

  return (
    <main className="app-shell">
      <aside className="sidebar left-sidebar">
        <RoomSettingsPanel
          projectName={project.name}
          room={project.room}
          onProjectNameChange={(name) => updateProject({ ...project, name })}
          onRoomChange={(room) => updateProject({ ...project, room })}
        />
        <EquipmentCatalogPanel definitions={equipmentDefinitions} onAddEquipment={addEquipment} />
      </aside>

      <section className="workspace">
        <ExportPanel
          onGenerateRoutes={() => updateProject({ ...project, pipingRoutes: pipeRouter.generateRoutes(project, exportContext) })}
          onValidate={() => updateProject(project)}
          onExportJson={() => downloadTextFile("boiler-room-project.json", jsonExporter.export(project), "application/json")}
          onExportSvg={() => downloadTextFile("boiler-room-layout.svg", svgExporter.export(project, exportContext), "image/svg+xml")}
          onExportCsv={() => downloadTextFile("equipment-schedule.csv", csvExporter.export(project, exportContext), "text/csv")}
        />
        <LayoutSvgEditor
          project={project}
          definitions={equipmentDefinitions}
          selectedId={selectedId}
          validationIssues={project.validationIssues}
          onSelect={setSelectedId}
          onMove={(id, position) => updateInstance(id, { position })}
        />
      </section>

      <aside className="sidebar right-sidebar">
        <PropertiesPanel
          selectedInstance={selectedInstance}
          selectedDefinition={selectedDefinition}
          onUpdateLabel={(label) => selectedId && updateInstance(selectedId, { label })}
          onRotate={() => {
            if (!selectedInstance) return;
            const rotations = [0, 90, 180, 270] as const;
            const next = rotations[(rotations.indexOf(selectedInstance.rotationDeg) + 1) % rotations.length];
            updateInstance(selectedInstance.id, { rotationDeg: next });
          }}
          onDelete={deleteSelectedEquipment}
        />
        <ValidationPanel issues={project.validationIssues} aiExplanation={aiExplanation} />
      </aside>
    </main>
  );
}
