import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft, HelpCircle, Clock } from "lucide-react";

export type Task = { id: string; text: string };

export type Module = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  tasks: Task[];
};

export type ModuleProgress = {
  done: Record<string, boolean>;
};

export type Progress = {
  [moduleId: string]: ModuleProgress | any;
  _streak?: { count: number; last: string | null };
  _touchedToday?: boolean;
};

const DEFAULT_MODULES: Module[] = [
  {
    id: "driving",
    title: "Rules of the Road",
    subtitle: "Drive like you have sense",
    emoji: "🚗",
    color: "from-amber-200 to-amber-400",
    tasks: [
      { id: "lane-discipline", text: "Signal + mirror + blind-spot before lane change" },
      { id: "left-lane", text: "Use left lane for passing only" },
      { id: "beams", text: "Kill high beams for oncoming/taillights" }
    ]
  },
  {
    id: "chores",
    title: "Chores & Environment",
    subtitle: "Read the room, then fix it",
    emoji: "🧹",
    color: "from-lime-200 to-lime-400",
    tasks: [
      { id: "30scan", text: "30-second room scan (surfaces, floors, smells)" },
      { id: "dishes", text: "Wash dishes after use (no fossilized sauce)" },
      { id: "trash", text: "Take out trash before it stinks" }
    ]
  },
  {
    id: "carcare",
    title: "Car Care",
    subtitle: "Independence insurance policy",
    emoji: "🛠️",
    color: "from-sky-200 to-sky-400",
    tasks: [
      { id: "oil", text: "Check oil monthly (between MIN/MAX)" },
      { id: "psi", text: "Check tire PSI twice a month" },
      { id: "lights", text: "Know red vs amber dash lights" }
    ]
  },
  {
    id: "groceries",
    title: "Grocery Strategy",
    subtitle: "Survival w/ strategy",
    emoji: "🛒",
    color: "from-rose-200 to-rose-400",
    tasks: [
      { id: "dont-hungry", text: "Don’t shop hungry" },
      { id: "list", text: "Make a list; stick to it" },
      { id: "budget", text: "Track spend while shopping" }
    ]
  },
  {
    id: "bodylang",
    title: "Body Language",
    subtitle: "Read & project power",
    emoji: "🧠",
    color: "from-violet-200 to-violet-400",
    tasks: [
      { id: "eyes", text: "Hold 3–5s eye contact, break naturally" },
      { id: "hands", text: "Keep hands visible; no fidgeting" },
      { id: "posture", text: "Shoulders back; head level" }
    ]
  },
  {
    id: "presentation",
    title: "Presentation",
    subtitle: "First impressions & standards",
    emoji: "🧥",
    color: "from-stone-200 to-stone-400",
    tasks: [
      { id: "dress-mission", text: "Dress to match the mission" },
      { id: "clean-shoes", text: "Clean footwear = instant upgrade" },
      { id: "hygiene", text: "Daily hygiene checklist, no excuses" }
    ]
  },
  {
    id: "golden",
    title: "Golden Rule",
    subtitle: "Social survival guide",
    emoji: "🫱🏻‍🫲🏽",
    color: "from-yellow-200 to-yellow-400",
    tasks: [
      { id: "basic-courtesy", text: "Please/thanks, hold doors, let merge" },
      { id: "names", text: "Use names; give credit" },
      { id: "boundaries", text: "Kind ≠ doormat; set boundaries" }
    ]
  },
  {
    id: "word",
    title: "Your Word",
    subtitle: "Currency of trust",
    emoji: "🗝️",
    color: "from-emerald-200 to-emerald-400",
    tasks: [
      { id: "say-less", text: "Say less, mean more (no overpromising)" },
      { id: "keep-hard", text: "Keep it when it’s hard" },
      { id: "own-miss", text: "If you miss, own it early" }
    ]
  },
  {
    id: "situational",
    title: "Situational Awareness",
    subtitle: "Fight / Walk / Run",
    emoji: "🦅",
    color: "from-indigo-200 to-indigo-400",
    tasks: [
      { id: "yellow", text: "Default: Condition YELLOW" },
      { id: "exits", text: "Clock exits on entry" },
      { id: "hands-not-faces", text: "Watch hands, not faces" }
    ]
  },
  {
    id: "nerve",
    title: "Working Up the Nerve",
    subtitle: "Shoot your shot, not your foot",
    emoji: "💬",
    color: "from-orange-200 to-orange-400",
    tasks: [
      { id: "simple", text: "Keep it simple; be direct" },
      { id: "private", text: "Private, not isolated setting" },
      { id: "champ-no", text: "Handle a ‘no’ like a champ" }
    ]
  }
];

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const STORAGE_KEY = "adulting-coach-progress";
const STORAGE_VERSION = 1;

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__v === STORAGE_VERSION && parsed.data) return parsed.data;
    return parsed?.data || parsed || {};
  } catch {
    return {};
  }
}

function useLocalProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ __v: STORAGE_VERSION, data: progress })
        );
      } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [progress]);

  return [progress, setProgress] as const;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div className="h-full bg-black/70 dark:bg-white/80" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export default function AdultingCoach() {
  const modules = DEFAULT_MODULES;
  const [progress, setProgress] = useLocalProgress();
  const [active, setActive] = useState<string | null>(null);

  const taskCounts = useMemo(() => (
    Object.fromEntries(modules.map((m) => [m.id, m.tasks.length])) as Record<string, number>
  ), [modules]);

  const modulesById = useMemo(() => (
    Object.fromEntries(modules.map((m) => [m.id, m])) as Record<string, Module>
  ), [modules]);

  const streak = (progress._streak ?? { count: 0, last: null }) as { count: number; last: string | null };
  useEffect(() => {
    const key = todayKey();
    if (progress._touchedToday || streak.last === key) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    setProgress((p) => ({
      ...p,
      _streak: { count: streak.last === yKey ? (streak.count || 0) + 1 : 1, last: key },
      _touchedToday: true
    }));
  }, []);

  const toggleTask = (moduleId: string, taskId: string) => {
    setProgress((prev) => {
      const current: ModuleProgress = prev[moduleId] && prev[moduleId].done
        ? (prev[moduleId] as ModuleProgress)
        : { done: {} };
      const done = { ...current.done, [taskId]: !current.done[taskId] };
      return { ...prev, [moduleId]: { ...current, done } } as Progress;
    });
  };

  const moduleCompletion = (moduleId: string) => {
    const mod: ModuleProgress = (progress[moduleId] && (progress[moduleId] as ModuleProgress)) || { done: {} };
    const total = taskCounts[moduleId] || 0;
    const doneCount = Object.values(mod.done).filter(Boolean).length;
    return total ? doneCount / total : 0;
  };

  const activeModule = active ? modulesById[active] ?? null : null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 text-neutral-900 dark:text-neutral-50">
        <header className="sticky top-0 z-40 backdrop-blur border-b border-black/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div className="font-bold text-xl">Adulting Coach</div>
            <div className="ml-auto text-sm flex items-center gap-2 opacity-80">
              <Clock className="h-4 w-4" /> Streak: {streak.count || 0} days
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => {
              const completion = moduleCompletion(m.id);
              return (
                <motion.button
                  key={m.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActive(m.id)}
                  className={`text-left rounded-2xl p-4 shadow-sm border border-black/10 dark:border-white/10 bg-gradient-to-br ${m.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{m.emoji}</div>
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-sm opacity-80">{m.subtitle}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={completion} />
                  </div>
                  <div className="mt-2 text-xs opacity-70">{Math.round(completion * 100)}% complete</div>
                </motion.button>
              );
            })}
          </section>

          <footer className="mt-8 text-xs opacity-60">
            <div>Hot‑path optimized: taskCounts + modulesById + typed progress</div>
            <div>Next: PDF→tasks import, PWA packaging</div>
          </footer>
        </main>

        <AnimatePresence>
          {activeModule && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setActive(null)} />
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="relative z-10 w-full sm:max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => setActive(null)}
                    className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5"
                    type="button"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="text-2xl mr-1">{activeModule.emoji}</div>
                  <div>
                    <div className="font-semibold leading-tight">{activeModule.title}</div>
                    <div className="text-xs opacity-70 -mt-0.5">{activeModule.subtitle}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeModule.tasks.map((t) => {
                    const mod: ModuleProgress = (progress[activeModule.id] as ModuleProgress) || { done: {} };
                    const done = Boolean(mod.done[t.id]);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={done}
                        onClick={() => toggleTask(activeModule.id, t.id)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                          done
                            ? "border-emerald-500/40 bg-emerald-100/60 dark:bg-emerald-900/30"
                            : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className={`flex-none rounded-full p-1 ${done ? "bg-emerald-500 text-white" : "bg-transparent"}`}>
                          {done ? <Check className="h-4 w-4" /> : <X className="h-4 w-4 opacity-40" />}
                        </div>
                        <div className={`text-sm ${done ? "line-through opacity-70" : ""}`}>{t.text}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs opacity-70">
                  <HelpCircle className="h-4 w-4" />
                  <span>Tasks count toward your daily streak. Check in daily to keep it alive.</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
