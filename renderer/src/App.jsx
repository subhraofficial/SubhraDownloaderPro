import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TimerCircle from './components/TimerCircle';
import ResultsGraph from './components/ResultsGraph';
import Leaderboard from './components/Leaderboard';

const APP_STATE = {
  IDLE: 'IDLE',
  ACTIVE_POLL: 'ACTIVE_POLL',
  ANSWER_SELECTION: 'ANSWER_SELECTION',
  RESULTS_GRAPH: 'RESULTS_GRAPH',
  LEADERBOARD: 'LEADERBOARD'
};

const presets = [15, 30, 60, 90];

export default function App() {
  const [appState, setAppState] = useState(APP_STATE.IDLE);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [voteCount, setVoteCount] = useState(0);
  const [error, setError] = useState('');

  const [apiKey, setApiKey] = useState('');
  const [liveChatId, setLiveChatId] = useState('');

  const [pollResult, setPollResult] = useState({
    percentages: { A: 0, B: 0, C: 0, D: 0 },
    fastestFinger: null,
    leaderboard: []
  });

  useEffect(() => {
    const offVote = window.pollApi.onVoteUpdate(({ totalVotes }) => {
      setVoteCount(totalVotes);
    });

    const offError = window.pollApi.onPollError((pollError) => {
      setError(String(pollError));
    });

    return () => {
      offVote();
      offError();
    };
  }, []);

  useEffect(() => {
    if (appState !== APP_STATE.ACTIVE_POLL) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopPollAndMoveToAnswerSelection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState]);

  const stateTitle = useMemo(() => {
    switch (appState) {
      case APP_STATE.IDLE:
        return 'Biology Sekho - Ready';
      case APP_STATE.ACTIVE_POLL:
        return 'Polling Live';
      case APP_STATE.ANSWER_SELECTION:
        return 'Select Correct Answer';
      case APP_STATE.RESULTS_GRAPH:
        return 'Results Distribution';
      case APP_STATE.LEADERBOARD:
        return 'Top Performers';
      default:
        return '';
    }
  }, [appState]);

  async function startPoll() {
    setError('');
    setRemainingSeconds(selectedDuration);
    setVoteCount(0);
    setPollResult({ percentages: { A: 0, B: 0, C: 0, D: 0 }, fastestFinger: null, leaderboard: [] });

    try {
      await window.pollApi.startPoll({ apiKey, liveChatId });
      setAppState(APP_STATE.ACTIVE_POLL);
    } catch (e) {
      setError(e.message);
    }
  }

  async function stopPollAndMoveToAnswerSelection() {
    try {
      await window.pollApi.stopPoll();
      setAppState(APP_STATE.ANSWER_SELECTION);
    } catch (e) {
      setError(e.message);
    }
  }

  async function finalize(correctOption) {
    try {
      const result = await window.pollApi.finalizePoll(correctOption);
      setPollResult(result);
      setAppState(APP_STATE.RESULTS_GRAPH);
    } catch (e) {
      setError(e.message);
    }
  }

  async function reset() {
    await window.pollApi.resetPoll();
    setAppState(APP_STATE.IDLE);
    setVoteCount(0);
    setRemainingSeconds(selectedDuration);
    setPollResult({ percentages: { A: 0, B: 0, C: 0, D: 0 }, fastestFinger: null, leaderboard: [] });
  }

  return (
    <div className="widget-shell h-screen w-screen p-4 text-white">
      <motion.div
        layout
        className="mx-auto h-full max-w-lg rounded-3xl border border-white/20 bg-panel p-5 shadow-2xl backdrop-blur-md"
      >
        <h1 className="mb-4 text-center text-2xl font-extrabold">{stateTitle}</h1>

        {error && <div className="mb-3 rounded-lg bg-red-500/60 px-3 py-2 text-sm">{error}</div>}

        <AnimatePresence mode="wait">
          {appState === APP_STATE.IDLE && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 no-drag">
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="YouTube API Key"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70"
              />
              <input
                value={liveChatId}
                onChange={(e) => setLiveChatId(e.target.value)}
                placeholder="Live Chat ID"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70"
              />

              <div className="grid grid-cols-2 gap-3">
                {presets.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setSelectedDuration(sec);
                      setRemainingSeconds(sec);
                    }}
                    className={`rounded-xl px-4 py-3 text-lg font-bold ${
                      selectedDuration === sec ? 'bg-gold text-olive' : 'bg-white/10 text-white'
                    }`}
                  >
                    {sec === 60 ? '1 min' : sec === 90 ? '1 min 30 sec' : `${sec} sec`}
                  </button>
                ))}
              </div>

              <button
                onClick={startPoll}
                disabled={!apiKey || !liveChatId}
                className="w-full rounded-2xl bg-white px-4 py-4 text-2xl font-extrabold text-olive disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Poll
              </button>
            </motion.div>
          )}

          {appState === APP_STATE.ACTIVE_POLL && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TimerCircle
                totalSeconds={selectedDuration}
                remainingSeconds={remainingSeconds}
                voteCount={voteCount}
                onStop={stopPollAndMoveToAnswerSelection}
              />
            </motion.div>
          )}

          {appState === APP_STATE.ANSWER_SELECTION && (
            <motion.div key="answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="no-drag">
              <p className="mb-4 text-center text-lg">Tap the correct answer:</p>
              <div className="grid grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => finalize(opt)}
                    className="rounded-2xl bg-gold px-4 py-8 text-4xl font-extrabold text-olive"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {appState === APP_STATE.RESULTS_GRAPH && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsGraph
                percentages={pollResult.percentages}
                correctOption={pollResult.correctOption}
                fastestFinger={pollResult.fastestFinger}
                onShowLeaderboard={() => setAppState(APP_STATE.LEADERBOARD)}
              />
            </motion.div>
          )}

          {appState === APP_STATE.LEADERBOARD && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Leaderboard leaderboard={pollResult.leaderboard} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
