<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Руководство Для AI-Агентов

## Цель Проекта

Boilerplan AI v0 — доменно-ориентированное приложение для предварительной компоновки котельной. Оно должно оставаться runnable vertical slice: пользователь задает помещение, размещает оборудование, видит план и принципиальную схему, запускает предварительную маршрутизацию, проверяет отчет валидации и экспортирует данные.

Это не сертифицированный инженерный инструмент. Не формулируйте UI, README, validation messages или exports так, будто приложение выполняет реальные гидравлические расчеты или гарантирует соответствие ГОСТ, СП, СНиП, EN, DIN, пожарным, газовым, вентиляционным или строительным требованиям.

## Язык UI

Пользовательский интерфейс должен оставаться на русском языке. Новые видимые labels, button text, validation messages, empty states и help text пишите по-русски. TypeScript identifiers, filenames, enum values и технические code identifiers оставляйте на английском.

## Архитектура И Слои

Проект использует практичный FSD/layered подход без полного формального FSD-переезда:

- `src/app` — Next.js route shell, layout, providers, global CSS.
- `src/widgets` — сборка пользовательского сценария из features.
- `src/features` — UI-панели и интерактивные feature-компоненты.
- `src/store` — Redux Toolkit state, actions, selectors и derived UI/domain state.
- `src/domain` — чистые доменные типы и правила без React, Redux и browser API.
- `src/infrastructure` — реализации портов: mock catalog, routing, validation profile, exporters, AI mocks, CAD conversion.
- `src/shared` — shared config/data, не завязанная на конкретную feature.
- `src/lib` — маленькие общие утилиты; новые общие утилиты предпочтительно класть в `src/shared/lib`, когда появится такой слой.

Зависимости должны идти сверху вниз: UI может импортировать `domain`, `infrastructure`, `store`; `store` может импортировать `domain` и infrastructure services для selectors; `domain` не импортирует UI, store, infrastructure, React, DOM или browser API.

## Правила FSD/Layering

Не перемещайте файлы ради эстетики в задачах, где пользователь просит точечное изменение. Добавляйте новый код рядом с ближайшим существующим паттерном.

Feature-компоненты не должны становиться новым доменным слоем. Если логика отвечает на вопрос "что такое валидная инженерная модель?", ей место в `src/domain` или `src/infrastructure/standards`. Если логика отвечает на вопрос "как это показать или отредактировать?", ей место в `src/features` или `src/widgets`.

Infrastructure-классы должны реализовывать явные доменные интерфейсы или понятные replacement points. Не прячьте внешние форматы, CAD/DXF serialization, mock AI или routing side effects внутри React-компонентов.

## State Management

Redux Toolkit — текущий источник состояния приложения:

- `projectSlice` хранит `Project`: помещение, размещенные экземпляры оборудования и физические `PipingRoute`.
- `catalogSlice` хранит активные `EquipmentDefinition` и их `ConnectionPoint`.
- `editorSlice` хранит только UI-состояние: selection, layout mode, zoom, toggles.
- Derived data вычисляется selectors: validation issues, `SystemConnection`, `WorldConnectionPoint`.

Не храните stale derived data в `Project`, если его можно детерминированно получить из проекта и каталога. Особенно это касается `SystemConnection` и `WorldConnectionPoint`.

Когда меняются master data оборудования или connection points, очищайте физические routes, если старая геометрия могла стать неверной. Не очищайте состояние без причины.

## Доменная Модель

Вся геометрия домена хранится в миллиметрах. Перевод в пиксели допускается только в UI/rendering layer. Не добавляйте пиксели, CSS units или SVG-only координаты в доменные типы.

Различайте основные понятия:

- `EquipmentDefinition` — master data каталога: категория, название, габариты, зоны обслуживания, `ConnectionPoint`.
- `EquipmentInstance` — размещенный объект проекта: `definitionId`, позиция, поворот, label.
- `ConnectionPoint` — локальная точка подключения внутри `EquipmentDefinition`; координаты относительны карточке оборудования.
- `WorldConnectionPoint` — вычисленная точка подключения в координатах помещения с учетом `EquipmentInstance.position` и `rotationDeg`.
- `SystemConnection` — логическая инженерная связность между совместимыми точками, используется для принципиальной схемы и диагностики.
- `PipingRoute` — физическая предварительная полилиния на плане помещения; не является доказательством clash-free routing.
- `DrawingModel` / `CadDrawing` — промежуточная модель чертежа для CAD/DXF export; это не React SVG и не DOM snapshot.

`EquipmentDefinition` редактируется один раз и влияет на все `EquipmentInstance` с тем же `definitionId`. Не копируйте master data в instance без явной причины.

## Engineering Safety

Любые расчеты, правила и трассы в v0 являются предварительными или demo-placeholder. Новые validation rules должны явно указывать severity, rule id, affected entities и, где важно, placeholder nature.

Не добавляйте сообщения, которые обещают нормативное соответствие, реальные диаметры труб, пожарную безопасность, газовую безопасность, вентиляцию, BIM completeness или рабочую документацию.

Если добавляете новый инженерный алгоритм, сохраняйте deterministic behavior и покрывайте его тестами на простых сценариях.

## Evidence And Requirements

Для будущих ГОСТ/СП/паспортов производителей используйте evidence model в `src/domain/evidence`. Не превращайте свободный AI-ответ в инженерную истину.

Любое требование должно иметь `SourceDocument`, `DocumentCitation`, `Requirement.status` и условия применимости, если они известны. AI-extracted данные по умолчанию имеют статус `review_required` или `extracted`, но не `verified`.

Связь элемента проекта с документальным основанием должна идти через `EvidenceLink` или `RuleEvaluation`, а не через неструктурированный текст в UI.

Пилотные JSON datasets живут в `data/evidence/*` и должны проходить `EvidenceDatasetValidator`. Не меняйте статус на `verified` без отдельной реализованной процедуры проверки источника, версии, цитаты и применимости.

## Export Architecture

Для CAD/DXF и будущих drawing exports используйте цепочку:

`Project -> DrawingModel/CadDrawing -> Exporter/Writer`

Не строите DXF из React SVG, screenshot, DOM, CSS layout или canvas pixels. React SVG — это UI-представление, а не источник истины для CAD.

JSON, SVG, CSV и DXF exporters должны использовать доменную модель и `ExportContext`. Если exporter нуждается в каталоге, передавайте `equipmentDefinitions` через context.

## Тестирование

После изменений в доменной логике, reducers/selectors, routing, validation или exporters запускайте минимум:

```bash
npm test
```

После изменений в UI, Next.js app shell, imports или CSS запускайте:

```bash
npm run lint
npm run build
```

Если меняете интерактивное поведение редактора, дополнительно проверяйте в браузере: загрузка страницы, selection/drag, validation update, auto-connect/routes, exports.

## Дисциплина Изменений

Делайте минимальное изменение, нужное для задачи. Не рефакторьте, не переименовывайте и не переносите файлы без явного запроса или прямой необходимости.

Перед изменением существующего поведения найдите ближайшие tests и существующий паттерн. Если теста нет, добавьте focused test рядом с текущими тестами.

Не исправляйте unrelated lint/style/format issues в той же задаче. Не переписывайте README или архитектуру целиком, если пользователь просит локальную правку.

Перед кодом в Next.js сверяйтесь с релевантными документами в `node_modules/next/dist/docs/`, потому что версия Next.js в этом проекте может отличаться от привычной.
