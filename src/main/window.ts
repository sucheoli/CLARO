import { BrowserWindow, screen, ipcMain } from "electron";
import path from "path";
import { WINDOW_SIZES, IPC_CHANNELS } from "../shared/constants";

const isDev = process.env.NODE_ENV === "development";

export function createOverlayWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: WINDOW_SIZES.OVERLAY_ICON.width,
    height: WINDOW_SIZES.OVERLAY_ICON.height,
    x: sw - WINDOW_SIZES.OVERLAY_ICON.width - 24,
    y: sh - WINDOW_SIZES.OVERLAY_ICON.height - 24,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173/src/renderer/overlay/index.html");
  } else {
    win.loadFile(
      path.join(__dirname, "../../dist/renderer/overlay/index.html")
    );
  }

  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);

  // 상태별 창 크기 조정 (현재 위치 유지, guide만 재배치)
  ipcMain.handle(IPC_CHANNELS.WINDOW_RESIZE, (_event, mode: "icon" | "recording" | "guide") => {
    const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
    const [curX, curY] = win.getPosition();

    if (mode === "guide") {
      const w = WINDOW_SIZES.OVERLAY_GUIDE.width;
      const h = WINDOW_SIZES.OVERLAY_GUIDE.height;
      // 화면 밖으로 나가지 않도록 보정
      const x = Math.min(curX, screenW - w - 8);
      const y = Math.min(curY, screenH - h - 8);
      win.setSize(w, h);
      win.setPosition(x, y);
    } else if (mode === "recording") {
      const w = WINDOW_SIZES.OVERLAY_RECORDING.width;
      const h = WINDOW_SIZES.OVERLAY_RECORDING.height;
      win.setSize(w, h);
    } else {
      const w = WINDOW_SIZES.OVERLAY_ICON.width;
      const h = WINDOW_SIZES.OVERLAY_ICON.height;
      win.setSize(w, h);
    }
    return { success: true };
  });

  return win;
}

export function createDashboardWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: WINDOW_SIZES.DASHBOARD.width,
    height: WINDOW_SIZES.DASHBOARD.height,
    show: false,
    center: true,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173/src/renderer/dashboard/index.html");
  } else {
    win.loadFile(
      path.join(__dirname, "../../dist/renderer/dashboard/index.html")
    );
  }

  win.on("close", (event) => {
    event.preventDefault();
    win.hide();
  });

  return win;
}
