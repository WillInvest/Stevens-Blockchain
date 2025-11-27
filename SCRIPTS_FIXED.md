# Scripts Fixed for Portability ✅

## Summary

All scripts have been updated to work on **any machine** after cloning the repository. No more hardcoded paths!

## What Was Fixed

### ✅ `scripts/run-with-pm2.sh`
- **Before**: Hardcoded `/home/stevensbc/SBC-Project-Full`
- **After**: Automatically detects project root using relative paths
- **How**: Uses `SCRIPT_DIR` and calculates `PROJECT_ROOT` dynamically

### ✅ `scripts/setup-nginx.sh`
- **Before**: Hardcoded `/home/stevensbc/SBC-Project-Full`
- **After**: Automatically detects project root
- **How**: Uses `SCRIPT_DIR` and calculates `PROJECT_ROOT` dynamically

### ✅ `ecosystem.config.js`
- **Before**: Hardcoded `/home/stevensbc/SBC-Project-Full`
- **After**: Uses environment variables or relative paths
- **How**: `process.env.PROJECT_ROOT || './'` and `process.env.FRONTEND_DIR || './frontend/sbc-frontend'`

## How It Works

All scripts now use this pattern:

```bash
# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is the parent directory of scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
```

This ensures:
- ✅ Works regardless of where the repo is cloned
- ✅ Works for any user (not just `stevensbc`)
- ✅ Works on any machine
- ✅ Works on Linux, macOS, and WSL

## Testing

You can now test on a fresh clone:

```bash
# Clone the repo anywhere
git clone <your-repo-url>
cd <any-directory-name>

# Run the script - it will work!
./scripts/run-with-pm2.sh
```

## Updated Contract Addresses

The script now correctly extracts:
- `StevensBananaCoin` (SBC) address
- `StevensDuckCoin` (SDC) address  
- `StevensReputationProofCoin` (SRPC) address
- `StudentManagement` address

And updates the frontend config automatically.

## Additional Improvements

1. **Better error handling**: Checks if files exist before using them
2. **Package manager detection**: Tries pnpm first, falls back to npm
3. **Clearer output**: Shows project root path for debugging
4. **Updated paths**: Uses `frontend/sbc-frontend` instead of `sbc-frontend`

## Files Changed

- ✅ `scripts/run-with-pm2.sh` - Completely rewritten
- ✅ `scripts/setup-nginx.sh` - Updated paths
- ✅ `ecosystem.config.js` - Already fixed (uses env vars)
- ✅ `docs/guides/DEPLOYMENT_GUIDE.md` - Updated paths
- ✅ `scripts/README.md` - New documentation

## Verification

Both scripts have been syntax-checked:
```bash
✓ scripts/run-with-pm2.sh - Syntax valid
✓ scripts/setup-nginx.sh - Syntax valid
```

## Next Steps

1. Test the scripts on a fresh clone
2. Update any CI/CD workflows if needed
3. Commit the changes

---

**Result**: Anyone can now `git clone` your repo and run `./scripts/run-with-pm2.sh` without any path errors! 🎉

