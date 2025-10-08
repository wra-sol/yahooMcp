# Build Options & Size Optimization

## Current Size Analysis

- **Bundled JavaScript only**: 145 KB
- **Compiled binary with Bun runtime**: 55 MB
- **Ratio**: The Bun runtime is ~380x larger than our actual code!

## Why is the compiled binary so large?

When using `bun build --compile`, Bun bundles:
1. Your application code (145 KB)
2. The entire Bun runtime (~55 MB)
3. All necessary system libraries

This makes it a standalone executable that doesn't require Bun to be installed, but it's HUGE.

## Build Options

### Option 1: Bundled JS (Recommended for most deployments)
**Size**: ~145 KB  
**Requires**: Bun runtime installed on target system

```bash
bun run build:bundle
```

**Deployment**:
```bash
# On target system:
bun dist/index.js
```

**Pros**:
- 380x smaller than compiled binary
- Faster to upload/download
- Easier to update (just swap the JS file)
- Better for Railway/cloud deployments (they have Bun)

**Cons**:
- Requires Bun to be installed on the target system

---

### Option 2: Executable Script (Best for systems with Bun)
**Size**: ~145 KB  
**Requires**: Bun runtime installed on target system

```bash
bun run build:small
```

This creates an executable shell script with the bundled code.

**Usage**:
```bash
./dist/yahoo-mcp
```

---

### Option 3: Compiled Binary (For systems without Bun)
**Size**: ~55 MB  
**Requires**: Nothing (fully standalone)

```bash
bun run build
# or for optimized version:
bun run build:optimized
```

**Pros**:
- Completely standalone
- No dependencies needed
- Good for distribution to users

**Cons**:
- 55 MB file size
- Slower to upload/download
- Larger storage footprint

---

### Option 4: Multi-platform Builds
**Size**: ~55 MB per platform  
**Requires**: Nothing on target systems

```bash
bun run build:all
```

Builds for:
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Linux x64

---

## Dependency Analysis

### Current Dependencies
```json
{
  "@modelcontextprotocol/sdk": "1.7 MB",
  "zod": "5.0 MB"
}
```

### Bundle Impact
After minification and tree-shaking:
- **Total bundled size**: 145 KB
- **Compression ratio**: ~48x reduction from source

Both dependencies are heavily optimized during bundling, so they're not the bottleneck.

---

## Recommendations by Use Case

### For Railway/Render/Fly.io Deployment
✅ Use **build:bundle** (145 KB)
- These platforms have Bun pre-installed or can install it
- Faster deployments
- Smaller storage costs

### For Docker Deployment
✅ Use **build:bundle** (145 KB) + Bun base image
```dockerfile
FROM oven/bun:latest
COPY dist/index.js /app/
CMD ["bun", "/app/index.js"]
```

### For End-User Distribution
✅ Use **build** or **build:all** (55 MB per platform)
- Users don't need to install Bun
- Single executable file
- Cross-platform support

### For Development
✅ Use **dev** or **start** (no build needed)
```bash
bun run dev
```

---

## Size Comparison Table

| Build Type | Size | Requires Bun | Standalone | Recommended For |
|------------|------|--------------|------------|-----------------|
| dev/start | Source | ✅ Yes | ❌ No | Development |
| build:bundle | 145 KB | ✅ Yes | ❌ No | Cloud deployments |
| build:small | 145 KB | ✅ Yes | ⚠️ Partial | Systems with Bun |
| build | 55 MB | ❌ No | ✅ Yes | Distribution |
| build:all | 165 MB | ❌ No | ✅ Yes | Multi-platform dist |

---

## Further Optimization Ideas

If you need to reduce size even more:

### 1. Remove Zod (Advanced)
Replace Zod validation with native TypeScript types + runtime checks.
- **Savings**: Minimal (~10-20 KB in final bundle due to tree-shaking)
- **Effort**: High
- **Risk**: Moderate (less type safety)

### 2. Code Splitting (Advanced)
Split HTTP server and MCP server into separate entry points.
- **Savings**: ~50 KB per build
- **Effort**: Moderate
- **Use case**: If you only need one mode at a time

### 3. Remove Unused Tools (Simple)
Comment out fantasy tools you don't use in `src/tools/fantasy-tools.ts`.
- **Savings**: ~5-10 KB per tool
- **Effort**: Low
- **Risk**: Low

---

## Recommended Default Build

For most users, we recommend changing the default to:

```bash
bun run build:bundle
```

Then run with:
```bash
bun dist/index.js
```

This gives you the best balance of:
- ✅ Small size (145 KB)
- ✅ Fast uploads
- ✅ Easy updates
- ✅ Works on Railway/most clouds
