# Infrastructure Layer

`src/infrastructure` содержит реализации доменных портов и replacement points: mock catalog, demo standards profile, routing, exporters, CAD conversion и mock AI adapters.

Infrastructure может импортировать `src/domain`, но `src/domain` не должен импортировать infrastructure.

Экспортные правила:

- JSON/SVG/CSV/DXF exporters работают от `Project` и `ExportContext`.
- CAD/DXF идет через `LayoutToCadDrawingService` и `CadDrawing`.
- Не строите DXF из React SVG, DOM, screenshot или CSS layout.

Все текущие engineering implementations остаются v0/demo. Не добавляйте формулировки, будто они обеспечивают нормативное соответствие или реальные инженерные расчеты.
