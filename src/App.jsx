import { useState, useEffect } from "react";
import { Search, Plus, Trash2, LogOut, X, Utensils, Dumbbell } from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------- Constants ----------
const DAILY_GOAL = 2000;

const ACTIVITIES = [
  { name: "Running", emoji: "🏃", met: 9.8 },
  { name: "Walking", emoji: "🚶", met: 3.5 },
  { name: "Cycling", emoji: "🚴", met: 7.5 },
  { name: "Swimming", emoji: "🏊", met: 8.0 },
  { name: "Jump Rope", emoji: "⚡", met: 11.0 },
  { name: "Football", emoji: "⚽", met: 7.0 },
  { name: "Basketball", emoji: "🏀", met: 6.5 },
  { name: "Dancing", emoji: "💃", met: 5.0 },
  { name: "Gym Workout", emoji: "💪", met: 5.5 },
  { name: "Yoga", emoji: "🧘", met: 3.0 },
];

// MET formula: calories = MET * weight(kg) * duration(hrs)
const WEIGHT_KG = 70; // default weight

function calcCaloriesBurned(met, minutes) {
  return Math.round(met * WEIGHT_KG * (minutes / 60));
}

// ---------- Helpers ----------
function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ---------- Plate Ring ----------
function PlateRing({ consumed, burned, goal }) {
  const net = Math.max(consumed - burned, 0);
  const pct = Math.min(net / goal, 1);
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const over = net > goal;

  return (
    <div style={styles.ringWrap}>
      <svg width={200} height={200} style={{ display: "block" }}>
        <circle cx={100} cy={100} r={r} fill="none" stroke="#E8E0D0" strokeWidth={14} />
        <circle
          cx={100} cy={100} r={r} fill="none"
          stroke={over ? "#E8601C" : "#2D7A3A"}
          strokeWidth={14}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
      </svg>
      <div style={styles.ringInner}>
        <div style={styles.ringCalories}>{net.toLocaleString()}</div>
        <div style={styles.ringLabel}>kcal net</div>
        <div style={styles.ringRemaining}>
          {over
            ? <span style={{ color: "#E8601C" }}>+{(net - goal).toLocaleString()} over</span>
            : <span>{Math.max(goal - net, 0).toLocaleString()} left</span>
          }
        </div>
      </div>
    </div>
  );
}

// ---------- Auth Screen ----------
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) { setError("Enter both email and password."); return; }
    setError(""); setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) { setError(error.message); setLoading(false); return; }
      setError("Check your email to confirm your account, then log in.");
      setLoading(false); setMode("login"); return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setError(error.message); setLoading(false); return; }
    setLoading(false);
  }

  return (
    <div style={styles.authPage}>
      <GlobalStyles />
      <div style={styles.authCard}>
        <div style={styles.authLogo}>🍽</div>
        <h1 style={styles.authTitle}>ChopTrack</h1>
        <p style={styles.authSub}>Track what you chop, every day.</p>
        <div style={styles.authFields}>
          <input style={styles.authInput} type="email" placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <input style={styles.authInput} type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div style={styles.authError}>{error}</div>}
        <button style={styles.authBtn} onClick={submit} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        <button style={styles.authToggle}
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "New here? Create an account →" : "Already have an account? Log in →"}
        </button>
      </div>
    </div>
  );
}

// ---------- Log Workout Modal ----------
function WorkoutModal({ onClose, onSave }) {
  const [activity, setActivity] = useState(null);
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = activity && duration
    ? calcCaloriesBurned(activity.met, Number(duration))
    : null;

  async function submit() {
    if (!activity) { setError("Pick an activity."); return; }
    if (!duration || Number(duration) <= 0) { setError("Enter duration in minutes."); return; }
    setError(""); setSaving(true);
    await onSave({
      activity: activity.name,
      duration_minutes: Number(duration),
      calories_burned: calcCaloriesBurned(activity.met, Number(duration)),
    });
    setSaving(false);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Log a workout</h3>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: "0 20px", overflowY: "auto", flex: 1 }}>
          <div style={styles.fieldLabel}>Choose activity</div>
          <div style={styles.activityGrid}>
            {ACTIVITIES.map((a) => (
              <button
                key={a.name}
                style={{
                  ...styles.activityBtn,
                  ...(activity?.name === a.name ? styles.activityBtnActive : {}),
                }}
                onClick={() => setActivity(a)}
              >
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <span style={styles.activityName}>{a.name}</span>
              </button>
            ))}
          </div>

          <div style={{ ...styles.fieldLabel, marginTop: 18 }}>Duration (minutes)</div>
          <input
            style={styles.durationInput}
            type="number"
            placeholder="e.g. 30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          {preview !== null && (
            <div style={styles.previewBanner}>
              ~{preview} kcal burned for {duration} min of {activity.name}
            </div>
          )}

          {error && <div style={styles.authError}>{error}</div>}

          <button style={{ ...styles.authBtn, marginTop: 16, marginBottom: 24 }}
            onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Log workout"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [session, setSession] = useState(undefined);
  const [foods, setFoods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("food"); // "food" | "workout"
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadData(); }, [session]);

  async function loadData() {
    setLoading(true);
    const [{ data: foodsData }, { data: logsData }, { data: workoutsData }] = await Promise.all([
      supabase.from("foods").select("*").order("name"),
      supabase.from("food_logs")
        .select("*, foods(name, portion_description, calories)")
        .gte("logged_at", today() + "T00:00:00+01:00")
        .lte("logged_at", today() + "T23:59:59+01:00")
        .order("logged_at", { ascending: false }),
      supabase.from("workouts")
        .select("*")
        .gte("logged_at", today() + "T00:00:00+01:00")
        .lte("logged_at", today() + "T23:59:59+01:00")
        .order("logged_at", { ascending: false }),
    ]);
    setFoods(foodsData || []);
    setLogs(logsData || []);
    setWorkouts(workoutsData || []);
    setLoading(false);
  }

  async function logFood(food) {
    setError("");
    const { error } = await supabase.from("food_logs").insert({
      user_id: session.user.id,
      food_id: food.id,
      logged_at: new Date().toISOString(),
    });
    if (error) { setError(`Couldn't log that food. Details: ${error.message || JSON.stringify(error)}`); return; }
    setShowFoodSearch(false); setQuery("");
    await loadData();
  }

  async function deleteLog(logId) {
    await supabase.from("food_logs").delete().eq("id", logId);
    await loadData();
  }

  async function logWorkout(data) {
    const { error } = await supabase.from("workouts").insert({
      user_id: session.user.id,
      ...data,
      logged_at: new Date().toISOString(),
    });
    if (error) { setError(`Couldn't log workout. ${error.message}`); return; }
    setShowWorkoutModal(false);
    await loadData();
  }

  async function deleteWorkout(id) {
    await supabase.from("workouts").delete().eq("id", id);
    await loadData();
  }

  async function logout() {
    await supabase.auth.signOut();
    setLogs([]); setFoods([]); setWorkouts([]);
  }

  if (session === undefined) {
    return <div style={styles.loadPage}><GlobalStyles /><div style={styles.loadDot} /></div>;
  }
  if (!session) return <AuthScreen />;

  const totalCalories = logs.reduce((sum, l) => sum + (l.foods?.calories || 0), 0);
  const totalBurned = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const filtered = foods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={styles.page}>
      <GlobalStyles />

      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>CHOPTRACK</div>
          <div style={styles.dateLabel}>{formatDate(new Date())}</div>
        </div>
        <button style={styles.logoutBtn} onClick={logout}><LogOut size={18} /></button>
      </header>

      {/* Ring */}
      <PlateRing consumed={totalCalories} burned={totalBurned} goal={DAILY_GOAL} />

      {/* Summary row */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{totalCalories.toLocaleString()}</div>
          <div style={styles.summaryLbl}>eaten</div>
        </div>
        <div style={styles.summarySep} />
        <div style={styles.summaryItem}>
          <div style={{ ...styles.summaryVal, color: "#2D7A3A" }}>{totalBurned.toLocaleString()}</div>
          <div style={styles.summaryLbl}>burned</div>
        </div>
        <div style={styles.summarySep} />
        <div style={styles.summaryItem}>
          <div style={styles.summaryVal}>{DAILY_GOAL.toLocaleString()}</div>
          <div style={styles.summaryLbl}>goal</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === "food" ? styles.tabActive : {}) }}
          onClick={() => setTab("food")}
        >
          <Utensils size={15} /> Food
        </button>
        <button
          style={{ ...styles.tab, ...(tab === "workout" ? styles.tabActive : {}) }}
          onClick={() => setTab("workout")}
        >
          <Dumbbell size={15} /> Workout
        </button>
      </div>

      {/* Content */}
      <div style={styles.section}>
        {error && <div style={styles.errorBanner}>{error}</div>}

        {tab === "food" && (
          <>
            <div style={styles.sectionRow}>
              <h2 style={styles.sectionTitle}>Today's meals</h2>
              <button style={styles.addBtn} onClick={() => setShowFoodSearch(true)}>
                <Plus size={16} strokeWidth={2.5} /> Add food
              </button>
            </div>
            {loading ? (
              <div style={styles.emptyState}>Loading…</div>
            ) : logs.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyEmoji}>🍽</div>
                <div style={styles.emptyText}>Nothing logged yet today.</div>
                <div style={styles.emptyHint}>Tap "Add food" to log your first meal.</div>
              </div>
            ) : (
              <div style={styles.logList}>
                {logs.map((log) => (
                  <div key={log.id} style={styles.logRow}>
                    <div style={styles.logInfo}>
                      <div style={styles.logName}>{log.foods?.name}</div>
                      <div style={styles.logPortion}>{log.foods?.portion_description}</div>
                    </div>
                    <div style={styles.logRight}>
                      <div style={styles.logCal}>{log.foods?.calories} kcal</div>
                      <button style={styles.deleteBtn} onClick={() => deleteLog(log.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "workout" && (
          <>
            <div style={styles.sectionRow}>
              <h2 style={styles.sectionTitle}>Today's workouts</h2>
              <button style={styles.addBtn} onClick={() => setShowWorkoutModal(true)}>
                <Plus size={16} strokeWidth={2.5} /> Log workout
              </button>
            </div>
            {loading ? (
              <div style={styles.emptyState}>Loading…</div>
            ) : workouts.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyEmoji}>💪</div>
                <div style={styles.emptyText}>No workouts logged today.</div>
                <div style={styles.emptyHint}>Tap "Log workout" to add one.</div>
              </div>
            ) : (
              <div style={styles.logList}>
                {workouts.map((w) => (
                  <div key={w.id} style={styles.logRow}>
                    <div style={styles.logInfo}>
                      <div style={styles.logName}>
                        {ACTIVITIES.find((a) => a.name === w.activity)?.emoji} {w.activity}
                      </div>
                      <div style={styles.logPortion}>{w.duration_minutes} minutes</div>
                    </div>
                    <div style={styles.logRight}>
                      <div style={{ ...styles.logCal, color: "#2D7A3A" }}>
                        -{w.calories_burned} kcal
                      </div>
                      <button style={styles.deleteBtn} onClick={() => deleteWorkout(w.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Food search modal */}
      {showFoodSearch && (
        <div style={styles.overlay} onClick={() => { setShowFoodSearch(false); setQuery(""); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add a meal</h3>
              <button style={styles.closeBtn} onClick={() => { setShowFoodSearch(false); setQuery(""); }}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.searchBar}>
              <Search size={16} color="#8a9e8d" />
              <input
                style={styles.searchInput}
                placeholder="Search Nigerian foods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div style={styles.foodList}>
              {filtered.length === 0 ? (
                <div style={styles.emptyState}>No foods match "{query}"</div>
              ) : (
                filtered.map((food) => (
                  <button key={food.id} style={styles.foodRow} onClick={() => logFood(food)}>
                    <div style={styles.foodInfo}>
                      <div style={styles.foodName}>{food.name}</div>
                      <div style={styles.foodPortion}>{food.portion_description}</div>
                    </div>
                    <div style={styles.foodCal}>{food.calories} kcal</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workout modal */}
      {showWorkoutModal && (
        <WorkoutModal onClose={() => setShowWorkoutModal(false)} onSave={logWorkout} />
      )}
    </div>
  );
}

// ---------- Global styles ----------
function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: #FAFAF7; }
      input:focus { outline: 2px solid #2D7A3A; outline-offset: 2px; }
      button:focus-visible { outline: 2px solid #2D7A3A; outline-offset: 2px; }
      button { font-family: inherit; cursor: pointer; }
      @media (prefers-reduced-motion: reduce) {
        * { transition: none !important; animation: none !important; }
      }
    `}</style>
  );
}

// ---------- Styles ----------
const FONT_DISPLAY = "'Syne', sans-serif";
const FONT_MONO = "'Syne Mono', monospace";
const FONT_BODY = "'Inter', -apple-system, sans-serif";
const GREEN = "#2D7A3A";
const ORANGE = "#E8601C";
const FOREST = "#0D2818";
const CHALK = "#FAFAF7";

const styles = {
  page: { minHeight: "100vh", background: CHALK, fontFamily: FONT_BODY, maxWidth: 480, margin: "0 auto", paddingBottom: 60 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "28px 24px 0" },
  eyebrow: { fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: GREEN, marginBottom: 4 },
  dateLabel: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: FOREST, lineHeight: 1.2 },
  logoutBtn: { background: "none", border: "none", color: "#8a9e8d", padding: 6, marginTop: 2 },
  ringWrap: { position: "relative", width: 200, height: 200, margin: "24px auto 0" },
  ringInner: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  ringCalories: { fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600, color: FOREST, lineHeight: 1 },
  ringLabel: { fontFamily: FONT_BODY, fontSize: 11, color: "#8a9e8d", marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" },
  ringRemaining: { fontFamily: FONT_BODY, fontSize: 12.5, color: GREEN, marginTop: 6, fontWeight: 600 },
  summaryRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: 0, margin: "16px 24px 0", background: "#fff", borderRadius: 12, border: "1px solid #E8E0D0", padding: "12px 0" },
  summaryItem: { flex: 1, textAlign: "center" },
  summaryVal: { fontFamily: FONT_MONO, fontSize: 17, fontWeight: 600, color: ORANGE },
  summaryLbl: { fontSize: 11, color: "#8a9e8d", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" },
  summarySep: { width: 1, height: 32, background: "#E8E0D0" },
  tabs: { display: "flex", gap: 8, margin: "20px 24px 0" },
  tab: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", border: "1px solid #E8E0D0", borderRadius: 10, background: "#fff", color: "#8a9e8d", fontSize: 14, fontWeight: 600, fontFamily: FONT_DISPLAY },
  tabActive: { background: FOREST, color: "#fff", borderColor: FOREST },
  section: { padding: "20px 24px 0" },
  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: FOREST, margin: 0 },
  addBtn: { display: "flex", alignItems: "center", gap: 5, background: GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "8px 13px", fontSize: 13, fontWeight: 600 },
  errorBanner: { background: "#FEE9E1", border: "1px solid #F4C5B0", color: ORANGE, borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 12 },
  emptyState: { textAlign: "center", padding: "40px 20px", color: "#8a9e8d" },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: FOREST, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: "#8a9e8d" },
  logList: { display: "flex", flexDirection: "column", gap: 8 },
  logRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #E8E0D0", borderRadius: 12, padding: "12px 14px", gap: 12 },
  logInfo: { flex: 1, minWidth: 0 },
  logName: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: FOREST },
  logPortion: { fontSize: 12, color: "#8a9e8d", marginTop: 2 },
  logRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  logCal: { fontFamily: FONT_MONO, fontSize: 14, color: ORANGE, fontWeight: 600 },
  deleteBtn: { background: "none", border: "none", color: "#c0b8a8", padding: 4 },
  overlay: { position: "fixed", inset: 0, background: "rgba(13, 40, 24, 0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modal: { background: CHALK, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "20px 0 0" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 16px", borderBottom: "1px solid #E8E0D0" },
  modalTitle: { fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: FOREST, margin: 0 },
  closeBtn: { background: "none", border: "none", color: "#8a9e8d", padding: 4 },
  searchBar: { display: "flex", alignItems: "center", gap: 10, margin: "12px 20px", background: "#fff", border: "1px solid #E8E0D0", borderRadius: 10, padding: "10px 14px" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: FOREST, fontFamily: FONT_BODY },
  foodList: { overflowY: "auto", flex: 1, padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 6 },
  foodRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #E8E0D0", borderRadius: 10, padding: "12px 14px", width: "100%", textAlign: "left", gap: 12 },
  foodInfo: { flex: 1, minWidth: 0 },
  foodName: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: FOREST },
  foodPortion: { fontSize: 12, color: "#8a9e8d", marginTop: 2 },
  foodCal: { fontFamily: FONT_MONO, fontSize: 13.5, color: ORANGE, fontWeight: 600, flexShrink: 0 },
  fieldLabel: { fontSize: 12.5, fontWeight: 600, color: "#8a9e8d", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" },
  activityGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 },
  activityBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", border: "1px solid #E8E0D0", borderRadius: 10, background: "#fff", color: FOREST },
  activityBtnActive: { border: `2px solid ${GREEN}`, background: "#EAF4EB" },
  activityName: { fontSize: 12.5, fontWeight: 600, fontFamily: FONT_DISPLAY },
  durationInput: { width: "100%", background: "#fff", border: "1px solid #E8E0D0", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: FOREST, fontFamily: FONT_BODY },
  previewBanner: { background: "#EAF4EB", border: "1px solid #b8d9bc", color: GREEN, borderRadius: 9, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, marginTop: 12, textAlign: "center" },
  authPage: { minHeight: "100vh", background: FOREST, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT_BODY },
  authCard: { background: CHALK, borderRadius: 20, padding: "36px 28px", width: "100%", maxWidth: 380, textAlign: "center" },
  authLogo: { fontSize: 40, marginBottom: 8 },
  authTitle: { fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: FOREST, margin: "0 0 6px" },
  authSub: { fontSize: 14, color: "#8a9e8d", margin: "0 0 24px" },
  authFields: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, textAlign: "left" },
  authInput: { width: "100%", background: "#fff", border: "1px solid #E8E0D0", borderRadius: 10, padding: "12px 14px", fontSize: 14.5, color: FOREST, fontFamily: FONT_BODY },
  authError: { fontSize: 13, color: ORANGE, marginBottom: 12, padding: "8px 12px", background: "#FEE9E1", borderRadius: 8 },
  authBtn: { width: "100%", background: GREEN, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY, marginBottom: 14 },
  authToggle: { background: "none", border: "none", color: GREEN, fontSize: 13.5, fontWeight: 600 },
  loadPage: { minHeight: "100vh", background: FOREST, display: "flex", alignItems: "center", justifyContent: "center" },
  loadDot: { width: 12, height: 12, borderRadius: "50%", background: "#F5E6C8" },
};
