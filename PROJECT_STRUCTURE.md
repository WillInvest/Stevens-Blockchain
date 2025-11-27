# Project Structure Reorganization Plan

## Current Issues
- Files scattered at root level
- Documentation mixed with code
- Old contract files present
- No clear separation of concerns

## Proposed Production-Level Structure

```
SBC-Project-Full/
├── contracts/                    # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── tokens/
│   │   │   ├── StevensBananaCoin.sol
│   │   │   ├── StevensDuckCoin.sol
│   │   │   └── StevensReputationProofCoin.sol
│   │   ├── core/
│   │   │   └── StudentManagement.sol
│   │   ├── applications/
│   │   │   ├── TaskManager.sol (future)
│   │   │   ├── LendingPool.sol (future)
│   │   │   ├── AMM.sol (future)
│   │   │   └── SHIFT.sol (future)
│   │   └── interfaces/
│   ├── test/
│   ├── script/
│   ├── lib/
│   ├── foundry.toml
│   └── remappings.txt
│
├── frontend/                     # Frontend dApp (React + Vite)
│   └── sbc-frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
│
├── docs/                        # Documentation
│   ├── architecture/
│   │   ├── CONTRACT_ARCHITECTURE.md
│   │   ├── TASK_LIST_ARCHITECTURE_SUMMARY.md
│   │   └── LENDING_IMPLEMENTATION_PLAN.md
│   ├── guides/
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   └── TASK_LIST_IMPLEMENTATION_PLAN.md
│   ├── tokenomics/
│   │   └── TOKENOMICS_REFINEMENT.md
│   └── README.md (main project README)
│
├── deployments/                 # Deployment artifacts
│   ├── addresses/
│   └── abis/
│
├── scripts/                     # Utility scripts
│   ├── deploy.sh
│   ├── setup-nginx.sh
│   └── run-with-pm2.sh
│
├── infrastructure/              # Infrastructure configs
│   ├── nginx/
│   ├── pm2/
│   └── docker/ (if needed)
│
├── .github/                     # GitHub workflows
│   └── workflows/
│
├── .gitignore
├── README.md                    # Main project README
├── package.json                 # Root package.json (if needed)
└── foundry.toml                 # Root foundry config (if needed)
```

## Migration Steps
1. Create new directory structure
2. Move contracts to contracts/
3. Move frontend to frontend/
4. Move docs to docs/
5. Move scripts to scripts/
6. Archive old files
7. Update all import paths
8. Update documentation references

