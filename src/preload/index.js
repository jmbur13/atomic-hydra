// src/preload/index.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanForGames: () => ipcRenderer.invoke('scan-games'),
  showGameContextMenu: (game) => ipcRenderer.send('show-game-context-menu', game),
  markGameAsAdult: (gameId) => ipcRenderer.invoke('mark-game-as-adult', gameId),
  onGameMarkedAsAdult: (callback) => ipcRenderer.on('game-marked-as-adult', (_event, gameId) => callback(gameId)),
  launchGame: (gamePath) => ipcRenderer.send('launch-game', gamePath),
  openGameFolder: (gamePath) => ipcRenderer.send('open-game-folder', gamePath),
  selectGameFile: () => ipcRenderer.invoke('select-game-file'),
  addGame: (gameData) => ipcRenderer.invoke('add-game', gameData)
});