const lessons = [
  { id: 1, title: 'Lesson 1: Qubits', content: 'A qubit is the basic unit of quantum information.' },
  { id: 2, title: 'Lesson 2: Superposition', content: 'Superposition allows a qubit to be in multiple states at once.' },
  { id: 3, title: 'Lesson 3: Entanglement', content: 'Entanglement links qubits so that the state of one affects the other.' }
];

const quizzes = [
  {
    question: 'What is a qubit?',
    answers: ['Classical bit', 'Quantum bit', 'Coin'],
    correct: 1,
    explanation: 'A qubit is the quantum version of a classical bit.'
  },
  {
    question: 'What concept allows multiple states?',
    answers: ['Entanglement', 'Superposition', 'Classical mechanics'],
    correct: 1,
    explanation: 'Superposition lets a qubit be 0 and 1 simultaneously.'
  },
  {
    question: 'Which phenomenon links qubits together?',
    answers: ['Superposition', 'Classical mechanics', 'Entanglement'],
    correct: 2,
    explanation: 'Entangled qubits affect each other no matter the distance.'
  }
];

const funFacts = [
  'Quantum computers use qubits instead of classical bits.',
  'Entanglement was once called "spooky action at a distance" by Einstein.',
  'Superposition means a qubit can represent 0 and 1 at the same time.'
];

function Lesson({ lesson, onComplete }) {
  return (
    <div className="lesson">
      <h2>{lesson.title}</h2>
      <p>{lesson.content}</p>
      <button onClick={onComplete}>Complete Lesson</button>
    </div>
  );
}

function Quiz({ quiz, onComplete }) {
  const [selected, setSelected] = React.useState(null);
  const submit = () => {
    if (selected !== null) {
      const correct = selected === quiz.correct;
      onComplete(correct, quiz.explanation);
    }
  };
  return (
    <div className="quiz">
      <h3>{quiz.question}</h3>
      {quiz.answers.map((ans, idx) => (
        <label key={idx} className="quiz-answer">
          <input
            type="radio"
            name="answer"
            value={idx}
            onChange={() => setSelected(idx)}
          />{' '}
          {ans}
        </label>
      ))}
      <button onClick={submit}>Submit</button>
    </div>
  );
}

function CharacterGuide({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Character Guide</h3>
        <p>Meet our mascot Q-Bit who will guide you through quantum concepts!</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function InAppPurchase({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Upgrade</h3>
        <p>Unlock more lessons with the premium pack.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function RulesModal({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Game Rules</h3>
        <ol>
          <li>Finish lessons to unlock quizzes.</li>
          <li>Correct answers earn points and may trigger a bonus.</li>
          <li>Reset progress at any time.</li>
        </ol>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function FunFact({ fact, onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Fun Fact</h3>
        <p>{fact}</p>
        <button onClick={onClose}>Next</button>
      </div>
    </div>
  );
}

function CoinFlipModal({ result, onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Coin Flip</h3>
        <p>Result: {result}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function DiceRollModal({ result, onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Dice Roll</h3>
        <p>You rolled: {result}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function ResourcesModal({ onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Further Reading</h3>
        <ul>
          <li>Quantum Computation and Quantum Information - Nielsen &amp; Chuang</li>
          <li>Quantum Mechanics: The Theoretical Minimum - Susskind &amp; Friedman</li>
          <li>Qiskit.org tutorials</li>
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="progress-container">
      <div className="progress" aria-label={`Progress: ${Math.round(progress)}%`}>
        <div className="progress-inner" style={{ width: progress + '%' }}></div>
      </div>
      <span className="progress-text">{Math.round(progress)}%</span>
    </div>
  );
}

function Header({ progress }) {
  return (
    <header className="header">
      <h1>Quantum Fun Adventures</h1>
      <ProgressBar progress={progress} />
    </header>
  );
}

function Footer({ score, onGuide, onUpgrade, onReset, onFlip, onRoll, onResources, onRules }) {
  return (
    <footer className="footer">
      <button onClick={onGuide}>Guide</button>
      <span>Score: {score}</span>
      <button onClick={onUpgrade}>Upgrade</button>
      <button onClick={onReset}>Reset Progress</button>
      <button onClick={onFlip}>Flip Coin</button>
      <button onClick={onRoll}>Roll Dice</button>
      <button onClick={onResources}>Resources</button>
      <button onClick={onRules}>Rules</button>
    </footer>
  );
}

function QuizResult({ result, onNext }) {
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>{result.correct ? 'Correct!' : 'Incorrect'}</h3>
        <p>{result.explanation}</p>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
}

function App() {
  const [lessonIdx, setLessonIdx] = React.useState(() =>
    parseInt(localStorage.getItem('lessonIdx')) || 0
  );
  const [quizIdx, setQuizIdx] = React.useState(() =>
    parseInt(localStorage.getItem('quizIdx')) || 0
  );
  const [score, setScore] = React.useState(() =>
    parseInt(localStorage.getItem('score')) || 0
  );
  const [showGuide, setShowGuide] = React.useState(false);
  const [showPurchase, setShowPurchase] = React.useState(false);
  const [fact, setFact] = React.useState('');
  const [showFact, setShowFact] = React.useState(false);
  const [quizResult, setQuizResult] = React.useState(null);
  const [coinResult, setCoinResult] = React.useState(null);
  const [diceResult, setDiceResult] = React.useState(null);
  const [showResources, setShowResources] = React.useState(false);
  const [showRules, setShowRules] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('lessonIdx', lessonIdx);
    localStorage.setItem('quizIdx', quizIdx);
    localStorage.setItem('score', score);
  }, [lessonIdx, quizIdx, score]);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === 'g') setShowGuide(true);
      if (e.key === 'r') setShowRules(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const resetProgress = () => {
    setLessonIdx(0);
    setQuizIdx(0);
    setScore(0);
    localStorage.removeItem('lessonIdx');
    localStorage.removeItem('quizIdx');
    localStorage.removeItem('score');
  };

  const completeLesson = () => {
    setLessonIdx(lessonIdx + 1);
    const f = funFacts[Math.floor(Math.random() * funFacts.length)];
    setFact(f);
    setShowFact(true);
  };

  const completeQuiz = (correct, explanation) => {
    let newScore = score + (correct ? 1 : 0);
    if (correct) {
      newScore += secretSauceBonus();
    }
    setScore(newScore);
    setQuizResult({ correct, explanation });
  };

  const flipCoin = () => {
    setCoinResult(quantumRandom());
  };

  const rollDice = () => {
    setDiceResult(quantumDice());
  };

  const closeDice = () => setDiceResult(null);

  const closeCoin = () => setCoinResult(null);

  const closeFact = () => setShowFact(false);
  const nextQuizStep = () => {
    setQuizIdx(quizIdx + 1);
    setQuizResult(null);
  };

  const totalSteps = lessons.length + quizzes.length;
  const progress = ((lessonIdx + quizIdx) / totalSteps) * 100;

  return (
    <div className="container">
      <Header progress={progress} />
      <main className="content">
        {lessonIdx < lessons.length && (
          <Lesson lesson={lessons[lessonIdx]} onComplete={completeLesson} />
        )}
        {lessonIdx > quizIdx && quizIdx < quizzes.length && (
          <Quiz quiz={quizzes[quizIdx]} onComplete={completeQuiz} />
        )}
      </main>
      <Footer
        score={score}
        onGuide={() => setShowGuide(true)}
        onUpgrade={() => setShowPurchase(true)}
        onReset={resetProgress}
        onFlip={flipCoin}
        onRoll={rollDice}
        onResources={() => setShowResources(true)}
        onRules={() => setShowRules(true)}
      />

      {showGuide && <CharacterGuide onClose={() => setShowGuide(false)} />}
      {showPurchase && <InAppPurchase onClose={() => setShowPurchase(false)} />}
      {showFact && <FunFact fact={fact} onClose={closeFact} />}
      {quizResult && <QuizResult result={quizResult} onNext={nextQuizStep} />}
      {coinResult !== null && (
        <CoinFlipModal result={coinResult} onClose={closeCoin} />
      )}
      {diceResult !== null && (
        <DiceRollModal result={diceResult} onClose={closeDice} />
      )}
      {showResources && (
        <ResourcesModal onClose={() => setShowResources(false)} />
      )}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
