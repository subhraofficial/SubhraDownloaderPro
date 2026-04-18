function calculateLeaderboard(votesByUser, correctOption) {
  const entries = Object.values(votesByUser);

  return entries
    .map((vote) => {
      const isCorrect = vote.option === correctOption;
      const speedMs = Math.max(vote.elapsedMs, 1);
      const accuracyScore = isCorrect ? 1000 : 0;
      const speedScore = isCorrect ? Math.max(0, Math.round(600 - speedMs / 50)) : 0;
      const totalScore = accuracyScore + speedScore;

      return {
        username: vote.username,
        option: vote.option,
        isCorrect,
        elapsedMs: vote.elapsedMs,
        speedScore,
        accuracyScore,
        totalScore
      };
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.elapsedMs - b.elapsedMs;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function getFastestFinger(votesByUser, correctOption) {
  const correctVotes = Object.values(votesByUser)
    .filter((vote) => vote.option === correctOption)
    .sort((a, b) => a.elapsedMs - b.elapsedMs);

  return correctVotes[0] || null;
}

module.exports = {
  calculateLeaderboard,
  getFastestFinger
};
