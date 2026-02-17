## 2026-02-15 - [React Context & Filtering Optimization]
**Learning:** In a multi-portal Next.js app, a central AuthProvider that doesn't memoize its context value causes cascading re-renders across the entire application on every auth-state change. Additionally, pages with frequent state updates (like terminal inputs) can suffer from redundant O(n) filtering if calculations aren't decoupled using `useMemo`.
**Action:** Always memoize context values in global providers and use `useMemo` for any list-filtering logic that depends on state unrelated to other frequent UI updates.

## 2026-02-17 - [State Colocation & Component Memoization]
**Learning:** Even with `useMemo` for filtering logic, high-frequency state updates (like typing in a terminal) can cause the entire page to re-render, leading to performance degradation in sibling components. "Pushing state down" to the smallest possible component is often more effective than memoization alone.
**Action:** Colocate high-frequency state within its own component. Wrap static or infrequently changing siblings (like large lists) in `React.memo` to ensure they skip the reconciliation process entirely during parent re-renders.
