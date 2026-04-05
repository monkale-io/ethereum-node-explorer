# Monkale Ethereum Node Explorer

## Overview

Light, serverless IPFS-hosted Ethereum explorer app that connects directly to your Ethereum JSON-RPC node. Intended to be fast and handy for Ethereum node runners without the need to run it yourself. 

No backend, no servers, and no required third-party infrastructure: your browser queries the node you configure for chain data. Some optional UX features, such as unknown event signature resolution, can use public metadata services when enabled in settings.

So far the application is capable to browse blocks, transactions, and accounts on any Ethereum-compatible chain.

![Dashboard overview](docs/screenshots/dashboard.png)

![Transaction details page](docs/screenshots/transaction-details.png)

## How to Use

Open the explorer in your browser:

- With an ENS-enabled browser: [nodex.monkale.eth](https://nodex.monkale.eth)
- Without ENS support: [nodex.monkale.eth.limo](https://nodex.monkale.eth.limo)

After opening the app, choose **Configure RPC Endpoint**, enter your Ethereum JSON-RPC URL, and start exploring blocks, transactions, and accounts.

![Configure RPC endpoint](docs/screenshots/configure-rpc.png)

## Tech Stack

- **React 19** + **TypeScript 5** + **Vite 6**
- **viem** for Ethereum JSON-RPC
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** for state
- **React Router v7** (HashRouter for IPFS)
- **Framer Motion** for list / chart micro-animations
- **Vitest** + **Cypress** + **Hardhat** for tests

## Get Envolved

### Contributing

Contributiongs are welcome. Suggest features, solve bugs and more.
Please read docs first. 

- [Local Development](docs/contributing/local-development.md)
- [Contributing Guide](CONTRIBUTING.md)

### IPFS pinning

To make the app always reachable you can help to pin the current version.

<details>
<summary>Current IPFS CID</summary>

`QmQ7AP8oMB8B8Ssp11c4VjSHVcJ6JtuznnQDB3zHRnGpmM`

</details>

### Donations

ERC20 `monkale.eth`

## Contact

* [Email - monkaleio@gmail.com](mailto:monkaleio@gmail.com)
* [Farcaster](https://farcaster.xyz/nikolayz.eth)

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

Copyright (C) 2026 monkale.io

See `LICENSE` for the full text.
