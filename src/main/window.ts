import { BrowserWindow, screen } from "electron";
import path from "path";
import { WINDOW_SIZES } from "../shared/constants";

const isDev = process.env.NODE_ENV === "development";

export function createOverlayWindow(): BrowserWindow {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: WINDOW_SIZES.OVERLAY.width,
    height: WINDOW_SIZES.OVERLAY.height,
    x: screenWidth - WINDOW_SIZES.OVERLAY.width - 20,
    y: 20,
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
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(
      path.join(__dirname, "../../dist/renderer/overlay/index.html")
    );
  }

  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);

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
