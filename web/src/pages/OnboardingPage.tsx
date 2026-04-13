import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { onboard, onboardMulti } from "../api";
import type { AppState, Session } from "../types";

interface Props {
  appState: AppState;
  setAppState: (update: Partial<AppState>) => void;
  onPlanGenerated: () => void;
}

type LearningStyle = "visual" | "reading" | "practice";
type SkillLevel = "beginner" | "intermediate" | "advanced";

interface PlanForm {
  id: string;
  goal: string;
  deadline: string;
  hours_per_day: number;
  learning_style: LearningStyle;
  skill_level: SkillLevel;
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface ThemedSelectProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

const CURRICULA: Record<string, string[]> = {
  mathematics: ["Number Systems", "Algebra", "Linear Equations", "Quadratic Equations", "Trigonometry", "Coordinate Geometry", "Calculus Basics", "Statistics and Probability"],
  physics: ["Units and Measurements", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Thermodynamics", "Electrostatics", "Current Electricity", "Modern Physics"],
  chemistry: ["Atomic Structure", "Periodic Table", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Organic Basics", "Revision and Numericals"],
  biology: ["Cell Structure", "Human Physiology", "Plant Physiology", "Genetics", "Evolution", "Ecology", "Reproduction", "Revision and Diagrams"],
  english: ["Grammar Fundamentals", "Vocabulary Building", "Reading Comprehension", "Writing Skills", "Literature Analysis", "Essay Practice", "Spoken English", "Mock Passage Review"],
  history: ["Ancient Civilizations", "Medieval India", "Modern India", "World Wars", "Freedom Movement", "Post-Independence India", "Important Movements", "Revision Timelines"],
  geography: ["Earth and Maps", "Climate and Weather", "Physical Geography", "Resources and Agriculture", "Population and Settlement", "India Geography", "World Geography", "Map Practice"],
  civics: ["Constitution Basics", "Rights and Duties", "Democracy", "Parliament and Law", "Judiciary", "Government Structure", "Elections", "Case Study Revision"],
  "programming fundamentals": ["Problem Solving Logic", "Variables and Data Types", "Conditionals", "Loops", "Functions", "Arrays and Strings", "Basic Recursion", "Mini Coding Drills"],
  "object-oriented programming": ["Classes and Objects", "Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "Constructors", "Interfaces", "OOP Practice"],
  "computer science": ["Number Systems", "Logic Gates", "Computer Architecture", "Operating Systems", "Databases", "Networking Basics", "Software Engineering", "Revision and Practice"],
  "data structures and algorithms": ["Arrays", "Linked Lists", "Stacks and Queues", "Trees", "Graphs", "Sorting and Searching", "Dynamic Programming", "Mock Interview Practice"],
  "database management systems": ["ER Modeling", "Relational Model", "SQL Queries", "Normalization", "Transactions", "Indexing", "Stored Procedures", "DBMS Practice"],
  "operating systems": ["Processes and Threads", "CPU Scheduling", "Memory Management", "Paging and Segmentation", "File Systems", "Deadlocks", "Synchronization", "OS Practice"],
  "computer networks": ["OSI Model", "TCP/IP Basics", "IP Addressing", "Routing and Switching", "DNS and DHCP", "HTTP and HTTPS", "Network Security", "CN Practice"],
  "web development": ["HTML and CSS", "JavaScript Basics", "Responsive Layouts", "DOM and Events", "React Components", "State Management", "API Integration", "Project Build"],
  java: ["Java Syntax", "Control Flow", "OOP in Java", "Collections", "Exception Handling", "Streams", "Multithreading", "Java Practice"],
  python: ["Python Syntax", "Data Structures", "Functions and Modules", "File Handling", "OOP in Python", "Libraries and Packages", "Testing", "Python Practice"],
  "system design": ["Scalability Basics", "Caching", "Load Balancing", "Databases at Scale", "Message Queues", "Distributed Systems", "Trade-offs and Patterns", "Design Interview Practice"],
  "machine learning": ["Statistics Basics", "Data Preparation", "Regression", "Classification", "Model Evaluation", "Overfitting and Regularization", "Feature Engineering", "ML Practice"],
  aptitude: ["Percentages", "Ratio and Proportion", "Time and Work", "Speed and Distance", "Profit and Loss", "Averages", "Permutation and Combination", "Aptitude Practice"],
  reasoning: ["Series", "Coding-Decoding", "Seating Arrangement", "Syllogisms", "Blood Relations", "Puzzles", "Direction Sense", "Reasoning Practice"],
  "current affairs": ["National News", "International News", "Economy", "Science and Tech", "Sports", "Awards and Honours", "Government Schemes", "Weekly Current Affairs Review"],
  "mock test review": ["Error Analysis", "Speed Review", "Weak Areas", "Time Management", "Accuracy Check", "Revision Sprint", "Formula Drill", "Final Mock Review"],
};

const DEFAULT_CURRICULUM = ["Orientation", "Concept Build", "Guided Practice", "Applied Practice", "Timed Drill", "Revision", "Assessment", "Wrap-Up"];

const pickCurriculum = (goal: string) => {
  const normalized = goal.toLowerCase();
  const subjectEntry = Object.entries(CURRICULA).find(([subject]) => normalized.includes(subject));
  return subjectEntry?.[1] ?? DEFAULT_CURRICULUM;
};

const subjectFromGoal = (goal: string) => {
  const cleaned = goal
    .replace(/^learn\s+/i, "")
    .replace(/\s+for\s+.*$/i, "")
    .trim();
  return cleaned || goal.trim();
};

function ThemedSelect<T extends string>({ label, value, options, onChange }: ThemedSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="block space-y-2" ref={wrapperRef}>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`select-trigger ${open ? "select-trigger-open" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selected.label}</span>
          <span className="text-lg leading-none text-slate-300">▾</span>
        </button>

        {open ? (
          <div className="select-menu" role="listbox">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`select-option ${active ? "select-option-active" : ""}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OnboardingPage({ appState, setAppState, onPlanGenerated }: Props) {
  const defaultDeadline = (() => {
    const now = new Date();
    now.setDate(now.getDate() + 28);
    return now.toISOString().slice(0, 10);
  })();

  const toInitialPlans = (): PlanForm[] => {
    const existingGoals = (appState.goal || "")
      .split("|")
      .map((goal) => goal.trim())
      .filter(Boolean);

    if (existingGoals.length > 0) {
      return existingGoals.map((goal) => ({
        id: crypto.randomUUID(),
        goal,
        deadline: defaultDeadline,
        hours_per_day: 1,
        learning_style: "practice",
        skill_level: "beginner",
      }));
    }

    return [
      {
        id: crypto.randomUUID(),
        goal: "Learn React for interviews",
        deadline: defaultDeadline,
        hours_per_day: 1,
        learning_style: "practice",
        skill_level: "beginner",
      },
    ];
  };

  const [plans, setPlans] = useState<PlanForm[]>(toInitialPlans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const learningStyleOptions: SelectOption<LearningStyle>[] = [
    { value: "visual", label: "Visual" },
    { value: "reading", label: "Reading" },
    { value: "practice", label: "Practice" },
  ];

  const skillLevelOptions: SelectOption<SkillLevel>[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const totalHoursPerDay = plans.reduce((sum, plan) => sum + plan.hours_per_day, 0);

  const updatePlan = (id: string, update: Partial<PlanForm>) => {
    setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, ...update } : plan)));
  };

  const addPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        goal: "",
        deadline: defaultDeadline,
        hours_per_day: 1,
        learning_style: "practice",
        skill_level: "beginner",
      },
    ]);
  };

  const removePlan = (id: string) => {
    setPlans((prev) => (prev.length === 1 ? prev : prev.filter((plan) => plan.id !== id)));
  };

  const buildLocalSessions = (inputPlans: Array<Omit<PlanForm, "id">>): Session[] => {
    const sessions: Session[] = [];
    const today = new Date();
    let id = 0;

    for (let day = 0; day < 7; day += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      const scheduledDate = date.toISOString().slice(0, 10);

      for (const plan of inputPlans) {
        const duration = Math.max(15, Math.round(plan.hours_per_day * 60 * 0.6));
        const subject = subjectFromGoal(plan.goal);
        const curriculum = pickCurriculum(plan.goal);
        const stage = curriculum[day % curriculum.length];
        sessions.push({
          id: String(id++),
          topic: `${subject} - ${stage}`,
          duration_minutes: duration,
          session_type: plan.learning_style === "practice" ? "practice" : "learn",
          scheduled_date: scheduledDate,
          completed: false,
        });
      }
    }

    return sessions;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!appState.user_name.trim()) {
      setError("Please log in again so we can attach this plan to your profile.");
      return;
    }

    if (plans.some((plan) => !plan.goal.trim())) {
      setError("Each plan needs a goal before generating the schedule.");
      return;
    }

    if (totalHoursPerDay > 12) {
      setError("Total allocated time per day must be 12 hours or less.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const normalizedPlans = plans.map((plan) => ({
        goal: plan.goal.trim(),
        deadline: plan.deadline,
        hours_per_day: plan.hours_per_day,
        learning_style: plan.learning_style,
        skill_level: plan.skill_level,
      }));

      const result =
        normalizedPlans.length === 1
          ? await onboard({
              name: appState.user_name,
              ...normalizedPlans[0],
            })
          : await onboardMulti({
              name: appState.user_name,
              plans: normalizedPlans,
            });

      setAppState({
        user_id: result.user.id,
        user_name: result.user.name ?? appState.user_name,
        user_age: appState.user_age,
        goal: normalizedPlans.map((plan) => plan.goal).join(" | "),
        schedule: result.schedule,
        progress: null,
      });
      onPlanGenerated();
    } catch (err) {
      const normalizedPlans = plans.map((plan) => ({
        goal: plan.goal.trim(),
        deadline: plan.deadline,
        hours_per_day: plan.hours_per_day,
        learning_style: plan.learning_style,
        skill_level: plan.skill_level,
      }));
      const localUserId = appState.user_id || `local-${Date.now()}`;
      const localSchedule = {
        id: `local-schedule-${Date.now()}`,
        user_id: localUserId,
        week_start_date: new Date().toISOString().slice(0, 10),
        sessions: buildLocalSessions(normalizedPlans as Array<Omit<PlanForm, "id">>),
        generated_at: new Date().toISOString(),
      };

      setAppState({
        user_id: localUserId,
        user_name: appState.user_name,
        user_age: appState.user_age,
        goal: normalizedPlans.map((plan) => plan.goal).join(" | "),
        schedule: localSchedule,
        progress: null,
      });
      onPlanGenerated();
      setError("Server unavailable. Generated and saved a local schedule in IndexedDB.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p-3 sm:p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
        <div className="space-y-5">
          <div>
            <p className="mono-label text-xs text-cyan-200/70">Start</p>
            <h2 className="plan-headline mt-2 text-4xl font-bold text-white md:text-5xl">
              Plan Studio for {appState.user_name}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
              Add one or more learning plans, allocate daily time for each, and generate a merged weekly schedule.
            </p>
          </div>

          <div className="chip-row">
            <span className="chip-soft">IndexedDB session retained</span>
            <span className="chip-soft">One login until logout</span>
            <span className="chip-soft">Multi-plan time allocation</span>
          </div>

          <div className="metric-pills">
            {[
              { label: "Name", value: appState.user_name },
              { label: "Age", value: appState.user_age ?? "-" },
              { label: "Total Hours/Day", value: totalHoursPerDay.toFixed(1) },
            ].map((item) => (
              <div key={item.label} className="metric-pill">
                <p className="label">{item.label}</p>
                <p className="value">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-orb p-5 sm:p-6 md:p-7">
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <div key={plan.id} className="rounded-[1.6rem] border border-white/15 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="mono-label text-xs text-slate-200">Plan {index + 1}</p>
                  {plans.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removePlan(plan.id)}
                      className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-200 hover:bg-red-500/15"
                    >
                      Remove Existing Plan
                    </button>
                  ) : null}
                </div>

                <label className="block space-y-2">
                  <span className="mono-label text-[11px] text-slate-300">Goal</span>
                  <input
                    value={plan.goal}
                    onChange={(event) => updatePlan(plan.id, { goal: event.target.value })}
                    placeholder="Learn React Hooks in 6 weeks"
                    className="input"
                  />
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="mono-label text-[11px] text-slate-300">Deadline</span>
                    <input
                      type="date"
                      value={plan.deadline}
                      onChange={(event) => updatePlan(plan.id, { deadline: event.target.value })}
                      className="input"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="mono-label text-[11px] text-slate-300">Hours per day</span>
                    <input
                      type="number"
                      min={0.5}
                      max={12}
                      step={0.5}
                      value={plan.hours_per_day}
                      onChange={(event) => updatePlan(plan.id, { hours_per_day: Number(event.target.value) || 0.5 })}
                      className="input"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <ThemedSelect
                    label="Learning style"
                    value={plan.learning_style}
                    options={learningStyleOptions}
                    onChange={(value) => updatePlan(plan.id, { learning_style: value })}
                  />

                  <ThemedSelect
                    label="Skill level"
                    value={plan.skill_level}
                    options={skillLevelOptions}
                    onChange={(value) => updatePlan(plan.id, { skill_level: value })}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPlan}
              className="w-full rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/12 to-indigo-500/12 px-4 py-2 text-sm font-semibold text-cyan-100 hover:from-cyan-500/20 hover:to-indigo-500/20"
            >
              + Add Another Plan
            </button>

            {totalHoursPerDay > 12 ? (
              <p className="rounded-xl border border-amber-400/30 bg-amber-500/15 p-3 text-sm text-amber-100">
                Total allocated hours/day is {totalHoursPerDay.toFixed(1)}. Reduce it to 12 or less.
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={loading} className="button-primary mt-6 w-full py-3 text-base disabled:opacity-60">
            {loading ? "Generating plan..." : "Generate My AI Study Plan"}
          </button>

          {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
        </form>
      </div>
    </motion.div>
  );
}