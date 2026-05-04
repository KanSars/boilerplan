"use client";

import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";

type Props = {
  definitions: EquipmentDefinition[];
  onAddEquipment: (definition: EquipmentDefinition) => void;
  onSelectDefinition: (definitionId: string) => void;
};

export function EquipmentCatalogPanel({ definitions, onAddEquipment, onSelectDefinition }: Props) {
  return (
    <section className="panel-section">
      <h2>Каталог оборудования</h2>
      <div className="catalog-list">
        {definitions.map((definition) => (
          <div className="catalog-item" key={definition.id}>
            <button className="catalog-select-button" type="button" onClick={() => onSelectDefinition(definition.id)}>
              <span>{definition.name}</span>
              <small>{translateCategory(definition.category)} · {definition.dimensionsMm.width} x {definition.dimensionsMm.depth} мм</small>
            </button>
            <button className="secondary-button compact" type="button" onClick={() => onAddEquipment(definition)}>Добавить</button>
          </div>
        ))}
      </div>
    </section>
  );
}

const translateCategory = (category: EquipmentDefinition["category"]): string => {
  const labels: Record<EquipmentDefinition["category"], string> = {
    boiler: "котёл",
    pump: "насос",
    header: "коллектор",
    tank: "бак",
    sensor: "датчик",
    cabinet: "шкаф",
    other: "другое",
  };
  return labels[category];
};
