# Dashboard Studio and Library Improvements - Implementation Plan

This plan outlines the steps to address the TODOs identified in the `dashboard-studio` components and `lib` files.

## 1. Dashboard Studio Components (`portfolio/src/app/dashboard-studio/components`)

### 1.1. `ChartWidget.tsx`

- **TODO:** Implement logic to apply conditional formatting based on `config.conditionalFormattingRules`.
  - **Action:** Define a clear structure for `conditionalFormattingRules` within the configuration. Develop a utility function or hook to parse these rules and apply corresponding styles or transformations to chart data/presentation. Consider using a dedicated charting library's API for this if available.
- **TODO:** Add cases for other chart types like 'geospatial-map' if needed.
  - **Action:** Research and integrate a suitable geospatial mapping library (e.g., Leaflet, Mapbox GL JS with React wrappers). Create a modular approach to add new chart types, ensuring `ChartWidget.tsx` can dynamically render different chart components based on a `type` prop.

### 1.2. `DashboardBuilder.tsx`

- **TODO:** Implement Enhanced Drag-and-Drop Interface.
  - **Action:** Evaluate existing drag-and-drop libraries (e.g., `react-dnd`, `dnd-kit`). Design and implement a robust drag-and-drop system for dashboard elements, allowing for reordering, resizing, and placement of widgets. Ensure smooth user experience and accessibility.

### 1.3. `DashboardViewer.tsx`

- **TODO:** Implement performance optimization strategies for rendering large datasets (e.g., virtualization, data aggregation).
  - **Action:** Investigate and apply techniques like windowing/virtualization for large lists of widgets or data tables. Implement data aggregation strategies on the backend or frontend to reduce the amount of data rendered at once. Consider lazy loading of components or data.

### 1.4. `ReportEditor.tsx`

- **TODO:** The task mentions improving the drag-and-drop interface in `ReportEditor.tsx` or related components.
  - **Action:** Extend the enhanced drag-and-drop interface developed for `DashboardBuilder.tsx` to `ReportEditor.tsx` for report elements. Ensure consistency in user interaction and component behavior across both modules.

## 2. Library Files (`portfolio/src/lib`)

### 2.1. `dashboard-service.ts`

- **TODO:** Integrate custom calculation and formula evaluation logic.
  - **Action:** Utilize the `formula-evaluator.ts` module to process custom calculations and formulas. Design API endpoints or service methods within `dashboard-service.ts` to accept and execute these formulas, returning computed results for dashboard display.

### 2.2. `formula-evaluator.ts`

- **TODO:** Implement a formula evaluator for custom calculations and dimensions.
  - **Action:** Develop a robust formula parsing and evaluation engine. This could involve using a parser generator or writing a custom parser. Support common mathematical operations, logical functions, and references to data dimensions.
- **TODO:** Add more functions for formula validation, parsing, etc.
  - **Action:** Implement comprehensive validation for formulas (syntax, data type compatibility). Enhance parsing to handle complex expressions and provide meaningful error messages. Consider adding a function registry for extensible formula capabilities.
