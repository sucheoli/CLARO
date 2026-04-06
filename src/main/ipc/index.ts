import { ipcMain, BrowserWindow } from "electron";
import { registerCaptureHandlers } from "./capture";
import { registerAIHandlers } from "./ai";
import { IPC_CHANNELS } from "../../shared/constants";

export function registerIPCHandlers(
  overlayWindow: BrowserWindow,
  dashboardWindow: BrowserWindow
): void {
  // Register domain-specific handlers
  registerCaptureHandlers(overlayWindow);
  registerAIHandlers(overlayWindow, dashboardWindow);

  // Window management handlers
  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_OVERLAY, () => {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.show();
      overlayWindow.focus();
    }
    return { visible: overlayWindow.isVisible() };
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN_DASHBOARD, () => {
    dashboardWindow.show();
    dashboardWindow.focus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (_event, windowType: string) => {
    if (windowType === "overlay") {
      overlayWindow.minimize();
    } else if (windowType === "dashboard") {
      dashboardWindow.minimize();
    }
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (_event, windowType: string) => {
    if (windowType === "overlay") {
      overlayWindow.hide();
    } else if (windowType === "dashboard") {
      dashboardWindow.hide();
    }
    return { success: true };
  });

  console.log("[IPC] All handlers registered");
}
