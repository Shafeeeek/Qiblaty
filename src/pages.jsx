import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { CompassDial, Icon, Modal, SectionHeading } from "./components.jsx";
import {
  CITIES,
  METHODS,
  WORSHIP_PRAYERS,
  logScore,
  number,
  shiftDay,
} from "./lib.js";
import { useStoredState } from "./hooks.js";

function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading inner-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export function WorshipTracker({ log, update, compact = false }) {
  function togglePrayer(id) {
    update({
      prayers: log.prayers.includes(id)
        ? log.prayers.filter((p) => p !== id)
        : [...log.prayers, id],
    });
  }
  return (
    <div className={`worship-tracker ${compact ? "compact" : ""}`}>
      <div className="prayer-checks">
        {WORSHIP_PRAYERS.map((prayer) => (
          <button
            className={`prayer-check ${log.prayers.includes(prayer.id) ? "done" : ""}`}
            key={prayer.id}
            aria-pressed={log.prayers.includes(prayer.id)}
            onClick={() => togglePrayer(prayer.id)}
          >
            <span className="check-circle">
              <Icon
                name={log.prayers.includes(prayer.id) ? "check" : prayer.icon}
                size={18}
              />
            </span>
            <span>{prayer.name}</span>
          </button>
        ))}
      </div>
      {!compact && (
        <>
          <div className="azkar-buttons">
            {[
              ["morning", "أذكار الصباح", "sunrise"],
              ["evening", "أذكار المساء", "moon"],
            ].map(([id, label, icon]) => (
              <button
                key={id}
                className={`azkar-button ${log[id] ? "done" : ""}`}
                aria-pressed={log[id]}
                onClick={() => update({ [id]: !log[id] })}
              >
                <Icon name={icon} />
                <span>{label}</span>
                <span className="checkbox">
                  {log[id] && <Icon name="check" size={13} />}
                </span>
              </button>
            ))}
          </div>
          <div className="quran-counter">
            <div>
              <Icon name="book" />
              <span>
                صفحات القرآن<small>خمس صفحات، خطوة جميلة كل يوم</small>
              </span>
            </div>
            <div className="stepper">
              <button
                aria-label="تقليل صفحات القرآن"
                disabled={!log.pages}
                onClick={() => update({ pages: Math.max(0, log.pages - 1) })}
              >
                <Icon name="minus" size={16} />
              </button>
              <strong>{number(log.pages)}</strong>
              <button
                aria-label="زيادة صفحات القرآن"
                disabled={log.pages >= 9999}
                onClick={() => update({ pages: log.pages + 1 })}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Achievements({ logs, todayKey, todayLog, updateLog, streak }) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(todayKey, i - 6));
  const monthDays = Array.from({ length: 30 }, (_, i) =>
    shiftDay(todayKey, i - 29),
  );
  const prayerTotal = monthDays.reduce(
    (total, key) => total + (logs[key]?.prayers.length || 0),
    0,
  );
  const pages = monthDays.reduce(
    (total, key) => total + (logs[key]?.pages || 0),
    0,
  );
  return (
    <>
      <PageHeading
        eyebrow="خطواتك نحو الخير"
        title="عباداتي"
        description="لا تستصغر خطوة. الاستمرار هو أجمل إنجاز."
      />
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon amber">
            <Icon name="flame" size={26} />
          </span>
          <div>
            <strong>
              {number(streak)} <small>يوم</small>
            </strong>
            <p>إتمام الصلوات الخمس متتالياً</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Icon name="clock" size={26} />
          </span>
          <div>
            <strong>
              {number(prayerTotal)} <small>صلاة</small>
            </strong>
            <p>خلال آخر ٣٠ يوماً</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Icon name="book" size={26} />
          </span>
          <div>
            <strong>
              {number(pages)} <small>صفحة</small>
            </strong>
            <p>من القرآن خلال آخر ٣٠ يوماً</p>
          </div>
        </div>
      </div>
      <div className="two-column">
        <section className="card padded">
          <SectionHeading
            title="تسجيل عبادات اليوم"
            subtitle="سجّل ما أتممته، وواصل على مهل"
          >
            <span className="gold-tag">{number(logScore(todayLog))}٪</span>
          </SectionHeading>
          <WorshipTracker log={todayLog} update={updateLog} />
        </section>
        <section className="card padded">
          <SectionHeading
            title="أسبوع من الخير"
            subtitle="صلواتك المسجلة خلال آخر ٧ أيام"
          />
          <div className="week-chart">
            {days.map((key) => {
              const count = logs[key]?.prayers.length || 0;
              return (
                <div
                  className={`chart-column ${key === todayKey ? "current" : ""}`}
                  key={key}
                >
                  <span>{number(count)}</span>
                  <div className="chart-track">
                    <div style={{ height: `${(count / 5) * 100}%` }} />
                  </div>
                  <small>
                    {new Intl.DateTimeFormat("ar-EG", {
                      weekday: "short",
                      timeZone: "UTC",
                    }).format(new Date(`${key}T12:00:00Z`))}
                  </small>
                </div>
              );
            })}
          </div>
          <p className="chart-caption">
            كل عمود يمثل عدد الصلوات التي سجّلت أداءها.
          </p>
        </section>
      </div>
      <section className="card padded heatmap-card">
        <SectionHeading
          title="أثر الاستمرار"
          subtitle="عباداتك خلال آخر ٣٠ يوماً"
        />
        <div className="heatmap">
          {monthDays.map((key) => {
            const score = logScore(logs[key]);
            return (
              <div
                key={key}
                className={`heatmap-cell level-${score === 0 ? 0 : score < 40 ? 1 : score < 75 ? 2 : 3}`}
                title={`${key}: ${score}%`}
                aria-label={`${key}: ${number(score)}٪`}
              >
                <span>{number(Number(key.slice(-2)))}</span>
              </div>
            );
          })}
        </div>
        <div className="heatmap-legend">
          <span>أقل</span>
          {[0, 1, 2, 3].map((level) => (
            <i className={`level-${level}`} key={level} />
          ))}
          <span>أكثر</span>
        </div>
      </section>
      <p className="privacy-note">
        <Icon name="info" size={14} /> يُحفظ تقدمك في هذا المتصفح على جهازك.
      </p>
    </>
  );
}

export function QiblaPage({ qibla, place, onLocate }) {
  const [heading, setHeading] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let received = false;
    function orientation(event) {
      const value =
        typeof event.webkitCompassHeading === "number" &&
        event.webkitCompassHeading >= 0
          ? event.webkitCompassHeading
          : event.absolute === true && event.alpha !== null
            ? (360 - event.alpha) % 360
            : null;
      if (value !== null) {
        received = true;
        setHeading(value);
        setError("");
      }
    }
    window.addEventListener("deviceorientationabsolute", orientation, true);
    window.addEventListener("deviceorientation", orientation, true);
    const timer = setTimeout(() => {
      if (!received) {
        setError(
          "لم تصل قراءة للبوصلة. استخدم زاوية القبلة مع بوصلة خارجية، أو جرّب هاتفاً يدعم اتجاه الشمال.",
        );
        setEnabled(false);
      }
    }, 5000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "deviceorientationabsolute",
        orientation,
        true,
      );
      window.removeEventListener("deviceorientation", orientation, true);
    };
  }, [enabled]);
  async function enable() {
    setError("");
    if (!window.isSecureContext || !window.DeviceOrientationEvent) {
      setError(
        "البوصلة الحية تحتاج هاتفاً متوافقاً واتصال HTTPS. الزاوية أدناه محسوبة من الشمال.",
      );
      return;
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission(true);
        if (permission !== "granted") {
          setError("لم يُسمح بالوصول إلى مستشعر الاتجاه.");
          return;
        }
      }
      setEnabled(true);
    } catch {
      setError(
        "تعذّر تشغيل البوصلة. تحقق من أذونات الحركة والاتجاه في المتصفح.",
      );
    }
  }
  const aligned =
    heading !== null &&
    Math.abs(((qibla.bearing - heading + 540) % 360) - 180) < 5;
  return (
    <>
      <PageHeading
        eyebrow="أينما كنت"
        title="وجهتك واحدة"
        description="اتجه بقلبك وخطوتك إلى المسجد الحرام."
      >
        <button className="outline-button" onClick={onLocate}>
          <Icon name="pin" size={17} />
          {place.name}
          <Icon name="down" size={14} />
        </button>
      </PageHeading>
      <div className="qibla-page-grid">
        <section className={`card full-compass ${aligned ? "aligned" : ""}`}>
          <span className="gold-tag">
            {aligned
              ? "أنت باتجاه القبلة"
              : heading !== null
                ? "البوصلة الحية مفعّلة"
                : "اتجاه القبلة من الشمال"}
          </span>
          <CompassDial bearing={qibla.bearing} heading={heading || 0} large />
          <div className="bearing-value">
            <strong dir="ltr">{qibla.bearing.toFixed(1)}°</strong>
            <span>باتجاه عقارب الساعة من الشمال</span>
          </div>
          <button
            className="primary-button"
            disabled={enabled}
            onClick={enable}
          >
            <Icon name="compass" size={18} />
            {enabled
              ? heading === null
                ? "بانتظار مستشعر الاتجاه…"
                : "البوصلة الحية تعمل"
              : "تشغيل بوصلة الهاتف"}
          </button>
          {error && (
            <p className="inline-notice" role="status">
              {error}
            </p>
          )}
        </section>
        <div className="qibla-details">
          <section className="card padded">
            <span className="stat-icon">
              <Icon name="pin" size={24} />
            </span>
            <h2>من {place.name} إلى مكة</h2>
            <p>المسافة التقريبية إلى الكعبة المشرفة</p>
            <div className="distance-value">
              {number(Math.round(qibla.distance))}
              <small>كم</small>
            </div>
            <div className="coordinate-pair" dir="ltr">
              <span>{place.latitude.toFixed(4)}° LAT</span>
              <span>{place.longitude.toFixed(4)}° LNG</span>
            </div>
          </section>
          <section className="card padded compass-guide">
            <h2>
              <Icon name="info" size={19} /> لبوصلة أكثر دقة
            </h2>
            <p>ضع هاتفك بشكل مسطح، وابتعد عن الأجسام المعدنية والمغناطيسية.</p>
            <p>حرّك هاتفك على شكل الرقم 8 لمعايرة مستشعر البوصلة.</p>
            <p>
              على الكمبيوتر، اجعل الشمال أعلى الرسم واستخدم الزاوية مع بوصلة
              خارجية.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

const HALAQA_TYPES = {
  quran: { name: "ختمة قرآن", unit: "جزء", target: 30, icon: "book" },
  tasbih: { name: "تسبيح", unit: "تسبيحة", target: 1000, icon: "sparkles" },
  azkar: { name: "أذكار يومية", unit: "يوم", target: 30, icon: "sunrise" },
};
function validHalaqas(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (h) =>
        h &&
        typeof h.id === "string" &&
        typeof h.name === "string" &&
        Object.hasOwn(HALAQA_TYPES, h.type) &&
        Number.isInteger(h.target) &&
        h.target > 0 &&
        Number.isInteger(h.progress) &&
        h.progress >= 0 &&
        h.progress <= h.target,
    )
  );
}
export function Halaqas({ toast }) {
  const [halaqas, setHalaqas] = useStoredState(
    "qibla.halaqas.v1",
    [],
    validHalaqas,
  );
  const [create, setCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  function add(halaqa) {
    setHalaqas((v) => [
      { ...halaqa, id: crypto.randomUUID(), progress: 0 },
      ...v,
    ]);
    setCreate(false);
    toast("تم إنشاء الحلقة. جعلها الله بداية خير.");
  }
  function progress(id, amount) {
    setHalaqas((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              progress: Math.max(
                0,
                Math.min(item.target, item.progress + amount),
              ),
            }
          : item,
      ),
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="نتعاون على الخير"
        title="حلقاتي"
        description="نظّم وردك من القرآن والذكر، وتابع تقدمك يوماً بيوم."
      >
        <button className="primary-button" onClick={() => setCreate(true)}>
          <Icon name="plus" size={18} />
          إنشاء حلقة
        </button>
      </PageHeading>
      <div className="inline-notice">
        <Icon name="info" size={18} />
        الحلقات في نسخة الويب محفوظة على هذا الجهاز. المشاركة والمزامنة بين
        الأعضاء غير متاحة حالياً.
      </div>
      {!halaqas.length ? (
        <section className="card empty-state">
          <span className="empty-icon">
            <Icon name="users" size={36} />
          </span>
          <h2>بداية خير تجمعنا</h2>
          <p>
            أنشئ أول حلقة لختم القرآن أو التسبيح أو الأذكار،
            <br />
            وخصّص لها هدفاً تقترب منه كل يوم.
          </p>
          <button className="primary-button" onClick={() => setCreate(true)}>
            <Icon name="plus" size={18} />
            أنشئ حلقتك الأولى
          </button>
        </section>
      ) : (
        <div className="halaqa-grid">
          {halaqas.map((halaqa) => {
            const type = HALAQA_TYPES[halaqa.type];
            const percent = Math.round((halaqa.progress / halaqa.target) * 100);
            return (
              <section className="card padded halaqa-card" key={halaqa.id}>
                <div className="halaqa-top">
                  <span className="stat-icon">
                    <Icon name={type.icon} size={24} />
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`حذف ${halaqa.name}`}
                    onClick={() => setDeleting(halaqa)}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <span className="subtle-label">{type.name}</span>
                <h2>{halaqa.name}</h2>
                <div className="halaqa-progress">
                  <strong>{number(percent)}٪</strong>
                  <span>
                    {number(halaqa.progress)} / {number(halaqa.target)}{" "}
                    {type.unit}
                  </span>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${percent}%` }} />
                </div>
                <div className="halaqa-controls">
                  <button
                    className="outline-button"
                    disabled={!halaqa.progress}
                    aria-label={`تقليل تقدم ${halaqa.name}`}
                    onClick={() => progress(halaqa.id, -1)}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <button
                    className="primary-button"
                    disabled={halaqa.progress === halaqa.target}
                    onClick={() => progress(halaqa.id, 1)}
                  >
                    <Icon name={percent === 100 ? "check" : "plus"} size={16} />
                    {percent === 100
                      ? "اكتملت الحلقة، تقبّل الله"
                      : `أضف ${type.unit === "جزء" ? "جزءاً" : type.unit === "يوم" ? "يوماً" : "تسبيحة"}`}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {create && (
        <CreateHalaqa onClose={() => setCreate(false)} onCreate={add} />
      )}
      {deleting && (
        <Modal title="حذف الحلقة؟" onClose={() => setDeleting(null)}>
          <p>سيُحذف تقدمك في «{deleting.name}» من هذا الجهاز.</p>
          <div className="modal-actions">
            <button
              className="danger-button"
              onClick={() => {
                setHalaqas((v) => v.filter((h) => h.id !== deleting.id));
                setDeleting(null);
              }}
            >
              حذف الحلقة
            </button>
            <button
              className="outline-button"
              onClick={() => setDeleting(null)}
            >
              إلغاء
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function CreateHalaqa({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("quran");
  const [target, setTarget] = useState(30);
  return (
    <Modal title="حلقة جديدة" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            name.trim() &&
            Number.isInteger(Number(target)) &&
            Number(target) > 0
          )
            onCreate({ name: name.trim(), type, target: Number(target) });
        }}
      >
        <label className="field">
          اسم الحلقة
          <input
            autoFocus
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: ختمتي هذا الشهر"
          />
        </label>
        <label className="field">
          نوع الحلقة
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setTarget(HALAQA_TYPES[e.target.value].target);
            }}
          >
            {Object.entries(HALAQA_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          الهدف ({HALAQA_TYPES[type].unit})
          <input
            type="number"
            required
            min="1"
            max="1000000"
            step="1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        <button className="primary-button full-width" disabled={!name.trim()}>
          إنشاء الحلقة <Icon name="plus" size={16} />
        </button>
      </form>
    </Modal>
  );
}

const SUGGESTIONS = [
  "ما هي أذكار الصباح؟",
  "كيف أخشع في صلاتي؟",
  "ما فضل قراءة القرآن؟",
  "ما هي سنن الوضوء؟",
];
export function Assistant() {
  const [messages, setMessages] = useStoredState(
    "qibla.chat.v1",
    [],
    (value) =>
      Array.isArray(value) &&
      value.every(
        (m) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string",
      ),
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const controller = useRef(null);
  const end = useRef(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);
  async function send(text, retry = false) {
    if (busy || (!retry && !text.trim())) return;
    const conversation = retry
      ? messages
      : [...messages, { role: "user", content: text.trim().slice(0, 2000) }];
    setMessages(conversation);
    setInput("");
    setError("");
    setBusy(true);
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 45000);
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const response = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation.slice(-20) }),
        signal: controller.current.signal,
      });
      if (!response.ok) {
        const httpErr = new Error("http");
        httpErr.status = response.status;
        throw httpErr;
      }
      const data = await response.json();
      if (typeof data.reply !== "string" || !data.reply.trim())
        throw new Error("empty");
      if (mounted.current)
        setMessages([
          ...conversation,
          { role: "assistant", content: data.reply },
        ]);
    } catch (err) {
      if (mounted.current) {
        let msg;
        if (err.name === "AbortError") {
          msg = "استغرقت الإجابة وقتاً أطول من المتوقع. حاول مرة أخرى.";
        } else if (err.status === 429) {
          msg = "تجاوزت الحد المسموح به من الطلبات. انتظر قليلاً ثم حاول مجدداً.";
        } else if (err.status === 504) {
          msg = "انتهت مهلة الاستجابة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
        } else if (err.status === 503) {
          msg = "خدمة المساعد غير متاحة حالياً. يُرجى المحاولة لاحقاً.";
        } else if (err.status >= 500) {
          msg = "حدث خطأ في الخادم. يُرجى المحاولة مرة أخرى.";
        } else if (!navigator.onLine) {
          msg = "لا يوجد اتصال بالإنترنت. تحقق من شبكتك وحاول مجدداً.";
        } else {
          msg = "تعذّر الوصول إلى المساعد. تحقق من اتصالك وحاول مرة أخرى.";
        }
        setError(msg);
      }
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="مساحة للسؤال والمعرفة"
        title="مساعد قبلتي"
        description="أسئلتك عن العبادات والأذكار والقرآن، في مكان واحد."
      >
        {messages.length > 0 && (
          <button
            className="outline-button"
            disabled={busy}
            onClick={() => setClearOpen(true)}
          >
            <Icon name="plus" size={16} />
            محادثة جديدة
          </button>
        )}
      </PageHeading>
      <section className="card assistant-panel">
        <div className="assistant-panel-header">
          <span className="assistant-avatar">
            <Icon name="sparkles" size={22} />
          </span>
          <div>
            <h2>مساعدك في رحلة الإيمان</h2>
            <span>الفقه والعبادات • القرآن • الأحاديث والأذكار</span>
          </div>
          <span className="gold-tag">AI</span>
        </div>
        <div
          className="chat-body"
          role="log"
          aria-label="المحادثة"
          aria-live="polite"
        >
          {!messages.length && (
            <div className="assistant-welcome">
              <span className="welcome-star">
                <Icon name="sparkles" size={34} />
              </span>
              <h2>بماذا يمكنني مساعدتك اليوم؟</h2>
              <p>ابدأ بسؤال، وافتح باباً للمعرفة.</p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button key={suggestion} onClick={() => send(suggestion)}>
                    <Icon
                      name={["sunrise", "heart", "book", "sparkles"][i]}
                      size={19}
                    />
                    <span>{suggestion}</span>
                    <Icon name="arrow" size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, i) => (
            <div className={`chat-message ${message.role}`} key={i}>
              <span className="message-label">
                {message.role === "user" ? "أنت" : "مساعد قبلتي"}
              </span>
              <div className="message-content">
                {message.role === "assistant" ? (
                  <Markdown
                    components={{
                      img: ({ alt }) => <span>{alt}</span>,
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </Markdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="typing" role="status">
              يكتب مساعد قبلتي<span>•••</span>
            </div>
          )}
          {error && (
            <div className="chat-error" role="alert">
              <p>{error}</p>
              <button className="outline-button" onClick={() => send("", true)}>
                إعادة المحاولة
              </button>
            </div>
          )}
          <div ref={end} />
        </div>
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            aria-label="رسالتك إلى المساعد"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            placeholder="اكتب سؤالك هنا…"
            disabled={busy}
          />
          <button
            className="primary-button"
            aria-label="إرسال الرسالة"
            disabled={busy || !input.trim()}
          >
            <Icon name="send" size={18} />
          </button>
        </form>
        <p className="assistant-note">
          قد يخطئ المساعد. راجع المصادر واسأل أهل العلم في المسائل الفقهية.
          تُرسل رسائلك إلى خدمة الذكاء الاصطناعي.
        </p>
      </section>
      {clearOpen && (
        <Modal title="بدء محادثة جديدة؟" onClose={() => setClearOpen(false)}>
          <p>ستُحذف المحادثة الحالية من هذا المتصفح.</p>
          <div className="modal-actions">
            <button
              className="primary-button"
              onClick={() => {
                setMessages([]);
                setError("");
                setClearOpen(false);
              }}
            >
              بدء محادثة
            </button>
            <button
              className="outline-button"
              onClick={() => setClearOpen(false)}
            >
              إلغاء
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function SettingsPage({
  place,
  setPlace,
  method,
  setMethod,
  madhab,
  setMadhab,
  notifications,
  toggleNotification,
  onLocate,
}) {
  return (
    <>
      <PageHeading
        eyebrow="على ما يناسبك"
        title="الإعدادات"
        description="اضبط تجربتك، واجعل قبلتي أقرب إليك."
      />
      <div className="settings-grid">
        <section className="card padded">
          <SectionHeading
            title="الموقع والمواقيت"
            subtitle="حساب دقيق بحسب مدينتك وطريقتك"
          />
          <div className="setting-location">
            <span className="stat-icon">
              <Icon name="pin" />
            </span>
            <div>
              <h3>
                {place.name}، {place.country}
              </h3>
              <p dir="ltr">
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </p>
            </div>
            <button className="text-button" onClick={onLocate}>
              تغيير
            </button>
          </div>
          <label className="field">
            طريقة حساب المواقيت
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {Object.entries(METHODS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            حساب صلاة العصر
            <select value={madhab} onChange={(e) => setMadhab(e.target.value)}>
              <option value="shafi">الشافعي والمالكي والحنبلي</option>
              <option value="hanafi">الحنفي</option>
            </select>
          </label>
          <label className="field">
            المنطقة الزمنية
            <select
              dir="ltr"
              value={place.timezone}
              onChange={(e) =>
                setPlace((p) => ({ ...p, timezone: e.target.value }))
              }
            >
              {[
                ...new Set([
                  place.timezone,
                  ...CITIES.map((c) => c.timezone),
                  ...(Intl.supportedValuesOf
                    ? Intl.supportedValuesOf("timeZone")
                    : []),
                ]),
              ]
                .sort()
                .map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
            </select>
          </label>
          <p className="field-help">
            يُراعى التوقيت الصيفي تلقائياً. تحقّق من المنطقة الزمنية عند استخدام
            GPS أثناء السفر.
          </p>
        </section>
        <section className="card padded">
          <SectionHeading
            title="التنبيهات والتذكيرات"
            subtitle="مساحة للذكر وسط يومك"
          />
          {[
            [
              "prayers",
              "تنبيهات مواقيت الصلاة",
              "تذكير عند دخول وقت كل صلاة",
              "bell",
            ],
            [
              "before",
              "تذكير قبل الأذان",
              "استعد للصلاة قبل الأذان بعشر دقائق",
              "clock",
            ],
            [
              "tips",
              "تذكير يومي بالذكر",
              "تذكير الساعة ٨ صباحاً و٨ مساءً",
              "sparkles",
            ],
          ].map(([id, title, subtitle, icon]) => (
            <div className="setting-row" key={id}>
              <Icon name={icon} size={21} />
              <div>
                <h3>{title}</h3>
                <p>{subtitle}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifications[id]}
                aria-label={title}
                className={`toggle ${notifications[id] ? "on" : ""}`}
                onClick={() => toggleNotification(id)}
              >
                <span />
              </button>
            </div>
          ))}
          <div className="inline-notice">
            <Icon name="info" size={17} />
            <span>
              تعمل التذكيرات أثناء فتح الموقع ونشاط المتصفح فقط. تحتاج إلى إذن
              التنبيهات، وقد تتأخر عند تعليق التبويب.
            </span>
          </div>
        </section>
        <section className="card padded about-card">
          <SectionHeading title="عن قبلتي" subtitle="رفيق رحلتك الإيمانية" />
          <p>
            مواقيت الصلاة، اتجاه القبلة، ومتابعة العبادات في تجربة عربية بسيطة،
            أينما كنت.
          </p>
          <div className="about-details">
            <span>
              تطوير وتصميم <strong dir="ltr">Shafeek Tech</strong>
            </span>
            <span>
              إصدار الويب <strong>1.0.0</strong>
            </span>
          </div>
        </section>
        <section className="card padded">
          <SectionHeading
            title="خصوصيتك"
            subtitle="بياناتك اليومية تبقى قريبة منك"
          />
          <p className="body-copy">
            يُحفظ الموقع والإعدادات وسجل العبادات والحلقات والمحادثة في هذا
            المتصفح. لا تتم مزامنتها بين الأجهزة، وقد يؤدي مسح بيانات المتصفح
            إلى حذفها. تُحسب المواقيت والقبلة محلياً. عند استخدام المساعد تُرسل
            رسائلك إلى خادم المساعد ومزوّد الذكاء الاصطناعي.
          </p>
        </section>
      </div>
    </>
  );
}
