# Local Development

## Prerequisites

- Node.js 19 or newer
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

Running the test command will automatically execute the following suite:
- **Linting**: Checks the code with ESLint.
- **Coverage & Unit Tests**: Runs Vitest to check component logic and generate a coverage report.
- **E2E Tests**: Spins up a local Hardhat node, a Vite dev server, and runs Cypress end-to-end tests.

```bash
npm run test
```

## Build

The build is designed to be deployable as a single HTML file.
The built artifact can be found at `dist/index.html`. If you want, you can pin it to IPFS.

```bash
npm run build
```
