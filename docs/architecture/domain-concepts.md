# Доменные Понятия

Документ фиксирует смысл основных TypeScript-моделей. Его цель — помочь агентам менять нужный слой, не перечитывая весь проект.

## Project

`Project` — корень доменной модели текущей котельной. Он содержит имя, единицы измерения, `Room`, размещенные `EquipmentInstance`, физические `PipingRoute`, validation issues и metadata.

`Project` не должен хранить все возможные derived views. Если данные можно детерминированно пересчитать из `Project` и активного каталога, их лучше держать в selectors/services.

## Room

`Room` описывает помещение в миллиметрах:

- `widthMm`
- `lengthMm`
- `heightMm`
- `origin`

Room задает систему координат для плана. В UI помещение рисуется как SVG, но доменные размеры остаются в миллиметрах.

## EquipmentDefinition

`EquipmentDefinition` — карточка оборудования в каталоге, то есть master data. Она описывает тип оборудования, габариты, производителя, модель, зоны обслуживания и локальные `ConnectionPoint`.

Одна `EquipmentDefinition` может использоваться многими `EquipmentInstance`. Если пользователь редактирует карточку, уже размещенные экземпляры должны начать использовать обновленные габариты и точки подключения через `definitionId`.

## EquipmentInstance

`EquipmentInstance` — конкретное размещение оборудования в проекте. Оно хранит:

- `id`
- `definitionId`
- `position`
- `rotationDeg`
- `label`
- optional custom parameters

Instance не должен дублировать габариты, clearances и master connection points из definition без очень веской причины. Его задача — сказать, где и как размещена карточка каталога.

## ConnectionPoint

`ConnectionPoint` — локальная точка подключения внутри `EquipmentDefinition`. Ее координаты относительны карточке оборудования, а не помещению.

Она описывает инженерный тип подключения: `supply`, `return`, `gas`, `drain`, `flue`, `electrical`, `signal` или `unknown`. Дополнительные поля вроде direction, role, source и confidence помогают различать ручной каталог, mock data, AI extraction и BIM import.

## WorldConnectionPoint

`WorldConnectionPoint` — вычисленный результат применения `EquipmentInstance.position` и `rotationDeg` к локальной `ConnectionPoint`.

Это derived data. Его используют план, routing, validation и future exports, когда нужна точка в координатах помещения. Не сохраняйте `WorldConnectionPoint` в проект как постоянную копию, если нет отдельного сценария persistence.

## SystemConnection

`SystemConnection` описывает логическую инженерную связность: например, подача котла связана с коллектором подачи.

Это не физическая труба и не CAD-линия. У `SystemConnection` есть status: `connected`, `missing_target`, `missing_source`, `ambiguous` или `invalid`. Эти статусы полезны для принципиальной схемы и validation.

В текущей архитектуре `SystemConnection` строится детерминированно через `SystemConnectionResolver` и selectors. Его не нужно записывать в `Project` как stale derived state.

## PipingRoute

`PipingRoute` — физическая предварительная трасса на плане. Она содержит `from`, `to`, `systemType`, `polylinePoints`, `nominalDiameterMm`, `calculationStatus` и warnings.

В v0 route является упрощенной orthogonal polyline. Он не доказывает, что трасса clash-free, buildable или рассчитана гидравлически. Любой UI или export должен сохранять это предупреждение в формулировках.

## DrawingModel / CadDrawing

`CadDrawing` — промежуточная модель чертежа для CAD/DXF exports. Она содержит слои, entities и metadata в миллиметрах.

Ее назначение — отделить инженерные данные от конкретного формата файла. Правильная цепочка такая:

`Project + equipmentDefinitions -> CadDrawing -> AsciiDxfWriter`

Неправильная цепочка:

`React SVG -> DOM/Screenshot -> DXF`

React SVG нужен для UI. CAD/DXF должен строиться из доменной модели.

## ValidationRule И ValidationIssue

`ValidationRule` — модульное правило проверки. Оно принимает `Project` и context, затем возвращает список `ValidationIssue`.

`ValidationIssue` должен быть понятным пользователю и агентам:

- severity;
- message на русском в UI-facing scenarios;
- entity ids;
- rule id;
- optional standard reference;
- suggested fix, если можно дать безопасный совет.

Demo rules не являются нормативной экспертизой. Всегда сохраняйте осторожные формулировки.

## Evidence Model

Evidence model — основа для будущей проверяемости требований. Она не заменяет ГОСТы, СП, паспорта производителей и инженерную экспертизу; она описывает, как приложение будет хранить ссылку от элемента проекта к документальному основанию.

Главные типы:

- `SourceDocument` — источник: ГОСТ, СП, паспорт производителя, datasheet, internal standard или demo source.
- `DocumentCitation` — конкретная ссылка на документ: страница, раздел, пункт, цитата или примечание о расположении.
- `Requirement` — извлеченное требование с категорией, статусом доверия, citations и условиями применимости.
- `ApplicabilityCondition` — условие, к чему требование применимо.
- `CompiledRule` — машинно-проверяемая форма требования, если требование можно формализовать.
- `RuleEvaluation` — результат применения compiled rule к проекту или элементу проекта.
- `EvidenceLink` — связь между элементом проекта/чертежа и требованием или citation.

Статусы доверия принципиальны: `extracted`, `review_required`, `verified`, `conflict`, `deprecated`. Все AI-extracted и demo данные по умолчанию не являются `verified`.

Важное правило: агент не должен возвращать просто "разрешено" или "запрещено". Он должен возвращать структурированное требование, применимость, citation и статус доверия.

## StandardsProfile

`StandardsProfile` собирает набор правил. Текущий `DemoInternalStandardsProfile` содержит placeholder/demo values и не должен восприниматься как реальный профиль стандартов.

Если в будущем появятся реальные профили, они должны быть отдельными implementations и явно указывать jurisdiction, source, limitations и статус применимости.

## Exporter

`Exporter<TOutput>` — порт для экспорта. Реализации находятся в infrastructure и должны принимать `Project` плюс `ExportContext`.

JSON, SVG, CSV и DXF могут иметь разные output formats, но источник истины общий: доменная модель и активный каталог.

## AI Adapters

AI adapters в v0 являются mock implementations. Они не вызывают реальные API. UI должен зависеть от интерфейсов и replacement points, а не от конкретного LLM SDK.

Если появятся реальные OpenAI/Codex integrations, держите их за доменными интерфейсами и не смешивайте network calls с reducers, selectors или чистой domain geometry.

## Связи Понятий

Основная цепочка данных:

`EquipmentDefinition.connectionPoints`

`EquipmentInstance.definitionId + position + rotationDeg`

`WorldConnectionPoint`

`SystemConnection` для логической схемы

`PipingRoute` для физического плана

`Requirement` / `EvidenceLink` для документального основания

`CadDrawing` для CAD/DXF export

Эти модели похожи, но решают разные задачи. Большинство ошибок в будущем будет появляться из-за смешения logical connectivity, physical routing и drawing/export representation.
