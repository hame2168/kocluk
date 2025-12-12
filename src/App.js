import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import {
  Layout, Users, BookOpen, Target, Smile, MessageSquare, CreditCard, LogOut, Plus, Trash2,
  ChevronRight, User, Lock, Check, Edit2, Save, X, Calendar, ChevronDown,
  Activity, Award, Clock, List, Book, RefreshCw, Zap,
  Library, Flag, Phone, GraduationCap, Timer, Menu, CloudOff, Cloud, Shield, Eye, Sun, Moon,
  Settings, ArrowUp, ArrowDown
} from 'lucide-react';

import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, setDoc,
} from "firebase/firestore";

// --- FIREBASE ENTEGRASYONU ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBcgbe_NhAfzwUHpuAS0TniHv-FifmxOA8",
  authDomain: "kocluk-6868.firebaseapp.com",
  projectId: "kocluk-6868",
  storageBucket: "kocluk-6868.firebasestorage.app",
  messagingSenderId: "172948773174",
  appId: "1:172948773174:web:4a58aadf83c48d2e187b97"
};

let db = null;
let isFirebaseActive = false;

if (FIREBASE_CONFIG.apiKey) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    isFirebaseActive = true;
    console.log("Firebase bağlantısı başarılı.");
  } catch (error) {
    console.error("Firebase başlatma hatası:", error);
  }
}

// --- TEMA YÖNETİMİ ---
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// Renk paleti yardımcı fonksiyonu
const useThemeColors = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    isDark,
    bgMain: isDark ? 'bg-slate-950' : 'bg-slate-100',
    bgCard: isDark ? 'bg-slate-900' : 'bg-white',
    bgCardTransparent: isDark ? 'bg-slate-900/50' : 'bg-white/80',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSec: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-slate-800' : 'border-slate-300',
    inputBg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    inputBorder: isDark ? 'border-slate-700' : 'border-slate-300',
    hoverBg: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200',
    tableHeader: isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700',
    divider: isDark ? 'divide-slate-800' : 'divide-slate-200',
    shadow: isDark ? 'shadow-none' : 'shadow-sm',
    chartGrid: isDark ? '#334155' : '#e2e8f0',
    chartTooltip: isDark ? '#1e293b' : '#ffffff',
  };
};

// --- GLOBAL HELPERS: DATE, SORTING ---
const pad2 = (n) => String(n).padStart(2, '0');

const parseDateLike = (value) => {
  // Accepts: YYYY-MM-DD, DD/MM/YYYY, Date, timestamp number
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  if (typeof value === 'string') {
    // YYYY-MM-DD
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    // DD/MM/YYYY
    const dmy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

    // tr-TR locale format can be "D.M.YYYY" etc.
    const dot = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dot) return new Date(Number(dot[3]), Number(dot[2]) - 1, Number(dot[1]));

    const t = Date.parse(value);
    if (!Number.isNaN(t)) return new Date(t);
  }
  return null;
};

const formatDateDDMMYYYY = (value) => {
  const d = parseDateLike(value);
  if (!d) return '-';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const toISODateInput = (value) => {
  // For <input type="date" />, expects YYYY-MM-DD
  const d = parseDateLike(value);
  if (!d) return new Date().toISOString().split('T')[0];
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

const compareByDateDesc = (a, b, getDate) => {
  const da = parseDateLike(getDate(a))?.getTime() ?? 0;
  const dbb = parseDateLike(getDate(b))?.getTime() ?? 0;
  return dbb - da;
};

// --- CHART HELPER (SMOOTH CURVES) ---
const svgPath = (points, command) => {
  const d = points.reduce((acc, point, i, a) => i === 0
    ? `M ${point[0]},${point[1]}`
    : `${acc} ${command(point, i, a)}`
  , '');
  return d;
};

const line = (pointA, pointB) => {
  const lengthX = pointB[0] - pointA[0];
  const lengthY = pointB[1] - pointA[1];
  return { length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)), angle: Math.atan2(lengthY, lengthX) };
};

const controlPoint = (current, previous, next, reverse) => {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.2;
  const o = line(p, n);
  const angle = o.angle + (reverse ? Math.PI : 0);
  const length = o.length * smoothing;
  const x = current[0] + Math.cos(angle) * length;
  const y = current[1] + Math.sin(angle) * length;
  return [x, y];
};

const bezierCommand = (point, i, a) => {
  const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
  const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
  return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
};

// --- VERİ MODELİ VE SABİTLER ---
const SUPER_ADMIN_ID = "super_admin_hmk";
const EXAM_TYPES = {
  TYT: {
    label: 'YKS - TYT',
    groups: [
      { title: 'Türkçe', sections: [{ key: 'turk', label: 'Türkçe', q: 40 }] },
      { title: 'Sosyal Bilimler', sections: [{ key: 'tarih', label: 'Tarih', q: 5 }, { key: 'cog', label: 'Coğrafya', q: 5 }, { key: 'fel', label: 'Felsefe', q: 5 }, { key: 'din', label: 'Din K.', q: 5 }] },
      { title: 'Temel Matematik', sections: [{ key: 'mat', label: 'Matematik', q: 30 }, { key: 'geo', label: 'Geometri', q: 10 }] },
      { title: 'Fen Bilimleri', sections: [{ key: 'fiz', label: 'Fizik', q: 7 }, { key: 'kim', label: 'Kimya', q: 7 }, { key: 'biyo', label: 'Biyoloji', q: 6 }] }
    ]
  },
  AYT: {
    label: 'YKS - AYT',
    groups: [
      { title: 'Matematik & Geometri', sections: [{ key: 'mat', label: 'Matematik', q: 30 }, { key: 'geo', label: 'Geometri', q: 10 }] },
      { title: 'Fen Bilimleri', sections: [{ key: 'fiz', label: 'Fizik', q: 14 }, { key: 'kim', label: 'Kimya', q: 13 }, { key: 'biyo', label: 'Biyoloji', q: 13 }] },
      { title: 'Edebiyat & Sosyal-1', sections: [{ key: 'edb', label: 'Edebiyat', q: 24 }, { key: 'tar1', label: 'Tarih-1', q: 10 }, { key: 'cog1', label: 'Coğ-1', q: 6 }] },
      { title: 'Sosyal-2', sections: [{ key: 'tar2', label: 'Tarih-2', q: 11 }, { key: 'cog2', label: 'Coğrafya-2', q: 11 }, { key: 'felg', label: 'Felsefe Grb.', q: 12 }, { key: 'din', label: 'Din K.', q: 6 }] }
    ]
  },
  LGS: {
    label: 'LGS',
    groups: [
      { title: 'Sözel Bölüm', sections: [{ key: 'turk', label: 'Türkçe', q: 20 }, { key: 'ink', label: 'İnkılap', q: 10 }, { key: 'din', label: 'Din K.', q: 10 }, { key: 'ing', label: 'İngilizce', q: 10 }] },
      { title: 'Sayısal Bölüm', sections: [{ key: 'mat', label: 'Matematik', q: 20 }, { key: 'fen', label: 'Fen Bilimleri', q: 20 }] }
    ]
  }
};

const BRANCH_SUBJECTS = [
  { id: 'turk', label: 'Türkçe' }, { id: 'mat', label: 'Matematik' }, { id: 'geo', label: 'Geometri' },
  { id: 'fiz', label: 'Fizik' }, { id: 'kim', label: 'Kimya' }, { id: 'biyo', label: 'Biyoloji' },
  { id: 'tarih', label: 'Tarih' }, { id: 'cog', label: 'Coğrafya' }, { id: 'fel', label: 'Felsefe' },
  { id: 'din', label: 'Din Kültürü' }, { id: 'sos', label: 'Sosyal (Genel)' }, { id: 'fen', label: 'Fen (Genel)' }
];

const DAYS = [
  { id: 'Mon', label: 'Pazartesi' }, { id: 'Tue', label: 'Salı' }, { id: 'Wed', label: 'Çarşamba' },
  { id: 'Thu', label: 'Perşembe' }, { id: 'Fri', label: 'Cuma' }, { id: 'Sat', label: 'Cumartesi' }, { id: 'Sun', label: 'Pazar' }
];

const TASK_TYPES = [
  { id: 'konu', label: 'Konu Çalışması' }, { id: 'soru', label: 'Soru Çözümü' },
  { id: 'tekrar', label: 'Konu Tekrarı' }, { id: 'deneme', label: 'Branş Denemesi' }, { id: 'ozel', label: 'Özel Görev' }
];

const INITIAL_CURRICULUM = [
  { id: 'mat-tyt', name: 'TYT Matematik', units: [{ id: 'u1', name: 'Temel Kavramlar', topics: ['Sayı Kümeleri', 'Tek-Çift Sayılar'] }] },
  { id: 'geo-tyt', name: 'Geometri', units: [{ id: 'g1', name: 'Üçgenler', topics: ['Doğruda Açı', 'Üçgende Açı'] }] }
];

const INITIAL_ADMINS = [
  { id: SUPER_ADMIN_ID, name: "Hamza Metehan Kılıç", username: "admin", password: "123", role: "superadmin" }
];

const INITIAL_STUDENTS = [
  {
    id: "demo_student_1",
    teacherId: SUPER_ADMIN_ID,
    name: "Ahmet Yılmaz (Demo)",
    username: "ahmet",
    password: "123",
    phone: "0555 111 22 33",
    school: "Fen Lisesi",
    grade: "12. Sınıf (YKS)",
    target: "Hukuk Fakültesi",
    exams: [{
      id: 1,
      name: "Özdebir TYT-1",
      type: "TYT",
      date: "2024-10-15",
      totalNet: 68.75,
      difficulty: "Orta",
      stats: { turkey: { rank: 15400, total: 120000 }, city: { rank: 450, total: 5000 }, school: { rank: 45, total: 120 } },
      details: { turk: { d: 30, y: 5, n: 28.75 }, tarih: { d: 4, y: 1, n: 3.75 }, cog: { d: 3, y: 2, n: 2.5 }, fel: { d: 4, y: 1, n: 3.75 }, din: { d: 4, y: 1, n: 3.75 }, mat: { d: 15, y: 3, n: 14.25 }, geo: { d: 5, y: 2, n: 4.5 }, fiz: { d: 3, y: 2, n: 2.5 }, kim: { d: 3, y: 0, n: 3 }, biyo: { d: 2, y: 0, n: 2 } }
    }],
    moods: [{ id: 101, date: "2024-12-01", metrics: { motivation: 80, happiness: 70, social: 60, examAnxiety: 40, lessonAnxiety: 30, performance: 75, homeworkRate: 90 } }],
    lessons: {},
    interviews: [],
    payments: [],
    teacherNotes: [],
    assignments: [{ id: 201, day: 'Mon', subject: 'TYT Matematik', topic: 'Sayı Kümeleri', type: 'soru', count: 50, source: '3D Yayınları', status: 'pending', note: 'İlk 2 test' }],
    pastWeeks: [],
    goals: [],
    resources: [],
    stats: { totalSolved: 12500, monthlySolved: 1200, xp: 1250, level: 5, pomodoroCount: 12, sprintCount: 5 }
  }
];

// --- YARDIMCI FONKSİYONLAR ---
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// max questions per section (for charts)
const getExamSectionMaxQ = (examType, sectionKey) => {
  if (!EXAM_TYPES[examType]) return null;
  const sections = EXAM_TYPES[examType].groups.flatMap(g => g.sections);
  const sec = sections.find(s => s.key === sectionKey);
  return sec?.q ?? null;
};

// --- UI BİLEŞENLERİ (TEMA UYUMLU) ---
const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, max }) => {
  const colors = useThemeColors();
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase tracking-wider`}>{label}</label>}
      <input
        type={type}
        value={value === undefined || value === null ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg px-4 py-3 ${colors.text} text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-sm`}
      />
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", className = "", size = "normal", icon: Icon, disabled }) => {
  const colors = useThemeColors();
  const variants = {
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30",
    secondary: `${colors.isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'} hover:opacity-80 border ${colors.border} shadow-sm`,
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
    ghost: `bg-transparent ${colors.hoverBg} ${colors.textSec} hover:${colors.text}`
  };
  const sizes = { small: "px-3 py-1.5 text-xs", normal: "px-5 py-2.5 text-sm", large: "px-6 py-3 text-base" };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon size="16" />} {children}
    </button>
  );
};

const Card = ({ children, title, action, className = "" }) => {
  const colors = useThemeColors();
  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4 md:p-6 ${colors.shadow} transition-colors ${className}`}>
      {(title || action) && (
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b ${colors.border} gap-4`}>
          {title && <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => {
  const colors = useThemeColors();
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`flex justify-between items-center p-6 border-b ${colors.border}`}>
          <h3 className={`text-xl font-bold ${colors.text}`}>{title}</h3>
          <button onClick={onClose} className={`${colors.textSec} hover:${colors.text}`}><X size="24" /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ProfileSettingsModal = ({ user, onClose, onUpdate }) => {
  const [form, setForm] = useState({ name: user.name, username: user.username || '', password: user.password || '' });
  const colors = useThemeColors();
  const handleSave = () => {
    if (!form.username || !form.password) return alert("Kullanıcı adı ve şifre boş bırakılamaz.");
    onUpdate({ ...user, ...form });
    onClose();
  };
  return (
    <Modal title="Profil Ayarları" onClose={onClose}>
      <div className="space-y-4">
        <Input label="Ad Soyad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <div className={`p-4 rounded-lg border ${colors.border} ${colors.isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <h4 className="text-orange-500 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Lock size={12} /> Güvenlik Bilgileri</h4>
          <div className="space-y-4">
            <Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <Input label="Yeni Şifre" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Yeni şifrenizi giriniz" />
          </div>
        </div>
        <Button className="w-full" onClick={handleSave}>Değişiklikleri Kaydet</Button>
      </div>
    </Modal>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, message = "Bu öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz." }) => {
  const colors = useThemeColors();
  if (!isOpen) return null;
  return (
    <Modal title="Silme Onayı" onClose={onClose}>
      <div className={`${colors.textSec} mb-6 text-sm`}>{message}</div>
      <div className="flex gap-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
        <Button variant="danger" onClick={onConfirm} className="flex-1" icon={Trash2}>Evet, Sil</Button>
      </div>
    </Modal>
  );
};

// --- Improved LineChart: dynamic min/max scaling (and optional clampMax) ---
const LineChart = ({
  data,
  dataKey,
  labelKey,
  color = "#f97316",
  height = 200,
  showDots = true,
  strokeWidth = 3,
  clampMax = null, // if provided (e.g., question count max), cap y-max to this
}) => {
  const colors = useThemeColors();
  if (!data || data.length < 2) return <div className={`flex items-center justify-center ${colors.textSec} text-sm h-full`}>Veri yetersiz</div>;

  const values = data.map(d => safeNum(d[dataKey], 0));
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);

  let maxVal = rawMax;
  let minVal = rawMin;

  if (clampMax !== null && Number.isFinite(clampMax)) {
    maxVal = Math.min(maxVal, clampMax);
    // If values exceed clampMax, they’ll be visually capped; but our data for nets should not exceed q anyway.
    maxVal = Math.max(maxVal, clampMax); // ensure max is at least clampMax for consistent scale
    minVal = 0;
  }

  // Make chart sensitive: use local range with padding, avoid flat-line
  const range = Math.max(1e-6, maxVal - minVal);
  const pad = clampMax !== null ? 0 : range * 0.15;

  const yMin = clampMax !== null ? 0 : Math.max(0, minVal - pad);
  const yMax = clampMax !== null ? clampMax : (maxVal + pad);

  const width = 1000;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const v = safeNum(d[dataKey], 0);
    const clamped = clampMax !== null ? Math.max(0, Math.min(v, yMax)) : v;
    const norm = (clamped - yMin) / Math.max(1e-6, (yMax - yMin));
    const y = height - padding - (norm * (height - 2 * padding));
    return [x, y];
  });

  const pathD = svgPath(points, bezierCommand);

  return (
    <div className="w-full h-full relative" style={{ height: height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const y = height - padding - (p * (height - 2 * padding));
          return <line key={p} x1={padding} y1={y} x2={width - padding} y2={y} stroke={colors.chartGrid} strokeWidth="1" strokeDasharray="4" />;
        })}

        {/* Path */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots & Labels */}
        {showDots && data.map((d, i) => {
          const [x, y] = points[i];
          return (
            <g key={i} className="group">
              <circle cx={x} cy={y} r="6" fill={colors.isDark ? "#1e293b" : "#ffffff"} stroke={color} strokeWidth="2" className="transition-all duration-300 group-hover:r-8" />
              {/* Halo */}
              <text x={x} y={y - 20} textAnchor="middle" stroke={colors.bgCard} strokeWidth="4" fontSize="16" fontWeight="900" paintOrder="stroke" className="select-none">
                {safeNum(d[dataKey], 0).toFixed(1)}
              </text>
              {/* Text */}
              <text x={x} y={y - 20} textAnchor="middle" fill={color} fontSize="16" fontWeight="900" className="select-none filter drop-shadow-md">
                {safeNum(d[dataKey], 0).toFixed(1)}
              </text>
              {/* X label */}
              <text x={x} y={height - 10} textAnchor="middle" fill={colors.textSec} fontSize="11" fontWeight="bold">
                {d[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- YÖNETİCİ YÖNETİMİ ---
const AdminManagementModule = ({ admins, setAdmins, user, allStudents, onInspectStudent }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedAdminId, setExpandedAdminId] = useState(null);
  const colors = useThemeColors();

  if (user.role !== 'superadmin') return <div className={`${colors.text} text-center`}>Bu sayfaya erişim yetkiniz yok.</div>;

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({ name: admin.name, username: admin.username, password: admin.password });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.username || !form.password) return alert("Tüm alanları doldurunuz.");
    if (editingAdmin) {
      const updatedAdmin = { ...editingAdmin, ...form };
      if (isFirebaseActive) {
        try {
          const adminRef = doc(db, "admins", editingAdmin.id);
          const { id, ...data } = updatedAdmin;
          await setDoc(adminRef, data, { merge: true });
        } catch (e) { console.error(e); alert("Güncelleme hatası: " + e.message); }
      } else {
        setAdmins(admins.map(a => a.id === editingAdmin.id ? updatedAdmin : a));
      }
    } else {
      const newAdmin = { name: form.name, username: form.username, password: form.password, role: 'admin' };
      if (isFirebaseActive) {
        try { await addDoc(collection(db, "admins"), newAdmin); } catch (e) { console.error(e); alert("Kayıt hatası: " + e.message); }
      } else {
        setAdmins([...admins, { id: Date.now().toString(), ...newAdmin }]);
      }
    }
    setShowModal(false);
    setForm({ name: '', username: '', password: '' });
    setEditingAdmin(null);
  };

  const handleDelete = async (id) => {
    if (id === user.id) {
      alert("Güvenlik nedeniyle şu an giriş yapmış olduğunuz hesabı silemezsiniz.");
      setDeleteConfirm(null);
      return;
    }
    if (isFirebaseActive) {
      try { await deleteDoc(doc(db, "admins", id)); } catch (e) { console.error("Silme hatası:", e); }
    } else {
      setAdmins(admins.filter(a => a.id !== id));
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${colors.text}`}>Yönetici & Öğretmen Paneli</h2>
        <Button icon={Plus} onClick={() => { setEditingAdmin(null); setForm({ name: '', username: '', password: '' }); setShowModal(true); }}>Yeni Yönetici Ekle</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map(admin => {
          const adminStudents = allStudents.filter(s => s.teacherId === admin.id);
          const isExpanded = expandedAdminId === admin.id;
          return (
            <div key={admin.id} className={`${colors.bgCard} border ${colors.border} rounded-xl p-6 relative group transition-all duration-300 ${colors.shadow} ${isExpanded ? 'row-span-2 shadow-xl border-orange-500/30' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full flex items-center justify-center text-orange-500 shrink-0`}>
                  <User size={24} />
                </div>
                <div className="overflow-hidden">
                  <h3 className={`font-bold ${colors.text} truncate`}>{admin.name}</h3>
                  <div className={`text-sm ${colors.textSec} truncate`}>K.Adı: <span className={colors.isDark ? 'text-slate-300' : 'text-slate-700'}>{admin.username}</span></div>
                  <div className={`text-xs ${colors.textSec} mt-1`}>{adminStudents.length} Öğrenci Kayıtlı</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setExpandedAdminId(isExpanded ? null : admin.id)}
                  className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${isExpanded ? 'bg-orange-500 text-white' : `${colors.isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}`}
                >
                  <Users size={14} /> {isExpanded ? 'Gizle' : 'Öğrenciler'}
                </button>
                <button onClick={() => handleEdit(admin)} className={`p-2 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 transition-colors`}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirm(admin.id)} className={`p-2 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-colors`}>
                  <Trash2 size={16} />
                </button>
              </div>

              {isExpanded && (
                <div className={`mt-4 pt-4 border-t ${colors.border} animate-fade-in`}>
                  <h4 className={`text-xs uppercase font-bold ${colors.textSec} mb-2`}>Öğrenci Listesi</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {adminStudents.map(st => (
                      <div
                        key={st.id}
                        onClick={() => onInspectStudent(st.id)}
                        className={`flex justify-between items-center p-2 rounded ${colors.isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-100 hover:bg-slate-200'} cursor-pointer transition-colors border border-transparent hover:border-slate-400`}
                      >
                        <div>
                          <div className={`text-sm font-medium ${colors.text}`}>{st.name}</div>
                          <div className={`text-[10px] ${colors.textSec}`}>{st.grade}</div>
                        </div>
                        <Eye size={14} className={`${colors.textSec} hover:text-orange-500`} />
                      </div>
                    ))}
                    {adminStudents.length === 0 && <div className={`text-center text-xs ${colors.textSec} py-2`}>Öğrenci bulunamadı.</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title={editingAdmin ? "Yönetici Düzenle" : "Yeni Yönetici Ekle"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Ad Soyad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <Input label="Şifre" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <Button className="w-full" onClick={handleSave}>{editingAdmin ? "Güncelle" : "Kaydet"}</Button>
          </div>
        </Modal>
      )}

      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} />
    </div>
  );
};

// 0. DASHBOARD
const DashboardModule = ({ user, students, setStudents, setSelectedStudentId, onUpdateStudent }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [timerMode, setTimerMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const colors = useThemeColors();

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current);
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    if (user.role === 'student') {
      const student = students.find(s => s.id === user.id);
      if (student) {
        const newStats = { ...student.stats };
        if (timerMode === 'pomodoro') newStats.pomodoroCount = (newStats.pomodoroCount || 0) + 1;
        else newStats.sprintCount = (newStats.sprintCount || 0) + 1;
        onUpdateStudent({ ...student, stats: newStats });
      }
    }
    resetTimer(timerMode);
  };

  const resetTimer = (mode) => {
    setIsActive(false);
    clearInterval(timerRef.current);
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    else setTimeLeft(50 * 60);
  };

  const changeMode = (mode) => { setTimerMode(mode); resetTimer(mode); };
  const toggleTimer = () => setIsActive(!isActive);

  const handleSave = async () => {
    if (!form.name || !form.username) return alert("İsim ve kullanıcı adı zorunludur.");
    if (editingId) {
      const student = students.find(s => s.id === editingId);
      onUpdateStudent({ ...student, ...form });
      setEditingId(null);
    } else {
      const newStudent = {
        ...form,
        teacherId: user.id,
        exams: [],
        moods: [],
        lessons: {},
        interviews: [],
        payments: [],
        teacherNotes: [],
        assignments: [],
        pastWeeks: [],
        goals: [],
        resources: [],
        stats: { totalSolved: 0, monthlySolved: 0, xp: 0, level: 1 }
      };
      if (isFirebaseActive) {
        try { await addDoc(collection(db, "students"), newStudent); } catch (e) { console.error(e); alert("Kayıt hatası: " + e.message); }
      } else {
        setStudents([...students, { id: Date.now(), ...newStudent }]);
      }
    }
    setShowModal(false);
    setForm({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '' });
  };

  const handleEdit = (student) => {
    setForm({ name: student.name, grade: student.grade, target: student.target, phone: student.phone, school: student.school, username: student.username, password: student.password });
    setEditingId(student.id);
    setShowModal(true);
  };

  const handleDeleteRequest = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = async () => {
    if (deleteConfirm) {
      if (isFirebaseActive) {
        await deleteDoc(doc(db, "students", deleteConfirm));
      } else {
        setStudents(students.filter(s => s.id !== deleteConfirm));
      }
      if (setSelectedStudentId) setSelectedStudentId(null);
      setDeleteConfirm(null);
    }
  };

  // Student view
  if (user.role === 'student') {
    const s = students.find(s => s.id === user.id);
    if (!s) return <div className={`${colors.text} text-center`}>Öğrenci verisi yükleniyor veya bulunamadı...</div>;

    // Sorting exams newest first
    const lastExam = (s.exams || []).slice().sort((a, b) => compareByDateDesc(a, b, x => x.date))[0];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Timer className="text-orange-500" /> Çalışma Sayacı</h3>
              <div className="flex bg-slate-800 rounded p-1">
                <button onClick={() => changeMode('pomodoro')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${timerMode === 'pomodoro' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Pomodoro</button>
                <button onClick={() => changeMode('sprint')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${timerMode === 'sprint' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Sprint</button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-5xl md:text-6xl font-mono font-bold text-white mb-6 tracking-wider">{formatTime(timeLeft)}</div>
              <div className="flex gap-4">
                <Button onClick={toggleTimer} size="large" className={isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}>
                  {isActive ? <>Duraklat</> : <>Başlat</>}
                </Button>
                <Button variant="secondary" onClick={() => resetTimer(timerMode)}>Sıfırla</Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className={`${colors.bgCard} flex flex-col items-center justify-center text-center`}>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-2 text-orange-500"><Clock size={24} /></div>
              <div className={`text-3xl font-bold ${colors.text}`}>{s.stats?.pomodoroCount || 0}</div>
              <div className={`text-xs ${colors.textSec} uppercase font-bold mt-1`}>Pomodoro</div>
            </Card>

            <Card className={`${colors.bgCard} flex flex-col items-center justify-center text-center`}>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-500"><Zap size={24} /></div>
              <div className={`text-3xl font-bold ${colors.text}`}>{s.stats?.sprintCount || 0}</div>
              <div className={`text-xs ${colors.textSec} uppercase font-bold mt-1`}>Sprint</div>
            </Card>

            <Card className={`${colors.bgCard} flex flex-col items-center justify-center text-center col-span-2`}>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2 text-green-500"><Award size={24} /></div>
              <div className={`text-3xl font-bold ${colors.text}`}>{s.stats?.totalSolved || 0}</div>
              <div className={`text-xs ${colors.textSec} uppercase font-bold mt-1`}>Toplam Soru</div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`border-l-4 border-l-blue-500 ${colors.bgCard}`}>
            <div className={`${colors.textSec} text-xs uppercase font-bold mb-2`}>Toplam Deneme</div>
            <div className={`text-4xl font-bold ${colors.text}`}>{s.exams?.length || 0}</div>
          </Card>

          <Card className={`border-l-4 border-l-green-500 ${colors.bgCard}`}>
            <div className={`${colors.textSec} text-xs uppercase font-bold mb-2`}>Bitirilen Konu</div>
            <div className={`text-4xl font-bold ${colors.text}`}>{Object.values(s.lessons || {}).filter(l => l.konu).length}</div>
          </Card>

          <Card className={`border-l-4 border-l-orange-500 ${colors.bgCard}`}>
            <div className={`${colors.textSec} text-xs uppercase font-bold mb-2`}>Son Deneme Neti</div>
            <div className={`text-4xl font-bold ${colors.text}`}>{lastExam ? safeNum(lastExam.totalNet, 0).toFixed(1) : '-'}</div>
          </Card>

          <Card className={`border-l-4 border-l-purple-500 ${colors.bgCard}`}>
            <div className={`${colors.textSec} text-xs uppercase font-bold mb-2`}>Aylık Soru</div>
            <div className={`text-4xl font-bold ${colors.text}`}>{s.stats?.monthlySolved || 0}</div>
          </Card>
        </div>

        {s.teacherNotes && s.teacherNotes.length > 0 && (
          <div className="mt-6">
            <Card title="Öğretmenden Notlar" className={`border-l-4 border-l-orange-500 ${colors.bgCard}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...(s.teacherNotes || [])]
                  .slice()
                  .sort((a, b) => compareByDateDesc(a, b, x => x.date))
                  .map((note) => (
                    <div key={note.id} className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} p-4 rounded-lg border ${colors.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-orange-500" />
                        <span className={`text-xs font-bold ${colors.textSec}`}>{formatDateDDMMYYYY(note.date)}</span>
                      </div>
                      <p className={`${colors.text} text-sm italic whitespace-pre-wrap`}>"{note.text}"</p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Admin view (portfolio)
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${colors.text}`}>Öğrenci Portföyü</h2>
        <Button icon={Plus} size="large" onClick={() => setShowModal(true)}>Yeni Öğrenci Ekle</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(student => (
          <div key={student.id} className={`${colors.bgCard} border ${colors.border} rounded-xl p-6 hover:border-orange-500/50 transition-all group relative ${colors.shadow}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedStudentId(student.id)}>
                <div className={`w-16 h-16 bg-gradient-to-br ${colors.isDark ? 'from-slate-800 to-slate-700' : 'from-slate-200 to-slate-100'} rounded-full flex items-center justify-center text-2xl font-bold ${colors.text} border ${colors.border}`}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${colors.text} group-hover:text-orange-400 transition-colors`}>{student.name}</h3>
                  <div className={`text-sm ${colors.textSec}`}>{student.grade}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(student); }} className={`p-2 ${colors.textSec} hover:text-blue-400 ${colors.isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg`}><Edit2 size={16} /></button>
                <button onClick={(e) => handleDeleteRequest(e, student.id)} className={`p-2 ${colors.textSec} hover:text-red-500 ${colors.isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg`}><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className={`flex items-center gap-2 text-sm ${colors.textSec}`}><Target size={14} className="text-orange-500" /> <span>Hedef: <span className={colors.text}>{student.target}</span></span></div>
              <div className={`flex items-center gap-2 text-sm ${colors.textSec}`}><GraduationCap size={14} className="text-blue-500" /> <span>Okul: <span className={colors.text}>{student.school}</span></span></div>
              <div className={`flex items-center gap-2 text-sm ${colors.textSec}`}><Phone size={14} className="text-green-500" /> <span>{student.phone}</span></div>
            </div>

            <Button className="w-full" variant="secondary" onClick={() => setSelectedStudentId(student.id)}>
              Profile Git <ChevronRight size={16} />
            </Button>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          title={editingId ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"}
          onClose={() => { setShowModal(false); setEditingId(null); setForm({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '' }); }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Ad Soyad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Sınıf" placeholder="12. Sınıf (YKS)" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
            <Input label="Hedef" placeholder="Tıp Fakültesi" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
            <Input label="Okul" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
            <Input label="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

            <div className={`col-span-1 md:col-span-2 p-4 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg border ${colors.border} mt-2`}>
              <h4 className="text-orange-500 font-bold text-xs uppercase mb-3">Giriş Bilgileri</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                <Input label="Şifre" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-4">
              <Button size="large" className="w-full" onClick={handleSave}>Kaydet</Button>
            </div>
          </div>
        </Modal>
      )}

      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 1. DERS YÖNETİMİ (reorder added)
const LessonModule = ({ student, curriculum, setCurriculum, onUpdateStudent, user }) => {
  const activeCurriculum = student.curriculum || curriculum;
  const [selectedCourseId, setSelectedCourseId] = useState(activeCurriculum[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", parentId: "" });
  const [bulkText, setBulkText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const colors = useThemeColors();

  if (user.role === 'student') return <div className={`${colors.text} text-center mt-20`}>Bu alana erişim yetkiniz yok.</div>;

  const selectedCourse = activeCurriculum.find(c => c.id === selectedCourseId);

  const toggleStatus = (topicId, type) => {
    const currentStatus = student.lessons[topicId] || {};
    const newStatus = { ...currentStatus, [type]: !currentStatus[type] };
    onUpdateStudent({ ...student, lessons: { ...student.lessons, [topicId]: newStatus } });
  };

  const handleAddItem = () => {
    let updatedCurriculum = [...activeCurriculum];

    if (showAddModal === 'course') {
      if (!newItem.name) return;
      const newCourse = { id: Date.now().toString(), name: newItem.name, units: [] };
      updatedCurriculum = [...updatedCurriculum, newCourse];
      setSelectedCourseId(newCourse.id);
    } else if (showAddModal === 'unit' || showAddModal === 'topic') {
      const names = bulkText ? bulkText.split('\n').filter(n => n.trim()) : (newItem.name ? [newItem.name] : []);
      if (names.length === 0) return;

      updatedCurriculum = updatedCurriculum.map(c => {
        if (c.id === selectedCourseId) {
          if (showAddModal === 'unit') {
            const newUnits = names.map(name => ({ id: Math.random().toString(36).substr(2, 9), name, topics: [] }));
            return { ...c, units: [...c.units, ...newUnits] };
          } else {
            return { ...c, units: c.units.map(u => u.id === newItem.parentId ? { ...u, topics: [...u.topics, ...names] } : u) };
          }
        }
        return c;
      });
    }

    // persist on student curriculum
    onUpdateStudent({ ...student, curriculum: updatedCurriculum });
    setShowAddModal(null);
    setNewItem({ name: "", parentId: "" });
    setBulkText("");
  };

  const requestDelete = (e, type, id, parentId = null) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({ type, id, parentId }); };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, id, parentId } = deleteConfirm;
    let updatedCurriculum = [...activeCurriculum];

    if (type === 'course') {
      updatedCurriculum = updatedCurriculum.filter(c => c.id !== id);
      if (selectedCourseId === id) setSelectedCourseId(updatedCurriculum[0]?.id || null);
    } else if (type === 'unit') {
      updatedCurriculum = updatedCurriculum.map(c => c.id === selectedCourseId ? { ...c, units: c.units.filter(u => u.id !== id) } : c);
    } else if (type === 'topic') {
      updatedCurriculum = updatedCurriculum.map(c => c.id === selectedCourseId ? { ...c, units: c.units.map(u => u.id === parentId ? { ...u, topics: u.topics.filter(t => t !== id) } : u) } : c);
    }

    onUpdateStudent({ ...student, curriculum: updatedCurriculum });
    setDeleteConfirm(null);
  };

  const LABELS = [
    { id: 'konu', label: 'Konu', color: 'bg-emerald-500' },
    { id: 'soru', label: 'Soru', color: 'bg-blue-500' },
    { id: 't1', label: '1. Tekrar', color: 'bg-purple-500' },
    { id: 't2', label: '2. Tekrar', color: 'bg-pink-500' },
    { id: 't3', label: '3. Tekrar', color: 'bg-orange-500' }
  ];

  // Reorder helpers (persist)
  const moveCourse = (courseId, direction) => {
    const idx = activeCurriculum.findIndex(c => c.id === courseId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= activeCurriculum.length) return;
    const next = activeCurriculum.slice();
    const temp = next[idx];
    next[idx] = next[newIdx];
    next[newIdx] = temp;
    onUpdateStudent({ ...student, curriculum: next });
  };

  const moveUnit = (unitId, direction) => {
    const cIdx = activeCurriculum.findIndex(c => c.id === selectedCourseId);
    if (cIdx < 0) return;
    const course = activeCurriculum[cIdx];
    const uIdx = course.units.findIndex(u => u.id === unitId);
    if (uIdx < 0) return;
    const newIdx = direction === 'up' ? uIdx - 1 : uIdx + 1;
    if (newIdx < 0 || newIdx >= course.units.length) return;

    const newUnits = course.units.slice();
    const tmp = newUnits[uIdx];
    newUnits[uIdx] = newUnits[newIdx];
    newUnits[newIdx] = tmp;

    const updatedCurriculum = activeCurriculum.map(c => c.id === selectedCourseId ? { ...c, units: newUnits } : c);
    onUpdateStudent({ ...student, curriculum: updatedCurriculum });
  };

  const moveTopic = (unitId, topicIndex, direction) => {
    const course = activeCurriculum.find(c => c.id === selectedCourseId);
    if (!course) return;
    const unit = course.units.find(u => u.id === unitId);
    if (!unit) return;
    const newIdx = direction === 'up' ? topicIndex - 1 : topicIndex + 1;
    if (newIdx < 0 || newIdx >= unit.topics.length) return;

    const newTopics = unit.topics.slice();
    const tmp = newTopics[topicIndex];
    newTopics[topicIndex] = newTopics[newIdx];
    newTopics[newIdx] = tmp;

    const updatedCurriculum = activeCurriculum.map(c => {
      if (c.id !== selectedCourseId) return c;
      return {
        ...c,
        units: c.units.map(u => u.id === unitId ? { ...u, topics: newTopics } : u)
      };
    });

    onUpdateStudent({ ...student, curriculum: updatedCurriculum });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)] animate-fade-in">
      <div className="w-full md:w-1/4 flex flex-col gap-2 max-h-60 md:max-h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-orange-500 font-bold">Dersler</h3>
          <Button size="small" icon={Plus} onClick={() => setShowAddModal('course')} />
        </div>

        {activeCurriculum.map((c, idx) => (
          <div key={c.id} className="flex gap-2 items-stretch">
            <button
              onClick={() => setSelectedCourseId(c.id)}
              className={`flex-1 p-3 rounded-lg text-left transition-all ${selectedCourseId === c.id ? `bg-slate-800 border-orange-500 text-white border` : `${colors.bgCard} ${colors.border} ${colors.textSec}`}`}
            >
              {c.name}
            </button>

            <div className="flex flex-col gap-1">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveCourse(c.id, 'up'); }}
                className={`p-2 ${colors.bgCard} border ${colors.border} rounded-lg text-slate-500 hover:text-orange-500`}
                title="Yukarı Taşı"
                disabled={idx === 0}
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveCourse(c.id, 'down'); }}
                className={`p-2 ${colors.bgCard} border ${colors.border} rounded-lg text-slate-500 hover:text-orange-500`}
                title="Aşağı Taşı"
                disabled={idx === activeCurriculum.length - 1}
              >
                <ArrowDown size={14} />
              </button>
            </div>

            <button onClick={(e) => requestDelete(e, 'course', c.id)} className={`p-3 ${colors.bgCard} ${colors.border} border rounded-lg text-slate-500 hover:text-red-500 hover:border-red-500/50 group`} title="Sil">
              <Trash2 size={16} className="group-hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>

      <div className={`flex-1 ${colors.bgCardTransparent} border ${colors.border} rounded-xl p-6 overflow-y-auto custom-scrollbar`}>
        {selectedCourse ? (
          <>
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b ${colors.border} gap-4`}>
              <h2 className={`text-xl font-bold ${colors.text}`}>{selectedCourse.name}</h2>
              <div className="flex gap-3">
                <Button size="small" variant="secondary" icon={Plus} onClick={() => setShowAddModal('unit')}>Ünite Ekle</Button>
                <Button size="small" variant="secondary" icon={Plus} onClick={() => { setNewItem({ ...newItem, parentId: selectedCourse.units[0]?.id }); setShowAddModal('topic'); }}>Konu Ekle</Button>
              </div>
            </div>

            {selectedCourse.units.map((unit, uIdx) => (
              <div key={unit.id} className={`mb-6 ${colors.bgCard} border ${colors.border} rounded-lg overflow-hidden ${colors.shadow}`}>
                <div className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} p-3 flex justify-between items-center gap-2`}>
                  <div className="flex items-center gap-2">
                    <h4 className="text-orange-500 font-bold">{unit.name}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveUnit(unit.id, 'up'); }}
                        className="text-slate-500 hover:text-orange-500 p-2"
                        title="Üniteyi Yukarı Taşı"
                        disabled={uIdx === 0}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveUnit(unit.id, 'down'); }}
                        className="text-slate-500 hover:text-orange-500 p-2"
                        title="Üniteyi Aşağı Taşı"
                        disabled={uIdx === selectedCourse.units.length - 1}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <button onClick={(e) => requestDelete(e, 'unit', unit.id)} className="text-slate-500 hover:text-red-500 p-2" title="Üniteyi Sil">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className={`divide-y ${colors.divider}`}>
                  {unit.topics.map((topic, idx) => {
                    const key = `${selectedCourse.id}-${unit.id}-${idx}`;
                    const status = student.lessons[key] || {};
                    return (
                      <div key={idx} className={`flex flex-col md:flex-row justify-between items-start md:items-center p-3 ${colors.hoverBg} transition-colors gap-2`}>
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex flex-col gap-1 mt-0.5">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveTopic(unit.id, idx, 'up'); }}
                              className="text-slate-500 hover:text-orange-500 p-1"
                              title="Konuyu Yukarı Taşı"
                              disabled={idx === 0}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveTopic(unit.id, idx, 'down'); }}
                              className="text-slate-500 hover:text-orange-500 p-1"
                              title="Konuyu Aşağı Taşı"
                              disabled={idx === unit.topics.length - 1}
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>

                          <span className={`${colors.text} text-sm font-medium`}>{topic}</span>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <div className="flex gap-3 mr-4">
                            {LABELS.map(lbl => (
                              <div key={lbl.id} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => toggleStatus(key, lbl.id)}>
                                <div className={`w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center transition-all ${status[lbl.id] ? `${lbl.color} border-transparent` : `hover:border-slate-400 ${colors.isDark ? 'bg-slate-800' : 'bg-white'}`}`}>
                                  {status[lbl.id] && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`text-[9px] ${colors.textSec} font-medium whitespace-nowrap group-hover:${colors.text} transition-colors`}>{lbl.label}</span>
                              </div>
                            ))}
                          </div>
                          <button onClick={(e) => requestDelete(e, 'topic', topic, unit.id)} className="text-slate-600 hover:text-red-500 p-2" title="Konuyu Sil">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {unit.topics.length === 0 && <div className={`p-4 text-xs ${colors.textSec}`}>Bu ünitede konu yok.</div>}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className={`${colors.textSec} text-center py-20`}>Ders seçiniz veya ekleyiniz.</div>
        )}
      </div>

      {showAddModal && (
        <Modal
          title={showAddModal === 'course' ? 'Yeni Ders' : showAddModal === 'unit' ? 'Yeni Ünite' : 'Yeni Konu'}
          onClose={() => setShowAddModal(null)}
        >
          <div className="space-y-4">
            {showAddModal === 'topic' && (
              <div>
                <label className={`block text-sm ${colors.textSec} mb-1`}>Hangi Üniteye?</label>
                <select
                  className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg p-3 ${colors.text}`}
                  value={newItem.parentId}
                  onChange={e => setNewItem({ ...newItem, parentId: e.target.value })}
                >
                  <option value="">Seçiniz</option>
                  {selectedCourse?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            {showAddModal === 'course' ? (
              <Input label="Ders Adı" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            ) : (
              <div>
                <label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>
                  {showAddModal === 'unit' ? 'Ünite İsimleri' : 'Konu İsimleri'} (Her satıra bir tane)
                </label>
                <textarea
                  className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg p-3 ${colors.text} h-32 focus:border-orange-500 outline-none`}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                />
              </div>
            )}

            <Button onClick={handleAddItem} className="w-full mt-4">Kaydet</Button>
          </div>
        </Modal>
      )}

      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 2. HAFTALIK PROGRAM + Archive grid refactor + Quick assign new fields
const ScheduleModule = ({ student, curriculum, onUpdateStudent, user }) => {
  const activeCurriculum = student.curriculum || curriculum;
  const [form, setForm] = useState({ days: [], courseId: '', unitId: '', topic: '', type: 'soru', count: '', source: '', note: '' });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickForm, setQuickForm] = useState({ text: '', days: [], source: '', count: '' }); // UPDATED

  const [isEditMode, setIsEditMode] = useState(false);

  const [expandedArchive, setExpandedArchive] = useState(null);
  const colors = useThemeColors();

  const selectedCourse = activeCurriculum.find(c => c.id === form.courseId);
  const selectedUnit = selectedCourse?.units.find(u => u.id === form.unitId);
  const availableResources = student.resources ? student.resources.filter(r => r.courseId === form.courseId) : [];

  const assignments = student.assignments || [];

  // Weekly stats
  const weeklySolvedQuestions = assignments
    .filter(a => a.type === 'soru' && a.status === 'completed')
    .reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
  const weeklyTaskCount = assignments.length;
  const weeklyCompletedCount = assignments.filter(a => a.status === 'completed').length;
  const completionRate = weeklyTaskCount > 0 ? Math.round((weeklyCompletedCount / weeklyTaskCount) * 100) : 0;

  const monthlySolved = (student.stats?.monthlySolved || 0) + weeklySolvedQuestions;
  const allTimeSolved = (student.stats?.totalSolved || 0) + weeklySolvedQuestions;

  const handleAssign = () => {
    if (!form.courseId || !form.topic) return alert("Lütfen ders ve konu seçiniz.");
    if (form.days.length === 0) return alert("En az bir gün seçiniz.");

    let newAssignments = [...assignments];

    if (editingId) {
      const day = form.days[0];
      newAssignments = newAssignments.map(a => a.id === editingId ? { ...a, ...form, day: day, subject: selectedCourse.name } : a);
      setEditingId(null);
    } else {
      form.days.forEach(day => {
        const newAssignment = {
          id: Date.now() + Math.random(),
          status: 'pending',
          subject: selectedCourse.name,
          ...form,
          day: day
        };
        delete newAssignment.days;
        newAssignments.push(newAssignment);
      });
    }

    onUpdateStudent({ ...student, assignments: newAssignments });
    setForm(prev => ({ ...prev, count: '', source: '', unitId: '', topic: '', note: '', days: [] }));
  };

  // UPDATED QUICK ASSIGN: source + count optional
  const handleQuickAssign = () => {
    if (!quickForm.text) return alert("Görev içeriği giriniz.");
    if (quickForm.days.length === 0) return alert("En az bir gün seçiniz.");

    const newAssignments = [...assignments];

    quickForm.days.forEach(day => {
      const newAssignment = {
        id: Date.now() + Math.random(),
        status: 'pending',
        subject: 'Ek Görev',
        topic: quickForm.text,
        day: day,
        type: 'ozel',
        count: quickForm.count || '',
        source: quickForm.source || '',
        note: ''
      };
      newAssignments.push(newAssignment);
    });

    onUpdateStudent({ ...student, assignments: newAssignments });
    setShowQuickModal(false);
    setQuickForm({ text: '', days: [], source: '', count: '' });
  };

  const handleEdit = (task) => {
    const course = activeCurriculum.find(c => c.name === task.subject);
    setForm({
      days: [task.day],
      courseId: course ? course.id : '',
      unitId: task.unitId || '',
      topic: task.topic,
      type: task.type,
      count: task.count,
      source: task.source || '',
      note: task.note || ''
    });
    setEditingId(task.id);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => { setEditingId(null); setForm(prev => ({ ...prev, count: '', source: '', unitId: '', topic: '', note: '', days: [] })); };

  const toggleTaskStatus = (id) => {
    const updated = assignments.map(a => a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a);
    let newStats = { ...student.stats };
    const task = assignments.find(a => a.id === id);
    if (task && task.status !== 'completed') {
      newStats.xp = (newStats.xp || 0) + 50;
      newStats.level = Math.floor(newStats.xp / 1000) + 1;
    }
    onUpdateStudent({ ...student, assignments: updated, stats: newStats });
