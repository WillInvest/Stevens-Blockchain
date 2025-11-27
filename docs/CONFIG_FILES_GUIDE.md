# Configuration Files Guide

This document explains what each configuration file does and whether it should be committed to GitHub.

## Files Overview

### ✅ **SHOULD be in GitHub** (Committed)

#### 1. `.env.example` ✅
**Purpose**: Template for environment variables
**Should commit**: YES
**Why**: 
- Shows what environment variables are needed
- Helps other developers set up the project
- Does NOT contain secrets (that's what `.env` is for, which should be gitignored)

**Action**: Keep in repo, but ensure `.env` (actual secrets) is in `.gitignore`

---

#### 2. `.gitignore` ✅
**Purpose**: Tells Git which files to ignore
**Should commit**: YES
**Why**: 
- Essential for preventing accidental commits of secrets, build artifacts, etc.
- Everyone needs the same ignore rules

**Action**: Keep in repo

---

#### 3. `.gitmodules` ✅
**Purpose**: Defines Git submodules (like OpenZeppelin contracts)
**Should commit**: YES
**Why**: 
- Tracks which submodules are used
- Ensures everyone uses the same dependency versions
- Required for `git submodule update` to work

**Action**: Keep in repo

---

#### 4. `.prettierrc.json` ✅
**Purpose**: Code formatting configuration (Prettier)
**Should commit**: YES
**Why**: 
- Ensures consistent code formatting across the team
- Prevents formatting conflicts in PRs
- Part of code quality standards

**Action**: Keep in repo

---

#### 5. `foundry.lock` ✅
**Purpose**: Locks dependency versions for Foundry (like package-lock.json for npm)
**Should commit**: YES
**Why**: 
- Ensures everyone uses the same dependency versions
- Reproducible builds
- Prevents "works on my machine" issues

**Action**: Keep in repo

---

#### 6. `package.json` ✅
**Purpose**: Node.js project dependencies and scripts
**Should commit**: YES
**Why**: 
- Defines project dependencies
- Contains build scripts
- Essential for npm/pnpm install

**Action**: Keep in repo

---

### ⚠️ **MAYBE** (Depends on use case)

#### 7. `ecosystem.config.js` ⚠️
**Purpose**: PM2 process manager configuration
**Should commit**: MAYBE (with modifications)
**Why**: 
- Contains hardcoded paths (`/home/stevensbc/SBC-Project-Full`)
- Should be templated or use environment variables
- Useful for deployment, but needs to be generic

**Action**: 
- Keep in repo BUT:
  - Remove hardcoded paths
  - Use environment variables or relative paths
  - Add `.example` version if needed

**Recommended fix**:
```javascript
// Use relative paths or environment variables
cwd: process.env.PROJECT_ROOT || './',
```

---

### ❌ **SHOULD NOT be in GitHub** (Gitignored)

#### 8. `package-lock.json` ❌
**Purpose**: Locks npm dependency versions
**Should commit**: NO (if using pnpm)
**Why**: 
- You're using `pnpm-lock.yaml` (in frontend)
- Having both can cause conflicts
- Only commit the lock file for the package manager you're actually using

**Action**: 
- Add to `.gitignore` if you're using pnpm
- OR keep it if you're using npm (but be consistent)

---

## Summary Table

| File | Commit? | Reason |
|------|---------|--------|
| `.env.example` | ✅ YES | Template for environment setup |
| `.gitignore` | ✅ YES | Essential for preventing bad commits |
| `.gitmodules` | ✅ YES | Required for submodules |
| `.prettierrc.json` | ✅ YES | Code formatting standards |
| `foundry.lock` | ✅ YES | Dependency version locking |
| `package.json` | ✅ YES | Project dependencies |
| `ecosystem.config.js` | ⚠️ YES (fix first) | Remove hardcoded paths |
| `package-lock.json` | ❌ NO | Use pnpm-lock.yaml instead |

---

## Recommended Actions

### 1. Fix `ecosystem.config.js`
Make it use relative paths or environment variables:

```javascript
module.exports = {
  apps: [
    {
      name: 'anvil',
      script: 'anvil',
      args: '--host 0.0.0.0 --port 8545 --chain-id 31337',
      cwd: process.env.PROJECT_ROOT || './',  // Use env var or relative
      // ... rest of config
    },
    {
      name: 'sbc-frontend',
      script: 'pnpm',
      args: 'run dev --host 0.0.0.0 --port 5173',
      cwd: process.env.FRONTEND_DIR || './frontend/sbc-frontend',  // Use env var or relative
      // ... rest of config
    }
  ]
};
```

### 2. Update `.gitignore`
Ensure these are ignored:
```
# Environment files (actual secrets)
.env
.env.local
.env.*.local

# Lock files (if using pnpm)
package-lock.json  # Only if using pnpm
```

### 3. Create `.env.example`
If it doesn't exist or is incomplete, create a template:
```bash
# Contract Addresses
STUDENT_MANAGEMENT_ADDRESS=
SBC_ADDRESS=
SDC_ADDRESS=
SRPC_ADDRESS=

# RPC URLs
RPC_URL=http://localhost:8545
CHAIN_ID=31337

# Private Keys (NEVER commit actual keys!)
PRIVATE_KEY=

# Frontend
VITE_RPC_URL=http://localhost:8545
```

---

## Best Practices

1. **Never commit secrets**: `.env` files with actual keys should be gitignored
2. **Always commit templates**: `.env.example` helps others set up
3. **Lock files**: Commit the lock file for the package manager you use
4. **Config files**: Commit configs but make them generic (no hardcoded paths)
5. **Submodules**: Always commit `.gitmodules` for dependency tracking

---

## Quick Checklist

- [ ] `.env.example` exists and is committed
- [ ] `.env` is in `.gitignore` (actual secrets)
- [ ] `.gitignore` is up to date
- [ ] `.gitmodules` is committed
- [ ] `.prettierrc.json` is committed
- [ ] `foundry.lock` is committed
- [ ] `package.json` is committed
- [ ] `ecosystem.config.js` uses relative paths (not hardcoded)
- [ ] `package-lock.json` is gitignored (if using pnpm)

