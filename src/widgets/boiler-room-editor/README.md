# Boiler Room Editor Widget

`BoilerRoomEditor.tsx` собирает основной сценарий приложения: selectors, dispatch actions, панели редактора, routing flow, validation output и exporters.

Это orchestration layer. Он может связывать UI с сервисами infrastructure, но не должен содержать сложные инженерные алгоритмы. Для новой логики предпочитайте:

- `src/domain` — чистая модель и правила;
- `src/infrastructure` — реализации сервисов и exporters;
- `src/store/selectors.ts` — derived data из Redux state.

Сохраняйте widget небольшим насколько это возможно для текущего vertical slice.
