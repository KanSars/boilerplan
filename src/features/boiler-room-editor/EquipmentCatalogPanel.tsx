"use client";

import type { EquipmentDefinition } from "@/domain/equipment/EquipmentDefinition";

type Props = {
  definitions: EquipmentDefinition[];
  onAddEquipment: (definition: EquipmentDefinition) => void;
};

export function EquipmentCatalogPanel({ definitions, onAddEquipment }: Props) {
  return (
    <section className="panel-section">
      <h2>Каталог оборудования</h2>
      <div className="catalog-list">
        {definitions.map((definition) => (
          <button className="catalog-item" key={definition.id} onClick={() => onAddEquipment(definition)}>
            <span>{definition.name}</span>
            <small>{translateCategory(definition.category)} · {definition.dimensionsMm.width} x {definition.dimensionsMm.depth} мм</small>
          </button>
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
