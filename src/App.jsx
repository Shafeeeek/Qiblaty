import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brand,
  CompassDial,
  Icon,
  Modal,
  MosqueArt,
  SectionHeading,
} from "./components.jsx";
import {
  CITIES,
  METHODS,
  EMPTY_LOG,
  WORSHIP_PRAYERS,
  countdown,
  dateKey,
  nextPrayer,
  number,
  qiblaFrom,
  scheduleFor,
  shiftDay,
  streakCount,
  timeParts,
  validLocation,
  validLogs,
} from "./lib.js";
import { useClock, useStoredState } from "./hooks.js";
import {
  Achievements,
  Assistant,
  Halaqas,
  QiblaPage,
  SettingsPage,
  WorshipTracker,
} from "./pages.jsx";

const NAV = [
  { id: "prayers", label: "مواقيت الصلاة", icon: "clock" },
  { id: "qibla", label: "اتجاه القبلة", icon: "compass" },
  { id: "achievements", label: "عباداتي", icon: "trophy" },
  { id: "halaqas", label: "حلقاتي", icon: "users" },
  { id: "assistant", label: "المساعد الذكي", icon: "sparkles" },
  { id: "settings", label: "الإعدادات", icon: "settings" },
];
const currentRoute = () =>
  NAV.some((n) => n.id === location.hash.slice(1))
    ? location.hash.slice(1)
    : "prayers";

export default function App() {
  const [page, setPage] = useState(currentRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [place, setPlace] = useStoredState(
    "qibla.location.v1",
    CITIES[0],
    validLocation,
  );
  const [method, setMethod] = useStoredState(
    "qibla.method.v1",
    "Egyptian",
    (x) => Object.hasOwn(METHODS, x),
  );
  const [madhab, setMadhab] = useStoredState("qibla.madhab.v1", "shafi", (x) =>
    ["shafi", "hanafi"].includes(x),
  );
  const [logs, setLogs] = useStoredState("qibla.logs.v1", {}, validLogs);
  const [notifications, setNotifications] = useStoredState(
    "qibla.notifications.v1",
    { prayers: false, before: false, tips: false },
    (x) =>
      x &&
      ["prayers", "before", "tips"].every((k) => typeof x[k] === "boolean"),
  );
  const now = useClock();
  const todayKey = dateKey(now, place.timezone);
  const today = useMemo(
    () => scheduleFor(todayKey, place, method, madhab),
    [todayKey, place, method, madhab],
  );
  const tomorrow = useMemo(
    () => scheduleFor(shiftDay(todayKey, 1), place, method, madhab),
    [todayKey, place, method, madhab],
  );
  const upcoming = nextPrayer(now, today, tomorrow);
  const qibla = useMemo(() => qiblaFrom(place), [place]);
  const todayLog = logs[todayKey] || EMPTY_LOG;
  const streak = streakCount(logs, todayKey);
  const sentNotifications = useRef(new Set());
  const mainRef = useRef(null);
  function navigate(id) {
    window.location.hash = id;
    setPage(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }
  function updateLog(update) {
    setLogs((previous) => ({
      ...previous,
      [todayKey]: { ...(previous[todayKey] || EMPTY_LOG), ...update },
    }));
  }
  useEffect(() => {
    const onHash = () => {
      setPage(currentRoute());
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const onError = () =>
      setToast(
        "تعذّر حفظ البيانات في هذا المتصفح. ستبقى تغييراتك متاحة خلال هذه الجلسة.",
      );
    window.addEventListener("qibla-storage-error", onError);
    return () => window.removeEventListener("qibla-storage-error", onError);
  }, []);
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;
    const notify = (key, title, body) => {
      if (sentNotifications.current.has(key)) return;
      sentNotifications.current.add(key);
      try {
        new Notification(title, { body, icon: "/favicon.svg", tag: key });
      } catch {
        /* Browser may require a service worker. */
      }
    };
    for (const prayer of [...today, ...tomorrow].filter(
      (p) => p.id !== "sunrise",
    )) {
      const difference = now - prayer.date;
      if (notifications.prayers && difference >= 0 && difference < 60000)
        notify(
          `${prayer.date}-adhan`,
          `حان وقت صلاة ${prayer.name}`,
          `قبلتي • ${place.name}`,
        );
      if (notifications.before && difference >= -600000 && difference < -540000)
        notify(
          `${prayer.date}-before`,
          `اقتربت صلاة ${prayer.name}`,
          "بقيت عشر دقائق، استعد للصلاة.",
        );
    }
    const clock = new Intl.DateTimeFormat("en-GB", {
      timeZone: place.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    if (notifications.tips && ["08:00", "20:00"].includes(clock))
      notify(
        `${todayKey}-${clock}-tip`,
        "لحظة لذكر الله",
        "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر.",
      );
  }, [now, today, tomorrow, notifications, place, todayKey]);
  async function toggleNotification(key) {
    if (notifications[key]) {
      setNotifications((v) => ({ ...v, [key]: false }));
      return;
    }
    if (!("Notification" in window)) {
      setToast(
        "هذا المتصفح لا يدعم التنبيهات. يمكنك متابعة العدّ التنازلي داخل الموقع.",
      );
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("تم تفعيل تنبيهات قبلتي", {
          body: "أبقِ الموقع مفتوحاً لتصلك التذكيرات.",
          icon: "/favicon.svg",
        });
        setNotifications((v) => ({ ...v, [key]: true }));
        setToast("تم تفعيل التنبيهات أثناء فتح الموقع.");
      } else
        setToast("لم يُسمح بالتنبيهات. يمكنك تغيير الإذن من إعدادات المتصفح.");
    } catch {
      setToast("تعذّر تفعيل تنبيهات النظام في هذا المتصفح.");
    }
  }
  const selectedNav = NAV.find((n) => n.id === page);
  return (
    <div className="app-shell" dir="rtl">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        انتقل إلى المحتوى
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="إغلاق القائمة"
        />
      )}
      <aside
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label="القائمة الرئيسية"
      >
        <a
          className="brand-link"
          href="#prayers"
          onClick={() => navigate("prayers")}
        >
          <Brand />
        </a>
        <div className="nav-caption">مساحتك اليومية</div>
        <nav>
          {NAV.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => navigate(item.id)}
              className={`nav-link ${page === item.id ? "active" : ""} ${index === 5 ? "settings-link" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {page === item.id && <span className="nav-dot" />}
              {item.id === "assistant" && <span className="ai-badge">AI</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="journey-card">
            <span className="journey-symbol">
              <Icon name="heart" size={23} />
            </span>
            <h3>خطوة صغيرة، أثر عظيم</h3>
            <p>
              كل صلاة وذكر يقربك أكثر.
              <br />
              اجعل لك اليوم نصيباً من الخير.
            </p>
            <button
              className="text-button"
              onClick={() => navigate("achievements")}
            >
              تابع رحلتك <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="sidebar-footer">
            <span className="online-dot" /> صُنع بمحبة، لطمأنينتك{" "}
            <span>Shafeek Tech © {now.getFullYear()}</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="فتح القائمة"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name="menu" />
            </button>
            <span>قبلتي</span>
            <Icon name="left" size={13} />
            <strong>{selectedNav.label}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="location-button"
              onClick={() => setLocationOpen(true)}
            >
              <Icon name="pin" size={16} />
              <span>
                {place.name}، {place.country || "موقعي"}
              </span>
              <Icon name="down" size={13} />
            </button>
            <span className="topbar-separator" />
            <button
              className="icon-button notification-button"
              aria-label="إعدادات التنبيهات"
              onClick={() => navigate("settings")}
            >
              <Icon name="bell" size={19} />
              {notifications.prayers && <i />}
            </button>
            <span className="avatar">ق</span>
          </div>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1}>
          {page === "prayers" && (
            <PrayerDashboard
              {...{
                now,
                todayKey,
                today,
                upcoming,
                place,
                method,
                madhab,
                qibla,
                todayLog,
                updateLog,
                navigate,
                streak,
              }}
            />
          )}
          {page === "qibla" && (
            <QiblaPage
              {...{ qibla, place }}
              onLocate={() => setLocationOpen(true)}
            />
          )}
          {page === "achievements" && (
            <Achievements
              {...{ logs, todayKey, todayLog, updateLog, streak }}
            />
          )}
          {page === "halaqas" && <Halaqas toast={setToast} />}
          {page === "assistant" && <Assistant />}
          {page === "settings" && (
            <SettingsPage
              {...{
                place,
                setPlace,
                method,
                setMethod,
                madhab,
                setMadhab,
                notifications,
                toggleNotification,
              }}
              onLocate={() => setLocationOpen(true)}
            />
          )}
        </main>
        <footer className="page-footer">
          <Brand small />
          <p>رفيقك إلى الصلاة، ووجهتك إلى الطمأنينة.</p>
          <span>كل يوم، أقرب.</span>
        </footer>
      </div>
      {locationOpen && (
        <LocationPicker
          place={place}
          onClose={() => setLocationOpen(false)}
          onSelect={(value) => {
            setPlace(value);
            setLocationOpen(false);
            setToast(`تم تحديث الموقع إلى ${value.name}`);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="info" size={20} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="إغلاق التنبيه"
            onClick={() => setToast("")}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function PrayerDashboard({
  now,
  todayKey,
  today,
  upcoming,
  place,
  method,
  madhab,
  qibla,
  todayLog,
  updateLog,
  navigate,
  streak,
}) {
  const [offset, setOffset] = useState(0);
  const selectedKey = shiftDay(todayKey, offset);
  const schedule = useMemo(
    () =>
      offset === 0 ? today : scheduleFor(selectedKey, place, method, madhab),
    [offset, today, selectedKey, place, method, madhab],
  );
  const nextTime = timeParts(upcoming?.date, place.timezone);
  const timer = upcoming ? countdown(upcoming.date, now) : ["--", "--", "--"];
  const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    timeZone: place.timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const gregorian = new Intl.DateTimeFormat("ar-EG", {
    timeZone: place.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-star">✧</span> السلام عليكم ورحمة الله
          </div>
          <h1>
            كل يوم، <em>أقرب.</em>
          </h1>
          <p>صلاتك في وقتها، وقلبك في وجهته.</p>
        </div>
        <div className="date-summary">
          <span>
            <Icon name="calendar" size={17} />
            {hijri}
          </span>
          <p>{gregorian}</p>
        </div>
      </div>
      <div className="hero-grid">
        <section className="prayer-hero" aria-label="الصلاة القادمة">
          <div className="hero-pattern" />
          <MosqueArt />
          <div className="hero-content">
            <div className="hero-label">
              <span className="pulsing-dot" /> الصلاة القادمة{" "}
              {upcoming &&
                dateKey(upcoming.date, place.timezone) !== todayKey &&
                "• غداً"}
            </div>
            <h2>{upcoming?.name || "المواقيت غير متاحة"}</h2>
            <div className="hero-prayer-time">
              {nextTime.time}
              <span>{nextTime.period}</span>
            </div>
            <div className="countdown-label">
              <span /> متبقٍ على الأذان <span />
            </div>
            <div
              className="countdown"
              dir="ltr"
              aria-label="الوقت المتبقي للأذان"
            >
              {timer.map((part, i) => (
                <div className="countdown-part" key={i}>
                  <strong>{part}</strong>
                  <span>{["ساعة", "دقيقة", "ثانية"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-footer">
            <span>
              <Icon name="pin" size={14} />
              {place.name}، {place.country}
            </span>
            <span>حيّ على الصلاة، حيّ على الفلاح</span>
          </div>
        </section>
        <section className="card qibla-preview">
          <div className="card-top">
            <h2>
              <Icon name="compass" size={18} /> اتجاه القبلة
            </h2>
            <span className="subtle-label">وجهتك إلى مكة</span>
          </div>
          <CompassDial bearing={qibla.bearing} />
          <div className="bearing-value">
            <strong dir="ltr">{qibla.bearing.toFixed(1)}°</strong>
            <span>من الشمال باتجاه عقارب الساعة</span>
          </div>
          <button
            className="outline-button full-width"
            onClick={() => navigate("qibla")}
          >
            افتح بوصلة القبلة <Icon name="arrow" size={16} />
          </button>
        </section>
      </div>
      <section className="prayers-section">
        <SectionHeading
          title="مواقيت الصلاة"
          subtitle={
            offset === 0
              ? "لحظات تضيء يومك"
              : new Intl.DateTimeFormat("ar-EG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${selectedKey}T12:00:00Z`))
          }
        >
          <div className="day-switcher">
            <button
              aria-label="اليوم السابق"
              onClick={() => setOffset((v) => v - 1)}
            >
              <Icon name="right" size={16} />
            </button>
            <button className="day-current" onClick={() => setOffset(0)}>
              {offset === 0
                ? "اليوم"
                : offset === -1
                  ? "أمس"
                  : offset === 1
                    ? "غداً"
                    : selectedKey}
            </button>
            <button
              aria-label="اليوم التالي"
              onClick={() => setOffset((v) => v + 1)}
            >
              <Icon name="left" size={16} />
            </button>
          </div>
        </SectionHeading>
        <div className="prayer-cards">
          {schedule.map((prayer) => {
            const active =
              offset === 0 &&
              prayer.date.getTime() === upcoming?.date.getTime();
            const time = timeParts(prayer.date, place.timezone);
            return (
              <article
                key={prayer.id}
                className={`prayer-card ${active ? "next" : ""}`}
              >
                <div className="prayer-icon">
                  <Icon name={prayer.icon} size={23} />
                </div>
                <h3>{prayer.name}</h3>
                <span className="english-label">{prayer.english}</span>
                <div className="prayer-time">
                  {time.time}
                  <small>{time.period}</small>
                </div>
                <span className="prayer-card-status">
                  {active ? (
                    <>
                      <span className="status-dot" /> الصلاة القادمة
                    </>
                  ) : prayer.id === "sunrise" ? (
                    "بداية الشروق"
                  ) : offset === 0 && todayLog.prayers.includes(prayer.id) ? (
                    <>
                      <Icon name="check" size={12} /> تم أداؤها
                    </>
                  ) : (
                    "وقت الأذان"
                  )}
                </span>
              </article>
            );
          })}
        </div>
        <div className="calculation-note">
          <Icon name="info" size={13} />
          <span>
            حُسبت المواقيت حسب {METHODS[method]} • التوقيت المحلي لمدينة{" "}
            {place.name}
          </span>
          <button onClick={() => navigate("settings")}>
            تغيير طريقة الحساب <Icon name="left" size={12} />
          </button>
        </div>
      </section>
      <div className="bottom-grid">
        <section className="card daily-card">
          <SectionHeading
            title="عباداتي اليوم"
            subtitle="القليل الدائم يصنع فرقاً"
          >
            <button
              className="text-button"
              onClick={() => navigate("achievements")}
            >
              عرض الكل <Icon name="arrow" size={15} />
            </button>
          </SectionHeading>
          <WorshipTracker log={todayLog} update={updateLog} compact />
          <div className="daily-card-footer">
            <span>
              <Icon name="flame" size={16} />
              {streak > 0
                ? `${number(streak)} يوم التزام متواصل`
                : "رحلة الألف خطوة تبدأ بصلاة"}
            </span>
            <span>{number(todayLog.prayers.length)} من ٥ صلوات</span>
          </div>
        </section>
        <section className="verse-card">
          <div className="verse-label">
            <Icon name="book" size={17} />
            <span>طمأنينة لقلبك</span>
          </div>
          <div className="verse-ornament">۞</div>
          <blockquote>
            أَلَا بِذِكْرِ اللَّهِ
            <br />
            تَطْمَئِنُّ الْقُلُوبُ
          </blockquote>
          <span className="verse-source">سورة الرعد • الآية ٢٨</span>
          <div className="verse-divider">
            <span />✧<span />
          </div>
          <p>خذ لحظة، اذكر الله، وامضِ بقلب مطمئن.</p>
        </section>
      </div>
    </>
  );
}

function LocationPicker({ onClose, onSelect, place }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("الموقع الجغرافي غير متاح. اختر مدينة من القائمة.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const { latitude, longitude } = position.coords;
        const nearby = CITIES.find(
          (city) =>
            Math.abs(city.latitude - latitude) < 0.35 &&
            Math.abs(city.longitude - longitude) < 0.35,
        );
        onSelect({
          id: "gps",
          name: nearby?.name || "موقعي الحالي",
          country: nearby?.country || "GPS",
          latitude,
          longitude,
          timezone:
            nearby?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      },
      (error) => {
        if (!mounted.current) return;
        setBusy(false);
        setError(
          error.code === 1
            ? "لم يُسمح بالوصول إلى موقعك. يمكنك اختيار مدينة يدوياً."
            : "تعذّر تحديد موقعك. حاول مرة أخرى أو اختر مدينة.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }
  const cities = CITIES.filter((city) =>
    `${city.name} ${city.country} ${city.id}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <Modal title="اختر موقعك" onClose={onClose}>
      <p className="muted">لمواقيت الصلاة واتجاه القبلة في مدينتك.</p>
      <button
        className="primary-button full-width"
        onClick={locate}
        disabled={busy}
      >
        <Icon name="locate" />
        {busy ? "جارٍ تحديد موقعك…" : "استخدم موقعي الحالي"}
      </button>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <label className="field">
        ابحث عن مدينة
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="القاهرة، مكة، الرياض…"
        />
      </label>
      <div className="city-list">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => onSelect(city)}
            className={place.id === city.id ? "selected" : ""}
          >
            <Icon name="pin" size={18} />
            <span>
              {city.name}
              <small>{city.country}</small>
            </span>
            {place.id === city.id && <Icon name="check" size={16} />}
          </button>
        ))}
        {!cities.length && (
          <p className="muted empty-search">
            لا توجد مدينة مطابقة. جرّب تحديد موقعك تلقائياً.
          </p>
        )}
      </div>
      <p className="privacy-note">
        <Icon name="info" size={14} /> تُحسب المواقيت والقبلة على جهازك.
      </p>
    </Modal>
  );
}
