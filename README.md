# OptiCare — Optical Business Platform (Frontend Demo)

*Clear Vision. Stronger Relationships.*

A frontend-only demo of a CRM + WhatsApp follow-up platform for an optical store.
There is no backend: all data is mock data kept in React state and saved to
`localStorage`, so changes survive a page refresh on the same browser.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

Requires Node 18+.

> Deploying the build? It uses client-side routing (`BrowserRouter`), so configure
> your host to serve `index.html` for unknown paths (e.g. a Netlify `_redirects`
> file with `/* /index.html 200`, or Vercel's SPA rewrite).

## Demo walkthrough (Acquire → Manage → Communicate → Follow up → Retain → Grow)

1. **Dashboard** — KPIs, the customer-lifecycle strip, sales chart (7D / 30D / 3M / 1Y),
   customer overview, follow-up summary and recent activity. Everything is clickable.
2. **Customers** — search by name, phone or email; filter New / Returning /
   Follow-up Due / Inactive / High Value. Open **Arun Kumar**.
3. **Customer profile** — tabs for Overview, Prescription (OD/OS table + history
   timeline with changed values highlighted), Purchase History, Appointments,
   Communication and Notes. Try *Add purchase*, *Add prescription* (creates a
   6-month eye-check reminder), *Book appointment* and *Send WhatsApp*.
4. **Orders** — move an order to **Ready**: the customer automatically receives
   a WhatsApp "order ready" message.
5. **Follow-ups** — Overdue / Today / This Week / Upcoming / Completed, bulk send,
   and the automation rules (Eye Check, Lens Replacement, Birthday, Order Ready,
   Post-Purchase). Edit a rule to see the live message preview with
   `{{customer_name}}`, `{{store_name}}`, `{{appointment_date}}`, `{{order_number}}`.
6. **WhatsApp** — open Arun's chat and tap a time slot to confirm the booking,
   or use the *Simulate customer taps* bar (Book Appointment, Browse Frames,
   Check Order, Store Location, Talk to Team). Quick replies fill in templates.
7. **Products** — catalogue with categories; share a product into a chat.
8. **Reports** — sales, customers, follow-ups and products; export CSV.
9. **Settings** — business profile, templates, automation and notification
   settings, and **Reset Demo Data**.

The demo runs on a fixed business date of **23 Sep 2026** so the sample data
(overdue reminders, today's orders) always reads consistently.

## Project structure

```
src/
  components/
    customers/  dashboard/  followups/  layout/  orders/
    prescriptions/  products/  reports/  ui/  whatsapp/
  data/         customers, prescriptions, orders, followups,
                conversations, products, analytics (seed data)
  hooks/        useFakeLoading, useMediaQuery
  lib/          format helpers and derived selectors
  pages/        one file per route
  store/        AppStore (state, actions, localStorage persistence)
  styles/       base, modules, pages CSS
  types/        shared TypeScript types
```

Stack: React 18, Vite 6, TypeScript, React Router 6, Recharts, lucide-react.
