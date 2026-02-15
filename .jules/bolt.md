## 2026-02-15 - [React Context & Filtering Optimization]
**Learning:** In a multi-portal Next.js app, a central AuthProvider that doesn't memoize its context value causes cascading re-renders across the entire application on every auth-state change. Additionally, pages with frequent state updates (like terminal inputs) can suffer from redundant O(n) filtering if calculations aren't decoupled using `useMemo`.
**Action:** Always memoize context values in global providers and use `useMemo` for any list-filtering logic that depends on state unrelated to other frequent UI updates.
