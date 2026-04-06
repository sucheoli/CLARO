import { Tray, Menu, BrowserWindow, nativeImage, app } from "electron";
import path from "path";

let tray: Tray | null = null;

export function setupTray(
  overlayWindow: BrowserWindow,
  dashboardWindow: BrowserWindow
): Tray {
  // Use a blank icon if resource is not available
  const iconPath = path.join(__dirname, "../../resources/icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  const trayIcon = icon.isEmpty()
    ? nativeImage.createEmpty()
    : icon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip("CLARO - AI Learning Assistant");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide Overlay",
      accelerator: "Ctrl+Shift+H",
      click: () => {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide();
        } else {
          overlayWindow.show();
          overlayWindow.focus();
        }
      },
    },
    {
      label: "Open Dashboard",
      accelerator: "Ctrl+Shift+D",
      click: () => {
        dashboardWindow.show();
        dashboardWindow.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit CLARO",
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.show();
      overlayWindow.focus();
    }
  });

  return tray;
}
