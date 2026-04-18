const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain } = require('electron');
const { YouTubePollCollector } = require('./youtubeService');
const { createPollSession, saveVote, closePollSession } = require('./db');
const { calculateLeaderboard, getFastestFinger } = require('./scoring');

let mainWindow;
let collector;
let currentSessionId = null;
let votesByUser = {};
let pollStartedAt = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 560,
    height: 840,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.loadURL('http://localhost:5173');
}

function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.whenReady().then(() => {
  ensureDataDir();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('poll:start', async (_event, payload) => {
  const { apiKey, liveChatId } = payload;

  if (!apiKey || !liveChatId) {
    throw new Error('apiKey and liveChatId are required');
  }

  if (collector) {
    collector.stop();
  }

  pollStartedAt = new Date();
  currentSessionId = createPollSession(pollStartedAt.toISOString());
  votesByUser = {};

  collector = new YouTubePollCollector({
    apiKey,
    liveChatId,
    onVote: (vote, allVotes) => {
      votesByUser = { ...allVotes };
      saveVote({
        sessionId: currentSessionId,
        username: vote.username,
        option: vote.option,
        elapsedMs: vote.elapsedMs,
        createdAt: vote.createdAt
      });

      mainWindow.webContents.send('poll:vote-update', {
        totalVotes: Object.keys(votesByUser).length,
        latestVote: vote
      });
    },
    onError: (error) => {
      mainWindow.webContents.send('poll:error', error);
    }
  });

  collector.start();
  return { ok: true, startedAt: pollStartedAt.toISOString() };
});

ipcMain.handle('poll:stop', async () => {
  if (collector) {
    votesByUser = collector.stop();
  }

  return {
    ok: true,
    totalVotes: Object.keys(votesByUser).length
  };
});

ipcMain.handle('poll:finalize', async (_event, { correctOption }) => {
  const upper = (correctOption || '').toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(upper)) {
    throw new Error('correctOption must be A/B/C/D');
  }

  const counts = { A: 0, B: 0, C: 0, D: 0 };
  Object.values(votesByUser).forEach((vote) => {
    counts[vote.option] += 1;
  });

  const totalVotes = Object.keys(votesByUser).length;
  const percentages = Object.fromEntries(
    Object.entries(counts).map(([option, count]) => [
      option,
      totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
    ])
  );

  const leaderboard = calculateLeaderboard(votesByUser, upper);
  const fastest = getFastestFinger(votesByUser, upper);

  closePollSession({
    sessionId: currentSessionId,
    endedAt: new Date().toISOString(),
    correctOption: upper,
    totalVotes
  });

  return {
    ok: true,
    correctOption: upper,
    counts,
    percentages,
    totalVotes,
    fastestFinger: fastest,
    leaderboard
  };
});

ipcMain.handle('poll:reset', async () => {
  if (collector) collector.stop();
  collector = null;
  votesByUser = {};
  currentSessionId = null;
  pollStartedAt = null;
  return { ok: true };
});
