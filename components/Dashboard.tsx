import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { FormData, StrategyUsage } from '../types';
import { GRADES, INITIAL_SUBJECTS } from '../constants';

interface DashboardProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  schoolInfo: {
    academicYear: string;
    branch: string;
  };
  subjects: string[];
}

const InputField: React.FC<{label: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string}> = ({ label, name, value, onChange, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <input type={type} id={name} name={name} value={value} onChange={onChange} min={type === 'number' ? 0 : undefined} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue" />
  </div>
);

const SelectField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]}> = ({ label, name, value, onChange, options }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <select id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue">
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);

const NestedInputSection: React.FC<{title: string, data: Record<string, number>, category: keyof FormData, onChange: (category: keyof FormData, e: React.ChangeEvent<HTMLInputElement>) => void, labels: Record<string, string>}> = ({ title, data, category, onChange, labels }) => (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">{title}</h2>
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <label htmlFor={`${category}-${key}`} className="text-sm font-medium text-gray-600">{labels[key] || key}</label>
            <input 
              type="number" 
              id={`${category}-${key}`} 
              name={key} 
              value={value} 
              min="0"
              onChange={(e) => onChange(category, e)} 
              className="w-24 text-center bg-gray-50 border border-gray-300 rounded-md p-1" 
            />
          </div>
        ))}
      </div>
    </section>
);

const StrategyDescriptionModal: React.FC<{
  strategy: StrategyUsage;
  onClose: () => void;
  onSave: (description: string) => void;
}> = ({ strategy, onClose, onSave }) => {
  const [description, setDescription] = useState(strategy.description);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    setIsLoading(true);
    setError('');
    
    if (!process.env.API_KEY) {
      setError("API Key is not configured.");
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Please provide a concise, professional description in Arabic for the educational strategy named "${strategy.name}". Explain its purpose and how it is typically used in a classroom.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setDescription(response.text);

    } catch (e) {
      console.error(e);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    onSave(description);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">وصف استراتيجية: {strategy.name}</h2>
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-custom-blue"
          placeholder="أدخل وصفًا للاستراتيجية هنا..."
        />

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded-md" role="alert">
                <p className="font-bold">حدث خطأ</p>
                <p>{error}</p>
            </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-4">
          <button
            onClick={handleSummarize}
            disabled={isLoading}
            className="px-4 py-2 bg-custom-green text-white font-semibold rounded-lg shadow-sm hover:bg-custom-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري التلخيص...</span>
                </>
            ) : (
                'تلخيص بالذكاء الاصطناعي'
            )}
          </button>
          <div className="space-x-2 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 bg-custom-blue text-white font-semibold rounded-lg shadow-sm hover:bg-custom-blue/90 transition-colors">حفظ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ formData, setFormData, schoolInfo, subjects }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Omit<StrategyUsage, 'id' | 'name' | 'description'> | null; direction: 'ascending' | 'descending' }>({
    key: null,
    direction: 'ascending',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' && value !== '' ? Number(value) : value,
    }));
  };

  const handleNestedInputChange = (category: keyof FormData, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [name]: value !== '' ? Number(value) : 0,
      },
    }));
  };

  const handleStrategyChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newStrategies = formData.strategies.map(strategy => {
      if (strategy.id === id) {
        const updatedStrategy = { ...strategy };
        if (name === 'name' || name === 'description') {
          updatedStrategy[name] = value;
        } else {
          updatedStrategy[name as keyof Omit<StrategyUsage, 'id' | 'name' | 'description'>] = value !== '' ? Number(value) : 0;
        }
        return updatedStrategy;
      }
      return strategy;
    });
    setFormData(prev => ({ ...prev, strategies: newStrategies }));
  };

  const handleDeleteStrategy = (idToDelete: number) => {
    setFormData(prev => ({
      ...prev,
      strategies: prev.strategies.filter(strategy => strategy.id !== idToDelete),
    }));
  };
  
  const handleAddStrategy = () => {
    const newId = formData.strategies.length > 0 ? Math.max(...formData.strategies.map(s => s.id)) + 1 : 1;
    const newStrategy: StrategyUsage = {
      id: newId,
      name: '',
      traditional: 0,
      active: 0,
      research: 0,
      description: '',
    };
    setFormData(prev => ({
      ...prev,
      strategies: [...prev.strategies, newStrategy],
    }));
  };

  const openDescriptionModal = (id: number) => {
    setSelectedStrategyId(id);
    setIsModalOpen(true);
  };

  const closeDescriptionModal = () => {
    setSelectedStrategyId(null);
    setIsModalOpen(false);
  };
  
  const saveStrategyDescription = (description: string) => {
    if (selectedStrategyId === null) return;
    const newStrategies = formData.strategies.map(s => s.id === selectedStrategyId ? { ...s, description } : s);
    setFormData(prev => ({ ...prev, strategies: newStrategies }));
  };
  
  const strategyForModal = formData.strategies.find(s => s.id === selectedStrategyId);
  
  const requestSort = (key: keyof Omit<StrategyUsage, 'id' | 'name' | 'description'>) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedStrategies = useMemo(() => {
    let sortableStrategies = [...formData.strategies];
    if (sortConfig.key !== null) {
      sortableStrategies.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStrategies;
  }, [formData.strategies, sortConfig]);

  const getSortIndicator = (key: keyof Omit<StrategyUsage, 'id' | 'name' | 'description'>) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full" dir="rtl">
      {isModalOpen && strategyForModal && (
        <StrategyDescriptionModal
          strategy={strategyForModal}
          onClose={closeDescriptionModal}
          onSave={saveStrategyDescription}
        />
      )}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة إدخال البيانات</h1>
        <p className="text-md text-gray-500">{schoolInfo.branch} - العام الدراسي: {schoolInfo.academicYear}</p>
      </header>
      
      <form className="space-y-8">
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="اسم المعلم" name="teacherName" value={formData.teacherName} onChange={handleInputChange} />
            <SelectField label="الفصل الدراسي" name="semester" value={formData.semester} onChange={handleInputChange} options={["الفصل الدراسي الأول", "الفصل الدراسي الثاني"]} />
            <SelectField label="الصف" name="grade" value={formData.grade} onChange={handleInputChange} options={GRADES} />
            <SelectField label="المادة" name="subject" value={formData.subject} onChange={handleInputChange} options={subjects.length > 0 ? subjects : INITIAL_SUBJECTS} />
            <InputField label="عدد الوحدات" name="units" type="number" value={formData.units} onChange={handleInputChange} />
            <InputField label="عدد الدروس" name="lessons" type="number" value={formData.lessons} onChange={handleInputChange} />
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">استراتيجيات التدريس (عدد مرات التنفيذ)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">الاستراتيجية</th>
                  <th scope="col" className="px-3 py-3 cursor-pointer" onClick={() => requestSort('traditional')}>
                    تقليدي {getSortIndicator('traditional')}
                  </th>
                  <th scope="col" className="px-3 py-3 cursor-pointer" onClick={() => requestSort('active')}>
                    نشط {getSortIndicator('active')}
                  </th>
                  <th scope="col" className="px-3 py-3 cursor-pointer" onClick={() => requestSort('research')}>
                    بحثي {getSortIndicator('research')}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">الوصف</th>
                  <th scope="col" className="px-3 py-3 text-center">حذف</th>
                </tr>
              </thead>
              <tbody>
                {sortedStrategies.map((strategy) => (
                  <tr key={strategy.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="text" name="name" value={strategy.name} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-full bg-transparent border-b focus:outline-none focus:border-custom-blue" />
                    </td>
                    <td className="px-3 py-4">
                      <input type="number" name="traditional" min="0" value={strategy.traditional} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-20 text-center bg-gray-50 border border-gray-300 rounded-md p-1" />
                    </td>
                    <td className="px-3 py-4">
                       <input type="number" name="active" min="0" value={strategy.active} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-20 text-center bg-gray-50 border border-gray-300 rounded-md p-1" />
                    </td>
                    <td className="px-3 py-4">
                       <input type="number" name="research" min="0" value={strategy.research} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-20 text-center bg-gray-50 border border-gray-300 rounded-md p-1" />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openDescriptionModal(strategy.id)}
                        className="text-xl text-blue-500 hover:text-blue-700 disabled:text-gray-400 p-1 rounded-full hover:bg-blue-100 transition-colors"
                        title="إضافة أو تعديل الوصف"
                        disabled={!strategy.name.trim()}
                      >
                        📝
                      </button>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteStrategy(strategy.id)}
                        className="text-xl text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                        title="حذف الاستراتيجية"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAddStrategy}
              className="px-6 py-2 bg-custom-blue text-white font-semibold rounded-lg shadow-sm hover:bg-custom-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-blue transition-colors duration-200"
            >
              + إضافة استراتيجية جديدة
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NestedInputSection title="الأنشطة اللاصفية" data={formData.extracurricular} category="extracurricular" onChange={handleNestedInputChange} labels={{ trip: "رحلة", radio: "إذاعة", competition: "مسابقة", newspaper: "صحيفة", initiative: "مبادرة", visit: "زيارة", research: "بحث", other: "أخرى" }} />
            <NestedInputSection title="غرف المصادر" data={formData.resourceRooms} category="resourceRooms" onChange={handleNestedInputChange} labels={{ library: "مكتبة", showroom: "معرض", interactiveBoard: "سبورة تفاعلية", scienceLab: "معمل علوم", other: "أخرى" }} />
            <NestedInputSection title="مخروط الخبرة لإدجار ديل" data={formData.experienceCone} category="experienceCone" onChange={handleNestedInputChange} labels={{ verbalSymbols: "الرموز اللفظية (كلمات ومحاضرات)", visualSymbols: "الرموز البصرية (صور وفيديوهات)", sensoryObservation: "الملاحظة الحسية (مشاهدات وعروض)", alternativeExperiences: "الخبرات البديلة (نماذج وعينات)", directExperiences: "الخبرات المباشرة (تركيب وصيانة)" }} />
        </div>
      </form>
    </div>
  );
};

export default Dashboard;