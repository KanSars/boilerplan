"use client";

import { useState } from "react";
import type {
  ConnectionDirection,
  ConnectionPoint,
  ConnectionPointSource,
  ConnectionPointType,
} from "@/domain/equipment/ConnectionPoint";
import type { EquipmentCategory, EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import { createId } from "@/lib/ids";

type Props = {
  definition?: EquipmentDefinition;
  onSave: (definition: EquipmentDefinition) => void;
  onResetCatalog: () => void;
};

const categoryOptions: EquipmentCategory[] = ["boiler", "pump", "header", "tank", "sensor", "cabinet", "other"];
const connectionTypes: ConnectionPointType[] = ["supply", "return", "gas", "drain", "flue", "electrical", "signal", "unknown"];
const directions: Array<ConnectionDirection | ""> = ["", "left", "right", "top", "bottom", "front", "back", "up", "down"];
const sources: ConnectionPointSource[] = ["mock", "manual_catalog", "ai_extracted_pdf", "bim_import", "user_override"];

export function EquipmentDefinitionEditorPanel({ definition, onSave, onResetCatalog }: Props) {
  const [draft, setDraft] = useState<EquipmentDefinition | undefined>(definition);
  const [selectedPointId, setSelectedPointId] = useState<string>(definition?.connectionPoints[0]?.id ?? "");

  if (!draft) {
    return (
      <section className="panel-section equipment-definition-editor">
        <h2>Редактор оборудования</h2>
        <p className="muted">Выберите карточку оборудования в каталоге.</p>
      </section>
    );
  }

  const selectedPoint = draft.connectionPoints.find((point) => point.id === selectedPointId);
  const validationMessages = validateDefinitionDraft(draft);
  const canSave = validationMessages.length === 0;

  const updateDraft = (patch: Partial<EquipmentDefinition>) => {
    setDraft((current) => current ? { ...current, ...patch } : current);
  };

  const updateDimensions = (field: keyof EquipmentDefinition["dimensionsMm"], value: number | undefined) => {
    setDraft((current) => current ? {
      ...current,
      dimensionsMm: { ...current.dimensionsMm, [field]: value },
    } : current);
  };

  const updateClearance = (field: keyof EquipmentDefinition["serviceClearancesMm"], value: number) => {
    setDraft((current) => current ? {
      ...current,
      serviceClearancesMm: { ...current.serviceClearancesMm, [field]: value },
    } : current);
  };

  const updateConnectionPoint = (pointId: string, patch: Partial<ConnectionPoint>) => {
    setDraft((current) => current ? {
      ...current,
      connectionPoints: current.connectionPoints.map((point) =>
        point.id === pointId ? { ...point, ...patch } : point,
      ),
    } : current);
  };

  const updateConnectionPosition = (
    pointId: string,
    field: keyof ConnectionPoint["position"],
    value: number | undefined,
  ) => {
    setDraft((current) => current ? {
      ...current,
      connectionPoints: current.connectionPoints.map((point) =>
        point.id === pointId
          ? { ...point, position: { ...point.position, [field]: value } }
          : point,
      ),
    } : current);
  };

  const addConnectionPoint = () => {
    const point: ConnectionPoint = {
      id: createId("connection"),
      type: "supply",
      label: "Новая точка",
      position: {
        xMm: Math.round(draft.dimensionsMm.width / 2),
        yMm: Math.round(draft.dimensionsMm.depth / 2),
        zMm: draft.dimensionsMm.height ? Math.round(draft.dimensionsMm.height / 2) : undefined,
      },
      direction: "right",
      systemRole: "bidirectional",
      source: "manual_catalog",
      confidence: 1,
    };
    setDraft({ ...draft, connectionPoints: [...draft.connectionPoints, point] });
    setSelectedPointId(point.id);
  };

  const deleteConnectionPoint = (pointId: string) => {
    const nextPoints = draft.connectionPoints.filter((point) => point.id !== pointId);
    setDraft({ ...draft, connectionPoints: nextPoints });
    setSelectedPointId(nextPoints[0]?.id ?? "");
  };

  return (
    <section className="panel-section equipment-definition-editor">
      <h2>Редактор оборудования</h2>
      <div className="definition-editor-actions">
        <button className="secondary-button compact" type="button" onClick={() => setDraft(cloneDefinition(definition ?? draft))}>Сбросить</button>
        <button className="secondary-button compact" type="button" onClick={onResetCatalog}>Сбросить каталог</button>
        <button className="secondary-button compact primary" type="button" disabled={!canSave} onClick={() => onSave(draft)}>Сохранить</button>
      </div>

      {validationMessages.length > 0 && (
        <div className="definition-editor-errors">
          {validationMessages.map((message) => <p key={message}>{message}</p>)}
        </div>
      )}

      <h3>Карточка оборудования</h3>
      <label>
        Название
        <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
      </label>
      <label>
        Производитель
        <input value={draft.manufacturer ?? ""} onChange={(event) => updateDraft({ manufacturer: event.target.value })} />
      </label>
      <label>
        Модель
        <input value={draft.model ?? ""} onChange={(event) => updateDraft({ model: event.target.value })} />
      </label>
      <label>
        Категория
        <select value={draft.category} onChange={(event) => updateDraft({ category: event.target.value as EquipmentCategory })}>
          {categoryOptions.map((category) => <option key={category} value={category}>{translateCategory(category)}</option>)}
        </select>
      </label>

      <h3>Габариты</h3>
      <div className="field-grid">
        <NumberField label="Ширина, мм" value={draft.dimensionsMm.width} onChange={(value) => updateDimensions("width", value ?? 0)} />
        <NumberField label="Глубина, мм" value={draft.dimensionsMm.depth} onChange={(value) => updateDimensions("depth", value ?? 0)} />
        <NumberField label="Высота, мм" value={draft.dimensionsMm.height} onChange={(value) => updateDimensions("height", value)} />
      </div>

      <h3>Зоны обслуживания</h3>
      <div className="field-grid">
        <NumberField label="Спереди, мм" value={draft.serviceClearancesMm.front} onChange={(value) => updateClearance("front", value ?? 0)} />
        <NumberField label="Сзади, мм" value={draft.serviceClearancesMm.back} onChange={(value) => updateClearance("back", value ?? 0)} />
        <NumberField label="Слева, мм" value={draft.serviceClearancesMm.left} onChange={(value) => updateClearance("left", value ?? 0)} />
        <NumberField label="Справа, мм" value={draft.serviceClearancesMm.right} onChange={(value) => updateClearance("right", value ?? 0)} />
      </div>

      <DefinitionPreview definition={draft} selectedPointId={selectedPointId} onSelectPoint={setSelectedPointId} />

      <div className="definition-editor-header">
        <h3>Точки подключения</h3>
        <button className="secondary-button compact" type="button" onClick={addConnectionPoint}>Добавить точку</button>
      </div>

      {draft.connectionPoints.length === 0 ? (
        <p className="muted">Нет точек подключения</p>
      ) : (
        <div className="connection-point-list">
          {draft.connectionPoints.map((point) => (
            <button
              className={point.id === selectedPointId ? "connection-point-row active" : "connection-point-row"}
              key={point.id}
              type="button"
              onClick={() => setSelectedPointId(point.id)}
            >
              <span>{point.label || "Без метки"}</span>
              <small>{translateConnectionType(point.type)} · X {point.position.xMm}, Y {point.position.yMm}</small>
            </button>
          ))}
        </div>
      )}

      {selectedPoint && (
        <div className="connection-point-editor">
          <label>
            Тип
            <select value={selectedPoint.type} onChange={(event) => updateConnectionPoint(selectedPoint.id, { type: event.target.value as ConnectionPointType })}>
              {connectionTypes.map((type) => <option key={type} value={type}>{translateConnectionType(type)}</option>)}
            </select>
          </label>
          <label>
            Метка
            <input value={selectedPoint.label} onChange={(event) => updateConnectionPoint(selectedPoint.id, { label: event.target.value })} />
          </label>
          <div className="field-grid">
            <NumberField label="X, мм" value={selectedPoint.position.xMm} onChange={(value) => updateConnectionPosition(selectedPoint.id, "xMm", value ?? 0)} />
            <NumberField label="Y, мм" value={selectedPoint.position.yMm} onChange={(value) => updateConnectionPosition(selectedPoint.id, "yMm", value ?? 0)} />
            <NumberField label="Z, мм" value={selectedPoint.position.zMm} onChange={(value) => updateConnectionPosition(selectedPoint.id, "zMm", value)} />
            <NumberField label="DN, мм" value={selectedPoint.nominalDiameterMm} onChange={(value) => updateConnectionPoint(selectedPoint.id, { nominalDiameterMm: value })} />
          </div>
          <label>
            Направление
            <select value={selectedPoint.direction ?? ""} onChange={(event) => updateConnectionPoint(selectedPoint.id, { direction: event.target.value ? event.target.value as ConnectionDirection : undefined })}>
              {directions.map((direction) => <option key={direction || "none"} value={direction}>{direction || "Не задано"}</option>)}
            </select>
          </label>
          <label>
            Источник данных
            <select value={selectedPoint.source} onChange={(event) => updateConnectionPoint(selectedPoint.id, { source: event.target.value as ConnectionPointSource })}>
              {sources.map((source) => <option key={source} value={source}>{translateSource(source)}</option>)}
            </select>
          </label>
          <NumberField label="Достоверность" value={selectedPoint.confidence} min={0} max={1} step={0.05} onChange={(value) => updateConnectionPoint(selectedPoint.id, { confidence: value })} />
          <button className="danger-button compact" type="button" onClick={() => deleteConnectionPoint(selectedPoint.id)}>Удалить точку</button>
        </div>
      )}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label>
      {label}
      <input
        max={max}
        min={min}
        step={step}
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
      />
    </label>
  );
}

function DefinitionPreview({
  definition,
  selectedPointId,
  onSelectPoint,
}: {
  definition: EquipmentDefinition;
  selectedPointId: string;
  onSelectPoint: (id: string) => void;
}) {
  const padding = 220;
  const viewBox = `${-padding} ${-padding} ${definition.dimensionsMm.width + padding * 2} ${definition.dimensionsMm.depth + padding * 2}`;
  return (
    <div className="definition-preview">
      <svg viewBox={viewBox} role="img" aria-label="Предпросмотр карточки оборудования">
        <rect
          className="definition-preview-clearance"
          x={-definition.serviceClearancesMm.left}
          y={-definition.serviceClearancesMm.back}
          width={definition.dimensionsMm.width + definition.serviceClearancesMm.left + definition.serviceClearancesMm.right}
          height={definition.dimensionsMm.depth + definition.serviceClearancesMm.back + definition.serviceClearancesMm.front}
        />
        <rect className="definition-preview-body" x="0" y="0" width={definition.dimensionsMm.width} height={definition.dimensionsMm.depth} />
        {definition.connectionPoints.map((point) => (
          <g key={point.id} onClick={() => onSelectPoint(point.id)}>
            <circle
              className={point.id === selectedPointId ? `definition-preview-point ${point.type} active` : `definition-preview-point ${point.type}`}
              cx={point.position.xMm}
              cy={point.position.yMm}
              r="55"
            />
            <text className="definition-preview-label" x={point.position.xMm + 70} y={point.position.yMm - 45}>{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const cloneDefinition = (definition: EquipmentDefinition): EquipmentDefinition => ({
  ...definition,
  dimensionsMm: { ...definition.dimensionsMm },
  serviceClearancesMm: { ...definition.serviceClearancesMm },
  connectionPoints: definition.connectionPoints.map((point) => ({
    ...point,
    position: { ...point.position },
    metadata: point.metadata ? { ...point.metadata } : undefined,
  })),
  metadata: definition.metadata ? { ...definition.metadata } : undefined,
});

const validateDefinitionDraft = (definition: EquipmentDefinition): string[] => {
  const messages: string[] = [];
  if (!definition.name.trim()) messages.push("Название обязательно.");
  if (definition.dimensionsMm.width <= 0) messages.push("Ширина должна быть больше 0.");
  if (definition.dimensionsMm.depth <= 0) messages.push("Глубина должна быть больше 0.");
  if (definition.dimensionsMm.height !== undefined && definition.dimensionsMm.height <= 0) messages.push("Высота должна быть больше 0.");
  Object.entries(definition.serviceClearancesMm).forEach(([key, value]) => {
    if (value < 0) messages.push(`Зона обслуживания ${key} должна быть не меньше 0.`);
  });
  definition.connectionPoints.forEach((point) => {
    if (!point.type) messages.push("Тип точки подключения обязателен.");
    if (!point.label.trim()) messages.push(`У точки ${point.id} должна быть метка.`);
    if (point.position.xMm < -500 || point.position.xMm > definition.dimensionsMm.width + 500) messages.push(`${point.label}: X находится далеко за пределами оборудования.`);
    if (point.position.yMm < -500 || point.position.yMm > definition.dimensionsMm.depth + 500) messages.push(`${point.label}: Y находится далеко за пределами оборудования.`);
    if (point.nominalDiameterMm !== undefined && point.nominalDiameterMm <= 0) messages.push(`${point.label}: DN должен быть больше 0.`);
  });
  return messages;
};

export const translateConnectionType = (type: ConnectionPointType): string => {
  const labels: Record<ConnectionPointType, string> = {
    supply: "Подача",
    return: "Обратка",
    gas: "Газ",
    drain: "Дренаж",
    flue: "Дымоход",
    electrical: "Электрика",
    signal: "Сигнал",
    unknown: "Неизвестно",
  };
  return labels[type];
};

const translateSource = (source: ConnectionPointSource): string => {
  const labels: Record<ConnectionPointSource, string> = {
    mock: "Тестовые данные",
    manual_catalog: "Ручной каталог",
    manufacturer_catalog: "Каталог производителя",
    ai_extracted_pdf: "Извлечено из PDF ИИ",
    bim_import: "Импорт BIM",
    user_override: "Пользовательская правка",
  };
  return labels[source];
};

const translateCategory = (category: EquipmentCategory): string => {
  const labels: Record<EquipmentCategory, string> = {
    boiler: "котёл",
    pump: "насос",
    header: "коллектор",
    valve: "арматура",
    tank: "бак",
    sensor: "датчик",
    cabinet: "шкаф",
    other: "другое",
  };
  return labels[category];
};
