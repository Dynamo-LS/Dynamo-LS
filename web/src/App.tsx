import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AppState, LoginProfile } from "./types";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import SchedulePage from "./pages/SchedulePage";
import TodayPage from "./pages/TodayPage";
import DashboardPage from "./pages/DashboardPage";
import CinematicIntro from "./components/CinematicIntro";
import FuturisticBackdrop from "./components/FuturisticBackdrop";
import {
  clearActiveUserName,
  clearLegacyWorkspace,
  getActiveUserName,
  getLegacyWorkspace,
  getWorkspaceByName,
  saveWorkspaceForName,
  setActiveUserName,
} from "./lib/workspaceStore";

export type PageId = "onboarding" | "schedule" | "today" | "dashboard";

const INITIAL_STATE: AppState = {
  user_id: "",
  user_name: "",
  user_age: null,
  goal: "",
  schedule: null,
  progress: null,
};

export default function App() {
  const [profile, setProfile] = useState<LoginProfile | null>(null);
  const [current_page, set_current_page] = useState<PageId>("onboarding");
  const [showIntro, setShowIntro] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [appState, setAppState] = useState<AppState>(() => {
    return INITIAL_STATE;
  });

  const handleSetAppState = (update: Partial<AppState>) => {
    setAppState((prev) => {
      const next = { ...prev, ...update };
      if (profile) {
        next.user_name = next.user_name || profile.name;
        next.user_age = next.user_age ?? profile.age;
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    const loadWorkspace = async () => {
      try {
        const activeUserName = await getActiveUserName();
        const workspace = activeUserName ? await getWorkspaceByName(activeUserName) : null;

        if (!active) return;

        if (workspace) {
          setProfile(workspace.profile);
          setAppState({
            ...INITIAL_STATE,
            ...workspace.appState,
            user_name: workspace.appState.user_name || workspace.profile?.name || "",
            user_age: workspace.appState.user_age ?? workspace.profile?.age ?? null,
          });
          set_current_page(workspace.currentPage as PageId);
          setShowIntro(workspace.introSeen ? false : sessionStorage.getItem("dls_intro_seen") !== "1");
          return;
        }

        const legacyWorkspace = await getLegacyWorkspace();
        if (!active || !legacyWorkspace?.profile?.name) return;

        await saveWorkspaceForName(legacyWorkspace.profile.name, legacyWorkspace);
        await setActiveUserName(legacyWorkspace.profile.name);
        await clearLegacyWorkspace();

        setProfile(legacyWorkspace.profile);
        setAppState({
          ...INITIAL_STATE,
          ...legacyWorkspace.appState,
          user_name: legacyWorkspace.appState.user_name || legacyWorkspace.profile.name,
          user_age: legacyWorkspace.appState.user_age ?? legacyWorkspace.profile.age ?? null,
        });
        set_current_page(legacyWorkspace.currentPage as PageId);
        setShowIntro(legacyWorkspace.introSeen ? false : sessionStorage.getItem("dls_intro_seen") !== "1");
      } catch {
        if (!active) return;
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!profile) {
      clearActiveUserName().catch(() => undefined);
      return;
    }

    const workspace = {
      profile,
      appState,
      currentPage: current_page,
      introSeen: sessionStorage.getItem("dls_intro_seen") === "1",
    };

    saveWorkspaceForName(profile.name, workspace)
      .then(() => setActiveUserName(profile.name))
      .catch(() => undefined);
  }, [appState, current_page, hydrated, profile]);

  const handleIntroComplete = () => {
    sessionStorage.setItem("dls_intro_seen", "1");
    setShowIntro(false);
  };

  const handleLogin = async (nextProfile: LoginProfile) => {
    const existingWorkspace = await getWorkspaceByName(nextProfile.name);

    if (existingWorkspace) {
      const restoredProfile: LoginProfile = {
        ...(existingWorkspace.profile ?? nextProfile),
        name: nextProfile.name,
        age: nextProfile.age || existingWorkspace.profile?.age || existingWorkspace.appState.user_age || 18,
      };

      const restoredState: AppState = {
        ...INITIAL_STATE,
        ...existingWorkspace.appState,
        user_name: restoredProfile.name,
        user_age: existingWorkspace.appState.user_age ?? restoredProfile.age,
      };

      setProfile(restoredProfile);
      setAppState(restoredState);
      set_current_page(existingWorkspace.currentPage as PageId);
      setShowIntro(existingWorkspace.introSeen ? false : sessionStorage.getItem("dls_intro_seen") !== "1");
      await setActiveUserName(restoredProfile.name);
      return;
    }

    setProfile(nextProfile);
    setAppState({
      ...INITIAL_STATE,
      user_name: nextProfile.name,
      user_age: nextProfile.age,
    });
    set_current_page("onboarding");
    setShowIntro(sessionStorage.getItem("dls_intro_seen") !== "1");
    await setActiveUserName(nextProfile.name);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("dls_intro_seen");
    setShowIntro(false);
    setProfile(null);
    set_current_page("onboarding");
    setAppState(INITIAL_STATE);
    await clearActiveUserName();
  };

  const nav_items = [
    { id: "onboarding", label: "Start" },
    { id: "schedule", label: "Schedule" },
    { id: "today", label: "Today" },
    { id: "dashboard", label: "Progress" },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b0f1a] text-slate-100">
      <FuturisticBackdrop />
      {profile && showIntro ? <CinematicIntro onComplete={handleIntroComplete} /> : null}
      {!profile ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <motion.div
            className="neo-panel overflow-hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
                <div className="space-y-4">
                  <p className="mono-label text-xs text-cyan-200/80">
                    AI-Powered Adaptive Learning Engine
                  </p>
                  <h1 className="heading-display bg-gradient-to-r from-cyan-100 via-blue-100 to-indigo-100 bg-clip-text text-4xl font-extrabold text-transparent md:text-6xl">
                    Dynamic Learning Scheduler
                  </h1>
                  <p className="max-w-2xl text-lg text-slate-300">
                    A living AI tutor that reshapes your plan in real-time.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="metric-chip">Real-time Adaptation</span>
                    <span className="metric-chip">Mood-Aware Planning</span>
                    <span className="metric-chip">Instant ETA Updates</span>
                  </div>

                  {appState.user_id && (
                    <nav className="nav-dock mt-5 w-fit">
                      {nav_items.map((item) => {
                        const active = current_page === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => set_current_page(item.id)}
                            whileHover={{ y: -1.5, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={`nav-btn ${active ? "nav-btn-active" : ""}`}
                          >
                            {item.label}
                          </motion.button>
                        );
                      })}
                    </nav>
                  )}
                </div>

                <div className="space-y-2 rounded-2xl border border-cyan-300/20 bg-slate-950/35 p-4">
                  <p className="mono-label text-[10px] uppercase text-cyan-200/70">Profile</p>
                  <p className="text-base font-semibold text-white">{profile.name}</p>
                  <p className="text-sm text-slate-300">Age: {profile.age}</p>
                  <button
                    onClick={handleLogout}
                    className="mt-2 w-full rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />

              <div className="p-2 sm:p-3 md:p-4">
                {current_page === "onboarding" && (
                  <OnboardingPage
                    appState={appState}
                    setAppState={handleSetAppState}
                    onPlanGenerated={() => set_current_page("schedule")}
                  />
                )}
                {current_page === "schedule" && (
                  <SchedulePage appState={appState} setAppState={handleSetAppState} />
                )}
                {current_page === "today" && (
                  <TodayPage appState={appState} setAppState={handleSetAppState} />
                )}
                {current_page === "dashboard" && <DashboardPage appState={appState} />}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
