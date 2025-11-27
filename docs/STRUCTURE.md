# Project Structure

This document describes the production-level organization of the Stevens Blockchain project.

## Directory Structure

```
SBC-Project-Full/
├── contracts/                    # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── tokens/              # Token contracts
│   │   │   ├── StevensBananaCoin.sol
│   │   │   ├── StevensDuckCoin.sol
│   │   │   └── StevensReputationProofCoin.sol
│   │   ├── core/                # Core system contracts
│   │   │   └── StudentManagement.sol
│   │   ├── applications/        # Application contracts (future)
│   │   │   ├── TaskManager.sol
│   │   │   ├── LendingPool.sol
│   │   │   ├── AMM.sol
│   │   │   └── SHIFT.sol
│   │   ├── interfaces/          # Interface definitions
│   │   │   └── WETH.sol
│   │   └── archive/             # Deprecated contracts
│   │       ├── DuckCoin.sol
│   │       ├── ProveOfReputation.sol
│   │       └── SBC.sol
│   ├── test/                    # Test files
│   ├── script/                   # Deployment scripts
│   ├── lib/                      # Dependencies (OpenZeppelin, etc.)
│   ├── foundry.toml             # Foundry configuration
│   └── remappings.txt           # Solidity import remappings
│
├── frontend/                     # Frontend dApp (React + Vite)
│   └── sbc-frontend/
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── hooks/            # Custom React hooks
│       │   ├── contracts/       # Contract ABIs and configs
│       │   ├── styles/           # Styling constants
│       │   └── App.jsx          # Main app component
│       ├── public/              # Static assets
│       ├── package.json
│       └── vite.config.js
│
├── docs/                        # Documentation
│   ├── architecture/            # Architecture documentation
│   │   ├── CONTRACT_ARCHITECTURE.md
│   │   ├── TASK_LIST_ARCHITECTURE_SUMMARY.md
│   │   └── LENDING_IMPLEMENTATION_PLAN.md
│   ├── guides/                  # Implementation guides
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   └── TASK_LIST_IMPLEMENTATION_PLAN.md
│   ├── tokenomics/             # Tokenomics documentation
│   │   └── TOKENOMICS_REFINEMENT.md
│   ├── Cursor_Chats/           # Development chat logs
│   └── STRUCTURE.md            # This file
│
├── deployments/                 # Deployment artifacts
│   ├── addresses/              # Deployed contract addresses
│   └── abis/                   # Contract ABIs
│
├── scripts/                     # Utility scripts
│   ├── deploy.sh
│   ├── setup-nginx.sh
│   └── run-with-pm2.sh
│
├── infrastructure/              # Infrastructure configurations
│   ├── nginx/                  # Nginx configurations
│   └── pm2/                    # PM2 configurations
│
├── .github/                     # GitHub workflows
│   └── workflows/              # CI/CD workflows
│
├── README.md                    # Main project README
├── .gitignore
└── package.json                 # Root package.json
```

## Key Directories

### `contracts/`
Contains all smart contract code organized by purpose:
- **tokens/**: ERC20 token contracts (SBC, SDC, SRPC)
- **core/**: Core system contracts (StudentManagement)
- **applications/**: Application-layer contracts (TaskManager, Lending, Exchange)
- **interfaces/**: Interface definitions
- **archive/**: Deprecated contracts kept for reference

### `frontend/`
React-based frontend application for interacting with the smart contracts.

### `docs/`
All project documentation organized by category:
- **architecture/**: System architecture and design documents
- **guides/**: Step-by-step implementation guides
- **tokenomics/**: Token economics and distribution models

### `deployments/`
Deployment artifacts including contract addresses and ABIs for different networks.

### `scripts/`
Utility scripts for deployment, setup, and maintenance.

### `infrastructure/`
Configuration files for deployment infrastructure (Nginx, PM2, Docker, etc.).

## Development Workflow

1. **Smart Contracts**: Work in `contracts/` directory
2. **Frontend**: Work in `frontend/sbc-frontend/` directory
3. **Documentation**: Add/update files in `docs/` directory
4. **Deployments**: Store artifacts in `deployments/` directory

## Import Paths

### Solidity Contracts
```solidity
import { StevensBananaCoin } from "../tokens/StevensBananaCoin.sol";
import { StudentManagement } from "../core/StudentManagement.sol";
```

### Frontend
```javascript
import { useContract } from "./hooks/useContract";
import { stevensRed } from "./styles/constants";
```

## Build Commands

### Contracts
```bash
cd contracts
forge build
forge test
forge script script/DeployNewContracts.s.sol
```

### Frontend
```bash
cd frontend/sbc-frontend
npm install
npm run dev
npm run build
```

## Notes

- Old contract files are archived in `contracts/src/archive/` for reference
- All documentation is centralized in `docs/` for easy access
- Deployment artifacts are separated from source code
- Infrastructure configs are version-controlled for reproducibility

