const { google } = require('googleapis');

const VALID_OPTIONS = new Set(['A', 'B', 'C', 'D']);

class YouTubePollCollector {
  constructor({ apiKey, liveChatId, onVote, onError }) {
    this.youtube = google.youtube({ version: 'v3', auth: apiKey });
    this.liveChatId = liveChatId;
    this.onVote = onVote;
    this.onError = onError;
    this.isRunning = false;
    this.nextPageToken = undefined;
    this.pollStartEpoch = 0;
    this.votesByUser = {};
  }

  start() {
    this.isRunning = true;
    this.pollStartEpoch = Date.now();
    this.nextPageToken = undefined;
    this.votesByUser = {};
    this.pollLoop();
  }

  stop() {
    this.isRunning = false;
    return this.votesByUser;
  }

  async pollLoop() {
    while (this.isRunning) {
      try {
        const response = await this.youtube.liveChatMessages.list({
          liveChatId: this.liveChatId,
          part: ['id', 'snippet', 'authorDetails'],
          pageToken: this.nextPageToken
        });

        const data = response.data;
        this.nextPageToken = data.nextPageToken;
        const pollingIntervalMs = data.pollingIntervalMillis || 2000;
        const items = data.items || [];

        for (const message of items) {
          this.processMessage(message);
        }

        await sleep(pollingIntervalMs);
      } catch (error) {
        this.onError(error.message || 'YouTube polling failed');
        await sleep(2500);
      }
    }
  }

  processMessage(message) {
    const username = message?.authorDetails?.displayName?.trim();
    const text = (message?.snippet?.displayMessage || '').trim().toUpperCase();

    if (!username || !VALID_OPTIONS.has(text)) return;
    if (this.votesByUser[username]) return;

    const elapsedMs = Date.now() - this.pollStartEpoch;
    const vote = {
      username,
      option: text,
      elapsedMs,
      createdAt: new Date().toISOString()
    };

    this.votesByUser[username] = vote;
    this.onVote(vote, this.votesByUser);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  YouTubePollCollector
};
