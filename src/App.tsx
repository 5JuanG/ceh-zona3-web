import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; // <-- Contenedor seguro añadido
import { AppProvider, useApp } from './context/AppContext';
import { auth, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DoctorDirectory } from './components/DoctorDirectory';
import { HospitalDirectory } from './components/HospitalDirectory';
import { VisitsLog } from './components/VisitsLog';
import { CasesManager } from './components/CasesManager';
import { MedicalResources } from './components/MedicalResources';
import { InteractiveMap } from './components/InteractiveMap';
import { CongregationManager } from './components/CongregationManager';
import { AdminControlPanel } from './components/AdminControlPanel';
import { DoctorModal } from './components/DoctorModal';
import { HospitalModal } from './components/HospitalModal';
import { VisitModal } from './components/VisitModal';
import { CaseModal } from './components/CaseModal';
import { EmergencyWorksheetModal } from './components/EmergencyWorksheetModal';
import { PrintReportModal } from './components/PrintReportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { LoginScreen } from './components/LoginScreen';
import { CEHMemberWorksheetModal } from './components/CEHMemberWorksheetModal';
import { Doctor, Hospital, VisitLog, PatientCase, Specialty, EmergencyWorksheet } from './types';

interface MainLayoutProps {
  currentUser: { name: string; role: string; email?: string; photoUrl?: string } | null;
  onLogout: () => void;
}

function MainLayout({ currentUser, onLogout }: MainLayoutProps) {
  const { activeTab, setActiveTab } = useApp();

  // Selected specialty filter for doctor directory
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<Specialty | 'todas'>('todas');

  // Modals state
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [hospitalToEdit, setHospitalToEdit] = useState<Hospital | null>(null);

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<VisitLog | null>(null);

  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<PatientCase | null>(null);

  const [worksheetModalOpen, setWorksheetModalOpen] = useState(false);
  const [worksheetToEdit, setWorksheetToEdit] = useState<EmergencyWorksheet | undefined>(undefined);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [memberWorksheetModalOpen, setMemberWorksheetModalOpen] = useState(false);
  const [selectedMemberWorksheetId, setSelectedMemberWorksheetId] = useState<string | null>(null);

  const handleOpenMemberWorksheetModal = (memberId?: string) => {
    setSelectedMemberWorksheetId(memberId || null);
    setMemberWorksheetModalOpen(true);
  };

  // Handlers
  const handleOpenDoctorModal = (doc?: Doctor) => {
    setDoctorToEdit(doc || null);
    setDoctorModalOpen(true);
  };

  const handleOpenHospitalModal = (hosp?: Hospital) => {
    setHospitalToEdit(hosp || null);
    setHospitalModalOpen(true);
  };

  const handleOpenVisitModal = (visit?: VisitLog) => {
    setVisitToEdit(visit || null);
    setVisitModalOpen(true);
  };

  const handleOpenCaseModal = (c?: PatientCase) => {
    setCaseToEdit(c || null);
    setCaseModalOpen(true);
  };

  const handleOpenWorksheetModal = (ws?: EmergencyWorksheet) => {
    setWorksheetToEdit(ws);
    setWorksheetOpen(true);
  };

  const handleFilterDoctorsByHospital = (hospitalId: string) => {
    setActiveTab('doctors');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col antialiased">
      
      {/* Header — Ahora convive de forma segura dentro del Router */}
      <Header 
        onOpenPrintModal={() => setPrintModalOpen(true)}
        onOpenExcelModal={() => setExcelModalOpen(true)}
        onOpenMemberWorksheetModal={handleOpenMemberWorksheetModal}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenDoctorModal={() => handleOpenDoctorModal()}
            onOpenVisitModal={() => handleOpenVisitModal()}
            onOpenCaseModal={() => handleOpenCaseModal()}
            onOpenWorksheetModal={() => handleOpenWorksheetModal()}
            setSelectedSpecialtyFilter={(spec) => setSelectedSpecialtyFilter(spec)}
          />
        )}

        {activeTab === 'congregations' && (
          <CongregationManager onOpenMemberWorksheetModal={handleOpenMemberWorksheetModal} />
        )}

        {activeTab === 'admin' && (
          <AdminControlPanel onOpenMemberWorksheetModal={handleOpenMemberWorksheetModal} />
        )}

        {activeTab === 'doctors' && (
          <DoctorDirectory
            onOpenDoctorModal={handleOpenDoctorModal}
            onOpenExcelModal={() => setExcelModalOpen(true)}
            selectedSpecialtyFilter={selectedSpecialtyFilter}
            setSelectedSpecialtyFilter={setSelectedSpecialtyFilter}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalDirectory
            onOpenHospitalModal={handleOpenHospitalModal}
            onFilterDoctorsByHospital={handleFilterDoctorsByHospital}
          />
        )}

        {activeTab === 'map' && (
          <InteractiveMap
            onOpenHospitalModal={handleOpenHospitalModal}
            onFilterDoctorsByHospital={handleFilterDoctorsByHospital}
          />
        )}

        {activeTab === 'visits' && (
          <VisitsLog onOpenVisitModal={handleOpenVisitModal} />
        )}

        {activeTab === 'cases' && (
          <CasesManager onOpenCaseModal={handleOpenCaseModal} />
        )}

        {activeTab === 'resources' && (
          <MedicalResources />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs space-y-1">
        <p className="font-semibold text-slate-300">
          Plataforma de Trabajo del Comité de Enlace con Hospitales
        </p>
        <p className="text-slate-500">
          Uso confidencial exclusivo para miembros del Comité. Copias de seguridad locales y exportación en formato JSON.
        </p>
      </footer>

      {/* Dialog Modals */}
      <DoctorModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        doctorToEdit={doctorToEdit}
      />

      <HospitalModal
        isOpen={hospitalModalOpen}
        onClose={() => setHospitalModalOpen(false)}
        hospitalToEdit={hospitalToEdit}
      />

      <VisitModal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        visitToEdit={visitToEdit}
      />

      <CaseModal
        isOpen={caseModalOpen}
        onClose={() => setCaseModalOpen(false)}
        caseToEdit={caseToEdit}
      />

      <EmergencyWorksheetModal
        isOpen={worksheetModalOpen}
        onClose={() => setWorksheetModalOpen(false)}
        worksheetToEdit={worksheetToEdit}
      />

      <PrintReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      <ExcelImportModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
      />

      <CEHMemberWorksheetModal
        isOpen={memberWorksheetModalOpen}
        onClose={() => setMemberWorksheetModalOpen(false)}
        initialMemberId={selectedMemberWorksheetId}
      />

    </div>
  );
}

function AppContent() {
  const { cehMembers } = useApp();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email?: string; photoUrl?: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (user) {
        // Enlace del perfil del miembro autenticado
        const member = cehMembers.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());
        setCurrentUser(member ? {
          name: member.nombre,
          role: member.rol,
          email: member.email
        } : {
          name: user.displayName || 'Usuario',
          role: 'miembro',
          email: user.email || undefined
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [cehMembers]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginScreen />;
  }

  return <MainLayout currentUser={currentUser} onLogout={logout} />;
}

// === COMPONENTE EXPORTADO COMPLETO ===
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}
