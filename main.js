const path = require("path");
const os = require("os");

const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const slash = require("slash");

process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isWin = process.platform === "win32" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "ImageShrink App",
    width: isDev ? 1240 : 500,
    height: isDev ? 900 : 600,
    icon: "./assets/icons/Icon_256x256.png",
    resizeble: isDev ? true : false,
    backgroundColor: "#fff",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "about ImageShrinkApp",
    width: 300,
    height: 300,
    icon: "./assets/icons/Icon_256x256.png",
    resizeble: false,
    backgroundColor: "#3c3c3c",
  });
  aboutWindow.loadURL(`file://${__dirname}/app/about.html`);
}

app.on("ready", () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  //const {globalShortcut} = require('electron');

  // globalShortcut.register('CmdOrCtrl+R', ()=> mainWindow.reload())
  // globalShortcut.register(isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I', ()=> mainWindow.toggleDevTools())

  mainWindow.on("ready", () => (mainWindow = null));
});

const menu = [
  ...(!isMac
    ? [
        {
          label: "Electron",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "FAQ",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [{ role: "reload" }, { role: "forceReload" }, { type: "separator" }, { role: "toggleDevTools" }],
        },
      ]
    : []),
];

if (isMac) {
  menu.unshift({ role: "appMenu" });
}
//Listening script from index.html========================
ipcMain.on("image:minimize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageShrink");
  shrinkImage(options);
});

//Imagemin plugin==========================================

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;
    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [imageminMozjpeg({ quality }), imageminPngquant({ quality: [pngQuality, pngQuality] })],
    });
    console.log(files);
    shell.openPath(dest);
  } catch (error) {
    console.log(error);
  }
}

//=========================================================

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.etAllWindows().length === 0) {
    createMainWindow();
  }
});
