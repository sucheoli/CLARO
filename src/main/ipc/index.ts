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

  // 현재 오버레이 위치 반환
  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_POSITION, () => {
    const [x, y] = overlayWindow.getPosition();
    return { x, y };
  });

  // 드래그로 오버레이 위치 이동 (절대 좌표)
  ipcMain.handle(IPC_CHANNELS.WINDOW_MOVE, (_event, x: number, y: number) => {
    overlayWindow.setPosition(Math.round(x), Math.round(y));
    return { success: true };
  });

  // 드래그로 오버레이 위치 이동 (상대 이동)
  ipcMain.handle(IPC_CHANNELS.WINDOW_MOVE_BY, (_event, dx: number, dy: number) => {
    const [x, y] = overlayWindow.getPosition();
    overlayWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
    return { success: true };
  });

  console.log("[IPC] All handlers registered");
}
