## Current State Assessment

Swippee is a well-built OTC crypto brokerage with solid fundamentals: auth, KYC, order flow, wallet, portfolio, admin panel, i18n, dark mode, and realtime updates. Here's what can be improved or added, organized by impact:

---

### UX Improvements

**1. Dashboard Overview — Recent Activity Empty State**

- The dashboard shows "No activity yet" with no guidance. Add a more actionable empty state with quick links to "Complete KYC", "Add Payment Method", "Make Your First Trade"

**2. Order Cancellation by User**

- Allow users to cancel orders that are still in `awaiting_payment` status before uploading proof. Currently there's no self-service cancel

**3. Mobile Navigation Polish**

- The mobile sidebar overlay could use a smoother slide-in animation and the header could show the current page title for better wayfinding

**4. Search/Filter on Orders Page**

- Add status filter chips and a date range picker to the orders list for users with many orders

---

**5. FAQ Section**

- Add an FAQ page or accordion section on the Support page covering common questions (processing times, supported banks, limits)

---

### Technical Debt

**6. Error Boundaries**

- No React error boundaries exist — a crash in any component takes down the whole app. Add route-level error boundaries

**7. Loading Skeletons**

- Several pages show blank space while loading. Add skeleton loaders for dashboard stats, order lists, and wallet balance