# Store Layer

`src/store` содержит Redux Toolkit state и selectors.

Текущие slices:

- `projectSlice` — доменная модель проекта: room, equipment instances, physical piping routes.
- `catalogSlice` — активные `EquipmentDefinition` и их `ConnectionPoint`.
- `editorSlice` — только UI-состояние: selection, active view, view layout, zoom, toggles.

Selectors вычисляют derived data, включая validation issues, `SystemConnection` и `WorldConnectionPoint`. Не сохраняйте эти derived values в `Project`, если они могут быть детерминированно пересчитаны из проекта и каталога.

Reducers не должны выполнять browser side effects, downloads, network calls или реальные AI calls.
