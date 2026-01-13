# Fix npm install Error (EPERM)

## Problem
You're getting `EPERM: operation not permitted` error because:
1. **You're in OneDrive folder** - OneDrive locks files during sync
2. **Files are in use** - Cursor/VS Code or OneDrive is using the files

## Solution

### Option 1: Work in LOCAL Desktop Folder (RECOMMENDED)

**You're currently in:**
```
C:\Users\ernes\OneDrive\Desktop\kjo-nextjs  ❌ (OneDrive - Causes errors)
```

**Switch to:**
```
C:\Users\ernes\Desktop\kjo-nextjs  ✅ (Local - No errors)
```

**Steps:**
1. Close Cursor completely
2. Open Cursor
3. File → Open Folder → `C:\Users\ernes\Desktop\kjo-nextjs`
4. Delete `node_modules` folder (if exists)
5. Run `npm install`

### Option 2: Fix Current Folder

If you must work in OneDrive folder:

1. **Close Cursor/VS Code** completely
2. **Pause OneDrive sync** temporarily
3. **Delete node_modules:**
   ```powershell
   Remove-Item -Path "node_modules" -Recurse -Force
   ```
4. **Run npm install as Administrator:**
   - Right-click PowerShell
   - "Run as Administrator"
   - Navigate to folder
   - Run `npm install`

### Option 3: Clean Install

```powershell
# Delete everything
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "package-lock.json" -Force

# Install fresh
npm install
```

## Why This Happens

- **OneDrive sync** locks files while syncing
- **npm install** tries to modify files
- **Conflict** = EPERM error

## Best Solution

**Always work in the LOCAL Desktop folder:**
```
C:\Users\ernes\Desktop\kjo-nextjs
```

Not in OneDrive folder. This prevents all file locking issues!

