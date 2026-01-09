import { useEffect, useMemo, useState } from 'react';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const randomSquare = () => {
  const file = FILES[Math.floor(Math.random() * FILES.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  return { file, rank };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getReducedLabels = (level) => {
  if (level < 5) {
    return { files: [], ranks: [] };
  }
  if (level < 7) {
    return {
      files: FILES.filter((_, index) => index % 2 === 0),
      ranks: RANKS.filter((_, index) => index % 2 === 0),
    };
  }
  if (level < 9) {
    return { files: ['a', 'd', 'h'], ranks: [8, 5, 1] };
  }
  return { files: ['a', 'h'], ranks: [8, 1] };
};

const getFlashDuration = (level) => {
  if (level <= 2) {
    return null;
  }
  const duration = 2600 - level * 200;
  return clamp(duration, 600, 2400);
};

const getHintDelay = (level) => clamp(2400 - level * 160, 700, 2400);

export default function App() {
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(() => randomSquare());
  const [feedback, setFeedback] = useState('Tap the square that matches the notation!');
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [lockBoard, setLockBoard] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const accuracy = attempts === 0 ? 0 : Math.round((correctCount / attempts) * 100);

  const reducedLabels = useMemo(() => getReducedLabels(level), [level]);

  useEffect(() => {
    setLabelsVisible(true);
    const duration = getFlashDuration(level);
    if (!duration) {
      return undefined;
    }
    const timer = setTimeout(() => setLabelsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [level, target]);

  useEffect(() => {
    setHintRevealed(false);
    const delay = getHintDelay(level);
    const timer = setTimeout(() => setHintRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [level, target]);

  const displayedFiles = labelsVisible ? FILES : reducedLabels.files;
  const displayedRanks = labelsVisible ? RANKS : reducedLabels.ranks;

  const handleSquarePick = (file, rank) => {
    if (lockBoard) return;
    setLockBoard(true);
    const picked = `${file}${rank}`;
    const answer = `${target.file}${target.rank}`;
    const isCorrect = picked === answer;
    const hintUsed = hintRevealed;

    setAttempts((prev) => prev + 1);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setLevel((prev) => clamp(prev + 1, 1, 10));
      const points = hintUsed ? 4 : 10;
      setScore((prev) => prev + points);
      setFeedback(
        `✅ Nailed it! ${picked} is correct. +${points} ${hintUsed ? 'for brave guessing' : 'for speed'}.`,
      );
    } else {
      setStreak(0);
      setLevel((prev) => clamp(prev - 1, 1, 10));
      setScore((prev) => clamp(prev - 4, 0, 9999));
      setFeedback(`❌ Oops! That was ${picked}. The right square was ${answer}. -4 points.`);
    }

    setTimeout(() => {
      setTarget(randomSquare());
      setLockBoard(false);
    }, 700);
  };

  const labelMode = labelsVisible
    ? 'Full glow'
    : reducedLabels.files.length === 0
      ? 'No hints'
      : 'Ghost hints';

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="tag">NotaChess</p>
          <h1>Learn chess notation like a neon ninja.</h1>
          <p className="sub">
            Read the target, find the square, and level up. Lose focus and the board will fade the
            hints.
          </p>
        </div>
        <div className="badge">
          <span className="badge-label">Level</span>
          <span className="badge-value">{level}</span>
          <span className="badge-mode">{labelMode}</span>
        </div>
      </header>

      <main className="game">
        <section className="hud">
          <div className="hud-card">
            <p className="hud-title">Target</p>
            <p className="hud-value target">{hintRevealed ? `${target.file}${target.rank}` : '??'}</p>
            <p className="hud-sub">
              {hintRevealed ? 'Hint is live' : 'Hint loading…'}
            </p>
          </div>
          <div className="hud-card">
            <p className="hud-title">Score</p>
            <p className="hud-value">{score}</p>
          </div>
          <div className="hud-card">
            <p className="hud-title">Streak</p>
            <p className="hud-value">{streak}</p>
          </div>
          <div className="hud-card">
            <p className="hud-title">Accuracy</p>
            <p className="hud-value">{accuracy}%</p>
          </div>
        </section>

        <section className="board-area">
          <div className={`board ${lockBoard ? 'locked' : ''}`}>
            {RANKS.map((rank) => (
              <div key={rank} className="rank-row">
                <div className="rank-label">
                  {displayedRanks.includes(rank) ? rank : ''}
                </div>
                <div className="rank-squares">
                  {FILES.map((file, fileIndex) => {
                    const isDark = (fileIndex + rank) % 2 === 1;
                    const isTarget = target.file === file && target.rank === rank;
                    return (
                      <button
                        key={`${file}${rank}`}
                        type="button"
                        className={`square ${isDark ? 'dark' : 'light'} ${isTarget ? 'target' : ''}`}
                        onClick={() => handleSquarePick(file, rank)}
                        aria-label={`Square ${file}${rank}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="file-labels">
              {FILES.map((file) => (
                <span key={file} className="file-label">
                  {displayedFiles.includes(file) ? file : ''}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="feedback">
          <p>{feedback}</p>
          <p className="hint">
            Guess before the hint appears for max points. Hints fade faster as you level up.
          </p>
        </section>
      </main>
    </div>
  );
}
