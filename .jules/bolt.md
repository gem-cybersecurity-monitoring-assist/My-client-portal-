## 2026-02-15 - [React Context & Filtering Optimization]
**Learning:** In a multi-portal Next.js app, a central AuthProvider that doesn't memoize its context value causes cascading re-renders across the entire application on every auth-state change. Additionally, pages with frequent state updates (like terminal inputs) can suffer from redundant O(n) filtering if calculations aren't decoupled using `useMemo`.
**Action:** Always memoize context values in global providers and use `useMemo` for any list-filtering logic that depends on state unrelated to other frequent UI updates.

## 2026-02-17 - [State Colocation & Component Memoization]
**Learning:** Even with `useMemo` for filtering logic, high-frequency state updates (like typing in a terminal) can cause the entire page to re-render, leading to performance degradation in sibling components. "Pushing state down" to the smallest possible component is often more effective than memoization alone.
**Action:** Colocate high-frequency state within its own component. Wrap static or infrequently changing siblings (like large lists) in `React.memo` to ensure they skip the reconciliation process entirely during parent re-renders.

## 2026-02-18 - [Hoisting JSX for Memoization Stability]
**Learning:** Wrapping a component in `React.memo` is ineffective if it receives inline JSX as a prop (e.g., `icon={<Settings />}`), because JSX elements are new objects on every render. Hoisting these elements to constants outside the render function ensures stable references.
**Action:** Hoist static JSX props (like icons or complex decorative elements) to module-level constants when the receiving component is memoized.

## 2026-02-20 - [Login Page Input Responsiveness]
**Learning:** High-frequency state updates (typing in email/password) on a login page can cause static UI elements (like quick-access buttons) to re-render, leading to input lag on lower-end devices.
**Action:** Move static button grids into memoized components and ensure their event handlers use `useCallback` with stable dependencies to maintain stable prop references.

## 2026-02-26 - [Terminal Line Memoization & Wrapper Memo Removal]
**Learning:** Foundational wrapper components like `GlassCard` that primarily receive dynamic `children` props (often inline JSX) should not be wrapped in `React.memo`, as the shallow comparison overhead is wasted on references that change every render. Conversely, large list items in high-frequency update areas (like a terminal log) MUST be memoized to ensure typing responsiveness.
**Action:** Extract and memoize list items in frequent update zones. Remove `memo` from generic layout wrappers.

## 2026-02-27 - [GPU-Accelerated Animations & List Memoization]
**Learning:** Animating properties like `box-shadow` triggers expensive paint cycles on every frame, which can lag the UI when multiple elements are animating simultaneously. Refactoring these to use `opacity` and `transform` on pseudo-elements offloads the work to the GPU compositor. Additionally, extracting list items into memoized components with stable keys is essential for maintaining performance in data-heavy dashboards.
**Action:** Use `opacity` and `transform` for high-frequency animations. Always extract and memoize list items in dashboard views to prevent unnecessary re-renders.

## 2026-03-21 - [State Colocation for Directory Isolation]
**Learning:** While `useMemo` prevents redundant O(n) calculations, the component containing the `useMemo` still re-renders when parent state changes. Pushing the filtering state and logic down into a dedicated memoized component ensures that high-frequency sibling updates (like terminal typing) never trigger the directory's render cycle at all.
**Action:** Colocate list-filtering state and logic into a dedicated component when that list is displayed alongside high-frequency input components.

## 2026-03-27 - [Build Artifact Hygiene & Security]
**Learning:** Running build commands like `next build` in the sandbox generates a `.next` directory containing sensitive metadata (e.g., encryption keys) and massive binary caches. If not manually cleaned before submission or review, these can be accidentally included, causing security risks and repository bloat.
**Action:** Always run a cleanup command (e.g., `rm -rf .next *.log`) before requesting code reviews or calling the submit tool to ensure only source changes are evaluated.
