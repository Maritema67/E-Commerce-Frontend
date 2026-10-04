# Forma — Project Report

## Overview
Forma is a modern e-commerce storefront built with React, TypeScript, and Vite. The application presents a curated product catalog, supports product discovery through search and filters, and includes cart, wishlist, and checkout flows in a polished storefront interface.

The project is designed as a single-page shopping experience with a premium editorial aesthetic and responsive behavior across desktop and mobile layouts.

## Project purpose
This app demonstrates a realistic storefront workflow:
- Browse a product collection fetched from a public API
- Search and refine products by category and price
- Sort items by relevance and pricing
- Save favorites to a wishlist
- Add items to a shopping bag and complete a mock checkout process
- Persist user cart and wishlist data locally in the browser

## Technology stack
- React 18+
- TypeScript
- Vite
- Lucide React for UI icons
- CSS for styling and responsive layout

## Key files
- [src/App.tsx](src/App.tsx) — application logic, state management, catalog UI, cart, wishlist, and checkout flow
- [src/styles.css](src/styles.css) — complete storefront styling and responsive design rules
- [src/main.tsx](src/main.tsx) — React bootstrap entry point
- [vite.config.ts](vite.config.ts) — Vite configuration for React support
- [package.json](package.json) — project scripts and dependencies

## Application flow
1. The app loads product data from the DummyJSON product API.
2. Users can search by title, category, brand, or description.
3. Category and price filters narrow the collection.
4. Product cards provide quick actions for wishlist and add-to-cart.
5. Clicking a product opens a dedicated detail view.
6. The shopping bag supports quantity updates, subtotal tracking, and free-shipping messaging.
7. The checkout form validates required details and completes a mock order.

## State and persistence
The app uses local browser storage for:
- `forma-cart`
- `forma-wishlist`

This ensures cart and saved item state persists when the page reloads.

## Scripts
Run the following commands from the project root:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Project structure
```text
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
└── dist/ (generated build output)
```

## Build status
The project is configured for TypeScript + Vite production builds and is intended to run in a standard frontend environment with Node and npm installed.

## Notes
- The storefront relies on a remote API source for catalog data.
- Cart and checkout behavior are demo-oriented and suitable for UI prototyping.
- Styling is intentionally custom and highly branded, giving the storefront a luxury editorial look.

## Recommended next improvements
- Add a real backend or API layer for checkout and inventory
- Introduce unit or component tests for key storefront flows
- Add product images and metadata caching for a smoother browsing experience
- Expand accessibility coverage for keyboard navigation and screen-reader labels

## Conclusion
Forma is a polished product catalog and shopping experience built as a strong frontend prototype. It demonstrates a full presentation layer for a retail app with modern React patterns, attractive design, and functional shopping interactions.
