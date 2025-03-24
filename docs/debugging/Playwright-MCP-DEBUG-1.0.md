# Playwright MCP Server Debug Journal

## **05-17-2024**

### Issue Overview
- **Problem Statement**: Playwright MCP servers showing yellow status, potentially due to missing dependencies
- **Symptoms**: Yellow status indicators for both EA and MS Playwright MCP servers
- **System Impact**: Potential instability or unavailability of browser automation capabilities
- **Configuration**: Two Playwright MCP servers configured in mcp.json
  - playwright-ea: Using @executeautomation/playwright-mcp-server
  - playwright-ms: Using @playwright/mcp@latest

### Context & Environment
- **System**: Linux 6.8.0-55-generic
- **Current Configuration**:
```json
{
  "playwright-ea": {
    "command": "npx",
    "args": ["@executeautomation/playwright-mcp-server"],
    "env": {
      "PLAYWRIGHT_BROWSERS_PATH": "0",
      "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "0"
    }
  },
  "playwright-ms": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--headless", "--vision"],
    "env": {
      "PLAYWRIGHT_WS_ENDPOINT": "ws://localhost:4444",
      "PLAYWRIGHT_BROWSERS_PATH": "0",
      "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "0"
    }
  }
}
```

### Investigation Plan
1. ✅ Install system-level dependencies for Playwright
2. ✅ Clean and reinstall Playwright packages
3. ✅ Install browser dependencies
4. ✅ Update MCP configuration with more specific settings
5. ✅ Check debug logs for both servers

### Timeline Log
```
2024-05-17 [STARTED]
- Identified potential dependency issues
- Created debug journal
- Planning systematic dependency installation and configuration updates

2024-05-17 [IN PROGRESS]
- Installed system dependencies
- Cleaned and reinstalled Playwright packages
- Installed browser dependencies and their system requirements
- Updated MCP configuration with specific settings

2024-05-17 [RESOLVED]
- Both Playwright MCP servers now showing green status
- Successfully resolved dependency and configuration issues
```

### Final Documentation
- **Root Cause**: Missing system dependencies and incomplete browser installations
- **Solution Implemented**:
  1. Installed required system dependencies
  2. Reinstalled Playwright packages with proper permissions
  3. Installed browser dependencies with explicit paths
  4. Updated configuration with specific browser settings
- **Verification**: Both Playwright MCP servers showing green status
- **Prevention Strategy**:
  1. Always ensure system dependencies are installed
  2. Use explicit browser paths in configuration
  3. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "0"` to ensure proper browser installation
- **Knowledge Gained**:
  1. Playwright requires specific system dependencies for browser automation
  2. Browser installation paths need to be explicitly configured
  3. Both EA and MS Playwright servers benefit from similar environment configurations
