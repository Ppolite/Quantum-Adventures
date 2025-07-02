const lessons = [
  { id: 1, title: 'Lesson 1: Qubits', content: 'A qubit is the basic unit of quantum information.' },
  { id: 2, title: 'Lesson 2: Superposition', content: 'Superposition allows a qubit to be in multiple states at once.' },
  { id: 3, title: 'Lesson 3: Entanglement', content: 'Entanglement links qubits so that the state of one affects the other.' }
];

const quizzes = [
  {
    question: 'What is a qubit?',
    answers: ['Classical bit', 'Quantum bit', 'Coin'],
    correct: 1
  },
  {
    question: 'What concept allows multiple states?',
    answers: ['Entanglement', 'Superposition', 'Classical mechanics'],
    correct: 1
  },
  {
    question: 'Which phenomenon links qubits together?',
    answers: ['Superposition', 'Classical mechanics', 'Entanglement'],
    correct: 2
  }
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
      onComplete(selected === quiz.correct ? 1 : 0);
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

  React.useEffect(() => {
    localStorage.setItem('lessonIdx', lessonIdx);
    localStorage.setItem('quizIdx', quizIdx);
    localStorage.setItem('score', score);
  }, [lessonIdx, quizIdx, score]);

  const resetProgress = () => {
    setLessonIdx(0);
    setQuizIdx(0);
    setScore(0);
    localStorage.removeItem('lessonIdx');
    localStorage.removeItem('quizIdx');
    localStorage.removeItem('score');
  };

  const completeLesson = () => setLessonIdx(lessonIdx + 1);
  const completeQuiz = (pts) => {
    setScore(score + pts);
    setQuizIdx(quizIdx + 1);
  };

  const totalSteps = lessons.length + quizzes.length;
  const progress = ((lessonIdx + quizIdx) / totalSteps) * 100;

  return (
    <div className="container">
      <header className="header">
        <h1>Quantum Fun Adventures</h1>
        <div className="progress-container">
          <div className="progress" aria-label={`Progress: ${Math.round(progress)}%`}>
            <div className="progress-inner" style={{ width: progress + '%' }}></div>
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      </header>
      <main className="content">
        {lessonIdx < lessons.length && (
          <Lesson lesson={lessons[lessonIdx]} onComplete={completeLesson} />
        )}
        {lessonIdx > quizIdx && quizIdx < quizzes.length && (
          <Quiz quiz={quizzes[quizIdx]} onComplete={completeQuiz} />
        )}
      </main>
      <footer className="footer">
        <button onClick={() => setShowGuide(true)}>Guide</button>
        <span>Score: {score}</span>
        <button onClick={() => setShowPurchase(true)}>Upgrade</button>
        <button onClick={resetProgress}>Reset Progress</button>
      </footer>

      {showGuide && <CharacterGuide onClose={() => setShowGuide(false)} />}
      {showPurchase && <InAppPurchase onClose={() => setShowPurchase(false)} />}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
