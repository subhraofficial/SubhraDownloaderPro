import { motion } from 'framer-motion';

export default function TimerCircle({ totalSeconds, remainingSeconds, voteCount, onStop }) {
  const progress = remainingSeconds / totalSeconds;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6 no-drag">
      <div className="relative h-64 w-64">
        <svg className="-rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r={radius} stroke="#ffffff33" strokeWidth="14" fill="none" />
          <motion.circle
            cx="130"
            cy="130"
            r={radius}
            stroke="#FFCC28"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ ease: 'linear', duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-6xl font-extrabold text-gold">{remainingSeconds}</span>
          <span className="text-sm font-semibold">sec left</span>
          <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-sm">Votes: {voteCount}</span>
        </div>
      </div>

      <button
        onClick={onStop}
        className="rounded-xl bg-red-500 px-8 py-3 text-xl font-bold text-white shadow-lg active:scale-95"
      >
        Stop Poll
      </button>
    </div>
  );
}
