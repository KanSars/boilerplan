"use client";

import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";
import type { EquipmentInstance } from "@/domain/equipment/EquipmentInstance";

type Props = {
  selectedInstance?: EquipmentInstance;
  selectedDefinition?: EquipmentDefinition;
  onUpdateLabel: (label: string) => void;
  onRotate: () => void;
  onDelete: () => void;
};

export function PropertiesPanel({ selectedInstance, selectedDefinition, onUpdateLabel, onRotate, onDelete }: Props) {
  return (
    <section className="panel-section">
      <h2>Выбранный объект</h2>
      {!selectedInstance || !selectedDefinition ? (
        <p className="muted">Объект не выбран.</p>
      ) : (
        <div className="properties">
          <label>
            Обозначение
            <input value={selectedInstance.label} onChange={(event) => onUpdateLabel(event.target.value)} />
          </label>
          <dl>
            <dt>Тип</dt><dd>{selectedDefinition.name}</dd>
            <dt>Позиция</dt><dd>{Math.round(selectedInstance.position.xMm)}, {Math.round(selectedInstance.position.yMm)} мм</dd>
            <dt>Поворот</dt><dd>{selectedInstance.rotationDeg}°</dd>
          </dl>
          <div className="property-actions">
            <button className="secondary-button" onClick={onRotate}>Повернуть на 90°</button>
            <button className="danger-button" onClick={onDelete}>Удалить элемент</button>
          </div>
        </div>
      )}
    </section>
  );
}
