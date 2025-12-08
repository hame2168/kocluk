import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Users, BookOpen, Target, Smile, MessageSquare, CreditCard, LogOut, Plus, Trash2, 
  ChevronRight, User, Lock, Check, Edit2, Save, X, Calendar, Filter, ChevronDown, BarChart2, 
  PieChart, Activity, ArrowUpRight, TrendingUp, Award, Clock, List, Book, RefreshCw, Zap, 
  Library, FileText, CheckCircle, Flag, Phone, GraduationCap, History, Star, Archive, AlertTriangle,
  Play, Pause, RotateCcw, Timer, Menu, Database, CloudOff, Cloud, Shield, Key, Eye
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
  { id: 'tekrar', label: 'Konu Tekrarı' }, { id: 'deneme', label: 'Branş Denemesi' }
];

const INITIAL_CURRICULUM = [
  { id: 'mat-tyt', name: 'TYT Matematik', units: [{ id: 'u1', name: 'Temel Kavramlar', topics: ['Sayı Kümeleri', 'Tek-Çift Sayılar'] }] },
  { id: 'geo-tyt', name: 'Geometri', units: [{ id: 'g1', name: 'Üçgenler', topics: ['Doğruda Açı', 'Üçgende Açı'] }] }
];

const INITIAL_ADMINS = [];

const INITIAL_STUDENTS = [
  { 
    id: "demo_student_1", teacherId: SUPER_ADMIN_ID, name: "Ahmet Yılmaz (Demo)", username: "ahmet", password: "123", phone: "0555 111 22 33", school: "Fen Lisesi", grade: "12. Sınıf (YKS)", target: "Hukuk Fakültesi",
    exams: [{ id: 1, name: "Özdebir TYT-1", type: "TYT", date: "2024-10-15", totalNet: 68.75, difficulty: "Orta", stats: { turkey: { rank: 15400, total: 120000 }, city: { rank: 450, total: 5000 }, school: { rank: 45, total: 120 } }, details: { turk: { d: 30, y: 5, n: 28.75 }, tarih: { d: 4, y: 1, n: 3.75 }, cog: { d: 3, y: 2, n: 2.5 }, fel: { d: 4, y: 1, n: 3.75 }, din: { d: 4, y: 1, n: 3.75 }, mat: { d: 15, y: 3, n: 14.25 }, geo: { d: 5, y: 2, n: 4.5 }, fiz: { d: 3, y: 2, n: 2.5 }, kim: { d: 3, y: 0, n: 3 }, biyo: { d: 2, y: 0, n: 2 } } }],
    moods: [{ id: 101, date: "2024-12-01", metrics: { motivation: 80, happiness: 70, social: 60, examAnxiety: 40, lessonAnxiety: 30, performance: 75, homeworkRate: 90 } }],
    lessons: {}, interviews: [], payments: [], teacherNotes: [],
    assignments: [{ id: 201, day: 'Mon', subject: 'TYT Matematik', topic: 'Sayı Kümeleri', type: 'soru', count: 50, source: '3D Yayınları', status: 'pending' }],
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

// --- UI BİLEŞENLERİ ---

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, max }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</label>}
    <input type={type} value={value === undefined || value === null ? '' : value} onChange={onChange} placeholder={placeholder} min={min} max={max} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-colors" />
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", size = "normal", icon: Icon }) => {
  const variants = { primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg", secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700", danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20", ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white" };
  const sizes = { small: "px-3 py-1.5 text-xs", normal: "px-5 py-2.5 text-sm", large: "px-6 py-3 text-base" };
  return (
    <button onClick={onClick} className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${className}`}>
      {Icon && <Icon size="16" />} {children}
    </button>
  );
};

const Card = ({ children, title, action, className = "" }) => (
  <div className={`bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6 ${className}`}>
    {(title || action) && <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-800 gap-4">{title && <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">{title}</h3>}{action}</div>}
    {children}
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
      <div className="flex justify-between items-center p-6 border-b border-slate-800"><h3 className="text-xl font-bold text-white">{title}</h3><button onClick={onClose} className="text-slate-500 hover:text-white"><X size="24"/></button></div>
      <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, message = "Bu öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz." }) => {
  if (!isOpen) return null;
  return (
    <Modal title="Silme Onayı" onClose={onClose}>
      <div className="text-slate-300 mb-6 text-sm">{message}</div>
      <div className="flex gap-4"><Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button><Button variant="danger" onClick={onConfirm} className="flex-1" icon={Trash2}>Evet, Sil</Button></div>
    </Modal>
  );
};

const LineChart = ({ data, dataKey, labelKey, color = "#f97316", height = 200, showDots = true }) => {
  if (!data || data.length < 2) return <div className="flex items-center justify-center text-slate-500 text-sm h-full">Veri yetersiz</div>;
  const maxVal = Math.max(...data.map(d => d[dataKey])) * 1.2 || 10;
  const width = 1000; const padding = 30;
  return (
    <div className="w-full h-full relative" style={{ height: height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map(p => { const y = height - padding - (p * (height - 2*padding)); return <line key={p} x1="0" y1={y} x2={width} y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />; })}
        <polyline points={data.map((d, i) => { const x = (i / (data.length - 1)) * width; const y = height - padding - ((d[dataKey] / maxVal) * (height - 2*padding)); return `${x},${y}`; }).join(' ')} fill="none" stroke={color} strokeWidth="3" />
        {showDots && data.map((d, i) => {
          const x = (i / (data.length - 1)) * width; const y = height - padding - ((d[dataKey] / maxVal) * (height - 2*padding));
          return (<g key={i} className="group"><circle cx={x} cy={y} r="5" fill="#1e293b" stroke={color} strokeWidth="2" /><text x={x} y={y - 12} textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">{Number(d[dataKey]).toFixed(1)}</text><text x={x} y={height - 5} textAnchor="middle" fill="#64748b" fontSize="10">{d[labelKey]}</text></g>);
        })}
      </svg>
    </div>
  );
};

// --- YENİ MODÜL: YÖNETİCİ YÖNETİMİ (GÜNCELLENDİ: EDİT VE SİLME) ---
const AdminManagementModule = ({ admins, setAdmins, user, allStudents, onInspectStudent }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null); // Düzenlenen admin state'i
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedAdminId, setExpandedAdminId] = useState(null);

  if (user.role !== 'superadmin') return <div className="text-white text-center">Bu sayfaya erişim yetkiniz yok.</div>;

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({ name: admin.name, username: admin.username, password: admin.password }); // Şifreyi de getiriyoruz
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.username || !form.password) return alert("Tüm alanları doldurunuz.");
    
    if (editingAdmin) {
       // GÜNCELLEME İŞLEMİ
       const updatedAdmin = { ...editingAdmin, ...form };
       
       if (isFirebaseActive) {
          try {
            const adminRef = doc(db, "admins", editingAdmin.id);
            // id'yi çıkartıp update edelim
            const { id, ...data } = updatedAdmin;
            await updateDoc(adminRef, data);
          } catch(e) { console.error(e); alert("Güncelleme hatası"); }
       } else {
          setAdmins(admins.map(a => a.id === editingAdmin.id ? updatedAdmin : a));
       }
    } else {
       // YENİ EKLEME İŞLEMİ
        const newAdmin = { 
          id: Date.now().toString(),
          name: form.name, 
          username: form.username, 
          password: form.password,
          role: 'admin' 
        };

        if (isFirebaseActive) {
          try {
            await addDoc(collection(db, "admins"), newAdmin);
          } catch(e) { console.error(e); alert("Kayıt hatası"); }
        } else {
          setAdmins([...admins, newAdmin]);
        }
    }
    
    setShowModal(false); 
    setForm({ name: '', username: '', password: '' });
    setEditingAdmin(null);
  };

  const handleDelete = async (id) => {
     if(isFirebaseActive) {
        await deleteDoc(doc(db, "admins", id));
     } else {
        setAdmins(admins.filter(a => a.id !== id));
     }
     setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-white">Yönetici & Öğretmen Paneli</h2>
         <Button icon={Plus} onClick={() => { setEditingAdmin(null); setForm({name:'', username:'', password:''}); setShowModal(true); }}>Yeni Yönetici Ekle</Button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {admins.map(admin => {
           const adminStudents = allStudents.filter(s => s.teacherId === admin.id);
           const isExpanded = expandedAdminId === admin.id;

           return (
             <div key={admin.id} className={`bg-slate-900 border border-slate-800 rounded-xl p-6 relative group transition-all duration-300 ${isExpanded ? 'row-span-2 shadow-xl border-orange-500/30' : ''}`}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                    <User size={24} />
                  </div>
                  <div className="overflow-hidden">
                     <h3 className="font-bold text-white truncate">{admin.name}</h3>
                     <div className="text-sm text-slate-500 truncate">K.Adı: <span className="text-slate-300">{admin.username}</span></div>
                     <div className="text-xs text-slate-600 mt-1">{adminStudents.length} Öğrenci Kayıtlı</div>
                  </div>
               </div>
               
               <div className="mt-4 flex gap-2">
                 <button onClick={() => setExpandedAdminId(isExpanded ? null : admin.id)} className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${isExpanded ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                    <Users size={14} /> {isExpanded ? 'Gizle' : 'Öğrenciler'}
                 </button>
                 {/* DÜZENLEME BUTONU EKLENDİ */}
                 <button onClick={() => handleEdit(admin)} className="p-2 bg-slate-800 rounded text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                    <Edit2 size={16}/>
                 </button>
                 <button onClick={() => setDeleteConfirm(admin.id)} className="p-2 bg-slate-800 rounded text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={16}/>
                 </button>
               </div>

               {/* Öğrenci Listesi (Expanded ise görünür) */}
               {isExpanded && (
                 <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in">
                    <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Öğrenci Listesi</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {adminStudents.map(st => (
                        <div key={st.id} onClick={() => onInspectStudent(st.id)} className="flex justify-between items-center p-2 rounded bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                           <div>
                             <div className="text-sm font-medium text-slate-200">{st.name}</div>
                             <div className="text-[10px] text-slate-500">{st.grade}</div>
                           </div>
                           <Eye size={14} className="text-slate-500 hover:text-orange-500" />
                        </div>
                      ))}
                      {adminStudents.length === 0 && <div className="text-center text-xs text-slate-600 py-2">Öğrenci bulunamadı.</div>}
                    </div>
                 </div>
               )}
             </div>
           );
         })}
         {admins.length === 0 && <div className="text-slate-500 col-span-full text-center py-10">Ekli yönetici bulunmuyor.</div>}
       </div>

       {showModal && (
        <Modal title={editingAdmin ? "Yönetici Düzenle" : "Yeni Yönetici Ekle"} onClose={() => setShowModal(false)}>
           <div className="space-y-4">
             <Input label="Ad Soyad" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
             <Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
             <Input label="Şifre" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
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

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current); setIsActive(false); handleTimerComplete();
    }
    return () => clearInterval(timerRef.current);
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

  const resetTimer = (mode) => { setIsActive(false); clearInterval(timerRef.current); if (mode === 'pomodoro') setTimeLeft(25 * 60); else setTimeLeft(50 * 60); };
  const changeMode = (mode) => { setTimerMode(mode); resetTimer(mode); };
  const toggleTimer = () => setIsActive(!isActive);

  const handleSave = async () => {
    if(!form.name || !form.username) return alert("İsim ve kullanıcı adı zorunludur.");
    if (editingId) { 
       const student = students.find(s => s.id === editingId);
       onUpdateStudent({ ...student, ...form });
       setEditingId(null); 
    } 
    else { 
       // Create new student - TEACHER ID EKLENDİ
       const newStudent = { 
         ...form, 
         teacherId: user.id, // Öğrenciyi ekleyen öğretmene bağla
         exams: [], moods: [], lessons: {}, interviews: [], payments: [], teacherNotes: [], assignments: [], pastWeeks: [], goals: [], resources: [], stats: { totalSolved: 0, monthlySolved: 0, xp: 0, level: 1 } 
       }; 
       if (isFirebaseActive) {
         try {
           await addDoc(collection(db, "students"), newStudent);
         } catch(e) { console.error(e); alert("Kayıt hatası"); }
       } else {
         setStudents([...students, { id: Date.now(), ...newStudent }]); 
       }
    }
    setShowModal(false); setForm({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '' });
  };
  
  const handleEdit = (student) => { setForm({ name: student.name, grade: student.grade, target: student.target, phone: student.phone, school: student.school, username: student.username, password: student.password }); setEditingId(student.id); setShowModal(true); };
  
  const handleDeleteRequest = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = async () => {
    if (deleteConfirm) {
        if(isFirebaseActive) {
           await deleteDoc(doc(db, "students", deleteConfirm));
        } else {
           setStudents(students.filter(s => s.id !== deleteConfirm));
        }
        if (setSelectedStudentId) setSelectedStudentId(null);
        setDeleteConfirm(null);
    }
  };

  if (user.role === 'student') {
    const s = students.find(s => s.id === user.id);
    if (!s) return <div className="text-white text-center">Öğrenci verisi yükleniyor veya bulunamadı...</div>;
    return (
      <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
                <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Timer className="text-orange-500"/> Çalışma Sayacı</h3><div className="flex bg-slate-800 rounded p-1"><button onClick={() => changeMode('pomodoro')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${timerMode === 'pomodoro' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Pomodoro</button><button onClick={() => changeMode('sprint')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${timerMode === 'sprint' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>Sprint</button></div></div>
                <div className="flex flex-col items-center justify-center py-4"><div className="text-5xl md:text-6xl font-mono font-bold text-white mb-6 tracking-wider">{formatTime(timeLeft)}</div><div className="flex gap-4"><Button onClick={toggleTimer} size="large" className={isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}>{isActive ? <><Pause size={20}/> Duraklat</> : <><Play size={20}/> Başlat</>}</Button><Button variant="secondary" onClick={() => resetTimer(timerMode)}><RotateCcw size={20}/> Sıfırla</Button></div></div>
            </Card>
            <div className="grid grid-cols-2 gap-4"><Card className="bg-slate-900 flex flex-col items-center justify-center text-center"><div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-2 text-orange-500"><Clock size={24}/></div><div className="text-3xl font-bold text-white">{s.stats?.pomodoroCount || 0}</div><div className="text-xs text-slate-400 uppercase font-bold mt-1">Pomodoro</div></Card><Card className="bg-slate-900 flex flex-col items-center justify-center text-center"><div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-500"><Zap size={24}/></div><div className="text-3xl font-bold text-white">{s.stats?.sprintCount || 0}</div><div className="text-xs text-slate-400 uppercase font-bold mt-1">Sprint</div></Card><Card className="bg-slate-900 flex flex-col items-center justify-center text-center col-span-2"><div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2 text-green-500"><Award size={24}/></div><div className="text-3xl font-bold text-white">{s.stats?.totalSolved || 0}</div><div className="text-xs text-slate-400 uppercase font-bold mt-1">Toplam Soru</div></Card></div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Card className="border-l-4 border-l-blue-500 bg-slate-900"><div className="text-slate-400 text-xs uppercase font-bold mb-2">Toplam Deneme</div><div className="text-4xl font-bold text-white">{s.exams?.length || 0}</div></Card><Card className="border-l-4 border-l-green-500 bg-slate-900"><div className="text-slate-400 text-xs uppercase font-bold mb-2">Bitirilen Konu</div><div className="text-4xl font-bold text-white">{Object.values(s.lessons || {}).filter(l => l.konu).length}</div></Card><Card className="border-l-4 border-l-orange-500 bg-slate-900"><div className="text-slate-400 text-xs uppercase font-bold mb-2">Son Deneme Neti</div><div className="text-4xl font-bold text-white">{s.exams?.length > 0 ? s.exams[0].totalNet.toFixed(1) : '-'}</div></Card><Card className="border-l-4 border-l-purple-500 bg-slate-900"><div className="text-slate-400 text-xs uppercase font-bold mb-2">Aylık Soru</div><div className="text-4xl font-bold text-white">{s.stats?.monthlySolved || 0}</div></Card></div>
        
        {/* --- ÖĞRENCİYE ÖZEL NOTLAR ALANI --- */}
        {s.teacherNotes && s.teacherNotes.length > 0 && (
          <div className="mt-6">
             <Card title="Öğretmenden Notlar" className="border-l-4 border-l-orange-500 bg-slate-900">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {s.teacherNotes.map((note, idx) => (
                   <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-slate-400">{note.date}</span>
                      </div>
                      <p className="text-white text-sm italic whitespace-pre-wrap">"{note.text}"</p>
                   </div>
                 ))}
               </div>
             </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Öğrenci Portföyü</h2><Button icon={Plus} size="large" onClick={() => setShowModal(true)}>Yeni Öğrenci Ekle</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{students.map(student => (<div key={student.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group relative"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedStudentId(student.id)}><div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-white border border-slate-600">{student.name.charAt(0)}</div><div><h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{student.name}</h3><div className="text-sm text-slate-400">{student.grade}</div></div></div><div className="flex gap-2"><button onClick={(e) => {e.stopPropagation(); handleEdit(student)}} className="p-2 text-slate-500 hover:text-blue-400 bg-slate-800 rounded-lg hover:bg-slate-700"><Edit2 size={16}/></button><button onClick={(e) => handleDeleteRequest(e, student.id)} className="p-2 text-slate-500 hover:text-red-500 bg-slate-800 rounded-lg hover:bg-slate-700"><Trash2 size={16}/></button></div></div><div className="space-y-3 mb-6"><div className="flex items-center gap-2 text-sm text-slate-400"><Target size={14} className="text-orange-500"/> <span>Hedef: <span className="text-slate-200">{student.target}</span></span></div><div className="flex items-center gap-2 text-sm text-slate-400"><GraduationCap size={14} className="text-blue-500"/> <span>Okul: <span className="text-slate-200">{student.school}</span></span></div><div className="flex items-center gap-2 text-sm text-slate-400"><Phone size={14} className="text-green-500"/> <span>{student.phone}</span></div></div><Button className="w-full" variant="secondary" onClick={() => setSelectedStudentId(student.id)}>Profile Git <ChevronRight size={16}/></Button></div>))}</div>
      {showModal && (<Modal title={editingId ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"} onClose={() => {setShowModal(false); setEditingId(null); setForm({ name: '', grade: '', target: '', phone: '', school: '', username: '', password: '' });}}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="Ad Soyad" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><Input label="Sınıf" placeholder="12. Sınıf (YKS)" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} /><Input label="Hedef" placeholder="Tıp Fakültesi" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /><Input label="Okul" value={form.school} onChange={e => setForm({...form, school: e.target.value})} /><Input label="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /><div className="col-span-1 md:col-span-2 p-4 bg-slate-800 rounded-lg border border-slate-700 mt-2"><h4 className="text-orange-500 font-bold text-xs uppercase mb-3">Giriş Bilgileri</h4><div className="grid grid-cols-2 gap-4"><Input label="Kullanıcı Adı" value={form.username} onChange={e => setForm({...form, username: e.target.value})} /><Input label="Şifre" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div></div><div className="col-span-1 md:col-span-2 pt-4"><Button size="large" className="w-full" onClick={handleSave}>Kaydet</Button></div></div></Modal>)}
      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 1. DERS YÖNETİMİ
const LessonModule = ({ student, curriculum, setCurriculum, onUpdateStudent, user }) => {
 
  const [selectedCourseId, setSelectedCourseId] = useState(curriculum[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(null); 
  const [newItem, setNewItem] = useState({ name: "", parentId: "" }); 
  const [bulkText, setBulkText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
 if (user.role === 'student') return <div className="text-white text-center mt-20">Bu alana erişim yetkiniz yok.</div>;
  const selectedCourse = curriculum.find(c => c.id === selectedCourseId);
  const toggleStatus = (topicId, type) => { const currentStatus = student.lessons[topicId] || {}; const newStatus = { ...currentStatus, [type]: !currentStatus[type] }; onUpdateStudent({ ...student, lessons: { ...student.lessons, [topicId]: newStatus } }); };
  
  const handleAddItem = () => {
    if (showAddModal === 'course') { if(!newItem.name) return; const newCourse = { id: Date.now().toString(), name: newItem.name, units: [] }; setCurriculum([...curriculum, newCourse]); setSelectedCourseId(newCourse.id); } 
    else if (showAddModal === 'unit' || showAddModal === 'topic') { const names = bulkText ? bulkText.split('\n').filter(n => n.trim()) : (newItem.name ? [newItem.name] : []); if(names.length === 0) return; const updatedCurriculum = curriculum.map(c => { if (c.id === selectedCourseId) { if (showAddModal === 'unit') { const newUnits = names.map(name => ({ id: Math.random().toString(36).substr(2, 9), name, topics: [] })); return { ...c, units: [...c.units, ...newUnits] }; } else { return { ...c, units: c.units.map(u => u.id === newItem.parentId ? { ...u, topics: [...u.topics, ...names] } : u) }; } } return c; }); setCurriculum(updatedCurriculum); }
    setShowAddModal(null); setNewItem({ name: "", parentId: "" }); setBulkText("");
  };
  
  const requestDelete = (e, type, id, parentId = null) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({ type, id, parentId }); };
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, id, parentId } = deleteConfirm;
    if (type === 'course') { const newCurriculum = curriculum.filter(c => c.id !== id); setCurriculum(newCurriculum); if(selectedCourseId === id) setSelectedCourseId(newCurriculum[0]?.id || null); } 
    else if (type === 'unit') { const updatedCurriculum = curriculum.map(c => c.id === selectedCourseId ? { ...c, units: c.units.filter(u => u.id !== id) } : c); setCurriculum(updatedCurriculum); } 
    else if (type === 'topic') { const updatedCurriculum = curriculum.map(c => c.id === selectedCourseId ? { ...c, units: c.units.map(u => u.id === parentId ? { ...u, topics: u.topics.filter(t => t !== id) } : u) } : c); setCurriculum(updatedCurriculum); } 
    setDeleteConfirm(null);
  };
  
  const LABELS = [{ id: 'konu', label: 'Konu', color: 'bg-emerald-500' }, { id: 'soru', label: 'Soru', color: 'bg-blue-500' }, { id: 't1', label: '1. Tekrar', color: 'bg-purple-500' }, { id: 't2', label: '2. Tekrar', color: 'bg-pink-500' }, { id: 't3', label: '3. Tekrar', color: 'bg-orange-500' }];
  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)] animate-fade-in">
        <div className="w-full md:w-1/4 flex flex-col gap-2 max-h-60 md:max-h-full overflow-y-auto pr-2 custom-scrollbar"><div className="flex justify-between items-center mb-2"><h3 className="text-orange-500 font-bold">Dersler</h3><Button size="small" icon={Plus} onClick={() => setShowAddModal('course')} /></div>{curriculum.map(c => (<div key={c.id} className="flex gap-2"><button onClick={() => setSelectedCourseId(c.id)} className={`flex-1 p-3 rounded-lg text-left transition-all ${selectedCourseId === c.id ? 'bg-slate-800 border border-orange-500 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>{c.name}</button><button onClick={(e) => requestDelete(e, 'course', c.id)} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-500/50 group"><Trash2 size={16} className="group-hover:text-red-500"/></button></div>))}</div>
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6 overflow-y-auto custom-scrollbar">{selectedCourse ? (<><div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-800 gap-4"><h2 className="text-xl font-bold text-white">{selectedCourse.name}</h2><div className="flex gap-3"><Button size="small" variant="secondary" icon={Plus} onClick={() => setShowAddModal('unit')}>Ünite Ekle</Button><Button size="small" variant="secondary" icon={Plus} onClick={() => { setNewItem({...newItem, parentId: selectedCourse.units[0]?.id}); setShowAddModal('topic'); }}>Konu Ekle</Button></div></div>{selectedCourse.units.map(unit => (<div key={unit.id} className="mb-6 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"><div className="bg-slate-800 p-3 flex justify-between items-center"><h4 className="text-orange-500 font-bold">{unit.name}</h4><button onClick={(e) => requestDelete(e, 'unit', unit.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={14}/></button></div><div className="divide-y divide-slate-800">{unit.topics.map((topic, idx) => { const key = `${selectedCourse.id}-${unit.id}-${idx}`; const status = student.lessons[key] || {}; return (<div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 hover:bg-slate-800/50 transition-colors gap-2"><span className="text-slate-300 text-sm font-medium">{topic}</span><div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end"><div className="flex gap-3 mr-4">{LABELS.map(lbl => (<div key={lbl.id} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => toggleStatus(key, lbl.id)}><div className={`w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center transition-all ${status[lbl.id] ? `${lbl.color} border-transparent` : 'hover:border-slate-400 bg-slate-800'}`}>{status[lbl.id] && <Check size={10} className="text-white"/>}</div><span className="text-[9px] text-slate-500 font-medium whitespace-nowrap group-hover:text-slate-300 transition-colors">{lbl.label}</span></div>))}</div><button onClick={(e) => requestDelete(e, 'topic', topic, unit.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={14}/></button></div></div>) })}</div></div>))}</>) : <div className="text-slate-500 text-center py-20">Ders seçiniz veya ekleyiniz.</div>}</div>
        {showAddModal && (<Modal title={showAddModal === 'course' ? 'Yeni Ders' : showAddModal === 'unit' ? 'Yeni Ünite' : 'Yeni Konu'} onClose={() => setShowAddModal(null)}><div className="space-y-4">{showAddModal === 'topic' && (<div><label className="block text-sm text-slate-400 mb-1">Hangi Üniteye?</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" value={newItem.parentId} onChange={e => setNewItem({...newItem, parentId: e.target.value})}><option value="">Seçiniz</option>{selectedCourse?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>)}{showAddModal === 'course' ? (<Input label="Ders Adı" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />) : (<div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase">{showAddModal === 'unit' ? 'Ünite İsimleri' : 'Konu İsimleri'} (Her satıra bir tane)</label><textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white h-32 focus:border-orange-500 outline-none" value={bulkText} onChange={e => setBulkText(e.target.value)}></textarea></div>)}<Button onClick={handleAddItem} className="w-full mt-4">Kaydet</Button></div></Modal>)}
        <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 2. HAFTALIK PROGRAM
const ScheduleModule = ({ student, curriculum, onUpdateStudent, user }) => {
  const [form, setForm] = useState({ day: 'Mon', courseId: '', unitId: '', topic: '', type: 'soru', count: '', source: '' });
  const [editingId, setEditingId] = useState(null); 
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const selectedCourse = curriculum.find(c => c.id === form.courseId);
  const selectedUnit = selectedCourse?.units.find(u => u.id === form.unitId);
  const availableResources = student.resources ? student.resources.filter(r => r.courseId === form.courseId) : [];
  const assignments = student.assignments || [];
  
  const weeklySolvedQuestions = assignments.filter(a => a.type === 'soru' && a.status === 'completed').reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
  const weeklyTaskCount = assignments.length;
  const weeklyCompletedCount = assignments.filter(a => a.status === 'completed').length;
  const completionRate = weeklyTaskCount > 0 ? Math.round((weeklyCompletedCount / weeklyTaskCount) * 100) : 0;
  const monthlySolved = (student.stats?.monthlySolved || 0) + weeklySolvedQuestions;
  const allTimeSolved = (student.stats?.totalSolved || 0) + weeklySolvedQuestions;
  
  const handleAssign = () => {
    if(!form.courseId || !form.topic) return alert("Lütfen ders ve konu seçiniz."); if(form.type === 'soru' && !form.count) return alert("Soru sayısı giriniz.");
    if (editingId) { const updatedAssignments = assignments.map(a => a.id === editingId ? { ...a, ...form, subject: selectedCourse.name } : a); onUpdateStudent({ ...student, assignments: updatedAssignments }); setEditingId(null); } 
    else { const newAssignment = { id: Date.now(), status: 'pending', subject: selectedCourse.name, ...form }; onUpdateStudent({ ...student, assignments: [...assignments, newAssignment] }); }
    setForm(prev => ({ ...prev, count: '', source: '', unitId: '', topic: '' })); 
  };
  const handleEdit = (task) => { const course = curriculum.find(c => c.name === task.subject); setForm({ day: task.day, courseId: course ? course.id : '', unitId: task.unitId || '', topic: task.topic, type: task.type, count: task.count, source: task.source || '' }); setEditingId(task.id); window.scrollTo(0,0); };
  const handleCancelEdit = () => { setEditingId(null); setForm(prev => ({ ...prev, count: '', source: '', unitId: '', topic: '' })); };
  const toggleTaskStatus = (id) => { 
    const updated = assignments.map(a => a.id === id ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } : a); 
    let newStats = { ...student.stats };
    const task = assignments.find(a => a.id === id);
    if (task && task.status !== 'completed') { newStats.xp = (newStats.xp || 0) + 50; newStats.level = Math.floor(newStats.xp / 1000) + 1; }
    onUpdateStudent({ ...student, assignments: updated, stats: newStats }); 
  };
  
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = assignments.filter(a => a.id !== deleteConfirm); onUpdateStudent({ ...student, assignments: filtered }); setDeleteConfirm(null); } };
  
  const handleResetSchedule = () => {
    if(window.confirm("Haftalık programı sıfırlamak üzeresiniz. Mevcut program arşive eklenecek ve liste temizlenecek. Onaylıyor musunuz?")) {
      const newTotalSolved = (student.stats?.totalSolved || 0) + weeklySolvedQuestions;
      const newMonthlySolved = (student.stats?.monthlySolved || 0) + weeklySolvedQuestions;
      const archivedWeek = { id: Date.now(), date: new Date().toLocaleDateString('tr-TR'), assignments: assignments, solvedCount: weeklySolvedQuestions };
      onUpdateStudent({ ...student, assignments: [], pastWeeks: [archivedWeek, ...(student.pastWeeks || [])], stats: { ...student.stats, totalSolved: newTotalSolved, monthlySolved: newMonthlySolved } });
    }
  };
  
  const getDailyStats = (dayId) => { const dayTasks = assignments.filter(a => a.day === dayId); return { topic: dayTasks.filter(t => t.type === 'konu').length, question: dayTasks.filter(t => t.type === 'soru').reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0), repeat: dayTasks.filter(t => t.type === 'tekrar').length, exam: dayTasks.filter(t => t.type === 'deneme').length }; };
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isStudent = user.role === 'student';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Haftalık Planlama</h2>{isAdmin && <Button variant="danger" size="small" icon={RefreshCw} onClick={handleResetSchedule}>Haftayı Sıfırla & Arşivle</Button>}</div>
      {isAdmin && (
        <Card title={editingId ? "Ödevi Düzenle" : "Hızlı Ödev Atama"} className="bg-slate-800/50"><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Ders</label><select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value, unitId: '', topic: '', source: ''})}><option value="">Seçiniz</option>{curriculum.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Ünite</label><select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm" value={form.unitId} onChange={e => setForm({...form, unitId: e.target.value, topic: ''})} disabled={!selectedCourse}><option value="">Seçiniz</option>{selectedCourse?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Konu</label><select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} disabled={!selectedUnit}><option value="">Seçiniz</option>{selectedUnit?.topics.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Gün</label><select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>{DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div></div><div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Tip</label><select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Soru Sayısı</label><input type="number" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm disabled:opacity-50" placeholder="Örn: 50" disabled={form.type !== 'soru'} value={form.count} onChange={e => setForm({...form, count: e.target.value})} /></div><div><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Kaynak</label><select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm" value={form.source} onChange={e => setForm({...form, source: e.target.value})}><option value="">Kaynak Seçiniz / Diğer</option>{availableResources.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</select></div><div className="flex gap-2"><Button onClick={handleAssign} icon={editingId ? Save : Plus} className="flex-1">{editingId ? 'Güncelle' : 'Ekle'}</Button>{editingId && <Button onClick={handleCancelEdit} variant="secondary">İptal</Button>}</div></div></Card>
      )}
      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-7 md:overflow-visible">
          {DAYS.map(day => { 
            const dayTasks = assignments.filter(a => a.day === day.id); 
            const stats = getDailyStats(day.id); 
            return (
            <div key={day.id} className="min-w-[280px] md:min-w-0 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-full snap-center">
                <div className="p-3 border-b border-slate-800 bg-slate-900 rounded-t-xl text-center"><span className="font-bold text-slate-300 text-sm">{day.label}</span><span className="block text-xs text-slate-500">{dayTasks.length} Görev</span></div>
                <div className="p-2 space-y-2 flex-1">
                    {dayTasks.map(task => (<div key={task.id} className={`p-3 rounded-lg border text-xs group relative ${task.status === 'completed' ? 'bg-emerald-900/20 border-emerald-900/50 opacity-75' : 'bg-slate-800 border-slate-700'}`}><div className="flex justify-between items-start"><span className="font-bold text-orange-400 truncate w-full pr-12">{task.subject}</span><div className="flex gap-1 absolute right-2 top-2 z-10 bg-slate-800/80 p-1 rounded backdrop-blur-sm shadow-sm border border-slate-700">{isAdmin && <button onClick={(e) => {e.stopPropagation(); handleEdit(task)}} className="text-slate-400 hover:text-blue-400 p-2"><Edit2 size={12}/></button>}{!isStudent && <button onClick={(e) => requestDelete(e, task.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={12}/></button>}</div></div><div className="text-white mt-1 text-sm font-medium line-clamp-2">{task.topic}</div><div className="mt-2 flex flex-col gap-1"><div className="flex justify-between items-center text-xs text-slate-300"><span className="bg-slate-700/50 px-1.5 py-0.5 rounded">{TASK_TYPES.find(t=>t.id === task.type)?.label}</span>{task.type === 'soru' && <span className="font-bold text-orange-300">{task.count} Soru</span>}</div>{task.source && (<div className="flex items-center gap-1 text-xs text-blue-300 mt-0.5"><Book size={10} /><span className="truncate">{task.source}</span></div>)}</div><button onClick={() => toggleTaskStatus(task.id)} className={`mt-2 w-full py-2 rounded flex items-center justify-center gap-1 ${task.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{task.status === 'completed' ? <Check size={14}/> : 'Tamamla'}</button></div>))}
                    {dayTasks.length === 0 && <div className="text-center py-8 text-slate-600 text-xs">Boş Gün</div>}
                </div>
                <div className="p-3 bg-slate-900/80 border-t border-slate-800 rounded-b-xl text-[10px] space-y-1"><div className="flex justify-between text-slate-400"><span>Konu:</span> <span className="text-white font-bold">{stats.topic}</span></div><div className="flex justify-between text-slate-400"><span>Soru:</span> <span className="text-orange-400 font-bold">{stats.question}</span></div><div className="flex justify-between text-slate-400"><span>Tekrar:</span> <span className="text-white font-bold">{stats.repeat}</span></div><div className="flex justify-between text-slate-400"><span>Deneme:</span> <span className="text-white font-bold">{stats.exam}</span></div></div>
            </div>) 
        })}
      </div>
       <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"><Card className="bg-slate-900 border-l-4 border-l-blue-500"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><Zap size={20}/></div><span className="text-xs uppercase font-bold text-slate-400">Haftalık Performans</span></div><div className="flex justify-between items-end"><div><div className="text-2xl font-bold text-white">{weeklySolvedQuestions} <span className="text-sm font-normal text-slate-500">Soru</span></div></div><div className="text-right"><div className="text-xl font-bold text-blue-400">%{completionRate}</div><div className="text-[10px] text-slate-500">Tamamlanma</div></div></div></Card><Card className="bg-slate-900 border-l-4 border-l-purple-500"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-purple-500/20 rounded-lg text-purple-500"><Calendar size={20}/></div><span className="text-xs uppercase font-bold text-slate-400">Aylık Toplam</span></div><div className="text-3xl font-bold text-white mt-2">{(monthlySolved || 0).toLocaleString()}</div></Card><Card className="bg-slate-900 border-l-4 border-l-emerald-500"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><Award size={20}/></div><span className="text-xs uppercase font-bold text-slate-400">Tüm Zamanlar</span></div><div className="text-3xl font-bold text-white mt-2">{(allTimeSolved || 0).toLocaleString()}</div></Card><Card className="bg-slate-900 border-l-4 border-l-orange-500"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-orange-500/20 rounded-lg text-orange-500"><List size={20}/></div><span className="text-xs uppercase font-bold text-slate-400">Görev Durumu</span></div><div className="grid grid-cols-2 gap-2 mt-2"><div className="bg-slate-800 p-2 rounded text-center"><div className="text-lg font-bold text-white">{weeklyCompletedCount}</div><div className="text-[10px] text-slate-500">Biten</div></div><div className="bg-slate-800 p-2 rounded text-center"><div className="text-lg font-bold text-slate-400">{weeklyTaskCount - weeklyCompletedCount}</div><div className="text-[10px] text-slate-500">Kalan</div></div></div></Card></div>
      {student.pastWeeks?.length > 0 && (<Card title="Geçmiş Haftalar Arşivi" className="mt-8"><div className="space-y-4">{student.pastWeeks.map(week => (<div key={week.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center"><div><div className="font-bold text-white text-sm">Hafta: {week.date}</div><div className="text-xs text-slate-400">{week.assignments.length} Görev Planlandı</div></div><div className="text-right"><div className="text-orange-400 font-bold">{week.solvedCount} Soru Çözüldü</div></div></div>))}</div></Card>)}
    </div>
  );
};

// 3. HEDEFLER
const GoalsModule = ({ student, onUpdateStudent, user }) => {
  const [showModal, setShowModal] = useState(false); const [editingId, setEditingId] = useState(null); const [form, setForm] = useState({ text: '', target: '', days: [] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const goals = student.goals || [];
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const isStudent = user.role === 'student';
  const handleDayToggle = (dayId) => { setForm(prev => { const days = prev.days.includes(dayId) ? prev.days.filter(d => d !== dayId) : [...prev.days, dayId]; return { ...prev, days }; }); };
  const handleSave = () => { if(!form.text || form.days.length === 0) return alert("Hedef adı ve en az bir gün seçiniz."); if(editingId) { const updated = goals.map(g => g.id === editingId ? { ...g, ...form } : g); onUpdateStudent({ ...student, goals: updated }); setEditingId(null); } else { const newGoal = { id: Date.now(), status: {}, ...form }; onUpdateStudent({ ...student, goals: [...goals, newGoal] }); } setShowModal(false); setForm({ text: '', target: '', days: [] }); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { onUpdateStudent({ ...student, goals: goals.filter(g => g.id !== deleteConfirm) }); setDeleteConfirm(null); } };
  const handleEdit = (goal) => { setForm({ text: goal.text, target: goal.target, days: goal.days }); setEditingId(goal.id); setShowModal(true); };
  const toggleGoalStatus = (goalId, dayId) => { const goal = goals.find(g => g.id === goalId); const key = `${goalId}-${dayId}`; const newStatus = { ...goal.status, [key]: !goal.status[key] }; onUpdateStudent({ ...student, goals: goals.map(g => g.id === goalId ? { ...g, status: newStatus } : g) }); };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Haftalık Hedef Takibi</h2>{isAdmin && <Button icon={Plus} onClick={() => setShowModal(true)}>Yeni Hedef Ekle</Button>}</div>
      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-7 md:overflow-visible">
        {DAYS.map(day => {
          const dailyGoals = goals.filter(g => g.days.includes(day.id));
          return (
            <div key={day.id} className="min-w-[200px] md:min-w-0 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-full snap-center">
              <div className="p-3 border-b border-slate-800 bg-slate-900 rounded-t-xl text-center"><span className="font-bold text-slate-300 text-sm">{day.label}</span></div>
              <div className="p-2 space-y-2 flex-1">
                {dailyGoals.map(goal => {
                  const isCompleted = goal.status[`${goal.id}-${day.id}`];
                  return (
                    <div key={goal.id} className={`p-3 rounded-lg border text-xs relative group ${isCompleted ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="font-bold text-orange-400 mb-1">{goal.text}</div>{goal.target && (<div className="text-xs text-emerald-300 mb-2 flex items-center gap-1.5 bg-emerald-900/20 py-1 px-2 rounded w-fit mt-1"><Target size={12}/> <span className="font-medium">{goal.target}</span></div>)}
                      <div className="absolute top-2 right-2 flex gap-1 bg-slate-900/50 rounded px-1">{isAdmin && <button onClick={() => handleEdit(goal)} className="text-slate-500 hover:text-blue-400 p-2"><Edit2 size={12}/></button>}{!isStudent && <button onClick={(e) => requestDelete(e, goal.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={12}/></button>}</div>
                      <button onClick={() => toggleGoalStatus(goal.id, day.id)} className={`w-full py-2 rounded flex items-center justify-center gap-1 ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{isCompleted ? <Check size={14}/> : 'Yapıldı'}</button>
                    </div>
                  );
                })}
                {dailyGoals.length === 0 && <div className="text-center py-8 text-slate-600 text-xs">-</div>}
              </div>
            </div>
          );
        })}
      </div>
      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
      {showModal && (<Modal title={editingId ? "Hedefi Düzenle" : "Yeni Hedef Ekle"} onClose={() => {setShowModal(false); setEditingId(null); setForm({ text: '', target: '', days: [] });}}><div className="space-y-4"><Input label="Hedef Başlığı" placeholder="Örn: Kitap Okuma" value={form.text} onChange={e => setForm({...form, text: e.target.value})} /><Input label="Hedef / Miktar" placeholder="Örn: 20 Sayfa / 30 Dk" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /><div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Günler</label><div className="flex flex-wrap gap-2">{DAYS.map(day => (<button key={day.id} onClick={() => handleDayToggle(day.id)} className={`px-3 py-2 rounded text-sm transition-colors ${form.days.includes(day.id) ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{day.label}</button>))}</div></div><Button onClick={handleSave} className="w-full mt-4">Kaydet</Button></div></Modal>)}
    </div>
  );
};

// 4. KAYNAKLAR
const ResourceModule = ({ student, curriculum, onUpdateStudent, user }) => {
 
  const [selectedCourseId, setSelectedCourseId] = useState(curriculum[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false); const [showDetailModal, setShowDetailModal] = useState(null); const [newResource, setNewResource] = useState({ name: '', publisher: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
   if (user.role === 'student') return <div className="text-white text-center mt-20">Bu alana erişim yetkiniz yok.</div>;
  const selectedCourse = curriculum.find(c => c.id === selectedCourseId);
  const resources = student.resources ? student.resources.filter(r => r.courseId === selectedCourseId) : [];
  const handleAddResource = () => { if(!newResource.name) return; const res = { id: Date.now(), courseId: selectedCourseId, name: newResource.name, publisher: newResource.publisher, progress: 0, notes: '', completedTopics: [] }; onUpdateStudent({ ...student, resources: [...(student.resources || []), res] }); setShowAddModal(false); setNewResource({ name: '', publisher: '' }); };
  const updateResource = (updatedRes) => { const updatedList = student.resources.map(r => r.id === updatedRes.id ? updatedRes : r); onUpdateStudent({ ...student, resources: updatedList }); if(showDetailModal) setShowDetailModal(updatedRes); };
  
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const updatedList = student.resources.filter(r => r.id !== deleteConfirm); onUpdateStudent({ ...student, resources: updatedList }); setDeleteConfirm(null); } };
  
  const toggleTopicCompletion = (resource, uniqueTopicKey) => { const isCompleted = resource.completedTopics?.includes(uniqueTopicKey); let newCompleted = resource.completedTopics || []; if (isCompleted) newCompleted = newCompleted.filter(t => t !== uniqueTopicKey); else newCompleted = [...newCompleted, uniqueTopicKey]; let totalTopics = 0; selectedCourse.units.forEach(u => totalTopics += u.topics.length); const progress = totalTopics > 0 ? Math.round((newCompleted.length / totalTopics) * 100) : 0; updateResource({ ...resource, completedTopics: newCompleted, progress }); };
  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)] animate-fade-in">
      <div className="w-full md:w-1/4 flex flex-col gap-2 max-h-60 md:max-h-full overflow-y-auto pr-2 custom-scrollbar">{curriculum.map(c => (<button key={c.id} onClick={() => setSelectedCourseId(c.id)} className={`p-4 rounded-lg text-left transition-all flex justify-between items-center ${selectedCourseId === c.id ? 'bg-slate-800 border border-orange-500 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}><span>{c.name}</span><span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{student.resources?.filter(r => r.courseId === c.id).length || 0}</span></button>))}</div>
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6 overflow-y-auto custom-scrollbar"><div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800"><h2 className="text-xl font-bold text-white">{selectedCourse?.name} Kaynakları</h2><Button size="small" icon={Plus} onClick={() => setShowAddModal(true)}>Kaynak Ekle</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{resources.map(res => (<div key={res.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors"><div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-white text-lg">{res.name}</h3><div className="text-sm text-slate-500">{res.publisher}</div></div><button onClick={(e) => requestDelete(e, res.id)} className="text-slate-600 hover:text-red-500 group p-2"><Trash2 size={16} className="group-hover:text-red-500"/></button></div><div className="mt-4"><div className="flex justify-between text-xs text-slate-400 mb-1"><span>İlerleme</span><span>%{res.progress}</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-500" style={{width: `${res.progress}%`}}></div></div></div><div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center"><div className="text-xs text-slate-500 flex items-center gap-1"><Check size={12} className="text-emerald-500"/>{res.completedTopics?.length || 0} Konu Bitti</div><Button size="small" variant="secondary" onClick={() => setShowDetailModal(res)}>Detay & Düzenle</Button></div></div>))}{resources.length === 0 && <div className="col-span-2 text-center py-10 text-slate-500">Bu ders için eklenmiş kaynak yok.</div>}</div></div>
      {showAddModal && (<Modal title="Yeni Kaynak Ekle" onClose={() => setShowAddModal(false)}><div className="space-y-4"><Input label="Kaynak Adı" placeholder="Örn: 3D TYT Matematik Soru Bankası" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} /><Input label="Yayıncı" placeholder="Örn: 3D Yayınları" value={newResource.publisher} onChange={e => setNewResource({...newResource, publisher: e.target.value})} /><Button onClick={handleAddResource} className="w-full mt-4">Ekle</Button></div></Modal>)}
      {showDetailModal && (<Modal title={showDetailModal.name} onClose={() => setShowDetailModal(null)}><div className="space-y-6"><div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase">İlerleme Durumu (%)</label><div className="flex gap-4 items-center"><input type="range" min="0" max="100" className="w-full accent-orange-500" value={showDetailModal.progress} onChange={e => updateResource({...showDetailModal, progress: parseInt(e.target.value)})} /><span className="font-bold text-white w-10 text-right">%{showDetailModal.progress}</span></div></div><div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Notlar</label><textarea className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm h-24" value={showDetailModal.notes} onChange={e => updateResource({...showDetailModal, notes: e.target.value})} placeholder="Bu kaynakla ilgili notlar..." /></div><div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Konu Takibi (Bu Kitap İçin)</label><div className="bg-slate-800 rounded-lg p-2 max-h-60 overflow-y-auto custom-scrollbar space-y-4">{selectedCourse.units.map(unit => (<div key={unit.id}><div className="text-orange-500 text-xs font-bold px-2 mb-1">{unit.name}</div>{unit.topics.map((topic, idx) => { const key = `${unit.id}-${idx}`; const isChecked = showDetailModal.completedTopics?.includes(key); return (<div key={key} onClick={() => toggleTopicCompletion(showDetailModal, key)} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded cursor-pointer"><div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>{isChecked && <Check size={10} className="text-white"/>}</div><span className={`text-sm ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>{topic}</span></div>) })}</div>))}</div></div></div></Modal>)}
      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 5. GELİŞMİŞ DENEME TAKİBİ
const ExamModule = ({ student, onUpdateStudent, user }) => {
  const [view, setView] = useState('list'); const [filterType, setFilterType] = useState('ALL'); const [branchFilter, setBranchFilter] = useState('mat');
  const [examType, setExamType] = useState('TYT'); const [formData, setFormData] = useState({ name: "", date: new Date().toISOString().split('T')[0], difficulty: "Orta", stats: { turkey: { rank: '', total: '' }, city: { rank: '', total: '' }, school: { rank: '', total: '' } }, details: {}, branchSubject: 'mat', duration: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if (view === 'add' && examType !== 'BRANS') { const initialDetails = {}; EXAM_TYPES[examType].groups.forEach(group => { group.sections.forEach(sec => { initialDetails[sec.key] = { d: '', y: '' }; }); }); setFormData(prev => ({ ...prev, details: initialDetails })); } else if (view === 'add' && examType === 'BRANS') { setFormData(prev => ({ ...prev, details: { [prev.branchSubject]: { d: '', y: '' } } })); } }, [examType, view, formData.branchSubject]);
  
  const getNetFormula = (d, y) => { const dVal = parseFloat(d) || 0; const yVal = parseFloat(y) || 0; const divisor = examType === 'LGS' ? 3 : 4; return Math.max(0, dVal - yVal / divisor); }
  const handleSave = () => { if(!formData.name) return alert("Lütfen deneme adını giriniz."); let totalNet = 0; const processedDetails = {}; Object.keys(formData.details).forEach(key => { const { d, y } = formData.details[key]; const net = getNetFormula(d, y); processedDetails[key] = { d, y, n: net }; totalNet += net; }); const newExam = { id: Date.now(), type: examType, subject: examType === 'BRANS' ? formData.branchSubject : null, ...formData, totalNet, details: processedDetails }; onUpdateStudent({ ...student, exams: [newExam, ...student.exams] }); setView('list'); setFormData({ name: "", date: new Date().toISOString().split('T')[0], difficulty: "Orta", stats: { turkey: { rank: '', total: '' }, city: { rank: '', total: '' }, school: { rank: '', total: '' } }, details: {}, branchSubject: 'mat', duration: '' }); };
  
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = student.exams.filter(e => e.id !== deleteConfirm); onUpdateStudent({ ...student, exams: filtered }); setDeleteConfirm(null); } };
  
  const updateDetail = (key, field, value) => setFormData(prev => ({ ...prev, details: { ...prev.details, [key]: { ...prev.details[key], [field]: value } } }));
  const updateStat = (scope, field, value) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, [scope]: { ...prev.stats[scope], [field]: value } } }));
  let filteredExams = student.exams || []; if (filterType !== 'ALL') { filteredExams = filteredExams.filter(e => e.type === filterType); if (filterType === 'BRANS') filteredExams = filteredExams.filter(e => e.subject === branchFilter); } else { filteredExams = filteredExams.filter(e => e.type !== 'BRANS'); }
  const chartData = [...filteredExams].reverse();
  
  // --- İSTATİSTİK KUTULARI (Tüm dersleri gösterecek şekilde güncellendi) ---
  const getBestScores = () => { 
    if(filterType === 'ALL' || filterType === 'BRANS') return null;
    const relevantExams = student.exams.filter(e => e.type === filterType); 
    if(relevantExams.length === 0) return null; 
    
    // Tüm alt branş anahtarlarını topla
    const subjectKeys = [];
    EXAM_TYPES[filterType].groups.forEach(g => g.sections.forEach(s => subjectKeys.push(s))); 
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Toplam Deneme</div>
          <div className="text-xl font-bold text-white">{relevantExams.length}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">En Yüksek Net</div>
          <div className="text-xl font-bold text-orange-500">{Math.max(...relevantExams.map(e => e.totalNet)).toFixed(2)}</div>
        </div>
        {/* Tüm dersler için döngü */}
        {subjectKeys.map(sub => (
          <div key={sub.key} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 max-w-full truncate" title={`En İyi ${sub.label}`}>{sub.label}</div>
            <div className="text-xl font-bold text-emerald-400">
              {Math.max(...relevantExams.map(e => e.details[sub.key]?.n || 0)).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getTableHeaders = () => { if(filterType === 'ALL') return ['Tarih', 'Sınav Adı', 'Tür', 'Net', 'İşlem']; if(filterType === 'BRANS') return ['Tarih', 'Sınav Adı', 'Ders', 'Süre', 'Net', 'İşlem']; const subjects = []; EXAM_TYPES[filterType].groups.forEach(g => g.sections.forEach(s => subjects.push(s.label))); return ['Tarih', 'Sınav Adı', ...subjects, 'Toplam', 'İşlem']; }
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 gap-4"><div className="flex flex-wrap gap-2 bg-slate-800 p-1 rounded-lg">{['ALL', 'TYT', 'AYT', 'LGS', 'BRANS'].map(type => (<button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filterType === type ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{type === 'ALL' ? 'Genel' : type === 'BRANS' ? 'Branş' : type}</button>))}</div>{filterType === 'BRANS' && (<select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:border-orange-500">{BRANCH_SUBJECTS.map(sub => <option key={sub.id} value={sub.id}>{sub.label}</option>)}</select>)}<div className="flex gap-2 ml-auto"><Button size="small" variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')}>Liste</Button>{isAdmin && <Button size="small" variant={view === 'add' ? 'primary' : 'ghost'} icon={Plus} onClick={() => setView('add')}>Ekle</Button>}</div></div>
      {view === 'list' && (<><Card title={`${filterType === 'BRANS' ? BRANCH_SUBJECTS.find(b=>b.id===branchFilter)?.label + ' Net Gelişimi' : 'Genel Net İlerleme Analizi'}`}><div className="h-64"><LineChart data={chartData} dataKey="totalNet" labelKey="date" /></div></Card>{getBestScores()}<Card title="Detaylı Sınav Arşivi"><div className="overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-800 text-slate-300 text-xs uppercase font-bold"><tr>{getTableHeaders().map((h, i) => <th key={i} className="p-4 text-center">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">{filteredExams.map(exam => (<tr key={exam.id} className="hover:bg-slate-800/30 group transition-colors"><td className="p-4 text-slate-500 text-center">{exam.date}</td><td className="p-4 font-medium text-white text-center">{exam.name}</td>{(filterType === 'ALL' || filterType === 'BRANS') ? (<><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${exam.type === 'BRANS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{exam.type === 'BRANS' ? BRANCH_SUBJECTS.find(s=>s.id === exam.subject)?.label : exam.type}</span></td>{filterType === 'BRANS' && <td className="p-4 text-center text-xs">{exam.duration ? exam.duration + ' dk' : '-'}</td>}</>) : (EXAM_TYPES[filterType].groups.flatMap(g => g.sections).map(sec => (<td key={sec.key} className="p-4 text-center">{exam.details[sec.key]?.n.toFixed(1) || '-'}</td>)))}<td className="p-4 text-center font-bold text-orange-500 text-lg">{exam.totalNet.toFixed(2)}</td><td className="p-4 text-center"><button onClick={(e) => requestDelete(e, exam.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded transition-colors group"><Trash2 size={16} className="group-hover:text-red-500" /></button></td></tr>))}{filteredExams.length === 0 && <tr><td colSpan="100%" className="p-8 text-center text-slate-500">Kayıt yok.</td></tr>}</tbody></table></div></Card></>)}
      {view === 'add' && (<div className="max-w-5xl mx-auto animate-fade-in"><Card title={examType === 'BRANS' ? 'Yeni Branş Denemesi' : 'Yeni Genel Deneme'}><div className="mb-8"><label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Sınav Türü</label><div className="flex flex-wrap gap-4">{[...Object.keys(EXAM_TYPES), 'BRANS'].map(type => (<button key={type} onClick={() => setExamType(type)} className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all font-bold text-lg ${examType === type ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-600'}`}>{type === 'BRANS' ? 'Branş' : EXAM_TYPES[type].label}</button>))}</div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">{examType === 'BRANS' && (<div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Branş Seçimi</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 outline-none" value={formData.branchSubject} onChange={e => setFormData({...formData, branchSubject: e.target.value})}>{BRANCH_SUBJECTS.map(sub => <option key={sub.id} value={sub.id}>{sub.label}</option>)}</select></div>)}<Input label="Deneme Adı *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn: 3D Matematik Branş-1" /><Input label="Tarih *" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />{examType !== 'BRANS' && (<div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Zorluk</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:border-orange-500 outline-none" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}><option>Kolay</option><option>Orta</option><option>Zor</option><option>Çok Zor</option></select></div>)}{examType === 'BRANS' && <Input label="Süre (dk) - İsteğe Bağlı" type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="Örn: 45" />}</div><div className="space-y-6 mb-8"><h4 className="text-orange-500 font-bold mb-4 border-b border-slate-700 pb-2 uppercase text-sm tracking-wider">Sonuç Girişi</h4>{examType === 'BRANS' ? (<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md"><div className="flex items-center justify-between"><span className="font-bold text-white text-lg">{BRANCH_SUBJECTS.find(s=>s.id === formData.branchSubject)?.label}</span><div className="flex gap-4"><div><label className="text-xs text-emerald-500 font-bold block mb-1">Doğru</label><input type="number" className="w-20 bg-slate-800 border border-slate-600 rounded p-3 text-white text-center font-bold text-lg focus:border-emerald-500 outline-none" value={formData.details[formData.branchSubject]?.d || ''} onChange={e => updateDetail(formData.branchSubject, 'd', e.target.value)} /></div><div><label className="text-xs text-red-500 font-bold block mb-1">Yanlış</label><input type="number" className="w-20 bg-slate-800 border border-slate-600 rounded p-3 text-white text-center font-bold text-lg focus:border-red-500 outline-none" value={formData.details[formData.branchSubject]?.y || ''} onChange={e => updateDetail(formData.branchSubject, 'y', e.target.value)} /></div></div></div></div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{EXAM_TYPES[examType].groups.map((group, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5"><h5 className="text-white font-bold mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div>{group.title}</h5><div className="space-y-3">{group.sections.map(sec => (<div key={sec.key} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-800"><div><span className="block text-sm font-medium text-slate-300">{sec.label}</span><span className="text-[10px] text-slate-500">{sec.q} Soru</span></div><div className="flex gap-2"><input type="number" placeholder="D" className="w-14 bg-slate-900 border border-slate-700 rounded p-2 text-white text-center text-sm focus:border-orange-500 outline-none" value={formData.details[sec.key]?.d || ''} onChange={e => updateDetail(sec.key, 'd', e.target.value)} /><input type="number" placeholder="Y" className="w-14 bg-slate-900 border border-slate-700 rounded p-2 text-white text-center text-sm focus:border-red-500 outline-none" value={formData.details[sec.key]?.y || ''} onChange={e => updateDetail(sec.key, 'y', e.target.value)} /></div></div>))}</div></div>))}</div>)}</div>{examType !== 'BRANS' && (<div className="mb-8 bg-slate-800/30 rounded-xl border border-slate-700 p-4"><h4 className="text-slate-400 text-sm font-bold mb-4 flex items-center gap-2"><Activity size="16" /> Sıralama Bilgileri (İsteğe Bağlı)</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{['turkey', 'city', 'school'].map(scope => (<div key={scope} className="bg-slate-900 p-4 rounded-lg border border-slate-800"><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{scope === 'turkey' ? 'Türkiye' : scope === 'city' ? 'İl Geneli' : 'Kurum'}</label><div className="flex gap-2"><input placeholder="Sıralama" type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={formData.stats[scope].rank} onChange={e => updateStat(scope, 'rank', e.target.value)} /><input placeholder="Katılım" type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" value={formData.stats[scope].total} onChange={e => updateStat(scope, 'total', e.target.value)} /></div></div>))}</div></div>)}<div className="flex justify-end gap-4 border-t border-slate-700 pt-6"><Button variant="secondary" onClick={() => setView('list')}>İptal</Button><Button onClick={handleSave} size="large" icon={Save}>Kaydet</Button></div></Card></div>)}
      <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 6. DUYGUDURUM TAKİBİ
const MoodModule = ({ student, onUpdateStudent, user }) => {
  
  const METRICS_CONFIG = [{ key: 'motivation', label: 'Motivasyon', color: '#3b82f6' }, { key: 'happiness', label: 'Mutluluk', color: '#10b981' }, { key: 'social', label: 'Sosyalleşme', color: '#f59e0b' }, { key: 'examAnxiety', label: 'Sınav Kaygısı', color: '#ef4444' }, { key: 'lessonAnxiety', label: 'Ders Kaygısı', color: '#8b5cf6' }, { key: 'performance', label: 'Performans', color: '#ec4899' }, { key: 'homeworkRate', label: 'Ödev Tamamlama', color: '#06b6d4' }];
  const [editingId, setEditingId] = useState(null); const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], metrics: { motivation: 50, happiness: 50, social: 50, examAnxiety: 50, lessonAnxiety: 50, performance: 50, homeworkRate: 50 } });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
if (user.role === 'student') return <div className="text-white text-center mt-20">Bu alana erişim yetkiniz yok.</div>;
  const handleSave = () => { let newMoods = [...student.moods]; if (editingId) { newMoods = newMoods.map(m => m.id === editingId ? { ...m, date: formData.date, metrics: formData.metrics } : m); } else { newMoods.push({ id: Date.now(), date: formData.date, metrics: formData.metrics }); } onUpdateStudent({ ...student, moods: newMoods }); setEditingId(null); setFormData({ ...formData, date: new Date().toISOString().split('T')[0] }); };
  const handleEdit = (mood) => { setEditingId(mood.id); setFormData({ date: mood.date, metrics: { ...mood.metrics } }); window.scrollTo(0,0); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = student.moods.filter(m => m.id !== deleteConfirm); onUpdateStudent({ ...student, moods: filtered }); setDeleteConfirm(null); } };
  
  const sortedMoods = [...student.moods].sort((a,b) => new Date(a.date) - new Date(b.date)); const flatData = sortedMoods.map(m => ({ date: m.date.substring(5), ...m.metrics }));
  return (
    <div className="space-y-8 animate-fade-in"><Card title={editingId ? "Duygudurum Düzenle" : "Yeni Duygudurum Girişi"} action={<div className="flex gap-4 items-center"><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-800 border-slate-700 text-white p-2 rounded text-sm"/><Button onClick={handleSave}>{editingId ? 'Güncelle' : 'Kaydet'}</Button></div>}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{METRICS_CONFIG.map(m => (<div key={m.key} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><label className="block text-sm text-slate-300 mb-2 font-medium">{m.label}</label><div className="flex items-center gap-3"><input type="range" min="0" max="100" value={formData.metrics[m.key]} onChange={e => setFormData({...formData, metrics: {...formData.metrics, [m.key]: parseInt(e.target.value)}})} className="w-full accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"/><span className="text-white font-bold w-10 text-right">{formData.metrics[m.key]}%</span></div></div>))}</div></Card><Card title="Kompozit Analiz (Genel Bakış)"><div className="h-64"><LineChart data={flatData} dataKey="motivation" labelKey="date" color="#3b82f6" /></div></Card><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{METRICS_CONFIG.map(metric => (<Card key={metric.key} title={metric.label} className="!p-4"><div className="h-40"><LineChart data={flatData} dataKey={metric.key} labelKey="date" color={metric.color} height={160} /></div></Card>))}</div><Card title="Geçmiş Kayıtlar"><div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-400"><thead className="bg-slate-800 text-slate-200"><tr><th className="p-4">Tarih</th>{METRICS_CONFIG.map(m => <th key={m.key} className="p-4">{m.label}</th>)}<th className="p-4">İşlem</th></tr></thead><tbody>{student.moods.sort((a,b)=> new Date(b.date)-new Date(a.date)).map(mood => (<tr key={mood.id} className="border-b border-slate-800"><td className="p-4">{mood.date}</td>{METRICS_CONFIG.map(m => <td key={m.key} className="p-4 text-center">{mood.metrics[m.key]}</td>)}<td className="p-4 flex gap-2"><button onClick={() => handleEdit(mood)}><Edit2 size="14" className="text-blue-400"/></button><button onClick={(e) => requestDelete(e, mood.id)} className="hover:text-red-500"><Trash2 size="14" className="text-red-400"/></button></td></tr>))}</tbody></table></div></Card>
    <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// 7. GÖRÜŞMELER & NOTLAR (GÜNCELLENDİ: WHITESPACE EKLENDİ)
const InterviewModule = ({ student, onUpdateStudent, user }) => {
  // Görüşme State'leri
  const [showModal, setShowModal] = useState(false);
  const [newInterview, setNewInterview] = useState({ date: new Date().toISOString().split('T')[0], title: "", note: "" });
  
  // Not State'leri
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ note: "" });

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // --- Görüşme Fonksiyonları ---
  const handleAddInterview = () => { 
    if(!newInterview.note) return; 
    const interview = { id: Date.now(), ...newInterview };
    onUpdateStudent({ ...student, interviews: [interview, ...student.interviews] }); 
    setShowModal(false); 
    setNewInterview({ date: new Date().toISOString().split('T')[0], title: "", note: "" }); 
  };

  const deleteInterview = (id) => {
    const filtered = student.interviews.filter(i => i.id !== id);
    onUpdateStudent({ ...student, interviews: filtered });
  };

  // --- Not Fonksiyonları ---
  const handleAddNote = () => {
    if(!newNote.note) return;
    const noteEntry = { id: Date.now(), date: new Date().toLocaleDateString('tr-TR'), text: newNote.note };
    // teacherNotes dizisi yoksa oluştur, varsa başına ekle
    const updatedNotes = [noteEntry, ...(student.teacherNotes || [])];
    onUpdateStudent({ ...student, teacherNotes: updatedNotes });
    setShowNoteModal(false);
    setNewNote({ note: "" });
  };

  const deleteNote = (id) => {
    const filtered = (student.teacherNotes || []).filter(n => n.id !== id);
    onUpdateStudent({ ...student, teacherNotes: filtered });
  };

  // Ortak Silme Mantığı
  const requestDelete = (e, type, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm({ type, id }); };
  
  const confirmDelete = () => { 
    if (deleteConfirm) { 
      if(deleteConfirm.type === 'interview') deleteInterview(deleteConfirm.id);
      if(deleteConfirm.type === 'note') deleteNote(deleteConfirm.id);
      setDeleteConfirm(null); 
    } 
  };

  if (user.role === 'student') return <div className="text-white text-center mt-20">Bu alana erişim yetkiniz yok.</div>;

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* --- BÖLÜM 1: GÖRÜŞME KAYITLARI --- */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Görüşme Kayıtları</h2>
          <Button onClick={() => setShowModal(true)} icon={Plus}>Yeni Görüşme</Button>
        </div>
        <div className="grid gap-4">
          {student.interviews.map(interview => (
            <div key={interview.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group">
              <div className="flex justify-between mb-2">
                <h3 className="font-bold text-white">{interview.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{interview.date}</span>
                  <button onClick={(e) => requestDelete(e, 'interview', interview.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                </div>
              </div>
              <p className="text-slate-400 text-sm whitespace-pre-wrap">{interview.note}</p>
            </div>
          ))}
          {student.interviews.length === 0 && <div className="text-center text-slate-500 py-4 text-sm">Henüz görüşme kaydı yok.</div>}
        </div>
      </div>

      <div className="border-t border-slate-800 my-6"></div>

      {/* --- BÖLÜM 2: ÖĞRENCİYE NOTLAR --- */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MessageSquare className="text-orange-500"/> Öğrenciye Notlar</h2>
          <Button onClick={() => setShowNoteModal(true)} variant="secondary" icon={Edit2}>Not Ekle</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(student.teacherNotes || []).map(note => (
             <div key={note.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative">
                <div className="text-xs text-orange-400 font-bold mb-2">{note.date}</div>
                <p className="text-slate-300 text-sm italic whitespace-pre-wrap">"{note.text}"</p>
                <button onClick={(e) => requestDelete(e, 'note', note.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500 p-1"><Trash2 size={14}/></button>
             </div>
          ))}
          {(!student.teacherNotes || student.teacherNotes.length === 0) && <div className="col-span-full text-center text-slate-500 py-4 text-sm">Öğrenci paneline düşecek bir not eklemediniz.</div>}
        </div>
      </div>

      {/* Görüşme Modalı */}
      {showModal && (
        <Modal title="Yeni Görüşme" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Tarih" type="date" value={newInterview.date} onChange={e => setNewInterview({...newInterview, date: e.target.value})} />
            <Input label="Başlık" value={newInterview.title} onChange={e => setNewInterview({...newInterview, title: e.target.value})} />
            <textarea className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white h-32 focus:border-orange-500 outline-none" value={newInterview.note} onChange={e => setNewInterview({...newInterview, note: e.target.value})} placeholder="Görüşme notları..." />
            <Button onClick={handleAddInterview}>Kaydet</Button>
          </div>
        </Modal>
      )}

      {/* Not Ekleme Modalı */}
      {showNoteModal && (
        <Modal title="Öğrenci Paneline Not Ekle" onClose={() => setShowNoteModal(false)}>
          <div className="space-y-4">
            <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20 text-orange-400 text-xs">
              Buraya yazdığınız notlar öğrenci kendi paneline girdiğinde "Öğretmenden Notlar" bölümünde görünecektir.
            </div>
            <textarea className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white h-32 focus:border-orange-500 outline-none" value={newNote.note} onChange={e => setNewNote({...newNote, note: e.target.value})} placeholder="Öğrenciye iletmek istediğiniz not..." />
            <Button onClick={handleAddNote}>Notu Yayınla</Button>
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
  const handleAdd = () => { if (!newPayment.amount) return; const payment = { id: Date.now(), ...newPayment }; onUpdateStudent({ ...student, payments: [payment, ...student.payments] }); setShowModal(false); setNewPayment({ date: new Date().toISOString().split('T')[0], amount: "", description: "", method: "Nakit" }); };
  const requestDelete = (e, id) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(id); };
  const confirmDelete = () => { if (deleteConfirm) { const filtered = student.payments.filter(p => p.id !== deleteConfirm); onUpdateStudent({ ...student, payments: filtered }); setDeleteConfirm(null); } };
   if (user.role === 'student') return <div className="text-white text-center mt-20">Bu alana erişim yetkiniz yok.</div>;
  const totalPaid = student.payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  return (
    <div className="animate-fade-in space-y-6"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Ödeme Takibi</h2><Button onClick={() => setShowModal(true)} icon={Plus}>Ödeme Ekle</Button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card className="bg-slate-900 border-l-4 border-l-emerald-500"><div className="text-slate-400 text-xs uppercase font-bold mb-2">Toplam Tahsilat</div><div className="text-3xl font-bold text-white">{totalPaid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div></Card><Card className="bg-slate-900 border-l-4 border-l-blue-500"><div className="text-slate-400 text-xs uppercase font-bold mb-2">Son İşlem</div><div className="text-xl font-bold text-white">{student.payments[0]?.date || '-'}</div></Card></div><Card title="Ödeme Geçmişi"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-800 text-slate-200"><tr><th className="p-4">Tarih</th><th className="p-4">Açıklama</th><th className="p-4">Yöntem</th><th className="p-4 text-right">Tutar</th><th className="p-4 text-right">İşlem</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">{student.payments.map(p => (<tr key={p.id} className="hover:bg-slate-800/30"><td className="p-4">{p.date}</td><td className="p-4 font-medium text-white">{p.description}</td><td className="p-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{p.method}</span></td><td className="p-4 text-right font-bold text-emerald-400">{Number(p.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td><td className="p-4 text-right"><button onClick={(e) => requestDelete(e, p.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={16}/></button></td></tr>))}{student.payments.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Ödeme kaydı bulunamadı.</td></tr>}</tbody></table></div></Card>{showModal && (<Modal title="Yeni Ödeme Alındısı" onClose={() => setShowModal(false)}><div className="space-y-4"><Input label="Tarih" type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} /><Input label="Tutar (TL)" type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} /><Input label="Açıklama" placeholder="Örn: Kasım 2025 Koçluk Ücreti" value={newPayment.description} onChange={e => setNewPayment({...newPayment, description: e.target.value})} /><div><label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Ödeme Yöntemi</label><select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none" value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})}><option>Nakit</option><option>Havale/EFT</option><option>Kredi Kartı</option></select></div><Button onClick={handleAdd} className="w-full mt-4">Kaydet</Button></div></Modal>)}
    <DeleteConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
    </div>
  );
};

// --- LOGIN SCREEN (GÜNCELLENDİ: MULTI-ADMIN DESTEĞİ) ---
const LoginScreen = ({ onLogin, students, admins, isFirebase, isLoading }) => {
  const [activeTab, setActiveTab] = useState('admin');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = () => {
    setError('');
    if (activeTab === 'admin') {
      // 1. Süper Admin Kontrolü
      if (password === 'canmete21') {
         onLogin({ role: 'superadmin', id: SUPER_ADMIN_ID, name: 'Hamza Metehan Kılıç' });
         return;
      }
      
      // 2. Diğer Adminlerin Kontrolü
      const adminUser = admins.find(a => a.username === username && a.password === password);
      if (adminUser) {
         onLogin({ role: 'admin', id: adminUser.id, name: adminUser.name });
         return;
      }

      setError('Hatalı yönetici bilgisi.');
    } else {
      // Öğrenci Girişi
      const student = students.find(s => s.username === username && s.password === password);
      if (student) onLogin({ role: 'student', id: student.id, name: student.name });
      else setError('Hatalı kullanıcı adı veya şifre.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-orange-500 font-bold animate-pulse">Sistem Yükleniyor...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"><div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl relative">
        {!isFirebase && <div className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded border border-yellow-500/30 flex items-center gap-1"><CloudOff size={12}/> Demo Modu</div>}
        {isFirebase && <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-500 text-[10px] px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1"><Cloud size={12}/> Canlı Bağlantı</div>}
        <div className="text-center mb-8"><h1 className="text-2xl font-bold text-white mb-1">Hamza Metehan Kılıç</h1><p className="text-orange-500 text-sm mb-4 font-medium">Uzman Psikolojik Danışman</p><p className="text-slate-500 text-xs">Giriş Yapın</p></div><div className="flex bg-slate-800 p-1 rounded-lg mb-6"><button onClick={() => {setActiveTab('admin'); setError(''); setPassword('');}} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>Yönetici / Öğretmen</button><button onClick={() => {setActiveTab('student'); setError(''); setPassword('');}} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'student' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>Öğrenci</button></div><div className="space-y-4">{activeTab === 'admin' && <Input label="Kullanıcı Adı (Süper Admin için boş geçin)" value={username} onChange={e => setUsername(e.target.value)} />}{activeTab === 'student' && <Input label="Kullanıcı Adı" value={username} onChange={e => setUsername(e.target.value)} />}<Input label="Şifre" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />{error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">{error}</div>}<Button size="large" className="w-full" onClick={handleLogin}>Giriş Yap</Button></div></div></div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [curriculum, setCurriculum] = useState(INITIAL_CURRICULUM);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isFirebaseActive); 

  // Firebase Realtime Listener
  useEffect(() => {
    if (isFirebaseActive) {
      setIsLoading(true);
      
      // Öğrencileri Çek
      const qStudents = query(collection(db, "students"));
      const unsubStudents = onSnapshot(qStudents, (snapshot) => {
        const data = []; snapshot.forEach(doc => data.push({id: doc.id, ...doc.data()}));
        setStudents(data);
        setIsLoading(false);
      });

      // Adminleri Çek
      const qAdmins = query(collection(db, "admins"));
      const unsubAdmins = onSnapshot(qAdmins, (snapshot) => {
        const data = []; snapshot.forEach(doc => data.push({id: doc.id, ...doc.data()}));
        setAdmins(data);
      });

      return () => { unsubStudents(); unsubAdmins(); };
    }
  }, []);

  // Filter students based on logged in user role
  // Super Admin: Kenar çubuğunda SADECE kendi eklediklerini görür. Yönetici panelinde hepsini görür.
  // Normal Admin: Sadece kendi öğrencilerini görür.
  // Student: Sadece kendini görür.
  const myStudents = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'student') return students.filter(s => s.id === user.id);
    // Superadmin ve Admin sadece kendi eklediklerini sidebar'da görsün
    return students.filter(s => s.teacherId === user.id);
  }, [user, students]);

  // Admin auto-select first student
  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'superadmin') && myStudents.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(myStudents[0].id);
    }
  }, [user, myStudents, selectedStudentId]);

  // currentStudent mantığını güncelliyoruz:
  // Seçili ID, benim öğrencilerim içinde yoksa (yani yönetici panelinden başka birinin öğrencisine tıkladıysam)
  // genel öğrenci listesinden bulup getirsin.
  const currentStudent = (user?.role === 'admin' || user?.role === 'superadmin')
    ? students.find(s => s.id === selectedStudentId) // Global listeden ara
    : students.find(s => s.id === user?.id);

  const updateStudentData = async (updated) => {
    if (isFirebaseActive) {
      try {
        const studentRef = doc(db, "students", updated.id);
        const { id, ...data } = updated;
        await setDoc(studentRef, data, { merge: true });
      } catch (error) {
        console.error("Güncelleme hatası:", error);
        alert("Bağlantı hatası: Kayıt yapılamadı.");
      }
    } else {
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    }
  };

  const handleInspectStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setActiveTab('dashboard'); // Ana sayfaya yönlendir
  };

  if (!user) return <LoginScreen onLogin={setUser} students={students} admins={admins} isFirebase={isFirebaseActive} isLoading={isLoading} />;

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
    { id: 'admin_panel', label: 'Yönetici Paneli', icon: Shield, roles: ['superadmin'] }, // Sadece Süper Admin
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 z-50">
           <div className="flex items-center gap-2 text-orange-500 font-bold text-lg"><Users size={20}/><span>HMK Koçluk</span></div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">{isMobileMenuOpen ? <X /> : <Menu />}</button>
      </div>
      {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>)}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex flex-col gap-1"><div className="flex items-center gap-2 text-orange-500 font-bold text-lg"><Users /><span>Hamza Metehan Kılıç</span></div><div className="text-xs text-slate-400 ml-8">Uzman Psikolojik Danışman</div></div>
        
        {/* ÖĞRENCİ SEÇİMİ SADECE ADMİNLERE GÖZÜKÜR */}
        {(user.role === 'admin' || user.role === 'superadmin') && (
          <div className="p-4 border-b border-slate-800">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Benim Öğrencilerim</label>
            <select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-orange-500" value={selectedStudentId || ''} onChange={e => setSelectedStudentId(e.target.value)}>
              {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {myStudents.length === 0 && <option value="">Öğrenci Yok</option>}
              {!myStudents.find(s => s.id === selectedStudentId) && selectedStudentId && <option value={selectedStudentId}>(İncelenen Öğrenci)</option>}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-4 custom-scrollbar">{MENU_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}><item.icon size={18} /> <span className="text-sm font-medium">{item.label}</span></button>))}</nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
            {!isFirebaseActive && <div className="text-[10px] text-center text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">Bulut kaydı kapalı. Veriler tarayıcı yenilendiğinde silinebilir.</div>}
            {isFirebaseActive && <div className="text-[10px] text-center text-emerald-500 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">Bulut kaydı açık. Veriler güvende.</div>}
            <button onClick={() => setUser(null)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-900 transition-all"><LogOut size={18} /> <span className="text-sm font-medium">Güvenli Çıkış</span></button>
        </div>
      </aside>
      <main className="flex-1 bg-slate-950 overflow-y-auto p-4 md:p-8 relative w-full custom-scrollbar">
        {user.role === 'superadmin' && activeTab === 'admin_panel' ? (
           <AdminManagementModule admins={admins} setAdmins={setAdmins} user={user} allStudents={students} onInspectStudent={handleInspectStudent} />
        ) : (user.role === 'admin' || user.role === 'superadmin') && activeTab === 'dashboard' ? (
           /* BURADA DEĞİŞİKLİK YAPILDI: 'students' yerine 'myStudents' gönderiyoruz */
           <DashboardModule user={user} students={myStudents} setStudents={setStudents} setSelectedStudentId={setSelectedStudentId} onUpdateStudent={updateStudentData} />
        ) : !currentStudent ? <div className="text-center mt-20 text-slate-500">Lütfen işlem yapmak için bir öğrenci seçiniz veya öğrenci ekleyiniz.</div> : (
          <>
            {activeTab === 'dashboard' && <DashboardModule user={user} students={students} setStudents={setStudents} setSelectedStudentId={setSelectedStudentId} onUpdateStudent={updateStudentData} />}
            {activeTab === 'schedule' && <ScheduleModule user={user} student={currentStudent} curriculum={curriculum} onUpdateStudent={updateStudentData} />}
            {activeTab === 'goals' && <GoalsModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'resources' && <ResourceModule user={user} student={currentStudent} curriculum={curriculum} onUpdateStudent={updateStudentData} />}
            {activeTab === 'lessons' && <LessonModule user={user} student={currentStudent} curriculum={curriculum} setCurriculum={setCurriculum} onUpdateStudent={updateStudentData} />}
            {activeTab === 'mood' && <MoodModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'exams' && <ExamModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'interviews' && <InterviewModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
            {activeTab === 'payment' && <PaymentModule user={user} student={currentStudent} onUpdateStudent={updateStudentData} />}
          </>
        )}
      </main>
    </div>
  );
}
