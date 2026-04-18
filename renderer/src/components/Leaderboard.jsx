import { motion } from 'framer-motion';

export default function Leaderboard({ leaderboard, onReset }) {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  return (
    <div className="w-full no-drag">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
        <button onClick={onReset} className="rounded-lg bg-white px-3 py-1 font-bold text-olive">
          ✕
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {top3.map((entry, idx) => (
          <motion.div
            key={entry.username}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.15 }}
            className={`rounded-xl p-3 text-center ${idx === 0 ? 'bg-gold text-olive' : 'bg-white/20 text-white'}`}
          >
            <div className="text-2xl font-extrabold">#{entry.rank}</div>
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="text-xs">{entry.totalScore} pts</div>
          </motion.div>
        ))}
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-white/10 p-3">
        {rest.map((entry) => (
          <div key={entry.username} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-white">
            <div>
              <span className="mr-2 font-bold">#{entry.rank}</span>
              <span>{entry.username}</span>
            </div>
            <div className="font-bold">{entry.totalScore}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
