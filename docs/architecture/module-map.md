# Карта Модулей

Эта карта помогает быстро найти место для точечных изменений. Она описывает текущую структуру, а не желаемую будущую архитектуру.

## Room Layout

План помещения отвечает за физическую компоновку в координатах помещения.

- `src/features/boiler-room-editor/LayoutSvgEditor.tsx` — интерактивный SVG-план: границы комнаты, корпуса оборудования, зоны обслуживания, точки подключения, физические трассы, selection и drag.
- `src/features/boiler-room-editor/RoomSettingsPanel.tsx` — ввод размеров помещения и имени проекта.
- `src/domain/room/Room.ts` — доменный тип помещения.
- `src/domain/geometry/geometryTypes.ts` — базовые типы точек и прямоугольников в миллиметрах.
- `src/domain/geometry/rectangles.ts` — расчет body/clearance rectangles, проверки пересечений и попадания в помещение.
- `src/domain/geometry/transforms.ts` — преобразование локальных connection points в `WorldConnectionPoint`.
- `src/lib/units.ts` — перевод метров, миллиметров и UI-scale units.

## Schematic View

Принципиальная схема показывает логическую связность оборудования, а не физическую трассировку труб.

- `src/features/boiler-room-editor/PrincipleSchematicView.tsx` — визуализация логических `SystemConnection`.
- `src/domain/piping/SystemConnection.ts` — тип логического соединения.
- `src/domain/piping/SystemConnectionResolver.ts` — детерминированное построение логических соединений из проекта и каталога.
- `src/domain/piping/ConnectionCompatibilityService.ts` — правила совместимости типов connection points.
- `src/store/selectors.ts` — `selectSystemConnections`, где схема получает derived data.

## Equipment Catalog And Editor

Каталог хранит master data оборудования. Размещенные элементы ссылаются на карточки через `definitionId`.

- `src/features/boiler-room-editor/EquipmentCatalogPanel.tsx` — список карточек и добавление экземпляров на план.
- `src/features/boiler-room-editor/EquipmentDefinitionEditorPanel.tsx` — редактирование карточки оборудования и ее connection points.
- `src/features/boiler-room-editor/PropertiesPanel.tsx` — свойства выбранного `EquipmentInstance`.
- `src/domain/equipment/EquipmentDefinition.ts` — master data оборудования.
- `src/domain/equipment/EquipmentInstance.ts` — размещенный экземпляр.
- `src/domain/equipment/ConnectionPoint.ts` — локальная точка подключения карточки.
- `src/domain/equipment/WorldConnectionPoint.ts` — вычисленная точка подключения в координатах помещения.
- `src/infrastructure/equipment-catalogs/EquipmentCatalog.ts` — интерфейс каталога.
- `src/infrastructure/equipment-catalogs/MockEquipmentCatalog.ts` — mock-реализация каталога.
- `src/shared/config/equipmentDefinitions.ts` — текущие стартовые mock definitions.
- `src/store/catalogSlice.ts` — active catalog state.

## Connection Resolving

Connection resolving связывает локальные точки оборудования в логическую инженерную сеть.

- `src/domain/piping/ConnectionCompatibilityService.ts` — совместимость типов, например supply -> supply и return -> return.
- `src/domain/piping/SystemConnectionResolver.ts` — выбор целей, статусы missing/ambiguous/connected.
- `src/domain/piping/SystemConnection.ts` — формат результата для схемы и правил.
- `src/infrastructure/standards/rules/AmbiguousConnectionRule.ts` — диагностика неоднозначных подключений.
- `src/infrastructure/standards/rules/ConnectionPointDataQualityRule.ts` — проверка качества данных точек.
- `src/infrastructure/standards/rules/RequiredHydronicConnectionsRule.ts` — проверка обязательных hydronic connections.
- `src/tests/systemConnections.test.ts` и `src/tests/connectionPoints.test.ts` — основные тесты этой зоны.

## Pipe Routing

Pipe routing строит предварительные физические полилинии на плане.

- `src/domain/piping/PipeRoutingService.ts` — интерфейс сервиса маршрутизации.
- `src/domain/piping/PipingRoute.ts` — доменный тип физической трассы.
- `src/infrastructure/piping/SimpleOrthogonalPipeRouter.ts` — текущий детерминированный v0-router.
- `src/infrastructure/piping/MockPipeSizingService.ts` — placeholder для будущего расчета диаметров.
- `src/widgets/boiler-room-editor/BoilerRoomEditor.tsx` — вызывает routing по кнопке `Соединить автоматически` / generate routes flow.
- `src/tests/pipeRouting.test.ts` — тесты маршрутизации.

## Validation

Validation запускает набор правил из активного standards profile. Правила демонстрационные и не означают нормативное соответствие.

- `src/domain/validation/ValidationRule.ts` — интерфейс validation rule.
- `src/domain/validation/ValidationIssue.ts` — формат результата.
- `src/domain/validation/ValidationEngine.ts` — запуск правил профиля.
- `src/domain/standards/StandardsProfile.ts` — профиль стандартов.
- `src/infrastructure/standards/DemoInternalStandardsProfile.ts` — активный demo-profile.
- `src/infrastructure/standards/rules/*` — конкретные правила: помещение, коллизии, clearance, connection quality, hydronic connections, placeholder compliance warning.
- `src/features/boiler-room-editor/ValidationPanel.tsx` — отображение отчета и mock AI explanation.
- `src/store/selectors.ts` — `selectValidationIssues`.
- `src/tests/validation.test.ts` — тесты validation behavior.

## Evidence And Requirements

Evidence model готовит основу для будущих нормативных требований, паспортов производителей и AI extraction agents. Это пока не проверка ГОСТов и не источник инженерной истины.

- `src/domain/evidence/*` — чистые типы evidence layer: `SourceDocument`, `DocumentCitation`, `Requirement`, `ApplicabilityCondition`, `CompiledRule`, `RuleEvaluation`, `EvidenceLink`.
- `src/domain/evidence/EvidenceRepository.ts` — интерфейсы будущих repository/compiler/evaluator сервисов без AI и без внешней БД.
- `src/domain/evidence/evidenceGuards.ts` — маленькие проверки связей внутри evidence model.
- `src/infrastructure/evidence/EvidenceDatasetValidator.ts` — проверка целостности JSON dataset: citations, source documents, requirement links, unverified statuses.
- `src/infrastructure/evidence/StaticEvidenceRepository.ts` — read-only repository поверх статического dataset.
- `src/infrastructure/evidence/typicalStandaloneBoilerRoomEvidence.ts` — loader пилотного dataset для отдельно стоящей блочно-модульной котельной.
- `src/shared/config/demoEvidenceRequirements.ts` — фиктивные demo requirements для проверки формы данных. Не использовать как инженерные правила.
- `data/evidence/typical-standalone-boiler-room/*` — pilot JSON dataset: source documents, requirements, compiled rules, evidence links и pilot elements.
- `src/tests/evidence.test.ts` — focused tests для цепочки requirement -> citation -> evaluation -> evidence link.
- `src/tests/evidenceDataset.test.ts` — integrity tests для pilot dataset.

Будущие AI-агенты должны возвращать структурированные требования с citations и статусом доверия, а не свободный текст без проверяемого источника.

## Exports

Exports должны исходить из доменной модели, а не из UI DOM.

- `src/domain/export/Exporter.ts` — общий интерфейс exporter и `ExportContext`.
- `src/features/boiler-room-editor/ExportPanel.tsx` — кнопки экспорта и генерации.
- `src/infrastructure/exporters/JsonProjectExporter.ts` — export проекта в JSON.
- `src/infrastructure/exporters/SvgProjectExporter.ts` — export layout SVG из доменной модели.
- `src/infrastructure/exporters/CsvEquipmentScheduleExporter.ts` — ведомость оборудования.
- `src/infrastructure/exporters/DxfProjectExporter.ts` — DXF export через CAD drawing model.
- `src/infrastructure/exporters/AsciiDxfWriter.ts` — сериализация `CadDrawing` в ASCII DXF.
- `src/lib/download.ts` — browser download helper.
- `src/tests/exporters.test.ts` — тесты exporters.

## Future Drawing And DXF Export

Будущие CAD/DXF/DWG/IFC/Revit изменения должны идти через промежуточную drawing model.

- `src/domain/cad/CadDrawing.ts` — текущая drawing model для CAD/DXF.
- `src/infrastructure/cad/LayoutToCadDrawingService.ts` — преобразование `Project + equipmentDefinitions` в `CadDrawing`.
- `src/infrastructure/exporters/DxfProjectExporter.ts` — exporter orchestration.
- `src/infrastructure/exporters/DxfExporter.placeholder.ts` — replacement point для будущего DXF.
- `src/infrastructure/exporters/DwgExporter.placeholder.ts` — replacement point для DWG.
- `src/infrastructure/exporters/IfcExporter.placeholder.ts` — replacement point для IFC.
- `src/infrastructure/exporters/RevitExporter.placeholder.ts` — replacement point для Revit.

Правило для агентов: `Project -> DrawingModel/CadDrawing -> Exporter/Writer`, не `React SVG -> DXF`.

## App Assembly

Главная сборка сценария находится здесь:

- `src/app/page.tsx` — вход на страницу.
- `src/app/StoreProvider.tsx` — Redux provider.
- `src/widgets/boiler-room-editor/BoilerRoomEditor.tsx` — orchestration виджета: selectors, dispatch, routing, exporters, panels.
- `src/app/globals.css` — глобальные стили текущего UI.
