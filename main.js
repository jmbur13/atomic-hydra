// main.js

const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const VDF = require('vdf-parser');
const WinReg = require('winreg');

const RAWG_API_KEY = 'ef815d7fed9c4098918023f67b8373ad';
let mainWindow;

const userDataPath = app.getPath('userData');
const gameDataPath = path.join(userDataPath, 'gamedata.json');

function loadGameData() { try { if (fs.existsSync(gameDataPath)) { const data = JSON.parse(fs.readFileSync(gameDataPath, 'utf-8')); return { adultGames: [], categories: {}, ...data }; } } catch (error) { console.error("Erreur lecture sauvegarde:", error); } return { adultGames: [], categories: { 'Jeux Locaux': [] } }; }
function saveGameData(data) { try { fs.writeFileSync(gameDataPath, JSON.stringify(data, null, 2)); } catch (error) { console.error("Erreur écriture sauvegarde:", error); } }

async function findGamePoster(gameName) { if (!RAWG_API_KEY || RAWG_API_KEY === 'TON_API_KEY_PERSONNELLE') { return ''; } try { const searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`; const response = await fetch(searchUrl); if (!response.ok) { return ''; } const data = await response.json(); return (data.results && data.results.length > 0) ? data.results[0].background_image : ''; } catch (error) { return ''; } }

async function scanSteamGames(gameData) { try { const regKey = new WinReg({ hive: WinReg.HKCU, key: '\\Software\\Valve\\Steam' }); const steamPathItem = await new Promise((resolve, reject) => regKey.get('SteamPath', (err, item) => err ? reject(err) : resolve(item))); if (!steamPathItem) return []; const steamPath = steamPathItem.value.replace(/\//g, '\\'); const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf'); if (!fs.existsSync(libraryFoldersPath)) return []; const libraryFoldersData = VDF.parse(fs.readFileSync(libraryFoldersPath, 'utf-8')); const libraryPaths = [path.join(steamPath, 'steamapps'), ...Object.values(libraryFoldersData.libraryfolders).map(lib => path.join(lib.path, 'steamapps')).filter(p => fs.existsSync(p))]; let steamGames = []; for (const libraryPath of libraryPaths) { const manifestFiles = fs.readdirSync(libraryPath).filter(f => f.startsWith('appmanifest_') && f.endsWith('.acf')); for (const manifestFile of manifestFiles) { const manifestData = VDF.parse(fs.readFileSync(path.join(libraryPath, manifestFile), 'utf-8')).AppState; if (manifestData && manifestData.name && manifestData.appid) { const gameId = `steam-${manifestData.appid}`; steamGames.push({ id: gameId, title: manifestData.name, posterUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${manifestData.appid}/header.jpg`, path: path.join(libraryPath, 'common', manifestData.installdir), isAdult: gameData.adultGames.includes(gameId), }); } } } return steamGames; } catch (error) { console.error('Erreur scan Steam:', error); return []; } }
async function scanLocalGames(gameData) {
  try {
    const localCategories = [];
    const categories = gameData.categories || {};
    for (const categoryName in categories) {
      const gamePaths = categories[categoryName];
      const gamesFromCat = await Promise.all(gamePaths.map(async (gamePath) => {
        if (!fs.existsSync(gamePath)) return null;
        const title = path.basename(gamePath, '.exe');
        const posterUrl = await findGamePoster(title);
        return { id: gamePath, title, posterUrl, path: gamePath, isAdult: gameData.adultGames.includes(gamePath) };
      }));
      const validGames = gamesFromCat.filter(g => g !== null);
      if (validGames.length > 0) {
        localCategories.push({ name: categoryName, games: validGames });
      }
    }
    return localCategories;
  } catch (error) { console.error('Erreur scan local:', error); return []; }
}
async function scanEpicGames(gameData) { try { const manifestsPath = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'; if (!fs.existsSync(manifestsPath)) return []; const manifestFiles = fs.readdirSync(manifestsPath).filter(f => f.endsWith('.item')); return Promise.all(manifestFiles.map(async (manifestFile) => { const manifestData = JSON.parse(fs.readFileSync(path.join(manifestsPath, manifestFile), 'utf-8')); const gameId = `epic-${manifestData.AppName}`; const title = manifestData.DisplayName; const posterUrl = await findGamePoster(title); return { id: gameId, title, posterUrl, path: manifestData.InstallLocation, isAdult: gameData.adultGames.includes(gameId) }; })); } catch (error) { console.error('Erreur scan Epic:', error); return []; } }

async function handleScanGames() {
  const gameData = loadGameData();
  const [steamCategory, epicCategory, localCategories] = await Promise.all([
    scanSteamGames(gameData).then(games => ({ name: 'Steam', games })),
    scanEpicGames(gameData).then(games => ({ name: 'Epic Games', games })),
    scanLocalGames(gameData)
  ]);
  return [steamCategory, epicCategory, ...localCategories].filter(c => c && c.games && c.games.length > 0);
}

function handleMarkAsAdult(event, gameId) { const gameData = loadGameData(); if (!gameData.adultGames.includes(gameId)) { gameData.adultGames.push(gameId); saveGameData(gameData); return { success: true }; } return { success: false }; }

async function handleSelectFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Sélectionner un jeu à ajouter', properties: ['openFile'], filters: [{ name: 'Exécutables', extensions: ['exe'] }]
  });
  if (canceled || filePaths.length === 0) return null;
  return { path: filePaths[0] };
}

async function handleAddGame(event, gameData) {
  const data = loadGameData();
  const { path, category } = gameData;
  if (!data.categories) data.categories = {};
  if (!data.categories[category]) data.categories[category] = [];
  if (!data.categories[category].includes(path)) {
    data.categories[category].push(path);
    saveGameData(data);
  }
  return { success: true };
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1280, height: 800, webPreferences: { preload: path.join(__dirname, 'src/preload/index.js') } });
  const isDev = !app.isPackaged;
  if (isDev) { mainWindow.loadURL('http://localhost:5173'); mainWindow.webContents.openDevTools(); }
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  ipcMain.handle('scan-games', handleScanGames);
  ipcMain.handle('mark-game-as-adult', handleMarkAsAdult);
  ipcMain.handle('select-game-file', handleSelectFile);
  ipcMain.handle('add-game', handleAddGame);
  ipcMain.on('launch-game', (event, gamePath) => { if (gamePath) { shell.openPath(gamePath).catch(err => console.error(err)); } });
  ipcMain.on('open-game-folder', (event, gamePath) => { if (gamePath) { shell.openPath(gamePath).catch(err => console.error(err)); } });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.on('show-game-context-menu', (event, game) => {
  const isExecutable = game.path && game.path.endsWith('.exe');
  const template = [
    { label: isExecutable ? 'Lancer le jeu' : 'Ouvrir le dossier du jeu', click: () => { if (game.path) shell.openPath(game.path).catch(err => console.error(err)); }, enabled: !!game.path },
    { type: 'separator' },
    { label: "Ouvrir l'emplacement du fichier", click: () => { if (game.path) shell.showItemInFolder(game.path) }, enabled: !!game.path },
    { type: 'separator' },
    { label: 'Marquer comme Adulte', enabled: !game.isAdult, click: () => mainWindow.webContents.send('game-marked-as-adult', game.id) }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});