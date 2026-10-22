import { ChangeEvent, CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  applyRating,
  createReviewState,
  formatDueDate,
  isDue,
  previewSchedule,
} from "./lib/scheduler";
import {
  clearData,
  createBackup,
  createInitialData,
  loadData,
  parseBackup,
  saveData,
} from "./lib/storage";
import { isSafeExternalUrl } from "./lib/urls";
import { getQuestionsForPlan, getStudyPlan, studyPlans } from "./lib/studyPlans";
import {
  dateKey,
  getDailyReviewCounts,
  getReviewedQuestionIdsByDay,
  getScheduledQuestionIdsByDay,
  getStreaks,
} from "./lib/activity";
import {
  buildCategoryQueue,
  buildStudyQueue,
  getCategoryProgress,
  getCurrentCategory,
  getQueueCounts,
  isStudied,
} from "./lib/studyPath";
import { ROADMAP_EDGES, ROADMAP_POSITIONS } from "./lib/roadmap";
import { createCompletedStudySession, createStudySession } from "./lib/session";
import type { CategoryProgress } from "./lib/studyPath";
import type { AppData, Difficulty, Question, Rating, ReviewEvent, StudyPlan, StudySession } from "./types";

type View = "today" | "roadmap" | "library" | "review";

interface StudyMotion {
  category: string;
  calendarDate?: string;
  token: number;
}

const ratingLabels: Record<Rating, string> = {
  again: "Couldn't solve",
  hard: "Needed help",
  good: "Solved independently",
};

const SESSION_LIMIT = 10;

function Icon({ name, size = 18 }: { name: "arrow" | "back" | "chevron" | "external" | "minus" | "plus" | "search" | "settings" | "target" | "x"; size?: number }) {
  const paths = {
    arrow: <path d="m13 5 7 7-7 7M20 12H4" />,
    back: <path d="m11 5-7 7 7 7M4 12h16" />,
    chevron: <path d="m7 9 5 5 5-5" />,
    external: <path d="M14 5h5v5M11 13l8-8M19 13v6H5V5h6" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    settings: <><path d="M4 7h4M12 7h8M4 17h8M16 17h4" /><circle cx="10" cy="7" r="2" /><circle cx="14" cy="17" r="2" /></>,
    target: <><circle cx="12" cy="12" r="6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
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

function Header({
  view,
  onNavigate,
  onExport,
  onImport,
  onReset,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onExport: () => void;
  onImport: (data: AppData) => void;
  onReset: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const closeSettings = () => {
    setSettingsOpen(false);
    setConfirmReset(false);
    setPendingImport(null);
    setImportError(null);
  };
  const navigate = (nextView: View) => {
    closeSettings();
    onNavigate(nextView);
  };
  const chooseImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setConfirmReset(false);
    setImportError(null);
    try {
      setPendingImport(parseBackup(await file.text()));
    } catch (error) {
      setPendingImport(null);
      setImportError(error instanceof Error ? error.message : "The backup could not be read.");
    }
  };

  return (
    <header className="site-header">
      {view !== "review" ? (
        <>
          <div className="header-primary">
            <button className="wordmark" onClick={() => navigate("today")} aria-label="Flashcode home">
              <Mark />
              <span>flashcode</span>
            </button>
            <nav className="main-nav" aria-label="Primary navigation">
              <button className={view === "today" ? "active" : ""} onClick={() => navigate("today")} aria-current={view === "today" ? "page" : undefined}>Today</button>
              <button className={view === "roadmap" ? "active" : ""} onClick={() => navigate("roadmap")} aria-current={view === "roadmap" ? "page" : undefined}>Roadmap</button>
              <button className={view === "library" ? "active" : ""} onClick={() => navigate("library")} aria-current={view === "library" ? "page" : undefined}>Library</button>
            </nav>
          </div>
          <div className="header-tools">
            <button
              className="settings-button"
              onClick={() => {
                if (settingsOpen) closeSettings();
                else setSettingsOpen(true);
              }}
              aria-label="Data settings"
              aria-expanded={settingsOpen}
              aria-controls="data-settings-menu"
            >
              <Icon name="settings" size={18} />
            </button>
            {settingsOpen && (
              <section className="settings-menu" id="data-settings-menu" aria-label="Data settings">
                <h2>Data</h2>
                <p>Your progress stays in this browser. Nothing is sent to a server.</p>
                <div className="settings-actions">
                  <button className="quiet-button" onClick={onExport}>Export backup</button>
                  <button className="quiet-button" onClick={() => importInput.current?.click()}>Import backup</button>
                  <input
                    ref={importInput}
                    className="hidden-file-input"
                    type="file"
                    accept="application/json,.json"
                    onChange={chooseImport}
                  />
                </div>
                {importError && <p className="settings-message error" role="alert">{importError}</p>}
                {pendingImport && (
                  <div className="settings-confirm">
                    <p>Replace current data with this backup?</p>
                    <div>
                      <button className="quiet-button" onClick={() => setPendingImport(null)}>Cancel</button>
                      <button className="secondary-button" onClick={() => { onImport(pendingImport); closeSettings(); }}>Import</button>
                    </div>
                  </div>
                )}
                {!pendingImport && !confirmReset && (
                  <button className="quiet-button danger-text settings-reset" onClick={() => { setConfirmReset(true); setImportError(null); }}>Reset app</button>
                )}
                {confirmReset && (
                  <div className="settings-confirm">
                    <p>Delete all progress and custom questions?</p>
                    <div>
                      <button className="quiet-button" onClick={() => setConfirmReset(false)}>Cancel</button>
                      <button className="danger-button" onClick={() => { onReset(); setSettingsOpen(false); setConfirmReset(false); }}>Delete</button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </>
      ) : (
        <>
          <button className="wordmark" onClick={() => navigate("today")} aria-label="Flashcode home">
            <Mark />
            <span>flashcode</span>
          </button>
          <button className="quiet-button back-to-today" onClick={() => navigate("today")}>
            <Icon name="back" size={16} />
            <span>Today</span>
          </button>
        </>
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

function ReadinessBar({
  current,
  due,
  newCount,
  total,
  label,
}: {
  current: number;
  due: number;
  newCount: number;
  total: number;
  label: string;
}) {
  const width = (value: number) => `${total > 0 ? (value / total) * 100 : 0}%`;

  return (
    <div
      className="readiness-bar"
      role="img"
      aria-label={`${label}: ${current} current, ${due} due, ${newCount} new`}
    >
      {current > 0 && <span className="readiness-current" style={{ width: width(current) }} />}
      {due > 0 && <span className="readiness-due" style={{ width: width(due) }} />}
      {newCount > 0 && <span className="readiness-new" style={{ width: width(newCount) }} />}
    </div>
  );
}

function ReadinessCounts({
  current,
  due,
  newCount,
  compact = false,
}: {
  current: number;
  due: number;
  newCount: number;
  compact?: boolean;
}) {
  return (
    <div className={`readiness-counts ${compact ? "compact" : ""}`}>
      <span className={`count-current ${current === 0 ? "is-zero" : ""}`}><strong>{current}</strong> Current</span>
      <span className={`count-due ${due === 0 ? "is-zero" : ""}`}><strong>{due}</strong> Due</span>
      <span className={`count-new ${newCount === 0 ? "is-zero" : ""}`}><strong>{newCount}</strong> New</span>
    </div>
  );
}

function TodayView({
  data,
  plan,
  questions,
  queue,
  session,
  activityMonth,
  onActivityMonthChange,
  onSelectPlan,
  onStart,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  queue: Question[];
  session: StudySession | null;
  activityMonth: Date;
  onActivityMonthChange: (month: Date) => void;
  onSelectPlan: (planId: string) => void;
  onStart: () => void;
}) {
  const now = new Date();
  const allDue = questions
    .filter((question) => isStudied(data.reviews[question.id]) && isDue(data.reviews[question.id], now))
    .sort((a, b) => data.reviews[a.id].dueAt.localeCompare(data.reviews[b.id].dueAt));
  const queueCounts = getQueueCounts(queue, data.reviews);
  const questionIds = new Set(questions.map((question) => question.id));
  const studiedToday = new Set(
    data.history
      .filter((event) => {
        const date = new Date(event.reviewedAt);
        return questionIds.has(event.questionId) && date.toDateString() === now.toDateString();
      })
      .map((event) => event.questionId),
  ).size;
  const completedToday = data.completedSessions.filter(
    (completed) =>
      completed.planId === plan.id &&
      new Date(completed.completedAt).toDateString() === now.toDateString(),
  );
  const completedQuestionsToday = completedToday.reduce(
    (total, completed) => total + completed.questionCount,
    0,
  );
  const active = questions.filter((question) => isStudied(data.reviews[question.id])).length;
  const nextDue = questions
    .map((question) => data.reviews[question.id])
    .filter((review) => isStudied(review) && !isDue(review, now))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const completedSessionToday = completedToday.length > 0;
  const reviewsStillDue = !session && completedSessionToday && allDue.length > 0;
  const todayComplete = !session && completedSessionToday && allDue.length === 0;
  const completedSessionLabel = `${completedToday.length} ${completedToday.length === 1 ? "session" : "sessions"}`;
  const completedQuestionLabel = `${completedQuestionsToday} ${completedQuestionsToday === 1 ? "question" : "questions"}`;

  return (
    <main className="page-shell today-page">
      <div className="standard-page-layout">
        <div className="standard-page-main">
      <section className="today-hero">
        <div className="today-heading-row">
          <time>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</time>
        </div>
        <div className="hero-content">
          <h1>
            {session
              ? `${queue.length} left in session`
              : reviewsStillDue
                ? `${allDue.length} ${allDue.length === 1 ? "review" : "reviews"} still due`
                : todayComplete
                  ? "Today complete"
                  : queue.length > 0
                    ? `${queue.length} to study`
                    : "You're caught up"}
          </h1>
          {todayComplete && (
            <p className="completion-summary">{completedSessionLabel}, {completedQuestionLabel}</p>
          )}
          {queue.length === 0 && !todayComplete && (
            <p className="lede">
              {nextDue
                ? `Next review ${formatDueDate(nextDue.dueAt, now).toLowerCase()}.`
                : "Add a question in Library."}
            </p>
          )}
          <div className="hero-action">
            {todayComplete ? (
              <>
                {queue.length > 0 && (
                  <button className="secondary-button study-more-button" onClick={onStart}>
                    <span>Study more</span>
                    <Icon name="arrow" />
                  </button>
                )}
                {nextDue && (
                  <span className="time-note">Next review {formatDueDate(nextDue.dueAt, now)}</span>
                )}
              </>
            ) : (
              <>
                <button className="primary-button" onClick={onStart} disabled={queue.length === 0}>
                  <span>
                    {queue.length > 0
                      ? session
                        ? "Continue"
                        : reviewsStillDue
                          ? "Continue reviews"
                          : "Start"
                      : "Nothing scheduled"}
                  </span>
                  {queue.length > 0 && <Icon name="arrow" />}
                </button>
                {queue.length > 0 && <span className="time-note">~{Math.max(5, queue.length * 3)} min</span>}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="route-overview" aria-label="Plan progress">
        <div className="metrics-row">
          <Metric value={allDue.length} label="Due" />
          <Metric value={active} label="Attempted" />
          <Metric value={studiedToday} label="Studied today" />
        </div>
      </section>

      {!todayComplete && <section className="queue-section">
        <div className="section-heading">
          <h2>{queue.length > 0 ? "Up next" : "Questions"}</h2>
          <div className="section-count queue-counts">
            {queue.length > 0
              ? <>
                  {queueCounts.reviews > 0 && <span>{queueCounts.reviews} review{queueCounts.reviews === 1 ? "" : "s"}</span>}
                  {queueCounts.newCount > 0 && <span>{queueCounts.newCount} new</span>}
                </>
              : `${questions.length} total`}
          </div>
        </div>
        <div className="question-list">
          {(queue.length > 0 ? queue : questions.slice(0, SESSION_LIMIT)).map((question) => {
            const review = data.reviews[question.id];
            const reviewDue = queue.length > 0 && isStudied(review) && isDue(review, now);

            return (
              <div className={`question-row ${queue.length > 0 ? "has-status" : ""}`} key={question.id}>
                <div className="question-primary">
                  <h3>{question.title}</h3>
                </div>
                <span className="topic-label">{question.topic}</span>
                {queue.length > 0 && (
                  <span className={`queue-status ${reviewDue ? "queue-status-review" : "queue-status-new"}`}>
                    {reviewDue ? "Review due" : "New"}
                  </span>
                )}
                <span className={`difficulty difficulty-${question.difficulty.toLowerCase()}`}>
                  {question.difficulty}
                </span>
              </div>
            );
          })}
        </div>
      </section>}
        </div>
        <StudySidebar
          data={data}
          plan={plan}
          questions={questions}
          activityMonth={activityMonth}
          onActivityMonthChange={onActivityMonthChange}
          onSelectPlan={onSelectPlan}
        />
      </div>
    </main>
  );
}

function CategoryRoute({
  progress,
  currentCategory,
  highlightCategory,
  onSelectCategory,
}: {
  progress: CategoryProgress[];
  currentCategory: string | null;
  highlightCategory?: string;
  onSelectCategory: (category: string) => void;
}) {
  return (
    <section className="category-path" aria-label="Categories">
      {progress.map((category) => {
        const current = category.name === currentCategory;
        return (
          <article
            className={`category-row ${current ? "current" : ""} ${category.name === highlightCategory ? "updated" : ""}`}
            key={category.name}
          >
            <div className="path-station" aria-hidden="true"><span /></div>
            <div className="category-copy">
              <div className="category-title-line">
                <h2>
                  <button className="category-name-button" onClick={() => onSelectCategory(category.name)}>
                    {category.name}
                  </button>
                </h2>
                {current && <span className="current-label">Next</span>}
              </div>
              <p>{category.studied} of {category.total} attempted</p>
            </div>
            <div className="category-progress">
              <ReadinessBar
                current={category.current}
                due={category.due}
                newCount={category.newCount}
                total={category.total}
                label={`${category.name} readiness`}
              />
              <ReadinessCounts
                current={category.current}
                due={category.due}
                newCount={category.newCount}
                compact
              />
            </div>
            <button className="category-action" onClick={() => onSelectCategory(category.name)}>
              View problems
            </button>
          </article>
        );
      })}
    </section>
  );
}

function RoadmapGraph({
  progress,
  currentCategory,
  highlightCategory,
  onSelectCategory,
}: {
  progress: CategoryProgress[];
  currentCategory: string | null;
  highlightCategory?: string;
  onSelectCategory: (category: string) => void;
}) {
  const MAP_WIDTH = 900;
  const MAP_HEIGHT = 1000;
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.15;
  const SCALE_STEP = 0.15;
  const viewportRef = useRef<HTMLElement>(null);
  const [mapScale, setMapScale] = useState(1);
  const visibleNames = new Set(progress.map((category) => category.name));
  const focusCategory = highlightCategory ?? currentCategory ?? progress[0]?.name ?? null;

  const centerCategory = (categoryName: string | null, behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    const position = categoryName ? ROADMAP_POSITIONS[categoryName] : null;
    if (!viewport || !position) return;

    viewport.scrollTo({
      left: Math.max(0, position.x * mapScale - viewport.clientWidth / 2),
      top: Math.max(0, position.y * mapScale - viewport.clientHeight / 2),
      behavior,
    });
  };

  const changeScale = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const nextScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Number((mapScale + direction * SCALE_STEP).toFixed(2))),
    );
    if (!viewport || nextScale === mapScale) return;

    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / mapScale;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / mapScale;
    setMapScale(nextScale);
    window.requestAnimationFrame(() => {
      viewport.scrollTo({
        left: Math.max(0, centerX * nextScale - viewport.clientWidth / 2),
        top: Math.max(0, centerY * nextScale - viewport.clientHeight / 2),
      });
    });
  };

  useEffect(() => {
    if (!window.matchMedia("(max-width: 1180px)").matches) return;
    const frame = window.requestAnimationFrame(() => centerCategory(focusCategory, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [focusCategory]);

  const canvasStyle = {
    width: `${MAP_WIDTH * mapScale}px`,
    height: `${MAP_HEIGHT * mapScale}px`,
    "--roadmap-scale": mapScale,
  } as CSSProperties;

  return (
    <div className="roadmap-map-shell">
    <section
      className="roadmap-graph"
      id="category-roadmap"
      aria-label="Category roadmap. Scroll or swipe to explore."
      ref={viewportRef}
      tabIndex={0}
    >
      <div className="roadmap-canvas" style={canvasStyle}>
        <div className="roadmap-canvas-content">
        <svg className="roadmap-connectors" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
          {ROADMAP_EDGES.filter(([from, to]) => visibleNames.has(from) && visibleNames.has(to)).map(([from, to]) => {
            const source = ROADMAP_POSITIONS[from];
            const target = ROADMAP_POSITIONS[to];
            const middle = (source.y + target.y) / 2;
            return (
              <path
                key={`${from}-${to}`}
                className={highlightCategory && (from === highlightCategory || to === highlightCategory) ? "updated" : ""}
                d={`M ${source.x} ${source.y + 42} C ${source.x} ${middle}, ${target.x} ${middle}, ${target.x} ${target.y - 42}`}
              />
            );
          })}
        </svg>

        {progress.map((category) => {
          const position = ROADMAP_POSITIONS[category.name];
          if (!position) return null;
          const current = category.name === currentCategory;
          return (
            <button
              type="button"
              key={category.name}
              className={`roadmap-node ${current ? "current" : ""} ${category.name === highlightCategory ? "updated" : ""}`}
              style={{ left: position.x, top: position.y }}
              onClick={() => onSelectCategory(category.name)}
              aria-label={`View ${category.name}. ${category.current} current, ${category.due} due, ${category.newCount} new.`}
            >
              <span className="roadmap-node-title">{category.name}</span>
              <ReadinessBar
                current={category.current}
                due={category.due}
                newCount={category.newCount}
                total={category.total}
                label={`${category.name} readiness`}
              />
              <ReadinessCounts
                current={category.current}
                due={category.due}
                newCount={category.newCount}
                compact
              />
              {current && <span className="roadmap-next">Next</span>}
            </button>
          );
        })}
        </div>
      </div>
    </section>
    <div className="roadmap-map-controls" aria-label="Roadmap controls">
      <button
        type="button"
        onClick={() => changeScale(1)}
        disabled={mapScale >= MAX_SCALE}
        aria-label="Zoom in"
        aria-controls="category-roadmap"
      >
        <Icon name="plus" size={17} />
      </button>
      <button
        type="button"
        onClick={() => changeScale(-1)}
        disabled={mapScale <= MIN_SCALE}
        aria-label="Zoom out"
        aria-controls="category-roadmap"
      >
        <Icon name="minus" size={17} />
      </button>
      <button
        type="button"
        onClick={() => centerCategory(focusCategory)}
        disabled={!focusCategory}
        aria-label={focusCategory ? `Center ${focusCategory}` : "Center roadmap"}
        aria-controls="category-roadmap"
      >
        <Icon name="target" size={17} />
      </button>
    </div>
    </div>
  );
}

function CategoryDetails({
  category,
  questions,
  reviews,
  onClose,
  onStart,
}: {
  category: CategoryProgress;
  questions: Question[];
  reviews: AppData["reviews"];
  onClose: () => void;
  onStart: () => void;
}) {
  const now = new Date();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="category-details-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="category-details" role="dialog" aria-modal="true" aria-labelledby="category-details-title">
        <header className="category-details-header">
          <div>
            <span className="path-kicker">Category</span>
            <h2 id="category-details-title">{category.name}</h2>
            <p>{category.studied} of {category.total} attempted</p>
          </div>
          <button className="icon-button category-details-close" onClick={onClose} aria-label="Close category details" autoFocus>
            <Icon name="x" size={20} />
          </button>
        </header>

        <section className="category-details-readiness" aria-label={`${category.name} readiness`}>
          <ReadinessBar
            current={category.current}
            due={category.due}
            newCount={category.newCount}
            total={category.total}
            label={`${category.name} readiness`}
          />
          <ReadinessCounts
            current={category.current}
            due={category.due}
            newCount={category.newCount}
          />
          <button className="primary-button" onClick={onStart} disabled={category.available === 0}>
            {category.available > 0 ? "Study this category" : "Nothing to review"}
          </button>
        </section>

        <section className="category-problems" aria-labelledby="category-problems-title">
          <div className="category-problems-heading">
            <h3 id="category-problems-title">Problems</h3>
            <span>{questions.length}</span>
          </div>
          <div className="category-problem-list">
            {questions.map((question) => {
              const review = reviews[question.id];
              const status = !isStudied(review) ? "New" : isDue(review, now) ? "Review due" : "Current";
              const statusClass = status === "Review due" ? "due" : status.toLowerCase();
              return (
                <article className="category-problem-row" key={question.id}>
                  <span className={`problem-status ${statusClass}`}>{status}</span>
                  <div className="category-problem-title">
                    <h4>{question.title}</h4>
                    {review && !isDue(review, now) && <span>Next review {formatDueDate(review.dueAt, now).toLowerCase()}</span>}
                  </div>
                  <span className={`difficulty difficulty-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
                  <a href={question.url} target="_blank" rel="noreferrer" aria-label={`Open ${question.title}`}>
                    <Icon name="external" size={17} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}

function ActivityPanel({
  history,
  questions,
  reviews,
  visibleMonth,
  onMonthChange,
  highlightDate,
}: {
  history: ReviewEvent[];
  questions: Question[];
  reviews: AppData["reviews"];
  visibleMonth: Date;
  onMonthChange: (month: Date) => void;
  highlightDate?: string;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const now = new Date();
  const today = dateKey(now);
  const counts = useMemo(() => getDailyReviewCounts(history), [history]);
  const streaks = useMemo(() => getStreaks(history, now), [history]);
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);
  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );
  const reviewedByDay = useMemo(
    () => getReviewedQuestionIdsByDay(history, questionIds),
    [history, questionIds],
  );
  const scheduledByDay = useMemo(
    () => getScheduledQuestionIdsByDay(reviews, questionIds, now),
    [reviews, questionIds, today],
  );
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const leadingDays = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const calendarCells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const dayKey = (day: number) => {
    const monthValue = String(month + 1).padStart(2, "0");
    return `${year}-${monthValue}-${String(day).padStart(2, "0")}`;
  };
  const intensity = (count: number) => {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    return 4;
  };

  useEffect(() => {
    const closePopover = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      setSelectedDay(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDay(null);
    };

    document.addEventListener("mousedown", closePopover);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closePopover);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const changeMonth = (nextMonth: Date) => {
    setSelectedDay(null);
    onMonthChange(nextMonth);
  };

  return (
    <section className="activity-panel sidebar-panel" aria-label="Study activity" ref={panelRef}>
      <div className="activity-heading">
        <div className="month-controls">
          <button
            className="icon-button previous-month"
            onClick={() => changeMonth(new Date(year, month - 1, 1))}
            aria-label="Previous month"
          >
            <Icon name="arrow" size={16} />
          </button>
          <strong>{monthLabel}</strong>
          <button
            className="icon-button"
            onClick={() => changeMonth(new Date(year, month + 1, 1))}
            aria-label="Next month"
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
      </div>
      <div className="activity-calendar" role="grid" aria-label={monthLabel}>
        {calendarCells.map((day, index) => {
          if (day === null) return <span className="calendar-blank" key={`blank-${index}`} aria-hidden="true" />;
          const key = dayKey(day);
          const count = counts.get(key) ?? 0;
          const dueQuestionIds = key >= today ? scheduledByDay.get(key) ?? [] : [];
          const reviewedQuestionIds = key < today ? reviewedByDay.get(key) ?? [] : [];
          const detailQuestionIds = key < today ? reviewedQuestionIds : dueQuestionIds;
          const detailQuestions = detailQuestionIds
            .map((questionId) => questionById.get(questionId))
            .filter((question): question is Question => Boolean(question))
            .sort((left, right) => left.title.localeCompare(right.title));
          const selected = selectedDay === key;
          const highlighted = key === highlightDate;
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const cellIndex = leadingDays + day - 1;
          const column = cellIndex % 7;
          const firstRow = cellIndex < 7;
          const popoverPosition = `${column < 2 ? "align-left" : column > 4 ? "align-right" : "align-center"} ${firstRow ? "place-below" : "place-above"}`;
          const date = new Date(year, month, day);
          const dateLabel = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const dueCount = dueQuestionIds.length;
          const accessibleSummary = key < today
            ? `${count} ${count === 1 ? "review" : "reviews"}`
            : `${dueCount} due for review`;
          const popoverId = `calendar-details-${key}`;
          return (
            <span className={`calendar-cell ${selected ? "is-selected" : ""}`} key={day} role="presentation">
              <button
                type="button"
                className={`calendar-day intensity-${intensity(count)} ${isToday ? "today" : ""} ${highlighted ? "first-review" : ""}`}
                title={accessibleSummary}
                role="gridcell"
                aria-label={`${dateLabel}: ${accessibleSummary}`}
                aria-expanded={selected}
                aria-controls={selected ? popoverId : undefined}
                onClick={() => setSelectedDay((current) => current === key ? null : key)}
              >
                {day}
                {dueCount > 0 && <span className="calendar-due-dot" aria-hidden="true" />}
              </button>
              {selected && (
                <div
                  className={`calendar-popover ${popoverPosition}`}
                  id={popoverId}
                  role="dialog"
                  aria-label={`Details for ${dateLabel}`}
                >
                  <strong>{dateLabel}</strong>
                  <span className="calendar-popover-label">
                    {key < today ? "Reviewed" : isToday ? "Due today" : "Due for review"}
                  </span>
                  {detailQuestions.length > 0 ? (
                    <ul>
                      {detailQuestions.map((question) => <li key={question.id}>{question.title}</li>)}
                    </ul>
                  ) : (
                    <p>{key < today ? "No problems reviewed." : "Nothing due."}</p>
                  )}
                </div>
              )}
            </span>
          );
        })}
      </div>

      <div className="streak-row">
        <div><strong>{streaks.current}</strong><span>Current streak</span></div>
        <div><strong>{streaks.longest}</strong><span>Longest streak</span></div>
      </div>
      <p className="streak-note">A study day includes at least one rated question.</p>
    </section>
  );
}

function PlanProgressPanel({
  data,
  plan,
  questions,
  onSelectPlan,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  onSelectPlan: (planId: string) => void;
}) {
  const [choosingPlan, setChoosingPlan] = useState(false);
  const progress = getCategoryProgress(questions, data.reviews, new Date());
  const attempted = progress.reduce((sum, category) => sum + category.studied, 0);
  const current = progress.reduce((sum, category) => sum + category.current, 0);
  const due = progress.reduce((sum, category) => sum + category.due, 0);
  const newCount = progress.reduce((sum, category) => sum + category.newCount, 0);

  return (
    <section className="progress-panel sidebar-panel" aria-label={`${plan.name} progress`}>
      <button
        className="plan-select-button"
        onClick={() => setChoosingPlan((value) => !value)}
        aria-expanded={choosingPlan}
        aria-controls="sidebar-plan-options"
      >
        <strong>{plan.name}</strong>
        <Icon name="chevron" size={16} />
      </button>
      {choosingPlan && (
        <div className="sidebar-plan-options" id="sidebar-plan-options" role="listbox" aria-label="Study plan">
          {studyPlans.map((option) => {
            const optionQuestions = getQuestionsForPlan(option.id, data.questions);
            const optionAttempted = optionQuestions.filter((question) => isStudied(data.reviews[question.id])).length;
            const selected = option.id === plan.id;
            return (
              <button
                key={option.id}
                className={selected ? "selected" : ""}
                onClick={() => {
                  if (!selected) onSelectPlan(option.id);
                  setChoosingPlan(false);
                }}
                role="option"
                aria-selected={selected}
              >
                <span>{option.name}</span>
                <small>{optionAttempted} of {optionQuestions.length}</small>
              </button>
            );
          })}
        </div>
      )}
      <p className="progress-total">
        <strong>{attempted}</strong>
        <span>of {questions.length} attempted</span>
      </p>
      <ReadinessBar
        current={current}
        due={due}
        newCount={newCount}
        total={questions.length}
        label={`${plan.name} readiness`}
      />
      <ReadinessCounts current={current} due={due} newCount={newCount} compact />
    </section>
  );
}

function StudySidebar({
  data,
  plan,
  questions,
  activityMonth,
  onActivityMonthChange,
  onSelectPlan,
  highlightDate,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  activityMonth: Date;
  onActivityMonthChange: (month: Date) => void;
  onSelectPlan: (planId: string) => void;
  highlightDate?: string;
}) {
  return (
    <aside className="study-sidebar" aria-label="Study overview">
      <PlanProgressPanel data={data} plan={plan} questions={questions} onSelectPlan={onSelectPlan} />
      <ActivityPanel
        history={data.history}
        questions={questions}
        reviews={data.reviews}
        visibleMonth={activityMonth}
        onMonthChange={onActivityMonthChange}
        highlightDate={highlightDate}
      />
    </aside>
  );
}

function RoadmapView({
  data,
  plan,
  questions,
  motion,
  activityMonth,
  onActivityMonthChange,
  onSelect,
  onStartCategory,
  onMotionComplete,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  motion: StudyMotion | null;
  activityMonth: Date;
  onActivityMonthChange: (month: Date) => void;
  onSelect: (planId: string) => void;
  onStartCategory: (category: string) => void;
  onMotionComplete: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const now = new Date();
  const progress = getCategoryProgress(questions, data.reviews, now);
  const currentCategory = getCurrentCategory(questions, data.reviews, now);
  const canShowGraph = progress.length >= 10 && progress.every((category) => ROADMAP_POSITIONS[category.name]);
  const selectedProgress = progress.find((category) => category.name === selectedCategory);
  const selectedQuestions = selectedCategory
    ? questions.filter((question) => question.topic === selectedCategory)
    : [];

  useEffect(() => {
    if (!motion) return;
    const timer = window.setTimeout(onMotionComplete, 1100);
    return () => window.clearTimeout(timer);
  }, [motion?.token]);

  return (
    <>
    <main className="page-shell path-page">
      <div className={`roadmap-layout ${canShowGraph ? "has-graph" : ""}`}>
        <div className="roadmap-content">
          {canShowGraph ? (
            <>
              <RoadmapGraph
                progress={progress}
                currentCategory={currentCategory}
                highlightCategory={motion?.category}
                onSelectCategory={setSelectedCategory}
              />
              <div className="roadmap-list-fallback">
                <CategoryRoute
                  progress={progress}
                  currentCategory={currentCategory}
                  highlightCategory={motion?.category}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
            </>
          ) : (
            <CategoryRoute
              progress={progress}
              currentCategory={currentCategory}
              highlightCategory={motion?.category}
              onSelectCategory={setSelectedCategory}
            />
          )}
        </div>
        <StudySidebar
          data={data}
          plan={plan}
          questions={questions}
          activityMonth={activityMonth}
          onActivityMonthChange={onActivityMonthChange}
          onSelectPlan={(planId) => { onSelect(planId); setSelectedCategory(null); }}
          highlightDate={motion?.calendarDate}
        />
      </div>
    </main>
    {selectedProgress && (
      <CategoryDetails
        category={selectedProgress}
        questions={selectedQuestions}
        reviews={data.reviews}
        onClose={() => setSelectedCategory(null)}
        onStart={() => onStartCategory(selectedProgress.name)}
      />
    )}
    </>
  );
}

function SessionProgress({
  total,
  current,
  departing,
}: {
  total: number;
  current: number;
  departing: boolean;
}) {
  return (
    <div
      className="session-progress"
      role="progressbar"
      aria-label={`Question ${current + 1} of ${total}`}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
    >
      <span>Question {current + 1} of {total}</span>
      <div className="progress-segments" aria-hidden="true">
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            className={`progress-segment ${index < current ? "complete" : ""} ${index === current ? "current" : ""} ${index === current && departing ? "departing" : ""}`}
          >
            {index === current && departing && (
              <span className="progress-traveler" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReviewSession({
  data,
  planQuestions,
  queue,
  initialIndex,
  onRate,
  onFinish,
}: {
  data: AppData;
  planQuestions: Question[];
  queue: string[];
  initialIndex: number;
  onRate: (questionId: string, rating: Rating, nextIndex: number) => void;
  onFinish: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [showSteps, setShowSteps] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [departingRating, setDepartingRating] = useState<Rating | null>(null);
  const question = data.questions.find((item) => item.id === queue[current]);
  const finished = current >= queue.length || !question;

  const chooseRating = (rating: Rating) => {
    if (!showRating || !question || departingRating) return;
    setDepartingRating(rating);
  };

  const completeRating = () => {
    if (!departingRating || !question) return;
    const nextIndex = current + 1;
    onRate(question.id, departingRating, nextIndex);
    setShowSteps(false);
    setShowRating(false);
    setCurrent(nextIndex);
    setDepartingRating(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const openRating = () => {
    setShowRating(true);
    requestAnimationFrame(() => {
      document.getElementById("close-review-sheet")?.focus();
    });
  };

  const closeRating = () => {
    setShowSteps(false);
    setShowRating(false);
    requestAnimationFrame(() => {
      document.getElementById("finish-attempt")?.focus();
    });
  };

  const toggleSteps = () => {
    setShowSteps((visible) => {
      const next = !visible;
      if (next) {
        requestAnimationFrame(() => {
          document.getElementById("key-steps")?.scrollIntoView({ block: "nearest" });
        });
      }
      return next;
    });
  };

  useEffect(() => {
    if (!departingRating) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(completeRating, reducedMotion ? 20 : 320);
    return () => window.clearTimeout(timer);
  }, [departingRating]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      if (typing) return;

      if (showRating && !departingRating && event.key === "Escape") {
        closeRating();
        return;
      }

      if (showRating && !departingRating && ["Digit1", "Digit2", "Digit3"].includes(event.code)) {
        const ratings: Rating[] = ["again", "hard", "good"];
        chooseRating(ratings[Number(event.code.slice(-1)) - 1]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (finished) {
    const planQuestionIds = new Set(planQuestions.map((item) => item.id));
    const futureReviews = Object.values(data.reviews)
      .filter((review) => planQuestionIds.has(review.questionId) && !isDue(review))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

    return (
      <main className="completion-page page-shell">
        <div className="terminus" aria-hidden="true">
          <span />
        </div>
        <h1>Session complete</h1>
        <p>
          {queue.length} {queue.length === 1 ? "question" : "questions"} reviewed.
          {futureReviews[0] && ` Next review: ${formatDueDate(futureReviews[0].dueAt).toLowerCase()}.`}
        </p>
        <button className="primary-button" onClick={onFinish}>Back to Today</button>
      </main>
    );
  }

  const reviewState = data.reviews[question.id];
  const ratings: Rating[] = ["again", "hard", "good"];

  return (
    <main className="review-layout page-shell">
      <SessionProgress
        total={queue.length}
        current={current}
        departing={Boolean(departingRating)}
      />
      <article key={question.id} className={`review-card question-arrival ${showRating ? "review-open" : ""}`} aria-busy={Boolean(departingRating)}>
        <div className="focus-edge" aria-hidden="true" />
        <div className="workbench">
          <section className="problem-panel">
            <div className="question-meta">
              <span>{question.topic}</span>
              <span>{question.difficulty}</span>
            </div>
            <div className="question-copy">
              <h1>{question.title}</h1>
              <p>{question.prompt}</p>
            </div>
            <div className="problem-action">
              <a className="primary-button" href={question.url} target="_blank" rel="noreferrer">
                Open problem <Icon name="external" size={16} />
              </a>
              <button
                className="secondary-button"
                id="finish-attempt"
                onClick={openRating}
                aria-controls="review-sheet"
                aria-expanded={showRating}
              >
                Finish attempt
              </button>
            </div>
          </section>
        </div>

        <section
          className={`review-sheet ${showRating ? "open" : ""}`}
          id="review-sheet"
          aria-hidden={!showRating}
          aria-labelledby="review-sheet-title"
        >
          <button
            className="icon-button review-sheet-close"
            id="close-review-sheet"
            onClick={closeRating}
            aria-label="Close review"
            disabled={Boolean(departingRating)}
          >
            <Icon name="x" />
          </button>

          <div className="review-sheet-main">
            <div className="review-sheet-intro">
              <h2 id="review-sheet-title">How did it go?</h2>
              {question.approach.length > 0 && (
                <button
                  className="quiet-button approach-button"
                  onClick={toggleSteps}
                  aria-expanded={showSteps}
                  disabled={Boolean(departingRating)}
                >
                  {showSteps ? "Hide key steps" : "View key steps"}
                </button>
              )}
            </div>

            <div className="rating-grid">
              {ratings.map((rating, index) => {
                const preview = previewSchedule(reviewState, rating);
                const nextReview = preview.label === "1 day" ? "Review tomorrow" : `Review in ${preview.label}`;
                return (
                  <button
                    key={rating}
                    className={`rating-button rating-${rating} ${departingRating === rating ? "selected" : ""}`}
                    onClick={() => chooseRating(rating)}
                    disabled={Boolean(departingRating)}
                  >
                    <kbd className="rating-key">{index + 1}</kbd>
                    <strong>{ratingLabels[rating]}</strong>
                    <small>{nextReview}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {question.approach.length > 0 && (
            <div className={`review-sheet-steps ${showSteps ? "open" : ""}`}>
              <div className={`answer-copy ${showSteps ? "open" : ""}`} id="key-steps" aria-hidden={!showSteps}>
                <ol>
                  {question.approach.map((step) => <li key={step}>{step}</li>)}
                </ol>
                {question.complexity && <code>{question.complexity}</code>}
              </div>
            </div>
          )}
        </section>
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
    const urlInput = event.currentTarget.elements.namedItem("url");
    if (!isSafeExternalUrl(url)) {
      if (urlInput instanceof HTMLInputElement) {
        urlInput.setCustomValidity("Enter a secure link beginning with https://");
        urlInput.reportValidity();
      }
      return;
    }

    const complexity = String(form.get("complexity") ?? "").trim();
    if (!complexity) return;
    onAdd({
      id: `custom-${Date.now()}`,
      title,
      url,
      topic,
      difficulty,
      prompt,
      approach: approach.split("\n").map((line) => line.trim()).filter(Boolean),
      complexity,
      builtIn: false,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <div className="form-header">
        <h2>Add question</h2>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Close form"><Icon name="x" /></button>
      </div>
      <div className="form-grid">
        <label>
          <span>Title</span>
          <input name="title" required placeholder="Course Schedule" />
        </label>
        <label>
          <span>Problem link</span>
          <input
            name="url"
            required
            type="url"
            inputMode="url"
            pattern="https://.*"
            placeholder="https://…"
            onInput={(event) => event.currentTarget.setCustomValidity("")}
          />
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
          <span>Problem summary</span>
          <textarea name="prompt" required rows={3} placeholder="Summarize the problem in a sentence or two." />
        </label>
        <label className="full-field">
          <span>Solution steps</span>
          <textarea name="approach" required rows={4} placeholder={"Build the graph\nTrack indegrees\nProcess zero-indegree nodes"} />
        </label>
        <label className="full-field">
          <span>Complexity</span>
          <input name="complexity" required placeholder="O(V + E) time / O(V + E) space" />
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
  plan,
  questions,
  activityMonth,
  onActivityMonthChange,
  onSelectPlan,
  onAdd,
  onRemove,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  activityMonth: Date;
  onActivityMonthChange: (month: Date) => void;
  onSelectPlan: (planId: string) => void;
  onAdd: (question: Question) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return questions;
    return questions.filter((question) =>
      [question.title, question.topic, question.difficulty].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [questions, query]);

  return (
    <main className="page-shell library-page">
      <div className="standard-page-layout">
        <div className="standard-page-main">
      <section className="library-heading">
        <div>
          <h1>{plan.name}</h1>
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
        <span>{query.trim() ? `${filtered.length} results` : `${questions.length} questions`}</span>
      </section>

      <div className="library-list">
        {filtered.map((question) => {
          const review = data.reviews[question.id];
          return (
            <article className="library-row" key={question.id}>
              <div className="library-title">
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

        </div>
        <StudySidebar
          data={data}
          plan={plan}
          questions={questions}
          activityMonth={activityMonth}
          onActivityMonthChange={onActivityMonthChange}
          onSelectPlan={onSelectPlan}
        />
      </div>
    </main>
  );
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [view, setView] = useState<View>("today");
  const [queue, setQueue] = useState<string[]>(() => data.activeSession?.questionIds ?? []);
  const [studyMotion, setStudyMotion] = useState<StudyMotion | null>(null);
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const activePlan = getStudyPlan(data.activePlanId);
  const activeQuestions = useMemo(
    () => getQuestionsForPlan(data.activePlanId, data.questions),
    [data.activePlanId, data.questions],
  );
  const todayQueue = buildStudyQueue(activeQuestions, data.reviews, new Date(), SESSION_LIMIT);
  const questionById = useMemo(
    () => new Map(data.questions.map((question) => [question.id, question])),
    [data.questions],
  );
  const sessionQueue = data.activeSession
    ? data.activeSession.questionIds
        .slice(data.activeSession.currentIndex)
        .map((questionId) => questionById.get(questionId))
        .filter((question): question is Question => Boolean(question))
    : null;
  const displayedQueue = sessionQueue ?? todayQueue;

  useEffect(() => saveData(data), [data]);

  const startReview = () => {
    if (data.activeSession) {
      setQueue(data.activeSession.questionIds);
      setView("review");
      return;
    }

    const questionIds = todayQueue.map((question) => question.id);
    if (questionIds.length === 0) return;
    const activeSession = createStudySession(questionIds, data.activePlanId, "general");
    setData((current) => ({ ...current, activeSession }));
    setQueue(questionIds);
    setView("review");
  };

  const startCategory = (category: string) => {
    const focused = buildCategoryQueue(activeQuestions, data.reviews, category, new Date(), SESSION_LIMIT);
    if (focused.length === 0) return;
    const questionIds = focused.map((question) => question.id);
    const activeSession = createStudySession(
      questionIds,
      data.activePlanId,
      "category",
      new Date(),
      category,
    );
    setData((current) => ({ ...current, activeSession }));
    setQueue(questionIds);
    setView("review");
  };

  const rateQuestion = (questionId: string, rating: Rating, nextIndex: number) => {
    const reviewedAt = new Date();
    const ratedQuestion = data.questions.find((question) => question.id === questionId);
    const reviewedDate = dateKey(reviewedAt);
    const firstReviewOfDay = !data.history.some(
      (event) => dateKey(new Date(event.reviewedAt)) === reviewedDate,
    );

    if (ratedQuestion) {
      setStudyMotion((current) => ({
        category: ratedQuestion.topic,
        calendarDate: firstReviewOfDay ? reviewedDate : current?.calendarDate,
        token: (current?.token ?? 0) + 1,
      }));
    }

    setData((current) => {
      const nextState = applyRating(current.reviews[questionId], rating, reviewedAt);
      const completedSession = current.activeSession && nextIndex >= current.activeSession.questionIds.length
        ? createCompletedStudySession(current.activeSession, reviewedAt)
        : null;
      const activeSession = completedSession
        ? null
        : current.activeSession
          ? { ...current.activeSession, currentIndex: nextIndex }
          : null;
      return {
        ...current,
        activeSession,
        completedSessions: completedSession
          ? [...current.completedSessions, completedSession]
          : current.completedSessions,
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
      const drafts = { ...current.drafts };
      delete reviews[questionId];
      delete drafts[questionId];
      return {
        ...current,
        questions: current.questions.filter((question) => question.id !== questionId),
        reviews,
        history: current.history.filter((event) => event.questionId !== questionId),
        drafts,
        activeSession: current.activeSession?.questionIds.includes(questionId)
          ? null
          : current.activeSession,
      };
    });
  };

  const reset = () => {
    clearData();
    setData(createInitialData());
    setQueue([]);
    setStudyMotion(null);
  };

  const exportData = () => {
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(new Blob([createBackup(data)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `flashcode-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importData = (imported: AppData) => {
    setData(imported);
    setQueue(imported.activeSession?.questionIds ?? []);
    setStudyMotion(null);
    setView("today");
  };

  const selectPlan = (activePlanId: string) => {
    setData((current) => ({ ...current, activePlanId, activeSession: null }));
    setQueue([]);
  };

  return (
    <div className="app">
      <Header
        view={view}
        onNavigate={setView}
        onExport={exportData}
        onImport={importData}
        onReset={reset}
      />
      {view === "today" && (
        <TodayView
          data={data}
          plan={activePlan}
          questions={activeQuestions}
          queue={displayedQueue}
          session={data.activeSession}
          activityMonth={activityMonth}
          onActivityMonthChange={setActivityMonth}
          onSelectPlan={selectPlan}
          onStart={startReview}
        />
      )}
      {view === "roadmap" && (
        <RoadmapView
          data={data}
          plan={activePlan}
          questions={activeQuestions}
          motion={studyMotion}
          activityMonth={activityMonth}
          onActivityMonthChange={setActivityMonth}
          onSelect={selectPlan}
          onStartCategory={startCategory}
          onMotionComplete={() => setStudyMotion(null)}
        />
      )}
      {view === "library" && (
        <LibraryView
          data={data}
          plan={activePlan}
          questions={activeQuestions}
          activityMonth={activityMonth}
          onActivityMonthChange={setActivityMonth}
          onSelectPlan={selectPlan}
          onAdd={(question) => {
            addQuestion(question);
            setData((current) => ({ ...current, activePlanId: "personal", activeSession: null }));
            setQueue([]);
          }}
          onRemove={removeQuestion}
        />
      )}
      {view === "review" && (
        <ReviewSession
          data={data}
          planQuestions={activeQuestions}
          queue={queue}
          initialIndex={data.activeSession?.currentIndex ?? 0}
          onRate={rateQuestion}
          onFinish={() => setView("today")}
        />
      )}
    </div>
  );
}
