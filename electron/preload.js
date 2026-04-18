const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pollApi', {
  startPoll: (payload) => ipcRenderer.invoke('poll:start', payload),
  stopPoll: () => ipcRenderer.invoke('poll:stop'),
  finalizePoll: (correctOption) => ipcRenderer.invoke('poll:finalize', { correctOption }),
  resetPoll: () => ipcRenderer.invoke('poll:reset'),
  onVoteUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('poll:vote-update', handler);
    return () => ipcRenderer.removeListener('poll:vote-update', handler);
  },
  onPollError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on('poll:error', handler);
    return () => ipcRenderer.removeListener('poll:error', handler);
  }
});
