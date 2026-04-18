const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(process.cwd(), 'data', 'biology-sekho.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS poll_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    correct_option TEXT,
    total_votes INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    option TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES poll_sessions(id)
  );
`);

const createSessionStmt = db.prepare(
  'INSERT INTO poll_sessions (started_at) VALUES (?)'
);
const endSessionStmt = db.prepare(
  'UPDATE poll_sessions SET ended_at = ?, correct_option = ?, total_votes = ? WHERE id = ?'
);
const insertVoteStmt = db.prepare(
  `INSERT INTO poll_votes (session_id, username, option, elapsed_ms, created_at)
   VALUES (?, ?, ?, ?, ?)`
);

function createPollSession(startedAtIso) {
  const result = createSessionStmt.run(startedAtIso);
  return result.lastInsertRowid;
}

function saveVote({ sessionId, username, option, elapsedMs, createdAt }) {
  insertVoteStmt.run(sessionId, username, option, elapsedMs, createdAt);
}

function closePollSession({ sessionId, endedAt, correctOption, totalVotes }) {
  endSessionStmt.run(endedAt, correctOption, totalVotes, sessionId);
}

module.exports = {
  createPollSession,
  saveVote,
  closePollSession
};
