# Local Development

## Prerequisites

- Node.js 18 or newer
- npm
- An Ethereum JSON-RPC endpoint for manual use of the app

## Install Dependencies

```bash
npm ci
```

## Start the App

```bash
npm run dev
```

Open `http://localhost:5173`, configure an RPC endpoint, and use the app.

## Test

```bash
npm run test
```

## Build

```bash
npm run build
```

## Notes

- `npm run test:e2e` starts a local Hardhat node and the Vite dev server before running Cypress.
- The build is designed to remain deployable as a single HTML file.
