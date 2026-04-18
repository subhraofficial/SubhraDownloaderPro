import { motion } from 'framer-motion';

const options = ['A', 'B', 'C', 'D'];

export default function ResultsGraph({ percentages, correctOption, fastestFinger, onShowLeaderboard }) {
  return (
    <div className="w-full no-drag">
      <h2 className="mb-4 text-center text-3xl font-bold text-white">Results</h2>

      <div className="space-y-3 rounded-2xl bg-white/10 p-4">
        {options.map((option) => {
          const value = percentages[option] ?? 0;
          const isCorrect = option === correctOption;

          return (
            <div key={option} className="flex items-center gap-3">
              <div className="w-8 text-xl font-bold text-white">{option}</div>
              <div className="h-10 flex-1 overflow-hidden rounded-xl bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${isCorrect ? 'bg-green-500' : 'bg-gold'}`}
                />
              </div>
              <div className="w-14 text-right text-lg font-bold text-white">{value}%</div>
            </div>
          );
        })}
      </div>

      {fastestFinger && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-gold/60 bg-gold/20 px-4 py-2 text-center text-white"
        >
          ⚡ Fastest Finger: <b>{fastestFinger.username}</b>
        </motion.div>
      )}

      <button
        onClick={onShowLeaderboard}
        className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-xl font-bold text-olive"
      >
        Show Leaderboard
      </button>
    </div>
  );
}
