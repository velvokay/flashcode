import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  applyRating,
  createReviewState,
  formatDueDate,
  isDue,
  previewSchedule,
} from "./lib/scheduler";
import { clearData, createInitialData, loadData, saveData } from "./lib/storage";
import { getQuestionsForPlan, getStudyPlan, studyPlans } from "./lib/studyPlans";
import { dateKey, getDailyReviewCounts, getStreaks } from "./lib/activity";
import {
  buildCategoryQueue,
  buildStudyQueue,
  getCategoryProgress,
  getCurrentCategory,
  getQueueCounts,
  isStudied,
} from "./lib/studyPath";
import { ROADMAP_EDGES, ROADMAP_POSITIONS } from "./lib/roadmap";
import { createStudySession } from "./lib/session";
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

function Icon({ name, size = 18 }: { name: "arrow" | "back" | "external" | "plus" | "search" | "x"; size?: number }) {
  const paths = {
    arrow: <path d="m13 5 7 7-7 7M20 12H4" />,
    back: <path d="m11 5-7 7 7 7M4 12h16" />,
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
            className={view === "roadmap" ? "active" : ""}
            onClick={() => onNavigate("roadmap")}
            aria-current={view === "roadmap" ? "page" : undefined}
          >
            Roadmap
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
        <button className="quiet-button back-to-today" onClick={() => onNavigate("today")}>
          <Icon name="back" size={16} />
          <span>Today</span>
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
  onStart,
  onChoosePlan,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  queue: Question[];
  session: StudySession | null;
  onStart: () => void;
  onChoosePlan: () => void;
}) {
  const now = new Date();
  const allDue = questions
    .filter((question) => isStudied(data.reviews[question.id]) && isDue(data.reviews[question.id], now))
    .sort((a, b) => data.reviews[a.id].dueAt.localeCompare(data.reviews[b.id].dueAt));
  const queueCounts = getQueueCounts(queue, data.reviews);
  const questionIds = new Set(questions.map((question) => question.id));
  const reviewedToday = data.history.filter((event) => {
    const date = new Date(event.reviewedAt);
    return questionIds.has(event.questionId) && date.toDateString() === now.toDateString();
  }).length;
  const active = questions.filter((question) => isStudied(data.reviews[question.id])).length;
  const nextDue = questions
    .map((question) => data.reviews[question.id])
    .filter((review) => isStudied(review) && !isDue(review, now))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];

  return (
    <main className="page-shell today-page">
      <section className="today-hero">
        <div className="today-heading-row">
          <button
            className="plan-context"
            onClick={onChoosePlan}
            aria-label={`Open ${plan.name} roadmap`}
          >
            <strong>{plan.name}</strong>
            <Icon name="arrow" size={15} />
          </button>
          <time>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</time>
        </div>
        <div className="hero-content">
          <h1>
            {queue.length > 0
              ? session
                ? `${queue.length} left in session`
                : `${queue.length} to study`
              : "You're caught up"}
          </h1>
          {queue.length === 0 && (
            <p className="lede">
              {nextDue
                ? `Next review ${formatDueDate(nextDue.dueAt, now).toLowerCase()}.`
                : "Add a question in Library."}
            </p>
          )}
          <div className="hero-action">
            <button className="primary-button" onClick={onStart} disabled={queue.length === 0}>
              <span>{queue.length > 0 ? (session ? "Continue" : "Start") : "Nothing scheduled"}</span>
              {queue.length > 0 && <Icon name="arrow" />}
            </button>
            {queue.length > 0 && <span className="time-note">~{Math.max(5, queue.length * 3)} min</span>}
          </div>
        </div>
      </section>

      <section className="route-overview" aria-label="Plan progress">
        <div className="metrics-row">
          <Metric value={allDue.length} label="Due" />
          <Metric value={active} label="Attempted" />
          <Metric value={reviewedToday} label="Reviews today" />
        </div>
      </section>

      <section className="queue-section">
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
          {(queue.length > 0 ? queue : questions.slice(0, SESSION_LIMIT)).map((question) => (
            <div className="question-row" key={question.id}>
              <div className="question-primary">
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
  const visibleNames = new Set(progress.map((category) => category.name));

  return (
    <section className="roadmap-graph" aria-label="Category roadmap">
      <div className="roadmap-canvas">
        <svg className="roadmap-connectors" viewBox="0 0 900 1000" aria-hidden="true">
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
    </section>
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
                  <a href={question.url} target="_blank" rel="noreferrer" aria-label={`Open ${question.title} on LeetCode`}>
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

function ActivityPanel({ history, highlightDate }: { history: ReviewEvent[]; highlightDate?: string }) {
  const now = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const counts = useMemo(() => getDailyReviewCounts(history), [history]);
  const streaks = useMemo(() => getStreaks(history, now), [history]);
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

  return (
    <aside className="activity-panel" aria-label="Study activity">
      <div className="activity-heading">
        <h2>Activity</h2>
        <div className="month-controls">
          <button
            className="icon-button previous-month"
            onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
            aria-label="Previous month"
          >
            <Icon name="arrow" size={16} />
          </button>
          <strong>{monthLabel}</strong>
          <button
            className="icon-button"
            onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
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
          const count = counts.get(dayKey(day)) ?? 0;
          const highlighted = dayKey(day) === highlightDate;
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          return (
            <span
              key={day}
              className={`calendar-day intensity-${intensity(count)} ${isToday ? "today" : ""} ${highlighted ? "first-review" : ""}`}
              title={`${count} ${count === 1 ? "review" : "reviews"}`}
              role="gridcell"
              aria-label={`${visibleMonth.toLocaleDateString(undefined, { month: "long" })} ${day}: ${count} ${count === 1 ? "review" : "reviews"}`}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="streak-row">
        <div><strong>{streaks.current}</strong><span>Current streak</span></div>
        <div><strong>{streaks.longest}</strong><span>Longest streak</span></div>
      </div>
      <p className="streak-note">A study day includes at least one rated question.</p>
    </aside>
  );
}

function RoadmapView({
  data,
  plan,
  questions,
  motion,
  onSelect,
  onStartCategory,
  onMotionComplete,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  motion: StudyMotion | null;
  onSelect: (planId: string) => void;
  onStartCategory: (category: string) => void;
  onMotionComplete: () => void;
}) {
  const [choosingPlan, setChoosingPlan] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const now = new Date();
  const progress = getCategoryProgress(questions, data.reviews, now);
  const currentCategory = getCurrentCategory(questions, data.reviews, now);
  const totalStudied = progress.reduce((sum, category) => sum + category.studied, 0);
  const totalCurrent = progress.reduce((sum, category) => sum + category.current, 0);
  const totalDue = progress.reduce((sum, category) => sum + category.due, 0);
  const totalNew = progress.reduce((sum, category) => sum + category.newCount, 0);
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
      <section className="path-heading">
        <div>
          <span className="path-kicker">Roadmap</span>
          <h1>{plan.name}</h1>
          <p>{totalStudied} of {questions.length} attempted</p>
        </div>
        <button className="secondary-button" onClick={() => setChoosingPlan((value) => !value)}>
          {choosingPlan ? "Close" : "Change plan"}
        </button>
      </section>

      <section className="plan-readiness" aria-label="Plan readiness">
        <ReadinessBar
          current={totalCurrent}
          due={totalDue}
          newCount={totalNew}
          total={questions.length}
          label={`${plan.name} readiness`}
        />
        <ReadinessCounts current={totalCurrent} due={totalDue} newCount={totalNew} />
      </section>

      {choosingPlan && (
        <section className="plan-picker" aria-label="Available study plans">
          {studyPlans.map((option) => {
            const planQuestions = getQuestionsForPlan(option.id, data.questions);
            const attempted = planQuestions.filter((question) => isStudied(data.reviews[question.id])).length;
            const selected = option.id === data.activePlanId;

            return (
              <article className={`plan-option ${selected ? "selected" : ""}`} key={option.id}>
                <div>
                  <h2>{option.name}</h2>
                  <span>{attempted} of {planQuestions.length} attempted</span>
                </div>
                <button
                  className={selected ? "selected-plan-button" : "quiet-plan-button"}
                  onClick={() => { onSelect(option.id); setChoosingPlan(false); setSelectedCategory(null); }}
                  disabled={selected}
                >
                  {selected ? "Current" : "Select"}
                </button>
              </article>
            );
          })}
        </section>
      )}

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
        <ActivityPanel history={data.history} highlightDate={motion?.calendarDate} />
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
                Open on LeetCode <Icon name="external" size={16} />
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
          <span>LeetCode link</span>
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
  onAdd,
  onRemove,
  onReset,
}: {
  data: AppData;
  plan: StudyPlan;
  questions: Question[];
  onAdd: (question: Question) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return questions;
    return questions.filter((question) =>
      [question.title, question.topic, question.difficulty].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [questions, query]);

  return (
    <main className="page-shell library-page">
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

      <section className="data-settings">
        <div>
          <h2>Data</h2>
          <p>Saved in this browser. Resetting deletes your progress and custom questions.</p>
        </div>
        {!confirmReset ? (
          <button className="quiet-button danger-text" onClick={() => setConfirmReset(true)}>Reset app</button>
        ) : (
          <div className="confirm-actions">
            <span>Delete progress and custom questions?</span>
            <button className="quiet-button" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="danger-button" onClick={() => { onReset(); setConfirmReset(false); }}>Delete</button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [view, setView] = useState<View>("today");
  const [queue, setQueue] = useState<string[]>(() => data.activeSession?.questionIds ?? []);
  const [studyMotion, setStudyMotion] = useState<StudyMotion | null>(null);
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
      const activeSession = current.activeSession
        ? nextIndex >= current.activeSession.questionIds.length
          ? null
          : { ...current.activeSession, currentIndex: nextIndex }
        : null;
      return {
        ...current,
        activeSession,
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

  return (
    <div className="app">
      <Header view={view} onNavigate={setView} />
      {view === "today" && (
        <TodayView
          data={data}
          plan={activePlan}
          questions={activeQuestions}
          queue={displayedQueue}
          session={data.activeSession}
          onStart={startReview}
          onChoosePlan={() => setView("roadmap")}
        />
      )}
      {view === "roadmap" && (
        <RoadmapView
          data={data}
          plan={activePlan}
          questions={activeQuestions}
          motion={studyMotion}
          onSelect={(activePlanId) => {
            setData((current) => ({ ...current, activePlanId, activeSession: null }));
            setQueue([]);
          }}
          onStartCategory={startCategory}
          onMotionComplete={() => setStudyMotion(null)}
        />
      )}
      {view === "library" && (
        <LibraryView
          data={data}
          plan={activePlan}
          questions={activeQuestions}
          onAdd={(question) => {
            addQuestion(question);
            setData((current) => ({ ...current, activePlanId: "personal", activeSession: null }));
            setQueue([]);
          }}
          onRemove={removeQuestion}
          onReset={reset}
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
