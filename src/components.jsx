import { useEffect, useId, useRef } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CloudSun,
  Compass,
  Flame,
  Heart,
  Info,
  LocateFixed,
  MapPin,
  Menu,
  Minus,
  Moon,
  Plus,
  Send,
  Settings,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
const icons = {
  arrow: ArrowLeft,
  arrowUp: ArrowUpRight,
  bell: Bell,
  book: BookOpen,
  calendar: CalendarDays,
  check: Check,
  down: ChevronDown,
  left: ChevronLeft,
  right: ChevronRight,
  clock: Clock3,
  cloudSun: CloudSun,
  compass: Compass,
  flame: Flame,
  heart: Heart,
  info: Info,
  locate: LocateFixed,
  pin: MapPin,
  menu: Menu,
  minus: Minus,
  moon: Moon,
  plus: Plus,
  send: Send,
  settings: Settings,
  sparkles: Sparkles,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  target: Target,
  trash: Trash2,
  trophy: Trophy,
  users: Users,
  x: X,
};
export function Icon({ name, size = 20, ...props }) {
  const Component = icons[name] || Sparkles;
  return (
    <Component size={size} strokeWidth={1.6} aria-hidden="true" {...props} />
  );
}
export function Brand({ small = false }) {
  return (
    <div className={`brand ${small ? "small" : ""}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M24 2 31 9 41 9 41 19 48 26 41 33 41 43 31 43 24 50 17 43 7 43 7 33 0 26 7 19 7 9 17 9Z"
          transform="translate(3 -1) scale(.88)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="m16 31 8-19 8 19-8-6z" fill="currentColor" />
      </svg>
      <div>
        <strong>
          قبلتي<span>QIBLATI</span>
        </strong>
        {!small && <p>رفيق رحلتك الإيمانية</p>}
      </div>
    </div>
  );
}
export function SectionHeading({ title, subtitle, children }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function MosqueArt() {
  return (
    <svg
      className="mosque-art"
      viewBox="0 0 540 350"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="dome"
          x1="275"
          y1="70"
          x2="275"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#53765a" />
          <stop offset="1" stopColor="#1d4337" />
        </linearGradient>
        <linearGradient
          id="tower"
          x1="0"
          y1="100"
          x2="150"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#668268" />
          <stop offset="1" stopColor="#244b3b" />
        </linearGradient>
      </defs>
      <circle cx="155" cy="74" r="33" fill="#ddc892" opacity=".8" />
      <circle cx="169" cy="65" r="32" fill="#264b3c" />
      <g stroke="#b7c8a1" opacity=".28">
        <path d="M55 51h8m-4-4v8M223 39h6m-3-3v6M378 58h8m-4-4v8M465 117h6m-3-3v6M53 164h6m-3-3v6" />
        <circle cx="306" cy="26" r="1.5" />
        <circle cx="406" cy="119" r="1" />
      </g>
      <g fill="url(#tower)">
        <path d="M75 315V131h27v184zM69 140h39v10H69zM77 131v-26l12-23 11 23v26zM88 80V58h2v22z" />
        <path d="M421 315V104h27v211zM415 113h39v10h-39zM423 104V78l12-23 11 23v26zM434 54V34h2v20z" />
      </g>
      <path d="M176 322V204h189v118z" fill="#274e3b" />
      <path
        d="M185 200c-9-54 63-64 85-108 20 44 95 54 85 108z"
        fill="url(#dome)"
      />
      <path d="M178 202h184v12H178z" fill="#789071" opacity=".6" />
      <path d="M270 92V69" stroke="#bca974" strokeWidth="2" />
      <path d="M274 54a8 8 0 1 0 4 13 7 7 0 0 1-4-13" fill="#ccb77d" />
      <path d="M115 324V245h62v79M365 324V245h62v79" fill="#376048" />
      <path
        d="M113 243c-2-24 21-33 32-51 10 18 34 27 33 51M364 243c-2-24 21-33 32-51 10 18 34 27 33 51"
        fill="url(#dome)"
      />
      <g fill="#153c30">
        <path d="M247 325v-63c0-17 23-30 23-30s23 13 23 30v63zM204 281v-29c0-8 10-15 10-15s10 7 10 15v29zM316 281v-29c0-8 10-15 10-15s10 7 10 15v29zM132 294v-24c0-7 12-15 12-15s12 8 12 15v24zM384 294v-24c0-7 12-15 12-15s12 8 12 15v24z" />
      </g>
      <path
        d="M246 325v-62c0-17 24-32 24-32s24 15 24 32v62"
        stroke="#9ea57a"
        opacity=".4"
      />
      <path
        d="M29 326h471M60 338h437"
        stroke="#7d916a"
        strokeWidth="2"
        opacity=".35"
      />
      <path
        d="M6 325c28-20 18-44 30-62 12 19 4 39 24 62M455 325c21-26 9-52 25-72 16 22 2 51 29 72"
        fill="#2e5840"
      />
    </svg>
  );
}
export function CompassDial({ bearing, heading = 0, large = false }) {
  return (
    <div
      className={`compass-dial ${large ? "large" : ""}`}
      role="img"
      aria-label={`اتجاه القبلة ${Math.round(bearing)} درجة من الشمال`}
    >
      <div
        className="compass-face"
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        <svg viewBox="0 0 260 260">
          <circle
            cx="130"
            cy="130"
            r="121"
            fill="none"
            stroke="currentColor"
            opacity=".15"
          />
          <circle
            cx="130"
            cy="130"
            r="94"
            fill="none"
            stroke="currentColor"
            opacity=".08"
          />
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1="130"
              y1="14"
              x2="130"
              y2={i % 5 === 0 ? "24" : "19"}
              transform={`rotate(${i * 6} 130 130)`}
              stroke="currentColor"
              opacity={i % 5 === 0 ? ".55" : ".2"}
            />
          ))}
          <text x="130" y="48" textAnchor="middle" className="north">
            N
          </text>
          <text x="214" y="134" textAnchor="middle">
            E
          </text>
          <text x="130" y="222" textAnchor="middle">
            S
          </text>
          <text x="46" y="134" textAnchor="middle">
            W
          </text>
          <path
            d="m130 65 9 55 56 10-56 9-9 56-9-56-56-9 56-10z"
            fill="currentColor"
            opacity=".04"
          />
          <g transform={`rotate(${bearing} 130 130)`}>
            <path d="m130 62 17 66-17-8-17 8z" fill="#d5b775" />
            <path d="m130 194 17-66-17 8-17-8z" fill="#53665e" />
            <circle
              cx="130"
              cy="130"
              r="7"
              fill="#152c24"
              stroke="#d5b775"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>
      <span className="compass-top-dot" />
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const titleId = useId();
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      className="modal"
      aria-labelledby={titleId}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label="إغلاق" onClick={onClose}>
          <Icon name="x" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
