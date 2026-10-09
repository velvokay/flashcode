import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  applyRating,
  createReviewState,
  formatDueDate,
  isDue,
  previewSchedule,
} from "./lib/scheduler";
import { clearData, createInitialData, loadData, saveData } from "./lib/storage";
import type { AppData, Difficulty, Question, Rating } from "./types";

type View = "today" | "library" | "review";

const ratingLabels: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

function Icon({ name, size = 18 }: { name: "arrow" | "external" | "plus" | "search" | "x"; size?: number }) {
  const paths = {
    arrow: <path d="m5 12 7-7 7 7M12 5v14" />,
    external: <path d="M14 5h5v5M11 13l8-8M19 13v6H5V5h6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {paths[name]}
    </svg>
  );
}

function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <span className="mark-line" />
      <span className="mark-station" />
    </span>
  );
}

function Header({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <header className="site-header">
      <button className="wordmark" onClick={() => onNavigate("today")} aria-label="Flashcode home">
        <Mark />
        <span>flashcode</span>
      </button>
      {view !== "review" ? (
        <nav className="main-nav" aria-label="Primary navigation">
          <button
            className={view === "today" ? "active" : ""}
            onClick={() => onNavigate("today")}
            aria-current={view === "today" ? "page" : undefined}
          >
            Today
          </button>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => onNavigate("library")}
            aria-current={view === "library" ? "page" : undefined}
          >
            Library
          </button>
        </nav>
      ) : (
        <button className="quiet-button" onClick={() => onNavigate("today")}>
          End session
        </button>
      )}
    </header>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function TodayView({ data, onStart }: { data: AppData; onStart: () => void }) {
  const now = new Date();
  const due = data.questions
    .filter((question) => isDue(data.reviews[question.id], now))
    .sort((a, b) => data.reviews[a.id].dueAt.localeCompare(data.reviews[b.id].dueAt));
  const reviewedToday = data.history.filter((event) => {
    const date = new Date(event.reviewedAt);
    return date.toDateString() === now.toDateString();
  }).length;
  const active = Object.values(data.reviews).filter((review) => review.repetitions > 0).length;
  const nextDue = data.questions
    .map((question) => data.reviews[question.id])
    .filter((review) => !isDue(review, now))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];

  return (
    <main className="page-shell today-page">
      <section className="today-hero">
        <div className="eyebrow-row">
          <span className="eyebrow">TODAY</span>
          <time>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</time>
        </div>
        <div className="hero-grid">
          <div>
            <h1>{due.length > 0 ? `${due.length} due` : "Route clear"}</h1>
            <p className="lede">
              {due.length > 0
                ? "A focused set of questions, ordered by what needs attention now."
                : nextDue
                  ? `Nothing else is due. Next review ${formatDueDate(nextDue.dueAt, now).toLowerCase()}.`
                  : "Your library is ready when you are."}
            </p>
          </div>
          <div className="hero-action">
            <button className="primary-button" onClick={onStart} disabled={due.length === 0}>
              <span>{due.length > 0 ? "Start review" : "Done for today"}</span>
              {due.length > 0 && <Icon name="arrow" />}
            </button>
            {due.length > 0 && <span className="time-note">About {Math.max(5, due.length * 3)} minutes</span>}
          </div>
        </div>
      </section>

      <section className="route-overview" aria-label="Today's route">
        <div className="route-track" aria-hidden="true">
          {Array.from({ length: Math.max(5, Math.min(due.length, 10)) }).map((_, index) => (
            <span className={index === 0 && due.length > 0 ? "station current" : "station"} key={index} />
          ))}
        </div>
        <div className="metrics-row">
          <Metric value={due.length} label="Due now" />
          <Metric value={active} label="In rotation" />
          <Metric value={reviewedToday} label="Reviewed today" />
        </div>
      </section>

      <section className="queue-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUEUE</span>
            <h2>{due.length > 0 ? "Next questions" : "Upcoming"}</h2>
          </div>
          <span className="section-count">{due.length || data.questions.length} questions</span>
        </div>
        <div className="question-list">
          {(due.length > 0 ? due : data.questions.slice(0, 5)).slice(0, 5).map((question, index) => (
            <div className="question-row" key={question.id}>
              <span className="queue-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="question-primary">
                <span className="question-code">{question.code}</span>
                <h3>{question.title}</h3>
              </div>
              <span className="topic-label">{question.topic}</span>
              <span className={`difficulty difficulty-${question.difficulty.toLowerCase()}`}>
                {question.difficulty}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ProgressRail({ total, current }: { total: number; current: number }) {
  return (
    <aside className="progress-rail" aria-label={`Question ${current + 1} of ${total}`}>
      <span className="progress-count">{String(current + 1).padStart(2, "0")}</span>
      <div className="vertical-track" aria-hidden="true">
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            className={`rail-station ${index < current ? "complete" : ""} ${index === current ? "current" : ""}`}
          />
        ))}
      </div>
      <span className="progress-total">{String(total).padStart(2, "0")}</span>
    </aside>
  );
}

function ReviewSession({
  data,
  queue,
  onRate,
  onFinish,
}: {
  data: AppData;
  queue: string[];
  onRate: (questionId: string, rating: Rating) => void;
  onFinish: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scratch, setScratch] = useState("");
  const question = data.questions.find((item) => item.id === queue[current]);
  const finished = current >= queue.length || !question;

  const rate = (rating: Rating) => {
    if (!revealed || !question) return;
    onRate(question.id, rating);
    setRevealed(false);
    setScratch("");
    setCurrent((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      if (typing) return;

      if (event.code === "Space" && !revealed && !finished) {
        event.preventDefault();
        setRevealed(true);
      }

      if (revealed && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) {
        const ratings: Rating[] = ["again", "hard", "good", "easy"];
        rate(ratings[Number(event.code.slice(-1)) - 1]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (finished) {
    const futureReviews = Object.values(data.reviews)
      .filter((review) => !isDue(review))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

    return (
      <main className="completion-page page-shell">
        <div className="terminus" aria-hidden="true">
          <span />
        </div>
        <span className="eyebrow">TERMINUS</span>
        <h1>Done for today.</h1>
        <p>
          {futureReviews[0]
            ? `The next question returns ${formatDueDate(futureReviews[0].dueAt).toLowerCase()}.`
            : "Your next review will appear here when it is due."}
        </p>
        <div className="completion-stats">
          <Metric value={queue.length} label="Reviewed" />
          <Metric value={new Set(queue).size} label="Questions" />
        </div>
        <button className="primary-button" onClick={onFinish}>Return to today</button>
      </main>
    );
  }

  const reviewState = data.reviews[question.id];
  const ratings: Rating[] = ["again", "hard", "good", "easy"];

  return (
    <main className="review-layout page-shell">
      <ProgressRail total={queue.length} current={current} />
      <article className="review-card">
        <div className="focus-edge" aria-hidden="true" />
        <div className="question-meta">
          <span className="question-code">{question.code}</span>
          <span>{question.topic}</span>
          <span>{question.difficulty}</span>
        </div>
        <div className="question-copy">
          <h1>{question.title}</h1>
          <p>{question.prompt}</p>
        </div>
        <a className="external-link" href={question.url} target="_blank" rel="noreferrer">
          Open original problem <Icon name="external" size={16} />
        </a>

        <div className="scratch-area">
          <label htmlFor="scratchpad">Work it through</label>
          <textarea
            id="scratchpad"
            value={scratch}
            onChange={(event) => setScratch(event.target.value)}
            placeholder="Write an invariant, outline, or complexity target…"
            rows={3}
          />
          <span>Private scratchpad · cleared after this question</span>
        </div>

        {!revealed ? (
          <div className="reveal-bar">
            <button className="primary-button" onClick={() => setRevealed(true)}>
              Show approach
            </button>
            <span><kbd>Space</kbd> to reveal</span>
          </div>
        ) : (
          <section className="answer-panel" aria-live="polite">
            <div className="answer-copy">
              <span className="eyebrow">APPROACH</span>
              <ol>
                {question.approach.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <code>{question.complexity}</code>
            </div>
            <div className="rating-section">
              <div className="rating-heading">
                <h2>How well did you recall it?</h2>
                <span>Be honest—the interval adapts.</span>
              </div>
              <div className="rating-grid">
                {ratings.map((rating, index) => {
                  const preview = previewSchedule(reviewState, rating);
                  return (
                    <button key={rating} className={`rating-button rating-${rating}`} onClick={() => rate(rating)}>
                      <span className="rating-key">{index + 1}</span>
                      <strong>{ratingLabels[rating]}</strong>
                      <small>{preview.label}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </article>
    </main>
  );
}

function AddQuestionForm({ onAdd, onCancel }: { onAdd: (question: Question) => void; onCancel: () => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const url = String(form.get("url") ?? "").trim();
    const topic = String(form.get("topic") ?? "General").trim() || "General";
    const prompt = String(form.get("prompt") ?? "").trim();
    const approach = String(form.get("approach") ?? "").trim();
    if (!title || !url || !prompt || !approach) return;

    const count = Math.floor(Math.random() * 900) + 100;
    onAdd({
      id: `custom-${Date.now()}`,
      code: `${topic.slice(0, 3).toUpperCase()} · ${count}`,
      title,
      url,
      topic,
      difficulty,
      prompt,
      approach: approach.split("\n").map((line) => line.trim()).filter(Boolean),
      complexity: "Review your implementation's time and space complexity.",
      builtIn: false,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <div className="form-header">
        <div>
          <span className="eyebrow">NEW QUESTION</span>
          <h2>Add to the route</h2>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Close form"><Icon name="x" /></button>
      </div>
      <div className="form-grid">
        <label>
          <span>Title</span>
          <input name="title" required placeholder="Course Schedule" />
        </label>
        <label>
          <span>Problem link</span>
          <input name="url" required type="url" placeholder="https://…" />
        </label>
        <label>
          <span>Topic</span>
          <input name="topic" required placeholder="Graphs" />
        </label>
        <label>
          <span>Difficulty</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
        <label className="full-field">
          <span>Prompt in your own words</span>
          <textarea name="prompt" required rows={3} placeholder="What should you be able to solve?" />
        </label>
        <label className="full-field">
          <span>Key approach · one step per line</span>
          <textarea name="approach" required rows={4} placeholder={"Build the graph\nTrack indegrees\nProcess zero-indegree nodes"} />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit">Add question</button>
      </div>
    </form>
  );
}

function LibraryView({
  data,
  onAdd,
  onRemove,
  onReset,
}: {
  data: AppData;
  onAdd: (question: Question) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.questions;
    return data.questions.filter((question) =>
      [question.title, question.topic, question.difficulty].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [data.questions, query]);

  return (
    <main className="page-shell library-page">
      <section className="library-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h1>Your questions</h1>
          <p>Keep the collection small enough to revisit and broad enough to stay useful.</p>
        </div>
        <button className="primary-button" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Add question
        </button>
      </section>

      {adding && <AddQuestionForm onAdd={(question) => { onAdd(question); setAdding(false); }} onCancel={() => setAdding(false)} />}

      <section className="library-controls">
        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="sr-only">Search questions</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, topic, or difficulty" />
        </label>
        <span>{filtered.length} of {data.questions.length}</span>
      </section>

      <div className="library-list">
        {filtered.map((question) => {
          const review = data.reviews[question.id];
          return (
            <article className="library-row" key={question.id}>
              <span className={`status-dot ${isDue(review) ? "due" : ""}`} aria-hidden="true" />
              <div className="library-title">
                <span className="question-code">{question.code}</span>
                <h2>{question.title}</h2>
              </div>
              <span className="topic-label">{question.topic}</span>
              <span>{question.difficulty}</span>
              <span className="due-label">{formatDueDate(review.dueAt)}</span>
              <a href={question.url} target="_blank" rel="noreferrer" aria-label={`Open ${question.title}`}><Icon name="external" /></a>
              {!question.builtIn && (
                <button className="remove-button" onClick={() => onRemove(question.id)}>Remove</button>
              )}
            </article>
          );
        })}
      </div>

      <section className="data-settings">
        <div>
          <h2>Local data</h2>
          <p>Progress is stored in this browser. Reset restores the original ten questions.</p>
        </div>
        {!confirmReset ? (
          <button className="quiet-button danger-text" onClick={() => setConfirmReset(true)}>Reset progress</button>
        ) : (
          <div className="confirm-actions">
            <span>Reset everything?</span>
            <button className="quiet-button" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="danger-button" onClick={() => { onReset(); setConfirmReset(false); }}>Reset</button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [view, setView] = useState<View>("today");
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => saveData(data), [data]);

  const startReview = () => {
    const now = new Date();
    const due = data.questions
      .filter((question) => isDue(data.reviews[question.id], now))
      .sort((a, b) => data.reviews[a.id].dueAt.localeCompare(data.reviews[b.id].dueAt))
      .map((question) => question.id);
    setQueue(due);
    setView("review");
  };

  const rateQuestion = (questionId: string, rating: Rating) => {
    const reviewedAt = new Date();
    setData((current) => {
      const nextState = applyRating(current.reviews[questionId], rating, reviewedAt);
      return {
        ...current,
        reviews: { ...current.reviews, [questionId]: nextState },
        history: [
          ...current.history,
          {
            id: `${questionId}-${reviewedAt.getTime()}`,
            questionId,
            rating,
            reviewedAt: reviewedAt.toISOString(),
            nextDueAt: nextState.dueAt,
          },
        ],
      };
    });
  };

  const addQuestion = (question: Question) => {
    setData((current) => ({
      ...current,
      questions: [...current.questions, question],
      reviews: { ...current.reviews, [question.id]: createReviewState(question.id) },
    }));
  };

  const removeQuestion = (questionId: string) => {
    setData((current) => {
      const reviews = { ...current.reviews };
      delete reviews[questionId];
      return {
        questions: current.questions.filter((question) => question.id !== questionId),
        reviews,
        history: current.history.filter((event) => event.questionId !== questionId),
      };
    });
  };

  const reset = () => {
    clearData();
    setData(createInitialData());
  };

  return (
    <div className="app">
      <Header view={view} onNavigate={setView} />
      {view === "today" && <TodayView data={data} onStart={startReview} />}
      {view === "library" && (
        <LibraryView data={data} onAdd={addQuestion} onRemove={removeQuestion} onReset={reset} />
      )}
      {view === "review" && (
        <ReviewSession data={data} queue={queue} onRate={rateQuestion} onFinish={() => setView("today")} />
      )}
      <footer className="site-footer">
        <span>Flashcode</span>
        <span>The right problem, at the right interval.</span>
      </footer>
    </div>
  );
}
