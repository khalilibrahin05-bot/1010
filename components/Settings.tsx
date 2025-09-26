import React, { useState, useCallback } from 'react';
import type { SchoolInfo } from '../types';

interface SettingsProps {
  schoolInfo: SchoolInfo;
  setSchoolInfo: React.Dispatch<React.SetStateAction<SchoolInfo>>;
  subjects: string[];
  setSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  onResetAllData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ schoolInfo, setSchoolInfo, subjects, setSubjects, fontSize, setFontSize, onResetAllData }) => {
  const [newSubject, setNewSubject] = useState('');

  const handleInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSchoolInfo(prev => ({ ...prev, [name]: value }));
  }, [setSchoolInfo]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSchoolInfo(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  }, [setSchoolInfo]);
  
  const handleImport = useCallback(() => {
    // This is a placeholder for the import functionality.
    alert('سيتم تنفيذ ميزة استيراد بيانات المعلمين والاستراتيجيات من ملفات Excel و PDF في التحديثات المستقبلية.');
  }, []);

  const handleAddSubject = useCallback(() => {
    const trimmedSubject = newSubject.trim();
    if (trimmedSubject && !subjects.includes(trimmedSubject)) {
      setSubjects(prev => [...prev, trimmedSubject]);
      setNewSubject('');
    }
  }, [newSubject, subjects, setSubjects]);

  const handleDeleteSubject = useCallback((subjectToDelete: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المادة: ${subjectToDelete}؟`)) {
        setSubjects(prev => prev.filter(s => s !== subjectToDelete));
    }
  }, [setSubjects]);

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">الإعدادات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* School Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">معلومات المدرسة</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600">اسم المدرسة</label>
              <input type="text" id="name" name="name" value={schoolInfo.name} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue" />
            </div>
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-600">الفرع</label>
              <input type="text" id="branch" name="branch" value={schoolInfo.branch} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue" />
            </div>
            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-600">العام الدراسي</label>
              <input type="text" id="academicYear" name="academicYear" value={schoolInfo.academicYear} onChange={handleInfoChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue" />
            </div>
          </div>
        </div>

        {/* Logo and Data Import */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">الشعار واستيراد البيانات</h2>
          <div className="space-y-6">
             <div>
              <label className="block text-sm font-medium text-gray-600">شعار المدرسة</label>
              <div className="mt-2 flex items-center space-x-4 space-x-reverse">
                {schoolInfo.logo && <img src={schoolInfo.logo} alt="School Logo" className="h-16 w-16 rounded-full object-cover" />}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-custom-blue file:text-white hover:file:bg-custom-blue/90"/>
              </div>
            </div>
             <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">استيراد البيانات</h3>
                 <p className="text-sm text-gray-500 mb-4">
                    يمكنك استيراد بيانات الاستراتيجيات والمعلمين من ملفات Excel أو PDF لسهولة الإعداد.
                </p>
                <button 
                  onClick={handleImport}
                  className="w-full px-4 py-2 bg-custom-green text-white font-semibold rounded-lg shadow-sm hover:bg-custom-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green transition-colors duration-200"
                >
                  استيراد من ملف
                </button>
             </div>
          </div>
        </div>
      </div>
       {/* Subject Management Card */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">إدارة المواد الدراسية</h2>
        <div className="space-y-4">
          <div className="flex space-x-2 space-x-reverse">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="أضف مادة دراسية جديدة"
              className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue"
            />
            <button
              onClick={handleAddSubject}
              className="px-4 py-2 bg-custom-blue text-white font-semibold rounded-lg shadow-sm hover:bg-custom-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-blue transition-colors duration-200"
            >
              إضافة
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 border rounded-md p-2">
            <ul className="space-y-2">
              {subjects.length > 0 ? subjects.map((subject, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-md animate-fade-in">
                  <span className="font-medium text-gray-800">{subject}</span>
                  <button
                    onClick={() => handleDeleteSubject(subject)}
                    className="text-red-500 hover:text-red-700 font-bold text-xl px-2 rounded-full transition-colors"
                    aria-label={`حذف ${subject}`}
                  >
                    &times;
                  </button>
                </li>
              )) : <p className="text-center text-gray-500 py-4">لا توجد مواد دراسية. أضف مادة جديدة أعلاه.</p>}
            </ul>
          </div>
        </div>
      </div>

       {/* UI Customization Card */}
       <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">تخصيص الواجهة</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-600 mb-2">
              حجم الخط: <span className="font-bold text-custom-blue">{fontSize}px</span>
            </label>
            <input
              type="range"
              id="fontSize"
              min="12"
              max="22"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-custom-blue"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
        <h2 className="text-xl font-semibold text-red-800 mb-4 border-b border-red-200 pb-2">منطقة الخطر</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800">إعادة تعيين بيانات التطبيق</h3>
            <p className="text-sm text-gray-600 mt-1">
              سيؤدي هذا الإجراء إلى حذف جميع البيانات المدخلة، بما في ذلك معلومات المدرسة، وبيانات النماذج، والمواد الدراسية المخصصة، وإعادتها إلى الإعدادات الأولية.
            </p>
          </div>
          <button
            onClick={onResetAllData}
            className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            إعادة تعيين جميع البيانات
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Settings);