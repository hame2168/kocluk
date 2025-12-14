import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { 
  Layout, Users, BookOpen, Target, Smile, MessageSquare, CreditCard, LogOut, Plus, Trash2, 
  ChevronRight, User, Lock, Check, Edit2, Save, X, Calendar, Filter, ChevronDown, BarChart2, ArrowUp, ArrowDown, 
  PieChart, Activity, ArrowUpRight, TrendingUp, Award, Clock, List, Book, RefreshCw, Zap, 
  Library, FileText, CheckCircle, Flag, Phone, GraduationCap, History, Star, Archive, AlertTriangle,
  Play, Pause, RotateCcw, Timer, Menu, Database, CloudOff, Cloud, Shield, Key, Eye, Sun, Moon, Settings,
  ZapOff, EyeOff
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, setDoc, getDoc } from "firebase/firestore";

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

// --- CHART HELPER (SMOOTH CURVES) ---
const svgPath = (points, command) => {
  const d = points.reduce((acc, point, i, a) => i === 0
    ? `M ${point[0]},${point[1]}`
    : `${acc} ${command(point, i, a)}`
  , '')
  return d
}
const line = (pointA, pointB) => {
  const lengthX = pointB[0] - pointA[0]
  const lengthY = pointB[1] - pointA[1]
  return { length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)), angle: Math.atan2(lengthY, lengthX) }
}
const controlPoint = (current, previous, next, reverse) => {
  const p = previous || current
  const n = next || current
  const smoothing = 0.2
  const o = line(p, n)
  const angle = o.angle + (reverse ? Math.PI : 0)
  const length = o.length * smoothing
  const x = current[0] + Math.cos(angle) * length
  const y = current[1] + Math.sin(angle) * length
  return [x, y]
}
const bezierCommand = (point, i, a) => {
  const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point)
  const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true)
  return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`
}

// --- VERİ MODELİ VE SABİTLER ---

const SUPER_ADMIN_ID = "super_admin_hmk";

const EXAM_TYPES = {
  TYT: { label: 'YKS - TYT', groups: [{ title: 'Türkçe', sections: [{ key: 'turk', label: 'Türkçe', q: 40 }] }, { title: 'Sosyal Bilimler', sections: [{ key: 'tarih', label: 'Tarih', q: 5 }, { key: 'cog', label: 'Coğrafya', q: 5 }, { key: 'fel', label: 'Felsefe', q: 5 }, { key: 'din', label: 'Din K.', q: 5 }] }, { title: 'Temel Matematik', sections: [{ key: 'mat', label: 'Matematik', q: 30 }, { key: 'geo', label: 'Geometri', q: 10 }] }, { title: 'Fen Bilimleri', sections: [{ key: 'fiz', label: 'Fizik', q: 7 }, { key: 'kim', label: 'Kimya', q: 7 }, { key: 'biyo', label: 'Biyoloji', q: 6 }] }] },
  AYT: { label: 'YKS - AYT', groups: [{ title: 'Matematik & Geometri', sections: [{ key: 'mat', label: 'Matematik', q: 30 }, { key: 'geo', label: 'Geometri', q: 10 }] }, { title: 'Fen Bilimleri', sections: [{ key: 'fiz', label: 'Fizik', q: 14 }, { key: 'kim', label: 'Kimya', q: 13 }, { key: 'biyo', label: 'Biyoloji', q: 13 }] }, { title: 'Edebiyat & Sosyal-1', sections: [{ key: 'edb', label: 'Edebiyat', q: 24 }, { key: 'tar1', label: 'Tarih-1', q: 10 }, { key: 'cog1', label: 'Coğ-1', q: 6 }] }, { title: 'Sosyal-2', sections: [{ key: 'tar2', label: 'Tarih-2', q: 11 }, { key: 'cog2', label: 'Coğrafya-2', q: 11 }, { key: 'felg', label: 'Felsefe Grb.', q: 12 }, { key: 'din', label: 'Din K.', q: 6 }] }] },
  LGS: { label: 'LGS', groups: [{ title: 'Sözel Bölüm', sections: [{ key: 'turk', label: 'Türkçe', q: 20 }, { key: 'ink', label: 'İnkılap', q: 10 }, { key: 'din', label: 'Din K.', q: 10 }, { key: 'ing', label: 'İngilizce', q: 10 }] }, { title: 'Sayısal Bölüm', sections: [{ key: 'mat', label: 'Matematik', q: 20 }, { key: 'fen', label: 'Fen Bilimleri', q: 20 }] }] }
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
    id: "demo_student_1", teacherId: SUPER_ADMIN_ID, name: "Ahmet Yılmaz (Demo)", username: "ahmet", password: "123", phone: "0555 111 22 33", school: "Fen Lisesi", grade: "12. Sınıf (YKS)", target: "Hukuk Fakültesi",
    exams: [{ id: 1, name: "Özdebir TYT-1", type: "TYT", date: "2024-10-15", totalNet: 68.75, difficulty: "Orta", stats: { turkey: { rank: 15400, total: 120000 }, city: { rank: 450, total: 5000 }, school: { rank: 45, total: 120 } }, details: { turk: { d: 30, y: 5, n: 28.75 }, tarih: { d: 4, y: 1, n: 3.75 }, cog: { d: 3, y: 2, n: 2.5 }, fel: { d: 4, y: 1, n: 3.75 }, din: { d: 4, y: 1, n: 3.75 }, mat: { d: 15, y: 3, n: 14.25 }, geo: { d: 5, y: 2, n: 4.5 }, fiz: { d: 3, y: 2, n: 2.5 }, kim: { d: 3, y: 0, n: 3 }, biyo: { d: 2, y: 0, n: 2 } } }],
    moods: [{ id: 101, date: "2024-12-01", metrics: { motivation: 80, happiness: 70, social: 60, examAnxiety: 40, lessonAnxiety: 30, performance: 75, homeworkRate: 90 } }],
    lessons: {}, interviews: [], payments: [], teacherNotes: [],
    assignments: [{ id: 201, day: 'Mon', subject: 'TYT Matematik', topic: 'Sayı Kümeleri', type: 'soru', count: 50, source: '3D Yayınları', status: 'pending', note: 'İlk 2 test' }],
    pastWeeks: [], goals: [], resources: [], 
    stats: { totalSolved: 12500, monthlySolved: 1200, xp: 1250, level: 5, pomodoroCount: 12, sprintCount: 5 }
  }
];

// --- YARDIMCI FONKSİYONLAR ---
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// TARİH FORMATLAYICI (YYYY-MM-DD -> DD/MM/YYYY)
const formatDate = (dateString) => {
  if (!dateString) return "";
  // Eğer tarih zaten nokta veya slaş içeriyorsa dokunma (Notlar için)
  if (dateString.includes('.') || dateString.includes('/')) return dateString;
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// --- UI BİLEŞENLERİ (TEMA UYUMLU) ---

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, max }) => {
  const colors = useThemeColors();
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase tracking-wider`}>{label}</label>}
      <input type={type} value={value === undefined || value === null ? '' : value} onChange={onChange} placeholder={placeholder} min={min} max={max} className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg px-4 py-3 ${colors.text} text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-sm`} />
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", className = "", size = "normal", icon: Icon }) => {
  const colors = useThemeColors();
  const variants = { 
    primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30", 
    secondary: `${colors.isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'} hover:opacity-80 border ${colors.border} shadow-sm`, 
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20", 
    ghost: `bg-transparent ${colors.hoverBg} ${colors.textSec} hover:${colors.text}` 
  };
  const sizes = { small: "px-3 py-1.5 text-xs", normal: "px-5 py-2.5 text-sm", large: "px-6 py-3 text-base" };
  return (
    <button onClick={onClick} className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${className}`}>
      {Icon && <Icon size="16" />} {children}
    </button>
  );
};

const Card = ({ children, title, action, className = "" }) => {
  const colors = useThemeColors();
  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4 md:p-6 ${colors.shadow} transition-colors ${className}`}>
      {(title || action) && <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b ${colors.border} gap-4`}>{title && <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">{title}</h3>}{action}</div>}
      {children}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => {
  const colors = useThemeColors();
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className={`${colors.bgCard} border ${colors.border} rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className={`flex justify-between items-center p-6 border-b ${colors.border}`}><h3 className={`text-xl font-bold ${colors.text}`}>{title}</h3><button onClick={onClose} className={`${colors.textSec} hover:${colors.text}`}><X size="24"/></button></div>
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
          <Input label="Ad Soyad" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <div className={`p-4 rounded-lg border ${colors.border} ${colors.isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <h4 className="text-orange-500 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Lock size={12}/> Güvenlik Bilgileri</h4>
            <div className="space-y-4">
              <Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              <Input label="Yeni Şifre" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Yeni şifrenizi giriniz" />
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
      <div className="flex gap-4"><Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button><Button variant="danger" onClick={onConfirm} className="flex-1" icon={Trash2}>Evet, Sil</Button></div>
    </Modal>
  );
};

// maxValue eklendi: Grafiğin tavan değerini dışarıdan belirlememizi sağlar.
// --- GELİŞMİŞ GRAFİK BİLEŞENİ (Area Chart + Dinamik Ölçek) ---
const LineChart = ({ data, dataKey, labelKey, color = "#f97316", height = 200, showDots = true, strokeWidth = 3 }) => {
  const colors = useThemeColors();
  if (!data || data.length < 2) return <div className={`flex items-center justify-center ${colors.textSec} text-sm h-full`}>Veri yetersiz</div>;
  
  // TAVAN AYARI: Grafiği artık 40 soruya göre değil, öğrencinin yaptığı MAX nete göre ölçekliyoruz.
  const calculatedMax = Math.max(...data.map(d => Number(d[dataKey])));
  const maxVal = (calculatedMax * 1.15) || 10; // En yüksek değerin %15 fazlasını tavan yap
  
  const width = 1000;
  const padding = 20; // Kenar boşluklarını azalttık
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((Number(d[dataKey]) / maxVal) * (height - 2 * padding));
    return [x, y];
  });

  const pathD = svgPath(points, bezierCommand);
  
  // Alt Alanı Doldurma (Gradient Efekti İçin Yol)
  const fillPathD = `
    ${pathD} 
    L ${width - padding},${height - padding} 
    L ${padding},${height - padding} 
    Z
  `;

  return (
    <div className="w-full h-full relative" style={{ height: height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(p => { 
          const y = height - padding - (p * (height - 2*padding)); 
          return <line key={p} x1={padding} y1={y} x2={width-padding} y2={y} stroke={colors.chartGrid} strokeWidth="1" strokeDasharray="4" opacity="0.5" />; 
        })}
        <path d={fillPathD} fill={`url(#gradient-${color})`} stroke="none" />
        <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        {showDots && data.map((d, i) => {
          const [x, y] = points[i];
          return (
            <g key={i} className="group">
              <circle cx={x} cy={y} r="4" fill={colors.bgCard} stroke={color} strokeWidth="2" className="transition-all duration-300 group-hover:r-6" />
              <text x={x} y={y - 15} textAnchor="middle" stroke={colors.bgCard} strokeWidth="3" fontSize="14" fontWeight="bold" paintOrder="stroke" className="select-none">{Number(d[dataKey]).toFixed(1)}</text>
              <text x={x} y={y - 15} textAnchor="middle" fill={color} fontSize="14" fontWeight="bold" className="select-none">{Number(d[dataKey]).toFixed(1)}</text>
              <text x={x} y={height + 15} textAnchor="middle" fill={colors.textSec} fontSize="10">{d[labelKey]}</text>
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

  const handleEdit = (admin) => { setEditingAdmin(admin); setForm({ name: admin.name, username: admin.username, password: admin.password }); setShowModal(true); };
  
  const handleSave = async () => {
    if (!form.name || !form.username || !form.password) return alert("Tüm alanları doldurunuz.");
    if (editingAdmin) {
       const updatedAdmin = { ...editingAdmin, ...form };
       if (isFirebaseActive) { 
           try { 
               const adminRef = doc(db, "admins", editingAdmin.id); 
               const { id, ...data } = updatedAdmin; 
               await setDoc(adminRef, data, { merge: true }); 
            } catch(e) { console.error(e); alert("Güncelleme hatası: " + e.message); } 
       } else { setAdmins(admins.map(a => a.id === editingAdmin.id ? updatedAdmin : a)); }
    } else {
        const newAdmin = { name: form.name, username: form.username, password: form.password, role: 'admin' };
        if (isFirebaseActive) { 
            try { await addDoc(collection(db, "admins"), newAdmin); } catch(e) { console.error(e); alert("Kayıt hatası: " + e.message); } 
        } else { setAdmins([...admins, { id: Date.now().toString(), ...newAdmin }]); }
    }
    setShowModal(false); setForm({ name: '', username: '', password: '' }); setEditingAdmin(null);
  };

  const handleDelete = async (id) => { 
      if (id === user.id) { alert("Güvenlik nedeniyle şu an giriş yapmış olduğunuz hesabı silemezsiniz."); setDeleteConfirm(null); return; }
      if(isFirebaseActive) { try { await deleteDoc(doc(db, "admins", id)); } catch(e) { console.error("Silme hatası:", e); } } 
      else { setAdmins(admins.filter(a => a.id !== id)); } 
      setDeleteConfirm(null); 
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center"><h2 className={`text-2xl font-bold ${colors.text}`}>Yönetici & Öğretmen Paneli</h2><Button icon={Plus} onClick={() => { setEditingAdmin(null); setForm({name:'', username:'', password:''}); setShowModal(true); }}>Yeni Yönetici Ekle</Button></div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {admins.map(admin => {
           const adminStudents = allStudents.filter(s => s.teacherId === admin.id);
           const isExpanded = expandedAdminId === admin.id;
           return (
             <div key={admin.id} className={`${colors.bgCard} border ${colors.border} rounded-xl p-6 relative group transition-all duration-300 ${colors.shadow} ${isExpanded ? 'row-span-2 shadow-xl border-orange-500/30' : ''}`}>
               <div className="flex items-center gap-4"><div className={`w-12 h-12 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full flex items-center justify-center text-orange-500 shrink-0`}><User size={24} /></div><div className="overflow-hidden"><h3 className={`font-bold ${colors.text} truncate`}>{admin.name}</h3><div className={`text-sm ${colors.textSec} truncate`}>K.Adı: <span className={colors.isDark ? 'text-slate-300' : 'text-slate-700'}>{admin.username}</span></div><div className={`text-xs ${colors.textSec} mt-1`}>{adminStudents.length} Öğrenci Kayıtlı</div></div></div>
               <div className="mt-4 flex gap-2"><button onClick={() => setExpandedAdminId(isExpanded ? null : admin.id)} className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${isExpanded ? 'bg-orange-500 text-white' : `${colors.isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}`}><Users size={14} /> {isExpanded ? 'Gizle' : 'Öğrenciler'}</button><button onClick={() => handleEdit(admin)} className={`p-2 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 transition-colors`}><Edit2 size={16}/></button><button onClick={() => setDeleteConfirm(admin.id)} className={`p-2 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-colors`}><Trash2 size={16}/></button></div>
               {isExpanded && (<div className={`mt-4 pt-4 border-t ${colors.border} animate-fade-in`}><h4 className={`text-xs uppercase font-bold ${colors.textSec} mb-2`}>Öğrenci Listesi</h4><div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">{adminStudents.map(st => (<div key={st.id} onClick={() => onInspectStudent(st.id)} className={`flex justify-between items-center p-2 rounded ${colors.isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-100 hover:bg-slate-200'} cursor-pointer transition-colors border border-transparent hover:border-slate-400`}><div><div className={`text-sm font-medium ${colors.text}`}>{st.name}</div><div className={`text-[10px] ${colors.textSec}`}>{st.grade}</div></div><Eye size={14} className={`${colors.textSec} hover:text-orange-500`} /></div>))}{adminStudents.length === 0 && <div className={`text-center text-xs ${colors.textSec} py-2`}>Öğrenci bulunamadı.</div>}</div></div>)}
             </div>
           );
         })}
       </div>
       {showModal && (<Modal title={editingAdmin ? "Yönetici Düzenle" : "Yeni Yönetici Ekle"} onClose={() => setShowModal(false)}><div className="space-y-4"><Input label="Ad Soyad" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({...form, username: e.target.value})} /><Input label="Şifre" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /><Button className="w-full" onClick={handleSave}>{editingAdmin ? "Güncelle" : "Kaydet"}</Button></div></Modal>)}
       <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} />
    </div>
  );
};
// 0. DASHBOARD (GÜNCELLENMİŞ)
const DashboardModule = ({ user, students, setStudents, setSelectedStudentId, onUpdateStudent, classes, setClasses }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Form'a 'classId' eklendi
  const [form, setForm] = useState({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '', classId: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // YENİ STATE'LER: Arama ve Sınıf Yönetimi
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const timerRef = useRef(null);
  const colors = useThemeColors();

  // ... (Timer useEffect aynen kalıyor)
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current); setIsActive(false); handleTimerComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => { /* ... (Eski kodla aynı) ... */ if (user.role === 'student') { const student = students.find(s => s.id === user.id); if (student) { const newStats = { ...student.stats }; if (timerMode === 'pomodoro') newStats.pomodoroCount = (newStats.pomodoroCount || 0) + 1; else newStats.sprintCount = (newStats.sprintCount || 0) + 1; onUpdateStudent({ ...student, stats: newStats }); } } resetTimer(timerMode); };
  const resetTimer = (mode) => { setIsActive(false); clearInterval(timerRef.current); if (mode === 'pomodoro') setTimeLeft(25 * 60); else setTimeLeft(50 * 60); };
  const changeMode = (mode) => { setTimerMode(mode); resetTimer(mode); };
  const toggleTimer = () => setIsActive(!isActive);

  // ÖĞRENCİ KAYDETME (Güncellendi: ClassId desteği)
  const handleSave = async () => {
    if(!form.name || !form.username) return alert("İsim ve kullanıcı adı zorunludur.");
    if (editingId) { const student = students.find(s => s.id === editingId); onUpdateStudent({ ...student, ...form }); setEditingId(null); } 
    else { 
        const newStudent = { ...form, teacherId: user.id, exams: [], moods: [], lessons: {}, interviews: [], payments: [], teacherNotes: [], assignments: [], pastWeeks: [], goals: [], resources: [], stats: { totalSolved: 0, monthlySolved: 0, xp: 0, level: 1 } }; 
        if (isFirebaseActive) { 
            try { await addDoc(collection(db, "students"), newStudent); } catch(e) { console.error(e); alert("Kayıt hatası: " + e.message); } 
        } else { setStudents([...students, { id: Date.now(), ...newStudent }]); } 
    }
    setShowModal(false); setForm({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '', classId: '' });
  };

  // SINIF YÖNETİMİ İŞLEVLERİ
  const handleAddClass = async () => {
      if(!newClassName) return;
      const newClass = { id: Date.now().toString(), name: newClassName };
      if(isFirebaseActive) {
         try { await addDoc(collection(db, "classes"), newClass); } catch(e) { console.error(e); }
      } else {
         setClasses([...classes, newClass]);
      }
      setNewClassName('');
  };
  
  const handleDeleteClass = async (id) => {
      if(!window.confirm("Bu sınıfı silmek istediğinize emin misiniz?")) return;
      if(isFirebaseActive) {
          try { await deleteDoc(doc(db, "classes", id)); } catch(e) { console.error(e); }
      } else {
          setClasses(classes.filter(c => c.id !== id));
      }
  };

  const handleEdit = (student) => { setForm({ name: student.name, grade: student.grade, target: student.target, phone: student.phone, school: student.school, username: student.username, password: student.password, classId: student.classId || '' }); setEditingId(student.id); setShowModal(true); };
  const handleDeleteRequest = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = async () => { if (deleteConfirm) { if(isFirebaseActive) { await deleteDoc(doc(db, "students", deleteConfirm)); } else { setStudents(students.filter(s => s.id !== deleteConfirm)); } if (setSelectedStudentId) setSelectedStudentId(null); setDeleteConfirm(null); } };

  // FİLTRELEME MANTIĞI
  const filteredStudents = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClassFilter === 'ALL' || student.classId === selectedClassFilter;
      return matchesSearch && matchesClass;
  });

  // ÖĞRENCİ GÖRÜNÜMÜ (Değişmedi)
  if (user.role === 'student') {
     // ... (Eski öğrenci dashboard kodu buraya gelecek - Kısaltma yapıyorum, yukarıdaki orjinal kodun aynısı buraya gelecek) ...
     // NOT: Kopyala-Yapıştır yaparken yukarıdaki 'User === student' bloğunun içeriğini buraya aynen koyunuz. 
     // Yer kazanmak için burayı kısa geçiyorum, mantık değişmedi.
     const s = students.find(s => s.id === user.id);
     if (!s) return <div className={`${colors.text} text-center`}>Veri yükleniyor...</div>;
     return (
        <div className="space-y-6 animate-fade-in">
           {/* ... Orjinal Öğrenci Dashboard İçeriği ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
                    <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Timer className="text-orange-500"/> Çalışma Sayacı</h3><div className="flex bg-slate-800 rounded p-1"><button onClick={() => changeMode('pomodoro')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${timerMode === 'pomodoro' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Pomodoro</button><button onClick={() => changeMode('sprint')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${timerMode === 'sprint' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Sprint</button></div></div>
                    <div className="flex flex-col items-center justify-center py-4"><div className="text-5xl md:text-6xl font-mono font-bold text-white mb-6 tracking-wider">{formatTime(timeLeft)}</div><div className="flex gap-4"><Button onClick={toggleTimer} size="large" className={isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}>{isActive ? <><Pause size={20}/> Duraklat</> : <><Play size={20}/> Başlat</>}</Button><Button variant="secondary" onClick={() => resetTimer(timerMode)}><RotateCcw size={20}/> Sıfırla</Button></div></div>
                </Card>
                <div className="grid grid-cols-2 gap-4"><Card className={`${colors.bgCard} flex flex-col items-center justify-center text-center`}><div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-2 text-orange-500"><Clock size={24}/></div><div className={`text-3xl font-bold ${colors.text}`}>{s.stats?.pomodoroCount || 0}</div><div className={`text-xs ${colors.textSec} uppercase font-bold mt-1`}>Pomodoro</div></Card><Card className={`${colors.bgCard} flex flex-col items-center justify-center text-center`}><div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-500"><Zap size={24}/></div><div className={`text-3xl font-bold ${colors.text}`}>{s.stats?.sprintCount || 0}</div><div className={`text-xs ${colors.textSec} uppercase font-bold mt-1`}>Sprint</div></Card><Card className={`${colors.bgCard} flex flex-col items-center justify-center text-center col-span-2`}><div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2 text-green-500"><Award size={24}/></div><div className={`text-3xl font-bold ${colors.text}`}>{s.stats?.totalSolved || 0}</div><div className={`text-xs ${colors.textSec} uppercase font-bold mt-1`}>Toplam Soru</div></Card></div>
            </div>
            {/* ... Diğer istatistik kartları ... */}
        </div>
     );
  }

  // ÖĞRETMEN GÖRÜNÜMÜ (YENİLENDİ)
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className={`text-2xl font-bold ${colors.text}`}>Öğrenci Portföyü</h2>
          <div className="flex gap-2">
            <Button variant="secondary" icon={Users} onClick={() => setShowClassModal(true)}>Sınıfları Yönet</Button>
            <Button icon={Plus} size="large" onClick={() => setShowModal(true)}>Yeni Öğrenci Ekle</Button>
          </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div className={`p-4 ${colors.bgCardTransparent} border ${colors.border} rounded-xl flex flex-col md:flex-row gap-4`}>
         <div className="flex-1">
            <Input 
                placeholder="Öğrenci adı ile ara..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="mb-0" 
            />
         </div>
         <div className="md:w-64">
             <select 
                className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg px-4 py-3 ${colors.text} text-sm focus:outline-none focus:border-orange-500`}
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
             >
                 <option value="ALL">Tüm Sınıflar</option>
                 {classes && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 <option value="">Sınıfsızlar</option>
             </select>
         </div>
      </div>

      {/* ÖĞRENCİ LİSTESİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
              <div key={student.id} className={`${colors.bgCard} border ${colors.border} rounded-xl p-6 hover:border-orange-500/50 transition-all group relative ${colors.shadow}`}>
                  <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedStudentId(student.id)}>
                          <div className={`w-16 h-16 bg-gradient-to-br ${colors.isDark ? 'from-slate-800 to-slate-700' : 'from-slate-200 to-slate-100'} rounded-full flex items-center justify-center text-2xl font-bold ${colors.text} border ${colors.border}`}>
                              {student.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className={`text-lg font-bold ${colors.text} group-hover:text-orange-400 transition-colors`}>{student.name}</h3>
                              <div className={`text-sm ${colors.textSec}`}>{student.grade}</div>
                              {/* Sınıf Etiketi */}
                              {student.classId && classes && (
                                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded ${colors.isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                      {classes.find(c => c.id === student.classId)?.name || 'Bilinmeyen Sınıf'}
                                  </span>
                              )}
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={(e) => {e.stopPropagation(); handleEdit(student)}} className={`p-2 ${colors.textSec} hover:text-blue-400 ${colors.isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg`}><Edit2 size={16}/></button>
                          <button onClick={(e) => handleDeleteRequest(e, student.id)} className={`p-2 ${colors.textSec} hover:text-red-500 ${colors.isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg`}><Trash2 size={16}/></button>
                      </div>
                  </div>
                  <div className="space-y-3 mb-6">
                      <div className={`flex items-center gap-2 text-sm ${colors.textSec}`}><Target size={14} className="text-orange-500"/> <span>Hedef: <span className={colors.text}>{student.target}</span></span></div>
                      <div className={`flex items-center gap-2 text-sm ${colors.textSec}`}><GraduationCap size={14} className="text-blue-500"/> <span>Okul: <span className={colors.text}>{student.school}</span></span></div>
                      <div className={`flex items-center gap-2 text-sm ${colors.textSec}`}><Phone size={14} className="text-green-500"/> <span>{student.phone}</span></div>
                  </div>
                  <Button className="w-full" variant="secondary" onClick={() => setSelectedStudentId(student.id)}>Profile Git <ChevronRight size={16}/></Button>
              </div>
          ))}
          {filteredStudents.length === 0 && <div className={`col-span-full text-center py-12 ${colors.textSec}`}>Aradığınız kriterlere uygun öğrenci bulunamadı.</div>}
      </div>

      {/* ÖĞRENCİ EKLEME/DÜZENLEME MODALI */}
      {showModal && (<Modal title={editingId ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"} onClose={() => {setShowModal(false); setEditingId(null); setForm({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '', classId: '' });}}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="Ad Soyad" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><Input label="Sınıf Düzeyi" placeholder="12. Sınıf (YKS)" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
        
        {/* YENİ: Sınıf Seçimi */}
        <div className="col-span-1 md:col-span-2">
            <label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>Atanacak Sınıf (Grup)</label>
            <select className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg p-3 ${colors.text}`} value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
                <option value="">Sınıf Seçiniz (Opsiyonel)</option>
                {classes && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        <Input label="Hedef" placeholder="Tıp Fakültesi" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /><Input label="Okul" value={form.school} onChange={e => setForm({...form, school: e.target.value})} /><Input label="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /><div className={`col-span-1 md:col-span-2 p-4 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg border ${colors.border} mt-2`}><h4 className="text-orange-500 font-bold text-xs uppercase mb-3">Giriş Bilgileri</h4><div className="grid grid-cols-2 gap-4"><Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({...form, username: e.target.value})} /><Input label="Şifre" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div></div><div className="col-span-1 md:col-span-2 pt-4"><Button size="large" className="w-full" onClick={handleSave}>Kaydet</Button></div></div></Modal>)}
      
      {/* YENİ: SINIF YÖNETİM MODALI */}
      {showClassModal && (
          <Modal title="Sınıf & Grup Yönetimi" onClose={() => setShowClassModal(false)}>
              <div className="space-y-6">
                  <div className="flex gap-2">
                      <Input placeholder="Yeni Sınıf Adı (Örn: 12-A)" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="mb-0 flex-1" />
                      <Button onClick={handleAddClass} icon={Plus}>Ekle</Button>
                  </div>
                  <div className={`border ${colors.border} rounded-lg overflow-hidden`}>
                      <table className="w-full text-left text-sm">
                          <thead className={colors.tableHeader}><tr><th className="p-3">Sınıf Adı</th><th className="p-3 text-right">İşlem</th></tr></thead>
                          <tbody className={`divide-y ${colors.divider}`}>
                              {classes && classes.map(c => (
                                  <tr key={c.id} className={colors.hoverBg}>
                                      <td className={`p-3 ${colors.text}`}>{c.name}</td>
                                      <td className="p-3 text-right">
                                          <button onClick={() => handleDeleteClass(c.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                                      </td>
                                  </tr>
                              ))}
                              {(!classes || classes.length === 0) && <tr><td colSpan="2" className="p-4 text-center text-slate-500">Henüz sınıf oluşturulmadı.</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          </Modal>
      )}

      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 1. DERS YÖNETİMİ
// 1. DERS YÖNETİMİ (GÜNCELLENMİŞ)
// Parametrelere 'allStudents' eklendi
const LessonModule = ({ student, curriculum, setCurriculum, onUpdateStudent, user, allStudents }) => {
  const activeCurriculum = student.curriculum || curriculum;
  const [selectedCourseId, setSelectedCourseId] = useState(activeCurriculum[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", parentId: "" }); 
  const [bulkText, setBulkText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // YENİ STATE: Kopyalama Modalı
  const [showCopyModal, setShowCopyModal] = useState(false);

  const colors = useThemeColors();
  
  if (user.role === 'student') return <div className={`${colors.text} text-center mt-20`}>Bu alana erişim yetkiniz yok.</div>;

  const selectedCourse = activeCurriculum.find(c => c.id === selectedCourseId);

  // ... (Eski toggleStatus, handleAddItem, handleMove, requestDelete, confirmDelete, LABELS kodları AYNEN buraya) ...
  // KOD TEKRARI OLMASIN DİYE KISALTIYORUM, MEVCUT FONKSİYONLARI KORU.
  const toggleStatus = (topicId, type) => { /* ... */ const currentStatus = student.lessons[topicId] || {}; const newStatus = { ...currentStatus, [type]: !currentStatus[type] }; onUpdateStudent({ ...student, lessons: { ...student.lessons, [topicId]: newStatus } }); };
  const handleAddItem = () => { /* ... */ let updatedCurriculum = [...activeCurriculum]; if (showAddModal === 'course') { if(!newItem.name) return; const newCourse = { id: Date.now().toString(), name: newItem.name, units: [] }; updatedCurriculum = [...updatedCurriculum, newCourse]; setSelectedCourseId(newCourse.id); } else if (showAddModal === 'unit' || showAddModal === 'topic') { const names = bulkText ? bulkText.split('\n').filter(n => n.trim()) : (newItem.name ? [newItem.name] : []); if(names.length === 0) return; updatedCurriculum = updatedCurriculum.map(c => { if (c.id === selectedCourseId) { if (showAddModal === 'unit') { const newUnits = names.map(name => ({ id: Math.random().toString(36).substr(2, 9), name, topics: [] })); return { ...c, units: [...c.units, ...newUnits] }; } else { return { ...c, units: c.units.map(u => u.id === newItem.parentId ? { ...u, topics: [...u.topics, ...names] } : u) }; } } return c; }); } onUpdateStudent({ ...student, curriculum: updatedCurriculum }); setShowAddModal(null); setNewItem({ name: "", parentId: "" }); setBulkText(""); };
  const handleMove = (e, type, index, direction, parentId = null, subParentId = null) => { /* ... */ e.stopPropagation(); let updated = [...activeCurriculum]; const swap = (arr, i, dir) => { if (dir === 'up' && i > 0) { [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; } else if (dir === 'down' && i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; } return arr; }; if (type === 'course') { updated = swap(updated, index, direction); } else if (type === 'unit') { const courseIndex = updated.findIndex(c => c.id === selectedCourseId); if (courseIndex > -1) { let units = [...updated[courseIndex].units]; units = swap(units, index, direction); updated[courseIndex] = { ...updated[courseIndex], units }; } } else if (type === 'topic') { const courseIndex = updated.findIndex(c => c.id === selectedCourseId); if (courseIndex > -1) { const unitIndex = updated[courseIndex].units.findIndex(u => u.id === parentId); if (unitIndex > -1) { let topics = [...updated[courseIndex].units[unitIndex].topics]; topics = swap(topics, index, direction); const newUnits = [...updated[courseIndex].units]; newUnits[unitIndex] = { ...newUnits[unitIndex], topics }; updated[courseIndex] = { ...updated[courseIndex], units: newUnits }; } } } onUpdateStudent({ ...student, curriculum: updated }); };
  const requestDelete = (e, type, id, parentId = null) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({ type, id, parentId }); };
  const confirmDelete = () => { /* ... */ if (!deleteConfirm) return; const { type, id, parentId } = deleteConfirm; let updatedCurriculum = [...activeCurriculum]; if (type === 'course') { updatedCurriculum = updatedCurriculum.filter(c => c.id !== id); if(selectedCourseId === id) setSelectedCourseId(updatedCurriculum[0]?.id || null); } else if (type === 'unit') { updatedCurriculum = updatedCurriculum.map(c => c.id === selectedCourseId ? { ...c, units: c.units.filter(u => u.id !== id) } : c); } else if (type === 'topic') { updatedCurriculum = updatedCurriculum.map(c => c.id === selectedCourseId ? { ...c, units: c.units.map(u => u.id === parentId ? { ...u, topics: u.topics.filter(t => t !== id) } : u) } : c); } onUpdateStudent({ ...student, curriculum: updatedCurriculum }); setDeleteConfirm(null); };
  const LABELS = [{ id: 'konu', label: 'Konu', color: 'bg-emerald-500' }, { id: 'soru', label: 'Soru', color: 'bg-blue-500' }, { id: 't1', label: '1. Tekrar', color: 'bg-purple-500' }, { id: 't2', label: '2. Tekrar', color: 'bg-pink-500' }, { id: 't3', label: '3. Tekrar', color: 'bg-orange-500' }];

  // YENİ FONKSİYON: Müfredat Kopyalama
  const handleCopyFromStudent = (targetStudentId) => {
      if(!window.confirm("Bu işlem mevcut öğrencinin ders programını tamamen silecek ve seçilen öğrencininkiyle değiştirecektir. Emin misiniz?")) return;
      const targetStudent = allStudents.find(s => s.id === targetStudentId);
      if(targetStudent && targetStudent.curriculum) {
          onUpdateStudent({ ...student, curriculum: targetStudent.curriculum });
          setShowCopyModal(false);
          alert("Ders programı başarıyla kopyalandı.");
      } else {
          alert("Seçilen öğrencinin özel bir ders programı yok veya bulunamadı.");
      }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)] animate-fade-in">
        {/* SOL MENÜ: DERSLER */}
        <div className="w-full md:w-1/4 flex flex-col gap-2 max-h-60 md:max-h-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-orange-500 font-bold">Dersler</h3>
                <div className="flex gap-1">
                    {/* YENİ BUTON: Kopyalama */}
                    <Button size="small" variant="secondary" icon={RefreshCw} onClick={() => setShowCopyModal(true)} title="Başka Öğrenciden Kopyala" />
                    <Button size="small" icon={Plus} onClick={() => setShowAddModal('course')} />
                </div>
            </div>
            {/* ... (Eski ders listeleme kodu aynı) ... */}
            {activeCurriculum.map((c, idx) => (
                <div key={c.id} className="flex gap-1 items-center">
                    <button onClick={() => setSelectedCourseId(c.id)} className={`flex-1 p-3 rounded-lg text-left transition-all truncate ${selectedCourseId === c.id ? `bg-slate-800 border-orange-500 text-white border` : `${colors.bgCard} ${colors.border} ${colors.textSec}`}`}>{c.name}</button>
                    <div className="flex flex-col gap-1">
                         <button onClick={(e) => handleMove(e, 'course', idx, 'up')} disabled={idx === 0} className={`p-1 ${colors.bgCard} border ${colors.border} rounded text-slate-500 hover:text-orange-500 disabled:opacity-30`}><ArrowUp size={10}/></button>
                         <button onClick={(e) => handleMove(e, 'course', idx, 'down')} disabled={idx === activeCurriculum.length - 1} className={`p-1 ${colors.bgCard} border ${colors.border} rounded text-slate-500 hover:text-orange-500 disabled:opacity-30`}><ArrowDown size={10}/></button>
                    </div>
                    <button onClick={(e) => requestDelete(e, 'course', c.id)} className={`p-3 ${colors.bgCard} ${colors.border} border rounded-lg text-slate-500 hover:text-red-500 hover:border-red-500/50 group h-full flex items-center`}><Trash2 size={16} className="group-hover:text-red-500"/></button>
                </div>
            ))}
        </div>

        {/* SAĞ TARAF: İÇERİK (Değişmedi, sadece context'i korumak için kısa tutuyorum) */}
        <div className={`flex-1 ${colors.bgCardTransparent} border ${colors.border} rounded-xl p-6 overflow-y-auto custom-scrollbar`}>
             {/* ... (Orjinal içerik aynen kalacak) ... */}
             {selectedCourse ? (
             <>
                 <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b ${colors.border} gap-4`}>
                     <h2 className={`text-xl font-bold ${colors.text}`}>{selectedCourse.name}</h2>
                     <div className="flex gap-3">
                         <Button size="small" variant="secondary" icon={Plus} onClick={() => setShowAddModal('unit')}>Ünite Ekle</Button>
                         <Button size="small" variant="secondary" icon={Plus} onClick={() => { setNewItem({...newItem, parentId: selectedCourse.units[0]?.id}); setShowAddModal('topic'); }}>Konu Ekle</Button>
                     </div>
                 </div>
                 {/* ... Üniteler ve Konular döngüsü (Eski kod) ... */}
                 {selectedCourse.units.map((unit, uIdx) => (
                    <div key={unit.id} className={`mb-6 ${colors.bgCard} border ${colors.border} rounded-lg overflow-hidden ${colors.shadow}`}>
                        <div className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} p-3 flex justify-between items-center`}>
                            <h4 className="text-orange-500 font-bold">{unit.name}</h4>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => handleMove(e, 'unit', uIdx, 'up')} disabled={uIdx === 0} className={`p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-orange-500 disabled:opacity-30`}><ArrowUp size={14}/></button>
                                <button onClick={(e) => handleMove(e, 'unit', uIdx, 'down')} disabled={uIdx === selectedCourse.units.length - 1} className={`p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-orange-500 disabled:opacity-30`}><ArrowDown size={14}/></button>
                                <div className="w-px h-4 bg-slate-500/30 mx-1"></div>
                                <button onClick={(e) => requestDelete(e, 'unit', unit.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={14}/></button>
                            </div>
                        </div>
                        <div className={`divide-y ${colors.divider}`}>
                            {unit.topics.map((topic, tIdx) => { 
                                const key = `${selectedCourse.id}-${unit.id}-${tIdx}`;
                                const status = student.lessons[key] || {}; 
                                return (
                                <div key={tIdx} className={`flex flex-col md:flex-row justify-between items-start md:items-center p-3 ${colors.hoverBg} transition-colors gap-2 group`}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleMove(e, 'topic', tIdx, 'up', unit.id)} disabled={tIdx === 0} className="text-slate-400 hover:text-orange-500 disabled:opacity-0"><ArrowUp size={10}/></button>
                                            <button onClick={(e) => handleMove(e, 'topic', tIdx, 'down', unit.id)} disabled={tIdx === unit.topics.length - 1} className="text-slate-400 hover:text-orange-500 disabled:opacity-0"><ArrowDown size={10}/></button>
                                        </div>
                                        <span className={`${colors.text} text-sm font-medium`}>{topic}</span>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                        <div className="flex gap-3 mr-4">
                                            {LABELS.map(lbl => (
                                                <div key={lbl.id} className="flex flex-col items-center gap-1 cursor-pointer group/lbl" onClick={() => toggleStatus(key, lbl.id)}>
                                                    <div className={`w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center transition-all ${status[lbl.id] ? `${lbl.color} border-transparent` : `hover:border-slate-400 ${colors.isDark ? 'bg-slate-800' : 'bg-white'}`}`}>
                                                        {status[lbl.id] && <Check size={10} className="text-white"/>}
                                                    </div>
                                                    <span className={`text-[9px] ${colors.textSec} font-medium whitespace-nowrap group-hover/lbl:${colors.text} transition-colors`}>{lbl.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={(e) => requestDelete(e, 'topic', topic, unit.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                ) 
                            })}
                        </div>
                    </div>
                ))}
             </>) : <div className={`${colors.textSec} text-center py-20`}>Ders seçiniz veya ekleyiniz.</div>}
        </div>
       
        {showAddModal && (<Modal title={showAddModal === 'course' ? 'Yeni Ders' : showAddModal === 'unit' ? 'Yeni Ünite' : 'Yeni Konu'} onClose={() => setShowAddModal(null)}>
            {/* ... (Eski modal içeriği aynen kalacak) ... */}
            <div className="space-y-4">
                {showAddModal === 'topic' && (
                    <div>
                        <label className={`block text-sm ${colors.textSec} mb-1`}>Hangi Üniteye?</label>
                        <select className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg p-3 ${colors.text}`} value={newItem.parentId} onChange={e => setNewItem({...newItem, parentId: e.target.value})}>
                            <option value="">Seçiniz</option>
                            {selectedCourse?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                )}
                {showAddModal === 'course' ? (
                    <Input label="Ders Adı" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                ) : (
                    <div>
                        <label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>{showAddModal === 'unit' ? 'Ünite İsimleri' : 'Konu İsimleri'} (Her satıra bir tane)</label>
                        <textarea className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg p-3 ${colors.text} h-32 focus:border-orange-500 outline-none`} value={bulkText} onChange={e => setBulkText(e.target.value)}></textarea>
                    </div>
                )}
                <Button onClick={handleAddItem} className="w-full mt-4">Kaydet</Button>
            </div>
        </Modal>)}

        {/* YENİ: KOPYALAMA MODALI */}
        {showCopyModal && (
            <Modal title="Müfredat Kopyala" onClose={() => setShowCopyModal(false)}>
                <div className="space-y-4">
                    <div className="bg-red-500/10 p-4 rounded text-red-500 text-sm">
                        Dikkat: Bu işlem, şu anki öğrencinin tüm ders yapısını silecek ve seçtiğiniz öğrencinin ders yapısını (dersler, üniteler, konular) buraya aktaracaktır.
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {allStudents
                            .filter(s => s.id !== student.id)
                            .map(s => (
                                <button key={s.id} onClick={() => handleCopyFromStudent(s.id)} className={`w-full text-left p-3 rounded border ${colors.border} ${colors.hoverBg} flex justify-between items-center`}>
                                    <span className={colors.text}>{s.name}</span>
                                    <span className={`text-xs ${colors.textSec}`}>{s.grade}</span>
                                </button>
                            ))
                        }
                        {allStudents.filter(s => s.id !== student.id).length === 0 && <div className={`text-center ${colors.textSec} py-2`}>Başka öğrenci bulunamadı.</div>}
                    </div>
                </div>
            </Modal>
        )}

        <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 2. HAFTALIK PROGRAM
const ScheduleModule = ({ student, curriculum, onUpdateStudent, user }) => {
  const activeCurriculum = student.curriculum || curriculum;
  // Çoklu gün seçimi için form yapısı güncellendi: day -> days array
  const [form, setForm] = useState({ days: [], courseId: '', unitId: '', topic: '', type: 'soru', count: '', source: '', note: '' });
  const [editingId, setEditingId] = useState(null); 
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showQuickModal, setShowQuickModal] = useState(false);
  // Quick Assign için de çoklu gün seçimi
  const [quickForm, setQuickForm] = useState({ text: '', days: [], count: '', source: '' });
  const [isEditMode, setIsEditMode] = useState(false); // Düzenleme modu görünürlüğü
  const [expandedArchive, setExpandedArchive] = useState(null); // Arşiv detayını açmak için
  const colors = useThemeColors();

  const selectedCourse = activeCurriculum.find(c => c.id === form.courseId);
  const selectedUnit = selectedCourse?.units.find(u => u.id === form.unitId);
  const availableResources = student.resources ? student.resources.filter(r => r.courseId === form.courseId) : [];
  const assignments = student.assignments || [];
  
  // İstatistiklerde opsiyonel 'count' değerini güvenli parse etme
  const weeklySolvedQuestions = assignments.filter(a => (a.type === 'soru' || a.count) && a.status === 'completed').reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
  const weeklyTaskCount = assignments.length;
  const weeklyCompletedCount = assignments.filter(a => a.status === 'completed').length;
  const completionRate = weeklyTaskCount > 0 ? Math.round((weeklyCompletedCount / weeklyTaskCount) * 100) : 0;
  const monthlySolved = (student.stats?.monthlySolved || 0) + weeklySolvedQuestions;
  const allTimeSolved = (student.stats?.totalSolved || 0) + weeklySolvedQuestions;
  
  const handleAssign = () => { 
      if(!form.courseId || !form.topic) return alert("Lütfen ders ve konu seçiniz."); 
      if(form.days.length === 0) return alert("En az bir gün seçiniz.");
      
      let newAssignments = [...assignments];

      if (editingId) { 
         // Düzenleme modunda tek bir kayıt güncellenir (gün değişebilir ama tekil kalır)
         // Not: Çoklu gün seçimi yeni ekleme içindir. Düzenlemede tekil gün mantığını koruyabiliriz veya onu da geliştirebiliriz.
         // Mevcut mantıkta id ile tek bir kayıt buluyoruz.
         const day = form.days[0]; // Düzenlemede ilk seçili günü alalım
         newAssignments = newAssignments.map(a => a.id === editingId ? { ...a, ...form, day: day, subject: selectedCourse.name } : a); 
         setEditingId(null); 
      } else { 
         // Çoklu gün seçimi ile toplu ekleme
         form.days.forEach(day => {
             const newAssignment = { 
                 id: Date.now() + Math.random(), // Unique ID 
                 status: 'pending', 
                 subject: selectedCourse.name, 
                 ...form,
                 day: day // Her kayıt için ayrı gün
             };
             // days arrayini kaydetmemize gerek yok, her obje kendi 'day' alanına sahip
             delete newAssignment.days;
             newAssignments.push(newAssignment);
         });
      } 
      
      onUpdateStudent({ ...student, assignments: newAssignments });
      setForm(prev => ({ ...prev, count: '', source: '', unitId: '', topic: '', note: '', days: [] })); 
  };
  
  // HIZLI GÖREV EKLEME
  const handleQuickAssign = () => {
    if(!quickForm.text) return alert("Görev içeriği giriniz.");
    if(quickForm.days.length === 0) return alert("En az bir gün seçiniz.");
    
    // 1. Mevcut ödev listesinin bir kopyasını al
    let newAssignments = [...assignments];

    // 2. Seçilen her gün için döngü kurarak görev ekle
    quickForm.days.forEach(day => {
        const newAssignment = { 
            id: Date.now() + Math.random(), 
            status: 'pending', 
            subject: 'Ek Görev', 
            topic: quickForm.text, 
            day: day, 
            type: 'ozel', 
            count: quickForm.count,   
            source: quickForm.source  
        };
        newAssignments.push(newAssignment);
    });

    // 3. Öğrenci verisini güncelle
    onUpdateStudent({ ...student, assignments: newAssignments });
    setShowQuickModal(false);
    setQuickForm({ text: '', days: [], count: '', source: '' });
  };

  const handleEdit = (task) => { 
      const course = activeCurriculum.find(c => c.name === task.subject); 
      setForm({ 
          days: [task.day], // Düzenlemede mevcut günü seçili getir
          courseId: course ? course.id : '', 
          unitId: task.unitId || '', 
          topic: task.topic, 
          type: task.type, 
          count: task.count, 
          source: task.source || '', 
          note: task.note || '' 
      }); 
      setEditingId(task.id); 
      window.scrollTo(0,0); 
  };
  
  const handleCancelEdit = () => { setEditingId(null); setForm(prev => ({ ...prev, count: '', source: '', unitId: '', topic: '', note: '', days: [] })); };
  const toggleTaskStatus = (id) => { const updated = assignments.map(a => a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a); let newStats = { ...student.stats }; const task = assignments.find(a => a.id === id); if (task && task.status !== 'completed') { newStats.xp = (newStats.xp || 0) + 50; newStats.level = Math.floor(newStats.xp / 1000) + 1; } onUpdateStudent({ ...student, assignments: updated, stats: newStats }); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = assignments.filter(a => a.id !== deleteConfirm); onUpdateStudent({ ...student, assignments: filtered }); setDeleteConfirm(null); } };
  const handleDeleteArchive = (weekId) => { if(window.confirm("Bu arşiv kaydını kalıcı olarak silmek istediğinize emin misiniz?")) { const updatedArchives = student.pastWeeks.filter(w => w.id !== weekId); onUpdateStudent({ ...student, pastWeeks: updatedArchives }); } };
  
  const handleResetSchedule = () => { 
      if(window.confirm("Haftalık programı sıfırlamak üzeresiniz. Mevcut program arşive eklenecek ve liste temizlenecek. Onaylıyor musunuz?")) { 
          const newTotalSolved = (student.stats?.totalSolved || 0) + weeklySolvedQuestions; 
          const newMonthlySolved = (student.stats?.monthlySolved || 0) + weeklySolvedQuestions; 
          
          // Arşive kaydederken detaylı listeyi saklıyoruz
          const archivedWeek = { 
              id: Date.now(), 
              date: new Date().toLocaleDateString('tr-TR'), 
              assignments: assignments, // Tüm görev listesini sakla
              solvedCount: weeklySolvedQuestions 
          }; 
          
          onUpdateStudent({ 
              ...student, 
              assignments: [], 
              pastWeeks: [archivedWeek, ...(student.pastWeeks || [])], 
              stats: { ...student.stats, totalSolved: newTotalSolved, monthlySolved: newMonthlySolved } 
          }); 
      } 
  };
  
  const getDailyStats = (dayId) => { 
      const dayTasks = assignments.filter(a => a.day === dayId); 
      return { 
          topic: dayTasks.filter(t => t.type === 'konu').length, 
          question: dayTasks.filter(t => t.type === 'soru' || t.count).reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0), 
          repeat: dayTasks.filter(t => t.type === 'tekrar').length, 
          exam: dayTasks.filter(t => t.type === 'deneme').length 
      }; 
  };
  
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isStudent = user.role === 'student';

  // Gün seçimi butonu bileşeni
  const DaySelector = ({ selectedDays, onChange }) => (
      <div className="flex flex-wrap gap-1">
          {DAYS.map(d => (
              <button
                  key={d.id}
                  onClick={() => {
                      const newDays = selectedDays.includes(d.id) 
                          ? selectedDays.filter(id => id !== d.id) 
                          : [...selectedDays, d.id];
                      onChange(newDays);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${selectedDays.includes(d.id) ? 'bg-orange-600 text-white border-orange-600' : `${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} ${colors.textSec} border-transparent hover:border-slate-500`}`}
              >
                  {d.label.substring(0,3)}
              </button>
          ))}
      </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${colors.text}`}>Haftalık Planlama</h2>
          <div className="flex gap-2">
              {isAdmin && <Button variant="ghost" onClick={() => setIsEditMode(!isEditMode)} icon={Settings} className={isEditMode ? 'text-orange-500 bg-orange-500/10' : ''} />}
              {isAdmin && <Button size="small" icon={Zap} onClick={() => setShowQuickModal(true)}>Hızlı Görev</Button>}
              {isAdmin && <Button variant="danger" size="small" icon={RefreshCw} onClick={handleResetSchedule}>Arşivle & Sıfırla</Button>}
          </div>
      </div>
      
      {isAdmin && (
        <Card title={editingId ? "Ödevi Düzenle" : "Detaylı Ödev Atama"} className={`${colors.isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Ders</label>
                    <select className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-2 ${colors.text} text-sm`} value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value, unitId: '', topic: '', source: ''})}><option value="">Seçiniz</option>{activeCurriculum.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Ünite</label>
                    <select className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-2 ${colors.text} text-sm`} value={form.unitId} onChange={e => setForm({...form, unitId: e.target.value, topic: ''})} disabled={!selectedCourse}><option value="">Seçiniz</option>{selectedCourse?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                </div>
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Konu</label>
                    <select className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-2 ${colors.text} text-sm`} value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} disabled={!selectedUnit}><option value="">Seçiniz</option>{selectedUnit?.topics.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Günler (Çoklu)</label>
                    <DaySelector selectedDays={form.days} onChange={days => setForm({...form, days})} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Tip</label>
                    <select className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-2 ${colors.text} text-sm`} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
                </div>
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Soru Sayısı</label>
                    <input type="number" className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-2 ${colors.text} text-sm disabled:opacity-50`} placeholder="Örn: 50" disabled={form.type !== 'soru'} value={form.count} onChange={e => setForm({...form, count: e.target.value})} />
                </div>
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Kaynak</label>
                    <select className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-2 ${colors.text} text-sm`} value={form.source} onChange={e => setForm({...form, source: e.target.value})}><option value="">Kaynak Seçiniz / Diğer</option>{availableResources.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</select>
                </div>
            </div>
            <div className="mb-4">
                 <Input label="Not / Sayfa Aralığı (İsteğe Bağlı)" placeholder="Örn: Sayfa 70-80 arası çözülecek" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            </div>
            <div className="flex gap-2"><Button onClick={handleAssign} icon={editingId ? Save : Plus} className="flex-1">{editingId ? 'Güncelle' : 'Ekle'}</Button>{editingId && <Button onClick={handleCancelEdit} variant="secondary">İptal</Button>}</div>
        </Card>
      )}

      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-7 md:overflow-visible">
          {DAYS.map(day => { 
            const dayTasks = assignments.filter(a => a.day === day.id); 
            const stats = getDailyStats(day.id); 
            return (
            <div key={day.id} className={`min-w-[280px] md:min-w-0 ${colors.bgCardTransparent} border ${colors.border} rounded-xl flex flex-col h-full snap-center`}>
                <div className={`p-3 border-b ${colors.border} ${colors.bgCard} rounded-t-xl text-center`}><span className={`font-bold ${colors.text} text-sm`}>{day.label}</span><span className={`block text-xs ${colors.textSec}`}>{dayTasks.length} Görev</span></div>
                <div className="p-2 space-y-2 flex-1">
                    {dayTasks.map(task => (<div key={task.id} className={`p-3 rounded-lg border text-xs group relative ${colors.shadow} ${task.status === 'completed' ? 'bg-emerald-900/20 border-emerald-900/50 opacity-75' : `${colors.bgCard} ${colors.border}`}`}><div className="flex justify-between items-start"><span className="font-bold text-orange-400 truncate w-full pr-12">{task.subject}</span>
                    
                    {/* EDIT MODE CONTROL */}
                    {(isAdmin && isEditMode) && (
                        <div className={`flex gap-1 absolute right-2 top-2 z-10 ${colors.isDark ? 'bg-slate-800/80' : 'bg-white/80'} p-1 rounded backdrop-blur-sm shadow-sm border ${colors.border}`}>
                            <button onClick={(e) => {e.stopPropagation(); handleEdit(task)}} className={`text-slate-400 hover:text-blue-400 p-2`}><Edit2 size={12}/></button>
                            <button onClick={(e) => requestDelete(e, task.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={12}/></button>
                        </div>
                    )}

                    </div><div className={`${colors.text} mt-1 text-sm font-medium line-clamp-2`}>{task.topic}</div><div className="mt-2 flex flex-col gap-1"><div className={`flex justify-between items-center text-xs ${colors.textSec}`}><span className={`${colors.isDark ? 'bg-slate-700/50' : 'bg-slate-200'} px-1.5 py-0.5 rounded`}>{TASK_TYPES.find(t=>t.id === task.type)?.label}</span>{task.count && <span className="font-bold text-orange-400">{task.count} Soru</span>}</div>{task.source && (<div className="flex items-center gap-1 text-xs text-blue-400 mt-0.5"><Book size={10} /><span className="truncate">{task.source}</span></div>)}</div>
                    
                    {task.note && (
                        <div className={`mt-2 pt-2 border-t ${colors.border} text-[10px] ${colors.textSec} italic`}>
                            Not: <span className={colors.text}>{task.note}</span>
                        </div>
                    )}

                    <button onClick={() => toggleTaskStatus(task.id)} className={`mt-2 w-full py-2 rounded flex items-center justify-center gap-1 ${task.status === 'completed' ? 'bg-emerald-600 text-white' : `${colors.isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}`}>{task.status === 'completed' ? <Check size={14}/> : 'Tamamla'}</button></div>))}
                    {dayTasks.length === 0 && <div className={`text-center py-8 ${colors.textSec} text-xs`}>Boş Gün</div>}
                </div>
                <div className={`p-3 ${colors.isDark ? 'bg-slate-900/80' : 'bg-white/80'} border-t ${colors.border} rounded-b-xl text-[10px] space-y-1`}><div className={`flex justify-between ${colors.textSec}`}><span>Konu:</span> <span className={`${colors.text} font-bold`}>{stats.topic}</span></div><div className={`flex justify-between ${colors.textSec}`}><span>Soru:</span> <span className="text-orange-400 font-bold">{stats.question}</span></div><div className={`flex justify-between ${colors.textSec}`}><span>Tekrar:</span> <span className={`${colors.text} font-bold`}>{stats.repeat}</span></div><div className={`flex justify-between ${colors.textSec}`}><span>Deneme:</span> <span className={`${colors.text} font-bold`}>{stats.exam}</span></div></div>
            </div>) 
        })}
      </div>

       <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
       
       {showQuickModal && (
        <Modal title="Hızlı Görev Ata" onClose={() => setShowQuickModal(false)}>
            <div className="space-y-4">
                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Görev İçeriği</label>
                    <input type="text" className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-3 ${colors.text} text-sm`} placeholder="Örn: X Videosunu İzle, Y Materyalini Hazırla" value={quickForm.text} onChange={e => setQuickForm({...quickForm, text: e.target.value})} />
                </div>
                
                {/* YENİ EKLENEN ALANLAR: SORU SAYISI VE KAYNAK */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Soru Sayısı</label>
                        <input type="number" className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-3 ${colors.text} text-sm`} placeholder="Opsiyonel" value={quickForm.count} onChange={e => setQuickForm({...quickForm, count: e.target.value})} />
                    </div>
                    <div>
                        <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Kaynak</label>
                        <input type="text" className={`w-full ${colors.inputBg} ${colors.inputBorder} border rounded p-3 ${colors.text} text-sm`} placeholder="Opsiyonel" value={quickForm.source} onChange={e => setQuickForm({...quickForm, source: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className={`text-xs ${colors.textSec} uppercase font-bold block mb-1`}>Günler (Çoklu)</label>
                    <DaySelector selectedDays={quickForm.days} onChange={days => setQuickForm({...quickForm, days})} />
                </div>
                <div className="text-xs text-orange-500 bg-orange-500/10 p-2 rounded">
                  
                </div>
                <Button className="w-full mt-2" onClick={handleQuickAssign}>Atama Yap</Button>
            </div>
        </Modal>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"><Card className={`border-l-4 border-l-blue-500 ${colors.bgCard}`}><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><Zap size={20}/></div><span className={`text-xs uppercase font-bold ${colors.textSec}`}>Haftalık Performans</span></div><div className="flex justify-between items-end"><div><div className={`text-2xl font-bold ${colors.text}`}>{weeklySolvedQuestions} <span className={`text-sm font-normal ${colors.textSec}`}>Soru</span></div></div><div className="text-right"><div className="text-xl font-bold text-blue-400">%{completionRate}</div><div className={`text-[10px] ${colors.textSec}`}>Tamamlanma</div></div></div></Card><Card className={`border-l-4 border-l-purple-500 ${colors.bgCard}`}><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-purple-500/20 rounded-lg text-purple-500"><Calendar size={20}/></div><span className={`text-xs uppercase font-bold ${colors.textSec}`}>Aylık Toplam</span></div><div className={`text-3xl font-bold ${colors.text} mt-2`}>{(monthlySolved || 0).toLocaleString()}</div></Card><Card className={`border-l-4 border-l-emerald-500 ${colors.bgCard}`}><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><Award size={20}/></div><span className={`text-xs uppercase font-bold ${colors.textSec}`}>Tüm Zamanlar</span></div><div className={`text-3xl font-bold ${colors.text} mt-2`}>{(allTimeSolved || 0).toLocaleString()}</div></Card><Card className={`border-l-4 border-l-orange-500 ${colors.bgCard}`}><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><List size={20}/></div><span className={`text-xs uppercase font-bold ${colors.textSec}`}>Görev Durumu</span></div><div className="grid grid-cols-2 gap-2 mt-2"><div className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} p-2 rounded text-center`}><div className={`text-lg font-bold ${colors.text}`}>{weeklyCompletedCount}</div><div className={`text-[10px] ${colors.textSec}`}>Biten</div></div><div className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} p-2 rounded text-center`}><div className={`text-lg font-bold ${colors.textSec}`}>{weeklyTaskCount - weeklyCompletedCount}</div><div className={`text-[10px] ${colors.textSec}`}>Kalan</div></div></div></Card></div>
      
       {student.pastWeeks?.length > 0 && (
        <Card title="Geçmiş Haftalar Arşivi" className="mt-8">
            <div className="space-y-4">
                {student.pastWeeks.map(week => (
                    <div key={week.id} className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg overflow-hidden`}>
                        <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedArchive(expandedArchive === week.id ? null : week.id)}>
                            <div className="flex items-center gap-3">
                                {expandedArchive === week.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                <div>
                                    <div className={`font-bold ${colors.text} text-sm`}>Hafta: {week.date}</div>
                                    <div className={`text-xs ${colors.textSec}`}>{week.assignments?.length || 0} Görev Planlandı</div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div className="text-orange-400 font-bold">{week.solvedCount} Soru Çözüldü</div>
                                {isAdmin && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteArchive(week.id); }} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Arşiv Detay Görünümü */}
                        {expandedArchive === week.id && week.assignments && (
                           <div className={`p-4 border-t ${colors.border} ${colors.isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
    {/* YENİ GRİD (IZGARA) GÖRÜNÜMÜ */}
    <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-7 md:overflow-visible">
        {DAYS.map(day => {
            // Arşivdeki o güne ait görevleri filtrele
            const dayTasks = week.assignments.filter(a => a.day === day.id);
            return (
                <div key={day.id} className={`min-w-[150px] md:min-w-0 ${colors.bgCardTransparent} border ${colors.border} rounded-xl flex flex-col h-full opacity-90`}>
                    {/* Gün Başlığı */}
                    <div className={`p-2 border-b ${colors.border} ${colors.bgCard} rounded-t-xl text-center`}>
                        <span className={`font-bold ${colors.text} text-xs`}>{day.label}</span>
                    </div>
                    {/* Görev Listesi */}
                    <div className="p-2 space-y-2 flex-1 min-h-[80px]">
                        {dayTasks.map(task => (
                            <div key={task.id} className={`p-2 rounded-lg border text-[10px] ${colors.shadow} ${task.status === 'completed' ? 'bg-emerald-900/10 border-emerald-500/30' : `${colors.bgCard} ${colors.border}`}`}>
                                <div className="font-bold text-orange-400 truncate">{task.subject}</div>
                                <div className={`${colors.text} line-clamp-2 mb-1`}>{task.topic}</div>
                                <div className={`flex justify-between items-center ${colors.textSec}`}>
                                    <span>{TASK_TYPES.find(t=>t.id === task.type)?.label}</span>
                                    {task.status === 'completed' ? <Check size={12} className="text-emerald-500"/> : <span className="text-red-400 text-[9px] font-bold">X</span>}
                                </div>
                                {task.count && task.type === 'soru' && <div className="text-orange-500 font-bold mt-1">{task.count} Soru</div>}
                            </div>
                        ))}
                        {dayTasks.length === 0 && <div className={`text-center py-4 ${colors.textSec} text-[10px]`}>-</div>}
                    </div>
                </div>
            )
        })}
    </div>
</div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
      )}
    </div>
  );
};

// 3. HEDEFLER
const GoalsModule = ({ student, onUpdateStudent, user }) => {
  const [showModal, setShowModal] = useState(false); const [editingId, setEditingId] = useState(null); const [form, setForm] = useState({ text: '', target: '', days: [] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const colors = useThemeColors();
  const goals = student.goals || [];
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isStudent = user.role === 'student';
  const handleDayToggle = (dayId) => { setForm(prev => { const days = prev.days.includes(dayId) ? prev.days.filter(d => d !== dayId) : [...prev.days, dayId]; return { ...prev, days }; }); };
  const handleSave = () => { if(!form.text || form.days.length === 0) return alert("Hedef adı ve en az bir gün seçiniz."); if(editingId) { const updated = goals.map(g => g.id === editingId ? { ...g, ...form } : g); onUpdateStudent({ ...student, goals: updated }); setEditingId(null); } else { const newGoal = { id: Date.now(), status: {}, ...form }; onUpdateStudent({ ...student, goals: [...goals, newGoal] }); } setShowModal(false); setForm({ text: '', target: '', days: [] }); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { onUpdateStudent({ ...student, goals: goals.filter(g => g.id !== deleteConfirm) }); setDeleteConfirm(null); } };
  const handleEdit = (goal) => { setForm({ text: goal.text, target: goal.target, days: goal.days }); setEditingId(goal.id); setShowModal(true); };
  const toggleGoalStatus = (goalId, dayId) => { const goal = goals.find(g => g.id === goalId); const key = `${goalId}-${dayId}`; const newStatus = { ...goal.status, [key]: !goal.status[key] }; onUpdateStudent({ ...student, goals: goals.map(g => g.id === goalId ? { ...g, status: newStatus } : g) }); };
  
  // YENİ ÖZELLİKLER: HAFTAYI SIFIRLA VE SİL
  const handleResetWeek = () => {
    if(!window.confirm("Bu haftaki tüm hedeflerin tamamlanma durumu sıfırlanacak. Onaylıyor musunuz?")) return;
    const resetGoals = goals.map(g => ({ ...g, status: {} })); // Status objesini temizle
    onUpdateStudent({ ...student, goals: resetGoals });
  };

  const handleDeleteWeek = () => {
    if(!window.confirm("DİKKAT: Bu haftanın TÜM hedefleri kalıcı olarak silinecek! Onaylıyor musunuz?")) return;
    onUpdateStudent({ ...student, goals: [] });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${colors.text}`}>Haftalık Hedef Takibi</h2>
          <div className="flex gap-2">
            {isAdmin && <Button variant="ghost" onClick={() => setIsEditMode(!isEditMode)} icon={Settings} className={isEditMode ? 'text-orange-500 bg-orange-500/10' : ''} />}
            {isAdmin && <Button icon={Plus} onClick={() => setShowModal(true)}>Yeni Hedef</Button>}
            {isAdmin && isEditMode && (
                <>
                    <Button size="small" variant="secondary" onClick={handleResetWeek} icon={RefreshCw}>Haftayı Sıfırla</Button>
                    <Button size="small" variant="danger" onClick={handleDeleteWeek} icon={Trash2}>Haftayı Sil</Button>
                </>
            )}
          </div>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-7 md:overflow-visible">
        {DAYS.map(day => {
          const dailyGoals = goals.filter(g => g.days.includes(day.id));
          return (
            <div key={day.id} className={`min-w-[200px] md:min-w-0 ${colors.bgCardTransparent} border ${colors.border} rounded-xl flex flex-col h-full snap-center`}>
              <div className={`p-3 border-b ${colors.border} ${colors.bgCard} rounded-t-xl text-center`}><span className={`font-bold ${colors.textSec} text-sm`}>{day.label}</span></div>
              <div className="p-2 space-y-2 flex-1">
                {dailyGoals.map(goal => {
                  const isCompleted = goal.status[`${goal.id}-${day.id}`];
                  return (
                    <div key={goal.id} className={`p-3 rounded-lg border text-xs relative group ${colors.shadow} ${isCompleted ? 'bg-emerald-900/20 border-emerald-900/50' : `${colors.bgCard} ${colors.border}`}`}>
                      <div className="font-bold text-orange-400 mb-1">{goal.text}</div>{goal.target && (<div className="text-xs text-emerald-500 mb-2 flex items-center gap-1.5 bg-emerald-500/10 py-1 px-2 rounded w-fit mt-1"><Target size={12}/> <span className="font-medium">{goal.target}</span></div>)}
                      
                      {/* EDIT MODE CONTROL */}
                      {(isAdmin && isEditMode) && (
                        <div className={`absolute top-2 right-2 flex gap-1 ${colors.isDark ? 'bg-slate-900/50' : 'bg-white/50'} rounded px-1`}>
                            <button onClick={() => handleEdit(goal)} className="text-slate-500 hover:text-blue-400 p-2"><Edit2 size={12}/></button>
                            <button onClick={(e) => requestDelete(e, goal.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={12}/></button>
                        </div>
                      )}

                      <button onClick={() => toggleGoalStatus(goal.id, day.id)} className={`w-full py-2 rounded flex items-center justify-center gap-1 ${isCompleted ? 'bg-emerald-600 text-white' : `${colors.isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}`}>{isCompleted ? <Check size={14}/> : 'Yapıldı'}</button>
                    </div>
                  );
                })}
                {dailyGoals.length === 0 && <div className={`text-center py-8 ${colors.textSec} text-xs`}>-</div>}
              </div>
            </div>
          );
        })}
      </div>
      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
      {showModal && (<Modal title={editingId ? "Hedefi Düzenle" : "Yeni Hedef Ekle"} onClose={() => {setShowModal(false); setEditingId(null); setForm({ text: '', target: '', days: [] });}}><div className="space-y-4"><Input label="Hedef Başlığı" placeholder="Örn: Kitap Okuma" value={form.text} onChange={e => setForm({...form, text: e.target.value})} /><Input label="Hedef / Miktar" placeholder="Örn: 20 Sayfa / 30 Dk" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /><div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>Günler</label><div className="flex flex-wrap gap-2">{DAYS.map(day => (<button key={day.id} onClick={() => handleDayToggle(day.id)} className={`px-3 py-2 rounded text-sm transition-colors ${form.days.includes(day.id) ? 'bg-orange-600 text-white' : `${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} ${colors.textSec} hover:opacity-80`}`}>{day.label}</button>))}</div></div><Button onClick={handleSave} className="w-full mt-4">Kaydet</Button></div></Modal>)}
    </div>
  );
};

// 4. KAYNAKLAR
const ResourceModule = ({ student, curriculum, onUpdateStudent, user }) => {
  const activeCurriculum = student.curriculum || curriculum;
  const [selectedCourseId, setSelectedCourseId] = useState(activeCurriculum[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false); const [showDetailModal, setShowDetailModal] = useState(null); const [newResource, setNewResource] = useState({ name: '', publisher: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const colors = useThemeColors();
   if (user.role === 'student') return <div className={`${colors.text} text-center mt-20`}>Bu alana erişim yetkiniz yok.</div>;
  const selectedCourse = activeCurriculum.find(c => c.id === selectedCourseId);
  const resources = student.resources ? student.resources.filter(r => r.courseId === selectedCourseId) : [];
  const handleAddResource = () => { if(!newResource.name) return; const res = { id: Date.now(), courseId: selectedCourseId, name: newResource.name, publisher: newResource.publisher, progress: 0, notes: '', completedTopics: [] }; onUpdateStudent({ ...student, resources: [...(student.resources || []), res] }); setShowAddModal(false); setNewResource({ name: '', publisher: '' }); };
  const updateResource = (updatedRes) => { const updatedList = student.resources.map(r => r.id === updatedRes.id ? updatedRes : r); onUpdateStudent({ ...student, resources: updatedList }); if(showDetailModal) setShowDetailModal(updatedRes); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const updatedList = student.resources.filter(r => r.id !== deleteConfirm); onUpdateStudent({ ...student, resources: updatedList }); setDeleteConfirm(null); } };
  const toggleTopicCompletion = (resource, uniqueTopicKey) => { const isCompleted = resource.completedTopics?.includes(uniqueTopicKey); let newCompleted = resource.completedTopics || []; if (isCompleted) newCompleted = newCompleted.filter(t => t !== uniqueTopicKey); else newCompleted = [...newCompleted, uniqueTopicKey]; let totalTopics = 0; selectedCourse.units.forEach(u => totalTopics += u.topics.length); const progress = totalTopics > 0 ? Math.round((newCompleted.length / totalTopics) * 100) : 0; updateResource({ ...resource, completedTopics: newCompleted, progress }); };
  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)] animate-fade-in">
      <div className="w-full md:w-1/4 flex flex-col gap-2 max-h-60 md:max-h-full overflow-y-auto pr-2 custom-scrollbar">{activeCurriculum.map(c => (<button key={c.id} onClick={() => setSelectedCourseId(c.id)} className={`p-4 rounded-lg text-left transition-all flex justify-between items-center ${selectedCourseId === c.id ? `bg-slate-800 border-orange-500 text-white border` : `${colors.bgCard} ${colors.border} ${colors.textSec}`}`}><span>{c.name}</span><span className={`text-xs ${colors.isDark ? 'bg-slate-700' : 'bg-slate-200'} px-2 py-1 rounded ${colors.textSec}`}>{student.resources?.filter(r => r.courseId === c.id).length || 0}</span></button>))}</div>
      <div className={`flex-1 ${colors.bgCardTransparent} border ${colors.border} rounded-xl p-6 overflow-y-auto custom-scrollbar`}><div className={`flex justify-between items-center mb-6 pb-4 border-b ${colors.border}`}><h2 className={`text-xl font-bold ${colors.text}`}>{selectedCourse?.name} Kaynakları</h2><Button size="small" icon={Plus} onClick={() => setShowAddModal(true)}>Kaynak Ekle</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{resources.map(res => (<div key={res.id} className={`${colors.bgCard} border ${colors.border} rounded-xl p-5 hover:border-slate-500 transition-colors ${colors.shadow}`}><div className="flex justify-between items-start mb-2"><div><h3 className={`font-bold ${colors.text} text-lg`}>{res.name}</h3><div className={`text-sm ${colors.textSec}`}>{res.publisher}</div></div><button onClick={(e) => requestDelete(e, res.id)} className="text-slate-600 hover:text-red-500 group p-2"><Trash2 size={16} className="group-hover:text-red-500"/></button></div><div className="mt-4"><div className={`flex justify-between text-xs ${colors.textSec} mb-1`}><span>İlerleme</span><span>%{res.progress}</span></div><div className={`w-full ${colors.isDark ? 'bg-slate-800' : 'bg-slate-200'} h-2 rounded-full overflow-hidden`}><div className="bg-emerald-500 h-full transition-all duration-500" style={{width: `${res.progress}%`}}></div></div></div><div className={`mt-4 pt-4 border-t ${colors.border} flex justify-between items-center`}><div className={`text-xs ${colors.textSec} flex items-center gap-1`}><Check size={12} className="text-emerald-500"/>{res.completedTopics?.length || 0} Konu Bitti</div><Button size="small" variant="secondary" onClick={() => setShowDetailModal(res)}>Detay & Düzenle</Button></div></div>))}{resources.length === 0 && <div className={`col-span-2 text-center py-10 ${colors.textSec}`}>Bu ders için eklenmiş kaynak yok.</div>}</div></div>
      {showAddModal && (<Modal title="Yeni Kaynak Ekle" onClose={() => setShowAddModal(false)}><div className="space-y-4"><Input label="Kaynak Adı" placeholder="Örn: 3D TYT Matematik Soru Bankası" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} /><Input label="Yayıncı" placeholder="Örn: 3D Yayınları" value={newResource.publisher} onChange={e => setNewResource({...newResource, publisher: e.target.value})} /><Button onClick={handleAddResource} className="w-full mt-4">Ekle</Button></div></Modal>)}
      {showDetailModal && (<Modal title={showDetailModal.name} onClose={() => setShowDetailModal(null)}><div className="space-y-6"><div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>İlerleme Durumu (%)</label><div className="flex gap-4 items-center"><input type="range" min="0" max="100" className="w-full accent-orange-500" value={showDetailModal.progress} onChange={e => updateResource({...showDetailModal, progress: parseInt(e.target.value)})} /><span className={`font-bold ${colors.text} w-10 text-right`}>%{showDetailModal.progress}</span></div></div><div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>Notlar</label><textarea className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded p-3 ${colors.text} text-sm h-24`} value={showDetailModal.notes} onChange={e => updateResource({...showDetailModal, notes: e.target.value})} placeholder="Bu kaynakla ilgili notlar..." /></div><div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>Konu Takibi (Bu Kitap İçin)</label><div className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg p-2 max-h-60 overflow-y-auto custom-scrollbar space-y-4`}>{selectedCourse.units.map(unit => (<div key={unit.id}><div className="text-orange-500 text-xs font-bold px-2 mb-1">{unit.name}</div>{unit.topics.map((topic, idx) => { const key = `${unit.id}-${idx}`; const isChecked = showDetailModal.completedTopics?.includes(key); return (<div key={key} onClick={() => toggleTopicCompletion(showDetailModal, key)} className={`flex items-center gap-3 p-2 ${colors.hoverBg} rounded cursor-pointer`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>{isChecked && <Check size={10} className="text-white"/>}</div><span className={`text-sm ${isChecked ? colors.text : colors.textSec}`}>{topic}</span></div>) })}</div>))}</div></div></div></Modal>)}
      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 5. GELİŞMİŞ DENEME TAKİBİ
const ExamModule = ({ student, onUpdateStudent, user }) => {
  const [view, setView] = useState('list');
  const [filterType, setFilterType] = useState('ALL'); 
  const [branchFilter, setBranchFilter] = useState('mat');
  const [examType, setExamType] = useState('TYT');
  // Düzenleme durumu için ID takibi
  const [editingId, setEditingId] = useState(null);
  const [showRankModal, setShowRankModal] = useState(null); // Sıralama modalı için

  const [formData, setFormData] = useState({ name: "", date: new Date().toISOString().split('T')[0], difficulty: "Orta", stats: { turkey: { rank: '', total: '' }, city: { rank: '', total: '' }, school: { rank: '', total: '' } }, details: {}, branchSubject: 'mat', duration: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [analysisTab, setAnalysisTab] = useState('TYT');
  const colors = useThemeColors();
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isStudent = user.role === 'student';

  useEffect(() => { 
      // Eğer düzenleme modunda değilsek formu temizle/hazırla
      if(!editingId) {
        if (view === 'add' && examType !== 'BRANS') { 
            const initialDetails = {}; 
            EXAM_TYPES[examType].groups.forEach(group => { group.sections.forEach(sec => { initialDetails[sec.key] = { d: '', y: '' }; }); }); 
            setFormData(prev => ({ ...prev, details: initialDetails })); 
        } else if (view === 'add' && examType === 'BRANS') { 
            setFormData(prev => ({ ...prev, details: { [prev.branchSubject]: { d: '', y: '' } } })); 
        } 
      }
  }, [examType, view, formData.branchSubject, editingId]);

  const getNetFormula = (d, y) => { 
      const dVal = parseFloat(d) || 0; 
      const yVal = parseFloat(y) || 0;
      const divisor = examType === 'LGS' ? 3 : 4; 
      return Math.max(0, dVal - yVal / divisor);
  }

  const handleEdit = (exam) => {
      // Düzenleme modunu aç
      setEditingId(exam.id);
      setExamType(exam.type === 'BRANS' ? 'BRANS' : exam.type);
      if(exam.type === 'BRANS') setBranchFilter(exam.subject);
      
      setFormData({
          name: exam.name,
          date: exam.date,
          difficulty: exam.difficulty || "Orta",
          stats: exam.stats || { turkey: { rank: '', total: '' }, city: { rank: '', total: '' }, school: { rank: '', total: '' } },
          details: exam.details || {},
          branchSubject: exam.subject || 'mat',
          duration: exam.duration || ''
      });
      setView('add');
  };

  const handleSave = () => { 
      if(!formData.name) return alert("Lütfen deneme adını giriniz."); 
      let totalNet = 0;
      const processedDetails = {}; 
      Object.keys(formData.details).forEach(key => { 
          const { d, y } = formData.details[key]; 
          const net = getNetFormula(d, y); 
          processedDetails[key] = { d, y, n: net }; 
          totalNet += net; 
      });

      if (editingId) {
          // GÜNCELLEME İŞLEMİ
          const updatedExams = student.exams.map(e => e.id === editingId ? { 
              ...e, 
              type: examType, 
              subject: examType === 'BRANS' ? formData.branchSubject : null, 
              ...formData, 
              totalNet, 
              details: processedDetails 
          } : e);
          onUpdateStudent({ ...student, exams: updatedExams });
          setEditingId(null);
      } else {
          // YENİ EKLEME İŞLEMİ
          const newExam = { 
              id: Date.now(), 
              type: examType, 
              subject: examType === 'BRANS' ? formData.branchSubject : null, 
              ...formData, 
              totalNet, 
              details: processedDetails 
          }; 
          onUpdateStudent({ ...student, exams: [newExam, ...student.exams] }); 
      }
      
      setView('list');
      setFormData({ name: "", date: new Date().toISOString().split('T')[0], difficulty: "Orta", stats: { turkey: { rank: '', total: '' }, city: { rank: '', total: '' }, school: { rank: '', total: '' } }, details: {}, branchSubject: 'mat', duration: '' });
  };

  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = student.exams.filter(e => e.id !== deleteConfirm); onUpdateStudent({ ...student, exams: filtered }); setDeleteConfirm(null); } };
  
  const updateDetail = (key, field, value) => setFormData(prev => ({ ...prev, details: { ...prev.details, [key]: { ...prev.details[key], [field]: value } } }));
  const updateStat = (scope, field, value) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, [scope]: { ...prev.stats[scope], [field]: value } } }));

  let filteredExams = student.exams || []; 
  if (filterType !== 'ALL') { 
      filteredExams = filteredExams.filter(e => e.type === filterType);
      if (filterType === 'BRANS') filteredExams = filteredExams.filter(e => e.subject === branchFilter);
  } else { filteredExams = filteredExams.filter(e => e.type !== 'BRANS'); }
  
  const analysisExams = student.exams.filter(e => e.type === analysisTab).reverse();
  const getSubjectHistory = (subjectKey) => { return analysisExams.map(e => ({ date: e.date, net: e.details[subjectKey]?.n || 0 })); }

  // ... getBestScores fonksiyonu ...
  const getBestScores = () => { 
    if(filterType === 'ALL' || filterType === 'BRANS') return null;
    const relevantExams = student.exams.filter(e => e.type === filterType); 
    if(relevantExams.length === 0) return null; 
    const subjectKeys = [];
    EXAM_TYPES[filterType].groups.forEach(g => g.sections.forEach(s => subjectKeys.push(s))); 
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className={`${colors.bgCard} p-4 rounded-xl border ${colors.border} text-center ${colors.shadow}`}>
          <div className={`text-[10px] ${colors.textSec} uppercase font-bold mb-1`}>Toplam Deneme</div>
          <div className={`text-xl font-bold ${colors.text}`}>{relevantExams.length}</div>
        </div>
        <div className={`${colors.bgCard} p-4 rounded-xl border ${colors.border} text-center ${colors.shadow}`}>
          <div className={`text-[10px] ${colors.textSec} uppercase font-bold mb-1`}>En Yüksek Net</div>
          <div className="text-xl font-bold text-orange-500">{Math.max(...relevantExams.map(e => e.totalNet)).toFixed(2)}</div>
        </div>
        {subjectKeys.map(sub => (
          <div key={sub.key} className={`${colors.bgCard} p-4 rounded-xl border ${colors.border} text-center ${colors.shadow}`}>
            <div className={`text-[10px] ${colors.textSec} uppercase font-bold mb-1 max-w-full truncate`} title={`En İyi ${sub.label}`}>{sub.label}</div>
            <div className="text-xl font-bold text-emerald-400">{Math.max(...relevantExams.map(e => e.details[sub.key]?.n || 0)).toFixed(1)}</div>
          </div>
        ))}
      </div>
    );
  }

  const getTableHeaders = () => { 
      if(filterType === 'ALL') return ['Tarih', 'Sınav Adı', 'Tür', 'Net', 'İşlem'];
      if(filterType === 'BRANS') return ['Tarih', 'Sınav Adı', 'Ders', 'Süre', 'Net', 'İşlem']; 
      const subjects = []; 
      EXAM_TYPES[filterType].groups.forEach(g => g.sections.forEach(s => subjects.push(s.label)));
      return ['Tarih', 'Sınav Adı', ...subjects, 'Toplam', 'İşlem']; 
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center ${colors.bgCardTransparent} p-4 rounded-xl border ${colors.border} gap-4`}>
          <div className={`flex flex-wrap gap-2 ${colors.isDark ? 'bg-slate-800' : 'bg-slate-200'} p-1 rounded-lg`}>
              {['ALL', 'TYT', 'AYT', 'LGS', 'BRANS'].map(type => (<button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filterType === type ? 'bg-orange-600 text-white shadow' : `${colors.textSec} hover:${colors.text}`}`}>{type === 'ALL' ? 'Genel' : type === 'BRANS' ? 'Branş' : type}</button>))}
          </div>
          {filterType === 'BRANS' && (<select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className={`${colors.inputBg} border ${colors.inputBorder} ${colors.text} text-sm rounded-lg p-2.5 outline-none focus:border-orange-500`}>{BRANCH_SUBJECTS.map(sub => <option key={sub.id} value={sub.id}>{sub.label}</option>)}</select>)}
          <div className="flex gap-2 ml-auto">
              <Button size="small" variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => { setView('list'); setEditingId(null); }}>Liste</Button>
              {isAdmin && <Button size="small" variant={view === 'add' ? 'primary' : 'ghost'} icon={Plus} onClick={() => { setView('add'); setEditingId(null); setFormData({ name: "", date: new Date().toISOString().split('T')[0], difficulty: "Orta", stats: { turkey: { rank: '', total: '' }, city: { rank: '', total: '' }, school: { rank: '', total: '' } }, details: {}, branchSubject: 'mat', duration: '' }); }}>Ekle</Button>}
          </div>
      </div>

      {view === 'list' && (<>
        <Card title="Genel Net İlerleme Analizi">
            <div className="flex gap-2 mb-4">
                {['TYT', 'AYT', 'LGS'].map(tab => (
                    <button key={tab} onClick={() => setAnalysisTab(tab)} className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${analysisTab === tab ? 'bg-orange-500 text-white border-orange-500' : `${colors.bgCard} ${colors.border} ${colors.textSec}`}`}>{tab}</button>
                ))}
            </div>
            <div className="h-64 mb-6">
                <LineChart data={analysisExams} dataKey="totalNet" labelKey="date" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EXAM_TYPES[analysisTab]?.groups.flatMap(g => g.sections).map(section => {
                    const history = getSubjectHistory(section.key);
                    return (
                        <div key={section.key} className={`${colors.bgCardTransparent} p-4 rounded-lg border ${colors.border}`}>
                            <div className={`text-xs font-bold ${colors.textSec} mb-2`}>{section.label} Net Gelişimi</div>
                            <div className="h-24">
                                <LineChart data={history} dataKey="net" labelKey="date" height={100} showDots={true} strokeWidth={2} color="#3b82f6" maxValue={section.q} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
        {getBestScores()}
        <Card title="Detaylı Sınav Arşivi">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className={`${colors.tableHeader} text-xs uppercase font-bold`}><tr>{getTableHeaders().map((h, i) => <th key={i} className="p-4 text-center">{h}</th>)}</tr></thead>
                    <tbody className={`divide-y ${colors.divider} ${colors.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {filteredExams
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(exam => (
                        <tr key={exam.id} className={`${colors.hoverBg} group transition-colors`}>
                            <td className={`p-4 ${colors.textSec} text-center`}>{formatDate(exam.date)}</td>
                            <td className={`p-4 font-medium ${colors.text} text-center`}>{exam.name}</td>
                            {(filterType === 'ALL' || filterType === 'BRANS') ? (<><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${exam.type === 'BRANS' ? 'bg-emerald-500/10 text-emerald-400' : `${colors.isDark ? 'bg-slate-800' : 'bg-slate-100'} ${colors.textSec}`}`}>{exam.type === 'BRANS' ? BRANCH_SUBJECTS.find(s=>s.id === exam.subject)?.label : exam.type}</span></td>{filterType === 'BRANS' && <td className="p-4 text-center text-xs">{exam.duration ? exam.duration + ' dk' : '-'}</td>}</>) : (EXAM_TYPES[filterType].groups.flatMap(g => g.sections).map(sec => (<td key={sec.key} className="p-4 text-center">{exam.details[sec.key]?.n.toFixed(1) || '-'}</td>)))}
                            <td className="p-4 text-center font-bold text-orange-500 text-lg">{exam.totalNet.toFixed(2)}</td>
                            <td className="p-4 text-center flex items-center justify-center gap-1">
                                {/* SIRALAMA GÖSTERME BUTONU */}
                                {(exam.stats?.turkey?.rank || exam.stats?.city?.rank || exam.stats?.school?.rank) && (
                                    <button onClick={() => setShowRankModal(exam)} className="p-2 hover:bg-blue-500/20 text-slate-500 hover:text-blue-500 rounded transition-colors group" title="Sıralamayı Gör">
                                        <Activity size={16} />
                                    </button>
                                )}
                                {/* DÜZENLEME BUTONU (YENİ) */}
                                {!isStudent && (
                                    <button onClick={() => handleEdit(exam)} className="p-2 hover:bg-orange-500/20 text-slate-500 hover:text-orange-500 rounded transition-colors group">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                {!isStudent && <button onClick={(e) => requestDelete(e, exam.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded transition-colors group"><Trash2 size={16} /></button>}
                            </td>
                        </tr>
                    ))}
                    {filteredExams.length === 0 && <tr><td colSpan="100%" className={`p-8 text-center ${colors.textSec}`}>Kayıt yok.</td></tr>}
                    </tbody>
                </table>
            </div>
        </Card>
      </>)}

      {view === 'add' && (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <Card title={editingId ? 'Deneme Düzenle' : (examType === 'BRANS' ? 'Yeni Branş Denemesi' : 'Yeni Genel Deneme')}>
                <div className="mb-8">
                    <label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase tracking-wider`}>Sınav Türü</label>
                    <div className="flex flex-wrap gap-4">{[...Object.keys(EXAM_TYPES), 'BRANS'].map(type => (<button key={type} onClick={() => setExamType(type)} className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all font-bold text-lg ${examType === type ? 'border-orange-500 bg-orange-500/10 text-orange-500' : `${colors.border} ${colors.inputBg} ${colors.textSec} hover:border-slate-500`}`}>{type === 'BRANS' ? 'Branş' : EXAM_TYPES[type].label}</button>))}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {examType === 'BRANS' && (<div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase tracking-wider`}>Branş Seçimi</label><select className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg px-4 py-3 ${colors.text} text-sm focus:border-orange-500 outline-none`} value={formData.branchSubject} onChange={e => setFormData({...formData, branchSubject: e.target.value})}>{BRANCH_SUBJECTS.map(sub => <option key={sub.id} value={sub.id}>{sub.label}</option>)}</select></div>)}
                    <Input label="Deneme Adı *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn: 3D Matematik Branş-1" />
                    <Input label="Tarih *" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    {examType !== 'BRANS' && (<div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase tracking-wider`}>Zorluk</label><select className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg px-4 py-3 ${colors.text} text-sm focus:border-orange-500 outline-none`} value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}><option>Kolay</option><option>Orta</option><option>Zor</option><option>Çok Zor</option></select></div>)}
                    {examType === 'BRANS' && <Input label="Süre (dk) - İsteğe Bağlı" type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="Örn: 45" />}
                </div>
                <div className="space-y-6 mb-8">
                    <h4 className={`text-orange-500 font-bold mb-4 border-b ${colors.border} pb-2 uppercase text-sm tracking-wider`}>Sonuç Girişi</h4>
                    {examType === 'BRANS' ? (
                        <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-6 max-w-md ${colors.shadow}`}>
                            <div className="flex items-center justify-between">
                                <span className={`font-bold ${colors.text} text-lg`}>{BRANCH_SUBJECTS.find(s=>s.id === formData.branchSubject)?.label}</span>
                                <div className="flex gap-4">
                                    <div><label className="text-xs text-emerald-500 font-bold block mb-1">Doğru</label><input type="number" className={`w-20 ${colors.inputBg} border ${colors.inputBorder} rounded p-3 ${colors.text} text-center font-bold text-lg focus:border-emerald-500 outline-none`} value={formData.details[formData.branchSubject]?.d || ''} onChange={e => updateDetail(formData.branchSubject, 'd', e.target.value)} /></div>
                                    <div><label className="text-xs text-red-500 font-bold block mb-1">Yanlış</label><input type="number" className={`w-20 ${colors.inputBg} border ${colors.inputBorder} rounded p-3 ${colors.text} text-center font-bold text-lg focus:border-red-500 outline-none`} value={formData.details[formData.branchSubject]?.y || ''} onChange={e => updateDetail(formData.branchSubject, 'y', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{EXAM_TYPES[examType].groups.map((group, idx) => (<div key={idx} className={`${colors.bgCard} border ${colors.border} rounded-xl p-5 ${colors.shadow}`}><h5 className={`${colors.text} font-bold mb-4 flex items-center gap-2`}><div className="w-2 h-2 rounded-full bg-orange-500"></div>{group.title}</h5><div className="space-y-3">{group.sections.map(sec => (<div key={sec.key} className={`flex items-center justify-between ${colors.isDark ? 'bg-slate-800/50' : 'bg-slate-50'} p-3 rounded-lg border ${colors.border}`}><div><span className={`block text-sm font-medium ${colors.textSec}`}>{sec.label}</span><span className={`text-[10px] ${colors.textSec}`}>{sec.q} Soru</span></div><div className="flex gap-2"><input type="number" placeholder="D" className={`w-14 ${colors.inputBg} border ${colors.inputBorder} rounded p-2 ${colors.text} text-center text-sm focus:border-orange-500 outline-none`} value={formData.details[sec.key]?.d || ''} onChange={e => updateDetail(sec.key, 'd', e.target.value)} /><input type="number" placeholder="Y" className={`w-14 ${colors.inputBg} border ${colors.inputBorder} rounded p-2 ${colors.text} text-center text-sm focus:border-red-500 outline-none`} value={formData.details[sec.key]?.y || ''} onChange={e => updateDetail(sec.key, 'y', e.target.value)} /></div></div>))}</div></div>))}</div>
                    )}
                </div>
                {examType !== 'BRANS' && (
                    <div className={`mb-8 ${colors.bgCardTransparent} rounded-xl border ${colors.border} p-4`}>
                        <h4 className={`${colors.textSec} text-sm font-bold mb-4 flex items-center gap-2`}><Activity size={16} /> Sıralama Bilgileri (İsteğe Bağlı)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{['turkey', 'city', 'school'].map(scope => (<div key={scope} className={`${colors.bgCard} p-4 rounded-lg border ${colors.border} ${colors.shadow}`}><label className={`block text-xs font-bold ${colors.textSec} mb-2 uppercase`}>{scope === 'turkey' ? 'Türkiye' : scope === 'city' ? 'İl Geneli' : 'Kurum'}</label><div className="flex gap-2"><input placeholder="Sıralama" type="number" className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded p-2 text-sm ${colors.text}`} value={formData.stats[scope].rank} onChange={e => updateStat(scope, 'rank', e.target.value)} /><input placeholder="Katılım" type="number" className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded p-2 text-sm ${colors.text}`} value={formData.stats[scope].total} onChange={e => updateStat(scope, 'total', e.target.value)} /></div></div>))}</div>
                    </div>
                )}
                <div className={`flex justify-end gap-4 border-t ${colors.border} pt-6`}>
                    <Button variant="secondary" onClick={() => { setView('list'); setEditingId(null); }}>İptal</Button>
                    <Button onClick={handleSave} size="large" icon={Save}>{editingId ? 'Güncelle' : 'Kaydet'}</Button>
                </div>
            </Card>
        </div>
      )}

      {/* SIRALAMA GÖSTERİM MODALI */}
      {showRankModal && (
        <Modal title={`${showRankModal.name} - Sıralama Sonuçları`} onClose={() => setShowRankModal(null)}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className={`${colors.bgCardTransparent} p-4 rounded border ${colors.border}`}>
                        <div className="text-sm font-bold text-orange-500 mb-1">Türkiye Geneli</div>
                        <div className={`text-xl font-bold ${colors.text}`}>
                            {showRankModal.stats?.turkey?.rank ? showRankModal.stats.turkey.rank : '-'} 
                            <span className="text-sm font-normal text-slate-500"> / {showRankModal.stats?.turkey?.total || '-'}</span>
                        </div>
                    </div>
                    <div className={`${colors.bgCardTransparent} p-4 rounded border ${colors.border}`}>
                        <div className="text-sm font-bold text-blue-500 mb-1">İl Geneli</div>
                        <div className={`text-xl font-bold ${colors.text}`}>
                            {showRankModal.stats?.city?.rank ? showRankModal.stats.city.rank : '-'} 
                            <span className="text-sm font-normal text-slate-500"> / {showRankModal.stats?.city?.total || '-'}</span>
                        </div>
                    </div>
                    <div className={`${colors.bgCardTransparent} p-4 rounded border ${colors.border}`}>
                        <div className="text-sm font-bold text-emerald-500 mb-1">Kurum/Okul Geneli</div>
                        <div className={`text-xl font-bold ${colors.text}`}>
                            {showRankModal.stats?.school?.rank ? showRankModal.stats.school.rank : '-'} 
                            <span className="text-sm font-normal text-slate-500"> / {showRankModal.stats?.school?.total || '-'}</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-center text-slate-500 mt-2">Bu veriler öğrenci tarafından manuel olarak girilmiştir.</div>
            </div>
        </Modal>
      )}

      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 6. DUYGUDURUM TAKİBİ
const MoodModule = ({ student, onUpdateStudent, user }) => {
  const METRICS_CONFIG = [{ key: 'motivation', label: 'Motivasyon', color: '#3b82f6' }, { key: 'happiness', label: 'Mutluluk', color: '#10b981' }, { key: 'social', label: 'Sosyalleşme', color: '#f59e0b' }, { key: 'examAnxiety', label: 'Sınav Kaygısı', color: '#ef4444' }, { key: 'lessonAnxiety', label: 'Ders Kaygısı', color: '#8b5cf6' }, { key: 'performance', label: 'Performans', color: '#ec4899' }, { key: 'homeworkRate', label: 'Ödev Tamamlama', color: '#06b6d4' }];
  const [editingId, setEditingId] = useState(null); const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], metrics: { motivation: 50, happiness: 50, social: 50, examAnxiety: 50, lessonAnxiety: 50, performance: 50, homeworkRate: 50 } });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const colors = useThemeColors();
if (user.role === 'student') return <div className={`${colors.text} text-center mt-20`}>Bu alana erişim yetkiniz yok.</div>;
  const handleSave = () => { let newMoods = [...student.moods]; if (editingId) { newMoods = newMoods.map(m => m.id === editingId ? { ...m, date: formData.date, metrics: formData.metrics } : m); } else { newMoods.push({ id: Date.now(), date: formData.date, metrics: formData.metrics }); } onUpdateStudent({ ...student, moods: newMoods }); setEditingId(null); setFormData({ ...formData, date: new Date().toISOString().split('T')[0] }); };
  const handleEdit = (mood) => { setEditingId(mood.id); setFormData({ date: mood.date, metrics: { ...mood.metrics } }); window.scrollTo(0,0); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = student.moods.filter(m => m.id !== deleteConfirm); onUpdateStudent({ ...student, moods: filtered }); setDeleteConfirm(null); } };
  const sortedMoods = [...student.moods].sort((a,b) => new Date(a.date) - new Date(b.date)); 
  
  // LOGIC UPDATE: Composite score calculation excluding Stress Factors
  const flatData = sortedMoods.map(m => {
    // Exclude examAnxiety and lessonAnxiety from the average calculation
    const { examAnxiety, lessonAnxiety, ...positiveMetrics } = m.metrics;
    const values = Object.values(positiveMetrics);
    
    // Calculate average only from positive/neutral indicators
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    return { date: m.date.substring(5), ...m.metrics, average: average };
  });

  return (
    <div className="space-y-8 animate-fade-in"><Card title={editingId ? "Duygudurum Düzenle" : "Yeni Duygudurum Girişi"} action={<div className="flex gap-4 items-center"><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`${colors.inputBg} border ${colors.inputBorder} ${colors.text} p-2 rounded text-sm`}/><Button onClick={handleSave}>{editingId ? 'Güncelle' : 'Kaydet'}</Button></div>}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{METRICS_CONFIG.map(m => (<div key={m.key} className={`${colors.bgCardTransparent} p-4 rounded-lg border ${colors.border}`}><label className={`block text-sm ${colors.textSec} mb-2 font-medium`}>{m.label}</label><div className="flex items-center gap-3"><input type="range" min="0" max="100" value={formData.metrics[m.key]} onChange={e => setFormData({...formData, metrics: {...formData.metrics, [m.key]: parseInt(e.target.value)}})} className={`w-full accent-orange-500 h-2 ${colors.isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg appearance-none cursor-pointer`}/><span className={`${colors.text} font-bold w-10 text-right`}>{formData.metrics[m.key]}%</span></div></div>))}</div></Card><Card title="Kompozit Analiz (Stres Faktörleri Hariç)"><div className="h-64"><LineChart data={flatData} dataKey="average" labelKey="date" color="#3b82f6" /></div></Card><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{METRICS_CONFIG.map(metric => (<Card key={metric.key} title={metric.label} className="!p-4"><div className="h-40"><LineChart data={flatData} dataKey={metric.key} labelKey="date" color={metric.color} height={160} /></div></Card>))}</div><Card title="Geçmiş Kayıtlar"><div className="overflow-x-auto"><table className={`w-full text-left text-sm ${colors.textSec}`}><thead className={colors.tableHeader}><tr><th className="p-4">Tarih</th>{METRICS_CONFIG.map(m => <th key={m.key} className="p-4">{m.label}</th>)}<th className="p-4">İşlem</th></tr></thead><tbody className={colors.divider}>
  {student.moods
    .sort((a,b)=> new Date(b.date)-new Date(a.date))
    .map(mood => (
      <tr key={mood.id} className={`border-b ${colors.border}`}>
        {/* TARİH FORMATI DÜZELTİLDİ */}
        <td className="p-4">{formatDate(mood.date)}</td>
        {METRICS_CONFIG.map(m => <td key={m.key} className="p-4 text-center">{mood.metrics[m.key]}</td>)}
        <td className="p-4 flex gap-2">
          <button onClick={() => handleEdit(mood)}><Edit2 size="14" className="text-blue-400"/></button>
          <button onClick={(e) => requestDelete(e, mood.id)} className="hover:text-red-500"><Trash2 size="14" className="text-red-400"/></button>
        </td>
      </tr>
    ))}
</tbody></table></div></Card>
    <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 7. GÖRÜŞMELER & NOTLAR
const InterviewModule = ({ student, onUpdateStudent, user }) => {
  const [showModal, setShowModal] = useState(false);
  const [newInterview, setNewInterview] = useState({ date: new Date().toISOString().split('T')[0], title: "", note: "" });
  const [editingInterviewId, setEditingInterviewId] = useState(null); // Düzenlenen Görüşme ID

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ note: "" });
  const [editingNoteId, setEditingNoteId] = useState(null); // Düzenlenen Not ID

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const colors = useThemeColors();

  // --- GÖRÜŞME İŞLEMLERİ ---
  const handleAddInterview = () => { 
      if(!newInterview.note) return; 
      
      if (editingInterviewId) {
          // GÜNCELLEME
          const updatedInterviews = student.interviews.map(i => i.id === editingInterviewId ? { ...i, ...newInterview } : i);
          onUpdateStudent({ ...student, interviews: updatedInterviews });
          setEditingInterviewId(null);
      } else {
          // EKLEME
          const interview = { id: Date.now(), ...newInterview }; 
          onUpdateStudent({ ...student, interviews: [interview, ...student.interviews] }); 
      }
      setShowModal(false); 
      setNewInterview({ date: new Date().toISOString().split('T')[0], title: "", note: "" }); 
  };

  const handleEditInterview = (interview) => {
      setNewInterview({ date: interview.date, title: interview.title, note: interview.note });
      setEditingInterviewId(interview.id);
      setShowModal(true);
  };

  const deleteInterview = (id) => { const filtered = student.interviews.filter(i => i.id !== id); onUpdateStudent({ ...student, interviews: filtered }); };

  // --- NOT İŞLEMLERİ ---
  const handleAddNote = () => { 
      if(!newNote.note) return; 
      
      if (editingNoteId) {
          // GÜNCELLEME
          const updatedNotes = (student.teacherNotes || []).map(n => n.id === editingNoteId ? { ...n, text: newNote.note } : n);
          onUpdateStudent({ ...student, teacherNotes: updatedNotes });
          setEditingNoteId(null);
      } else {
          // EKLEME
          const noteEntry = { id: Date.now(), date: new Date().toLocaleDateString('tr-TR'), text: newNote.note }; 
          const updatedNotes = [noteEntry, ...(student.teacherNotes || [])]; 
          onUpdateStudent({ ...student, teacherNotes: updatedNotes }); 
      }
      setShowNoteModal(false); 
      setNewNote({ note: "" }); 
  };

  const handleEditNote = (note) => {
      setNewNote({ note: note.text });
      setEditingNoteId(note.id);
      setShowNoteModal(true);
  };

  const deleteNote = (id) => { const filtered = (student.teacherNotes || []).filter(n => n.id !== id); onUpdateStudent({ ...student, teacherNotes: filtered }); };
  
  const requestDelete = (e, type, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({ type, id }); };
  const confirmDelete = () => { if (deleteConfirm) { if(deleteConfirm.type === 'interview') deleteInterview(deleteConfirm.id); if(deleteConfirm.type === 'note') deleteNote(deleteConfirm.id); setDeleteConfirm(null); } };

  if (user.role === 'student') return <div className={`${colors.text} text-center mt-20`}>Bu alana erişim yetkiniz yok.</div>;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Görüşmeler Kısmı */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold ${colors.text}`}>Görüşme Kayıtları</h2>
            <Button onClick={() => { setEditingInterviewId(null); setNewInterview({ date: new Date().toISOString().split('T')[0], title: "", note: "" }); setShowModal(true); }} icon={Plus}>Yeni Görüşme</Button>
        </div>
        <div className="grid gap-4">
            {student.interviews
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(interview => (
                <div key={interview.id} className={`${colors.bgCard} border ${colors.border} rounded-xl p-6 relative group ${colors.shadow}`}>
                    <div className="flex justify-between mb-2">
                        <h3 className={`font-bold ${colors.text}`}>{interview.title}</h3>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs ${colors.textSec}`}>{formatDate(interview.date)}</span>
                            {/* DÜZENLEME BUTONU */}
                            <button onClick={() => handleEditInterview(interview)} className="text-slate-600 hover:text-blue-500 p-2"><Edit2 size={16}/></button>
                            <button onClick={(e) => requestDelete(e, 'interview', interview.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <p className={`${colors.textSec} text-sm whitespace-pre-wrap`}>{interview.note}</p>
                </div>
            ))}
            {student.interviews.length === 0 && <div className={`text-center ${colors.textSec} py-4 text-sm`}>Henüz görüşme kaydı yok.</div>}
        </div>
      </div>

      <div className={`border-t ${colors.border} my-6`}></div>

      {/* Öğrenci Notları Kısmı */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold ${colors.text} flex items-center gap-2`}><MessageSquare className="text-orange-500"/> Öğrenciye Notlar</h2>
            <Button onClick={() => { setEditingNoteId(null); setNewNote({ note: "" }); setShowNoteModal(true); }} variant="secondary" icon={Edit2}>Not Ekle</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(student.teacherNotes || [])
                .sort((a, b) => {
                    const dateA = a.date.includes('.') ? new Date(a.date.split('.').reverse().join('-')) : new Date(a.date);
                    const dateB = b.date.includes('.') ? new Date(b.date.split('.').reverse().join('-')) : new Date(b.date);
                    return dateB - dateA;
                })
                .map(note => (
                <div key={note.id} className={`${colors.bgCardTransparent} border ${colors.border} rounded-lg p-4 relative`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-orange-400 font-bold">{note.date}</div>
                        <div className="flex gap-1">
                             {/* DÜZENLEME BUTONU */}
                            <button onClick={() => handleEditNote(note)} className="text-slate-600 hover:text-blue-500 p-1"><Edit2 size={14}/></button>
                            <button onClick={(e) => requestDelete(e, 'note', note.id)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    <p className={`${colors.textSec} text-sm italic whitespace-pre-wrap`}>"{note.text}"</p>
                </div>
            ))}
            {(!student.teacherNotes || student.teacherNotes.length === 0) && <div className={`col-span-full text-center ${colors.textSec} py-4 text-sm`}>Öğrenci paneline düşecek bir not eklemediniz.</div>}
        </div>
      </div>

      {showModal && (
        <Modal title={editingInterviewId ? "Görüşme Düzenle" : "Yeni Görüşme"} onClose={() => setShowModal(false)}>
            <div className="space-y-4">
                <Input label="Tarih" type="date" value={newInterview.date} onChange={e => setNewInterview({...newInterview, date: e.target.value})} />
                <Input label="Başlık" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} />
                <textarea className={`w-full ${colors.inputBg} border ${colors.inputBorder} p-3 rounded ${colors.text} h-32 focus:border-orange-500 outline-none`} value={newInterview.note} onChange={e => setNewInterview({...newInterview, note: e.target.value})} placeholder="Görüşme notları..." />
                <Button onClick={handleAddInterview}>{editingInterviewId ? "Güncelle" : "Kaydet"}</Button>
            </div>
        </Modal>
      )}
      
      {showNoteModal && (
        <Modal title={editingNoteId ? "Notu Düzenle" : "Öğrenci Paneline Not Ekle"} onClose={() => setShowNoteModal(false)}>
            <div className="space-y-4">
                <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20 text-orange-400 text-xs">Buraya yazdığınız notlar öğrenci kendi paneline girdiğinde "Öğretmenden Notlar" bölümünde görünecektir.</div>
                <textarea className={`w-full ${colors.inputBg} border ${colors.inputBorder} p-3 rounded ${colors.text} h-32 focus:border-orange-500 outline-none`} value={newNote.note} onChange={e => setNewNote({...newNote, note: e.target.value})} placeholder="Öğrenciye iletmek istediğiniz not..." />
                <Button onClick={handleAddNote}>{editingNoteId ? "Güncelle" : "Notu Yayınla"}</Button>
            </div>
        </Modal>
      )}

      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

const PaymentModule = ({ student, onUpdateStudent, user }) => {
  const [showModal, setShowModal] = useState(false); const [newPayment, setNewPayment] = useState({ date: new Date().toISOString().split('T')[0], amount: "", description: "", method: "Nakit" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const colors = useThemeColors();
  const handleAdd = () => { if (!newPayment.amount) return; const payment = { id: Date.now(), ...newPayment }; onUpdateStudent({ ...student, payments: [payment, ...student.payments] }); setShowModal(false); setNewPayment({ date: new Date().toISOString().split('T')[0], amount: "", description: "", method: "Nakit" }); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = student.payments.filter(p => p.id !== deleteConfirm); onUpdateStudent({ ...student, payments: filtered }); setDeleteConfirm(null); } };
   if (user.role === 'student') return <div className={`${colors.text} text-center mt-20`}>Bu alana erişim yetkiniz yok.</div>;
  const totalPaid = student.payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  return (
    <div className="animate-fade-in space-y-6"><div className="flex justify-between items-center"><h2 className={`text-2xl font-bold ${colors.text}`}>Ödeme Takibi</h2><Button onClick={() => setShowModal(true)} icon={Plus}>Ödeme Ekle</Button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card className={`border-l-4 border-l-emerald-500 ${colors.bgCard}`}><div className={`${colors.textSec} text-xs uppercase font-bold mb-2`}>Toplam Tahsilat</div><div className={`text-3xl font-bold ${colors.text}`}>{totalPaid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div></Card><Card className={`border-l-4 border-l-blue-500 ${colors.bgCard}`}><div className={`${colors.textSec} text-xs uppercase font-bold mb-2`}>Son İşlem</div><div className={`text-xl font-bold ${colors.text}`}>{student.payments[0]?.date || '-'}</div></Card></div><Card title="Ödeme Geçmişi"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className={colors.tableHeader}><tr><th className="p-4">Tarih</th><th className="p-4">Açıklama</th><th className="p-4">Yöntem</th><th className="p-4 text-right">Tutar</th><th className="p-4 text-right">İşlem</th></tr></thead><tbody className={`divide-y ${colors.divider} ${colors.textSec}`}>
  {student.payments
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // 1. TARİHE GÖRE SIRALAMA (YENİDEN ESKİYE)
    .map(p => (
    <tr key={p.id} className={colors.hoverBg}>
      <td className="p-4">{formatDate(p.date)}</td> {/* 2. TARİH FORMATI DÜZELTİLDİ */}
      <td className={`p-4 font-medium ${colors.text}`}>{p.description}</td>
      <td className="p-4">
        <span className={`${colors.isDark ? 'bg-slate-800' : 'bg-slate-200'} px-2 py-1 rounded text-xs`}>
          {p.method}
        </span>
      </td>
      <td className="p-4 text-right font-bold text-emerald-400">
        {Number(p.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
      </td>
      <td className="p-4 text-right">
        <button onClick={(e) => requestDelete(e, p.id)} className="text-slate-500 hover:text-red-500 p-2">
          <Trash2 size={16}/>
        </button>
      </td>
    </tr>
  ))}
  {student.payments.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Ödeme kaydı bulunamadı.</td></tr>}
</tbody></table></div></Card>{showModal && (<Modal title="Yeni Ödeme Alındısı" onClose={() => setShowModal(false)}><div className="space-y-4"><Input label="Tarih" type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} /><Input label="Tutar (TL)" type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} /><Input label="Açıklama" placeholder="Örn: Kasım 2025 Koçluk Ücreti" value={newPayment.description} onChange={e => setNewPayment({...newPayment, description: e.target.value})} /><div><label className={`block text-xs font-medium ${colors.textSec} mb-2 uppercase`}>Ödeme Yöntemi</label><select className={`w-full ${colors.inputBg} border ${colors.inputBorder} rounded-lg p-3 ${colors.text} focus:border-orange-500 outline-none`} value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})}><option>Nakit</option><option>Havale/EFT</option><option>Kredi Kartı</option></select></div><Button onClick={handleAdd} className="w-full mt-4">Kaydet</Button></div></Modal>)}
    <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};
// --- LANDING PAGE (KARŞILAMA EKRANI) ---
const LandingPage = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-orange-500">
          <Target size={28} /> Koçum Online
        </div>
        <button 
          onClick={onGoToLogin}
          className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 shadow-lg shadow-white/10"
        >
          Panele Giriş
        </button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 animate-fade-in">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            Profesyonel Öğrenci Koçluğu
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Başarıya Giden Yolda <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Dijital Yol Arkadaşın</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
            Öğrenci takibi, analizler, yapay zeka destekli raporlamalar ve çok daha fazlası. 
            Koçum Online ile potansiyelini keşfet.
          </p>
          <div className="flex gap-4 pt-4">
            <button onClick={onGoToLogin} className="px-8 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-white shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2">
              Hemen Başla <ChevronRight size={20}/>
            </button>
            <a href="https://wa.me/905419706821" target="_blank" rel="noreferrer" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-white transition-all flex items-center gap-2">
              <Phone size={20} className="text-green-500"/> İletişim
            </a>
          </div>
        </div>
        
        {/* Görsel / Grafik Alanı */}
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="space-y-4">
               <div className="h-32 bg-slate-800/50 rounded-lg flex items-end justify-between p-4 px-8">
                  <div className="w-8 h-12 bg-orange-500/20 rounded-t"></div>
                  <div className="w-8 h-20 bg-orange-500/40 rounded-t"></div>
                  <div className="w-8 h-16 bg-orange-500/30 rounded-t"></div>
                  <div className="w-8 h-24 bg-orange-500/60 rounded-t"></div>
                  <div className="w-8 h-28 bg-orange-500 rounded-t shadow-lg shadow-orange-500/20"></div>
               </div>
               <div className="flex gap-4">
                 <div className="flex-1 h-20 bg-slate-800/50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center mb-2"><Activity size={16}/></div>
                    <div className="h-2 w-16 bg-slate-700 rounded"></div>
                 </div>
                 <div className="flex-1 h-20 bg-slate-800/50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded bg-green-500/20 text-green-500 flex items-center justify-center mb-2"><CheckCircle size={16}/></div>
                    <div className="h-2 w-16 bg-slate-700 rounded"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-20 border-t border-slate-900">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-orange-500/30 transition-colors">
               <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4"><BarChart2 size={24}/></div>
               <h3 className="text-xl font-bold mb-2">Detaylı Analiz</h3>
               <p className="text-slate-400 text-sm">Deneme sonuçlarınızı, konu eksiklerinizi ve gelişim grafiğinizi anlık olarak takip edin.</p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-colors">
               <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4"><Calendar size={24}/></div>
               <h3 className="text-xl font-bold mb-2">Akıllı Planlama</h3>
               <p className="text-slate-400 text-sm">Haftalık ders programınızı oluşturun, hedeflerinizi belirleyin ve zamanı yönetin.</p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-green-500/30 transition-colors">
               <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4"><Users size={24}/></div>
               <h3 className="text-xl font-bold mb-2">Koç Desteği</h3>
               <p className="text-slate-400 text-sm">Öğretmeninizle sürekli iletişimde kalın, notlar alın ve rehberlik desteğiyle ilerleyin.</p>
            </div>
         </div>
      </div>

      {/* Footer / Contact */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-center md:text-left">
              <h4 className="font-bold text-lg mb-1">Koçum Online</h4>
              <p className="text-slate-500 text-sm">Tüm Hakları Saklıdır © 2025</p>
           </div>
           <div className="flex flex-col md:flex-row gap-6">
              <a href="https://instagram.com/kocum.onlinee" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors">
                 <div className="p-2 bg-slate-800 rounded-lg"><User size={18}/></div>
                 <span>@kocum.onlinee</span>
              </a>
              <a href="https://wa.me/905419706821" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors">
                 <div className="p-2 bg-slate-800 rounded-lg"><Phone size={18}/></div>
                 <span>0541 970 68 21</span>
              </a>
           </div>
        </div>
      </footer>
    </div>
  );
};

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin, students, admins, isFirebase, isLoading }) => {
  const [activeTab, setActiveTab] = useState('admin');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = () => {
    setError('');
    if (activeTab === 'admin') {
      const adminUser = admins.find(a => a.username === username && a.password === password);
      if (adminUser) { 
        const role = adminUser.role === 'superadmin' ? 'superadmin' : 'admin';
        onLogin({ role: role, id: adminUser.id, name: adminUser.name, username: adminUser.username, password: adminUser.password }); 
        return; 
      }
      setError('Hatalı yönetici bilgisi.');
    } else {
      const student = students.find(s => s.username === username && s.password === password);
      if (student) onLogin({ role: 'student', id: student.id, name: student.name, username: student.username, password: student.password });
      else setError('Hatalı kullanıcı adı veya şifre.');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-orange-500 font-bold animate-pulse">Sistem Yükleniyor...</div></div>;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"><div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl relative">
        {!isFirebase && <div className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded border border-yellow-500/30 flex items-center gap-1"><CloudOff size={12}/> Demo Modu</div>}
        {isFirebase && <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-500 text-[10px] px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1"><Cloud size={12}/> Canlı Bağlantı</div>}
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Profesyonel Koçluk Programı</h1>
            <p className="text-slate-500 text-xs">Uzm. Psikolojik Danışman Hamza Metehan Kılıç tarafından geliştirilmiştir.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg mb-6"><button onClick={() => {setActiveTab('admin'); setError(''); setPassword('');}} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>Yönetici / Öğretmen</button><button onClick={() => {setActiveTab('student'); setError(''); setPassword('');}} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'student' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>Öğrenci</button></div><div className="space-y-4"><Input label="Kullanıcı Adı" value={username} onChange={e => setUsername(e.target.value)} /><Input label="Şifre" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />{error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">{error}</div>}<Button size="large" className="w-full" onClick={handleLogin}>Giriş Yap</Button></div></div></div>
  );
};

// --- ANA UYGULAMA ---
  // --- ANA UYGULAMA (GÜNCELLENMİŞ) ---
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  
  // YENİ: Sınıflar State'i
  const [classes, setClasses] = useState([]);
  
  // YENİ: View Mode (Landing -> Login -> App)
  const [viewMode, setViewMode] = useState('landing'); // 'landing', 'login', 'app'

  const [curriculum, setCurriculum] = useState(INITIAL_CURRICULUM);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isFirebaseActive); 
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const colors = useThemeColors();

  // VERİ YÜKLEME (Firebase Dinleyicileri)
  useEffect(() => {
    if (isFirebaseActive) {
      setIsLoading(true);
      // Öğrencileri Çek
      const qStudents = query(collection(db, "students"));
      const unsubStudents = onSnapshot(qStudents, (snapshot) => { 
          const data = []; 
          snapshot.forEach(doc => data.push({id: doc.id, ...doc.data()})); 
          setStudents(data); 
          // Loading sadece burada false oluyor, diğerleri arka planda güncellenebilir
          setIsLoading(false); 
      });
      // Adminleri Çek
      const qAdmins = query(collection(db, "admins"));
      const unsubAdmins = onSnapshot(qAdmins, (snapshot) => { 
          const data = []; 
          snapshot.forEach(doc => data.push({id: doc.id, ...doc.data()})); 
          if(data.length === 0) setAdmins(INITIAL_ADMINS); else setAdmins(data); 
      });

      // YENİ: Sınıfları Çek
      const qClasses = query(collection(db, "classes"));
      const unsubClasses = onSnapshot(qClasses, (snapshot) => {
          const data = [];
          snapshot.forEach(doc => data.push({id: doc.id, ...doc.data()}));
          setClasses(data);
      });

      return () => { unsubStudents(); unsubAdmins(); unsubClasses(); };
    }
  }, []);

  const myStudents = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'student') return students.filter(s => s.id === user.id);
    return students.filter(s => s.teacherId === user.id);
  }, [user, students]);

  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'superadmin') && myStudents.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(myStudents[0].id);
    }
  }, [user, myStudents, selectedStudentId]);

  const currentStudent = (user?.role === 'admin' || user?.role === 'superadmin') ? students.find(s => s.id === selectedStudentId) : students.find(s => s.id === user?.id);

  const updateStudentData = async (updated) => {
    if (isFirebaseActive) { 
        try { 
            const studentRef = doc(db, "students", updated.id); 
            const { id, ...data } = updated; 
            await setDoc(studentRef, data, { merge: true }); 
        } catch (error) { console.error("Güncelleme hatası:", error); alert("Bağlantı hatası: Kayıt yapılamadı."); }
    } else { setStudents(prev => prev.map(s => s.id === updated.id ? updated : s)); }
  };

  const handleUpdateProfile = async (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser.role === 'student') {
        if(isFirebaseActive) { try { const ref = doc(db, "students", updatedUser.id); const { id, ...data } = updatedUser; await updateDoc(ref, data); } catch(e) { console.error(e); } } 
        else { setStudents(prev => prev.map(s => s.id === updatedUser.id ? updatedUser : s)); }
    } else {
        if(isFirebaseActive) { try { const ref = doc(db, "admins", updatedUser.id); const { id, ...data } = updatedUser; await setDoc(ref, data, { merge: true }); } catch(e) { console.error(e); } } 
        else { setAdmins(prev => prev.map(a => a.id === updatedUser.id ? updatedUser : a)); }
    }
  };

  const handleInspectStudent = (studentId) => { setSelectedStudentId(studentId); setActiveTab('dashboard'); };
  
  // LOGIN FLOW CONTROL
  const handleLoginSuccess = (loggedInUser) => {
      setUser(loggedInUser);
      setViewMode('app');
  };

  // EĞER KULLANICI YOKSA: Landing Page veya Login Screen Göster
  if (!user) {
      if (viewMode === 'landing') {
          return <LandingPage onGoToLogin={() => setViewMode('login')} />;
      } else {
          return <LoginScreen onLogin={handleLoginSuccess} students={students} admins={admins} isFirebase={isFirebaseActive} isLoading={isLoading} />;
      }
  }

  // MENÜ (Değişmedi)
  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Layout, roles: ['superadmin', 'admin', 'student'] },
    { id: 'schedule', label: 'Program & Ödev', icon: Calendar, roles: ['superadmin', 'admin', 'student'] },
    { id: 'goals', label: 'Haftalık Hedefler', icon: Flag, roles: ['superadmin', 'admin', 'student'] },
    { id: 'resources', label: 'Kaynaklar', icon: Library, roles: ['superadmin', 'admin'] },
    { id: 'lessons', label: 'Ders Yönetimi', icon: BookOpen, roles: ['superadmin', 'admin'] },
    { id: 'mood', label: 'Duygudurum', icon: Smile, roles: ['superadmin', 'admin'] },
    { id: 'exams', label: 'Deneme Takibi', icon: Target, roles: ['superadmin', 'admin', 'student'] },
    { id: 'interviews', label: 'Görüşmeler', icon: MessageSquare, roles: ['superadmin', 'admin'] },
    { id: 'payment', label: 'Ödeme', icon: CreditCard, roles: ['superadmin', 'admin'] },
    { id: 'admin_panel', label: 'Yönetici Paneli', icon: Shield, roles: ['superadmin'] },
  ];

  // MAIN LAYOUT (Değişmedi, sadece Dashboard ve LessonModule'a yeni prop'lar eklendi)
  return (
    <div className={`flex flex-col md:flex-row h-screen ${colors.bgMain} ${colors.text} overflow-hidden font-sans transition-colors duration-300`}>
      <div className={`md:hidden ${colors.bgCard} p-4 flex justify-between items-center border-b ${colors.border} z-50`}>
           <div className="flex items-center gap-2 text-orange-500 font-bold text-lg"><Users size={20}/><span>HMK Koçluk</span></div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={colors.text}>{isMobileMenuOpen ? <X /> : <Menu />}</button>
      </div>
      {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>)}
      <aside className={`fixed inset-y-0 left-0 w-64 ${colors.bgCard} border-r ${colors.border} flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-6 border-b ${colors.border} flex flex-col gap-1`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-lg truncate"><Users /><span>{user.name.split(' ')[0]}</span></div>
            <button onClick={() => setShowProfileModal(true)} className={`${colors.textSec} hover:text-orange-500 transition-colors`}><Settings size={18} /></button>
          </div>
          <div className={`text-xs ${colors.textSec} ml-8`}>{user.role === 'superadmin' ? 'Yönetici' : user.role === 'admin' ? 'Öğretmen' : 'Öğrenci'}</div>
        </div>
        
        {(user.role === 'admin' || user.role === 'superadmin') && (
          <div className={`p-4 border-b ${colors.border}`}>
            <label className={`block text-[10px] uppercase font-bold ${colors.textSec} mb-2`}>Benim Öğrencilerim</label>
            <select className={`w-full ${colors.inputBg} ${colors.border} border rounded p-2 ${colors.text} text-sm outline-none focus:border-orange-500`} value={selectedStudentId || ''} onChange={e => setSelectedStudentId(e.target.value)}>
              {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {myStudents.length === 0 && <option value="">Öğrenci Yok</option>}
              {!myStudents.find(s => s.id === selectedStudentId) && selectedStudentId && <option value={selectedStudentId}>(İncelenen Öğrenci)</option>}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-4 custom-scrollbar">{MENU_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : `${colors.textSec} hover:${colors.text} hover:${colors.hoverBg}`}`}><item.icon size={18} /> <span className="text-sm font-medium">{item.label}</span></button>))}</nav>
        <div className={`p-4 border-t ${colors.border} space-y-2`}>
            <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${colors.textSec} hover:${colors.text} ${colors.hoverBg} transition-all`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} 
              <span className="text-sm font-medium">{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
            </button>
            <button onClick={() => setShowProfileModal(true)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${colors.textSec} hover:${colors.text} ${colors.hoverBg} transition-all`}>
              <User size={18} />
              <span className="text-sm font-medium">Profilim</span>
            </button>
            <button onClick={() => { setUser(null); setViewMode('landing'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${colors.textSec} hover:text-red-500 ${colors.hoverBg} transition-all`}><LogOut size={18} /> <span className="text-sm font-medium">Güvenli Çıkış</span></button>
        </div>
      </aside>
      <main className={`flex-1 ${colors.bgMain} overflow-y-auto p-4 md:p-8 relative w-full custom-scrollbar`}>
        {user.role === 'superadmin' && activeTab === 'admin_panel' ? (
           <AdminManagementModule admins={admins} setAdmins={setAdmins} user={user} allStudents={students} onInspectStudent={handleInspectStudent} />
        ) : (user.role === 'admin' || user.role === 'superadmin') && activeTab === 'dashboard' ? (
           // GÜNCELLEME: Dashboard'a classes ve setClasses prop'ları eklendi
           <DashboardModule user={user} students={myStudents} setStudents={setStudents} setSelectedStudentId={setSelectedStudentId} onUpdateStudent={updateStudentData} classes={classes} setClasses={setClasses} />
        ) : !currentStudent ? <div className={`text-center mt-20 ${colors.textSec}`}>Lütfen işlem yapmak için bir öğrenci seçiniz veya öğrenci ekleyiniz.</div> : (
          <>
            {activeTab === 'dashboard' && <DashboardModule user={user} students={myStudents} setStudents={setStudents} setSelectedStudentId={setSelectedStudentId} onUpdateStudent={updateStudentData} classes={classes} setClasses={setClasses} />}
            {activeTab === 'schedule' && <ScheduleModule user={user} student={currentStudent} curriculum={curriculum} onUpdateStudent={updateStudentData} />}
            {activeTab === 'goals' && <GoalsModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'resources' && <ResourceModule user={user} student={currentStudent} curriculum={curriculum} onUpdateStudent={updateStudentData} />}
            
            {/* GÜNCELLEME: LessonModule'a allStudents prop'u eklendi */}
            {activeTab === 'lessons' && <LessonModule user={user} student={currentStudent} curriculum={curriculum} setCurriculum={setCurriculum} onUpdateStudent={updateStudentData} allStudents={students} />}
            
            {activeTab === 'mood' && <MoodModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'exams' && <ExamModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'interviews' && <InterviewModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'payment' && <PaymentModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
          </>
        )}
      </main>
      {showProfileModal && <ProfileSettingsModal user={user} onClose={() => setShowProfileModal(false)} onUpdate={handleUpdateProfile} />}
    </div>
  );
};
