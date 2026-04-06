import { app, globalShortcut, BrowserWindow } from "electron";
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env") });
import { createOverlayWindow, createDashboardWindow } from "./window";
import { setupTray } from "./tray";
import { registerIPCHandlers } from "./ipc";
import { SHORTCUTS } from "../shared/constants";

let overlayWindow: BrowserWindow | null = null;
let dashboardWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  // Create windows
  overlayWindow = createOverlayWindow();
  dashboardWindow = createDashboardWindow();

  // Setup system tray
  setupTray(overlayWindow, dashboardWindow);

  // Register IPC handlers
  registerIPCHandlers(overlayWindow, dashboardWindow);

  // Register global shortcut: Ctrl+Shift+H to toggle overlay
  globalShortcut.register(SHORTCUTS.TOGGLE_OVERLAY, () => {
    if (!overlayWindow) return;
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.show();
      overlayWindow.focus();
    }
  });

  // Register global shortcut: Ctrl+Shift+D to open dashboard
  globalShortcut.register(SHORTCUTS.OPEN_DASHBOARD, () => {
    if (!dashboardWindow) return;
    if (dashboardWindow.isVisible()) {
      dashboardWindow.focus();
    } else {
      dashboardWindow.show();
      dashboardWindow.focus();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      overlayWindow = createOverlayWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("uncaughtException", (error) => {
  console.error("[Main] Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Main] Unhandled rejection:", reason);
});
