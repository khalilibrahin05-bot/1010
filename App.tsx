import React, { useState, useEffect, lazy, Suspense } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
// import Reports from './components/Reports';
import Settings from './components/Settings';
import Footer from './components/Footer';
import type { SchoolInfo, AppView, FormData } from './types';
import { INITIAL_FORM_DATA, INITIAL_SUBJECTS } from './constants';

const LazyReports = lazy(() => import('./components/Reports'));

const LoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center h-full">
        <div className="text-xl font-semibold text-gray-500 animate-pulse">...جاري تحميل</div>
    </div>
);


const App: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useLocalStorage<SchoolInfo>('school-info', {
    name: 'اسم المدرسة الافتراضي',
    logo: null,
    branch: 'الفرع الرئيسي',
    academicYear: `2025/2026 م - 1447 هـ`,
  });

  const [formData, setFormData] = useLocalStorage<FormData>('form-data', INITIAL_FORM_DATA);
  const [subjects, setSubjects] = useLocalStorage<string[]>('subjects-list', INITIAL_SUBJECTS);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [fontSize, setFontSize] = useLocalStorage<number>('app-font-size', 16);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const handleResetAllData = () => {
    if (window.confirm('هل أنت متأكد من أنك تريد إعادة تعيين كافة البيانات إلى حالتها الأولية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setSchoolInfo({
        name: 'اسم المدرسة الافتراضي',
        logo: null,
        branch: 'الفرع الرئيسي',
        academicYear: `2025/2026 م - 1447 هـ`,
      });
      setFormData(INITIAL_FORM_DATA);
      setSubjects(INITIAL_SUBJECTS);
      setFontSize(16);
      alert('تمت إعادة تعيين جميع البيانات بنجاح.');
      setCurrentView('dashboard'); // Switch to a safe view after reset
    }
  };


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard formData={formData} setFormData={setFormData} schoolInfo={{academicYear: schoolInfo.academicYear, branch: schoolInfo.branch}} subjects={subjects} />;
      case 'reports':
        return <LazyReports data={formData} schoolInfo={schoolInfo} />;
      case 'settings':
        return <Settings schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} subjects={subjects} setSubjects={setSubjects} fontSize={fontSize} setFontSize={setFontSize} onResetAllData={handleResetAllData} />;
      default:
        return <Dashboard formData={formData} setFormData={setFormData} schoolInfo={{academicYear: schoolInfo.academicYear, branch: schoolInfo.branch}} subjects={subjects} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <div className="flex flex-1">
        <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg">
          <div className="flex items-center justify-center mb-8 p-2 border-b border-gray-700">
             {schoolInfo.logo ? (
                <img src={schoolInfo.logo} alt="School Logo" className="h-20 w-20 rounded-full object-cover" />
            ) : (
                <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">شعار</span>
                </div>
            )}
          </div>
          <h2 className="text-center font-bold mb-1">{schoolInfo.name}</h2>
          <p className="text-center text-xs text-gray-400 mb-8">{schoolInfo.branch}</p>
          <nav className="flex-1">
            <ul>
              <NavItem icon="📊" text="لوحة الإدخال" onClick={() => setCurrentView('dashboard')} active={currentView === 'dashboard'} />
              <NavItem icon="📈" text="التقارير" onClick={() => setCurrentView('reports')} active={currentView === 'reports'} />
              <NavItem icon="⚙️" text="الإعدادات" onClick={() => setCurrentView('settings')} active={currentView === 'settings'} />
            </ul>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingFallback />}>
            {renderView()}
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
};

interface NavItemProps {
  icon: string;
  text: string;
  onClick: () => void;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, onClick, active }) => {
  return (
    <li
      className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-all duration-200 ${
        active ? 'bg-custom-blue text-white shadow-md' : 'hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      <span className="text-2xl ml-4">{icon}</span>
      <span className="font-medium">{text}</span>
    </li>
  );
};

export default App;