import React, { useState, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useToasts } from './Toast';
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

const InputField: React.FC<{label: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string}> = React.memo(({ label, name, value, onChange, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <input type={type} id={name} name={name} value={value} onChange={onChange} min={type === 'number' ? 0 : undefined} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue" />
  </div>
));

const SelectField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]}> = React.memo(({ label, name, value, onChange, options }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <select id={name} name={name} value={value} onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-custom-blue focus:border-custom-blue">
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
));

const NestedInputSection: React.FC<{title: string, data: Record<string, number>, category: keyof FormData, onChange: (category: keyof FormData, e: React.ChangeEvent<HTMLInputElement>) => void, labels: Record<string, string>}> = React.memo(({ title, data, category, onChange, labels }) => (
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
));

const StrategyDescriptionModal: React.FC<{
  strategy: StrategyUsage;
  onClose: () => void;
  onSave: (description: string) => void;
}> = ({ strategy, onClose, onSave }) => {
  const [description, setDescription] = useState(strategy.description);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    const timer = setTimeout(() => {
        modalRef.current?.classList.remove('scale-95', 'opacity-0');
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      clearTimeout(timer);
    };
  }, [onClose]);

  const handleSummarize = async () => {
    setIsLoading(true);
    
    if (!process.env.API_KEY) {
      addToast("مفتاح API غير مهيأ.", 'error');
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const strategyTypes = [];
      if (strategy.traditional > 0) strategyTypes.push('تقليدية');
      if (strategy.active > 0) strategyTypes.push('نشطة');
      if (strategy.research > 0) strategyTypes.push('بحثية');

      const typeContext = strategyTypes.length > 0
        ? `هذه الاستراتيجية مصنفة ضمن الأنواع التالية: ${strategyTypes.join('، ')}.`
        : '';
        
      const prompt = `
        يرجى تقديم وصف احترافي وموجز باللغة العربية للاستراتيجية التعليمية المسماة "${strategy.name}".
        ${typeContext}
        اشرح الغرض منها وكيفية استخدامها عادة في الفصل الدراسي. يجب أن يكون الشرح واضحًا ومناسبًا للمعلمين.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setDescription(response.text);

    } catch (e) {
      console.error(e);
      let message = 'فشل في إنشاء الملخص. يرجى المحاولة مرة أخرى.';
      if (e instanceof Error) {
        if (e.message.toLowerCase().includes('api key')) {
          message = 'مفتاح API غير صالح. يرجى الاتصال بالمسؤول.';
        } else if (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network')) {
          message = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
        }
      }
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    onSave(description);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategyModalTitle"
    >
      <div 
        ref={modalRef}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <h2 id="strategyModalTitle" className="text-2xl font-bold text-gray-800">وصف استراتيجية: {strategy.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none" aria-label="إغلاق">&times;</button>
        </div>
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-custom-blue"
          placeholder="أدخل وصفًا للاستراتيجية هنا..."
          aria-label="وصف الاستراتيجية"
        />

        <div className="flex justify-between items-center flex-wrap gap-4">
          <button
            onClick={handleSummarize}
            disabled={isLoading || !strategy.name}
            title={!strategy.name ? "يرجى إدخال اسم للاستراتيجية أولاً" : "تلخيص بالذكاء الاصطناعي"}
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

const StrategyRow = React.memo(({
    strategy,
    index,
    handleStrategyChange,
    openDescriptionModal,
    handleDeleteStrategy
}: {
    strategy: StrategyUsage;
    index: number;
    handleStrategyChange: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    openDescriptionModal: (id: number) => void;
    handleDeleteStrategy: (id: number) => void;
}) => {
    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="px-2 py-2">
                <input type="text" name="name" value={strategy.name} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-full bg-transparent border border-gray-300 rounded px-2 py-1" placeholder={`استراتيجية ${index + 1}`} />
            </td>
            <td className="px-2 py-2"><input type="number" min="0" name="traditional" value={strategy.traditional} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-16 text-center bg-gray-50 border border-gray-300 rounded p-1" /></td>
            <td className="px-2 py-2"><input type="number" min="0" name="active" value={strategy.active} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-16 text-center bg-gray-50 border border-gray-300 rounded p-1" /></td>
            <td className="px-2 py-2"><input type="number" min="0" name="research" value={strategy.research} onChange={(e) => handleStrategyChange(strategy.id, e)} className="w-16 text-center bg-gray-50 border border-gray-300 rounded p-1" /></td>
            <td className="px-2 py-2 flex justify-center items-center space-x-1 space-x-reverse">
                <button onClick={() => openDescriptionModal(strategy.id)} className="text-blue-500 hover:text-blue-700 p-1" title="إضافة/تعديل الوصف">📝</button>
                <button onClick={() => handleDeleteStrategy(strategy.id)} className="text-red-500 hover:text-red-700 p-1 font-bold" title="حذف الاستراتيجية">🗑️</button>
            </td>
        </tr>
    );
});


const Dashboard: React.FC<DashboardProps> = ({ formData, setFormData, schoolInfo, subjects }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Omit<StrategyUsage, 'id' | 'name' | 'description'> | null; direction: 'ascending' | 'descending' }>({
    key: null,
    direction: 'ascending',
  });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { addToast } = useToasts();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' && value !== '' ? Number(value) : value,
    }));
  }, [setFormData]);

  const handleNestedInputChange = useCallback((category: keyof FormData, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [name]: value !== '' ? Number(value) : 0,
      },
    }));
  }, [setFormData]);

  const handleStrategyChange = useCallback((id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        strategies: prev.strategies.map(strategy => {
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
        })
    }));
  }, [setFormData]);

  const handleDeleteStrategy = useCallback((idToDelete: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الاستراتيجية؟')) {
      setFormData(prev => ({
        ...prev,
        strategies: prev.strategies.filter(strategy => strategy.id !== idToDelete),
      }));
    }
  }, [setFormData]);
  
  const handleAddStrategy = useCallback((name = '') => {
    setFormData(prev => {
        const newId = prev.strategies.length > 0 ? Math.max(...prev.strategies.map(s => s.id)) + 1 : 1;
        const newStrategy: StrategyUsage = {
            id: newId,
            name,
            traditional: 0,
            active: 0,
            research: 0,
            description: '',
        };
        return {
            ...prev,
            strategies: [...prev.strategies, newStrategy],
        };
    });
  }, [setFormData]);
  
  const handleSmartSuggest = async () => {
    setIsSuggesting(true);

    if (!process.env.API_KEY) {
      addToast("مفتاح API غير مهيأ.", 'error');
      setIsSuggesting(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const existingStrategies = formData.strategies.map(s => s.name).filter(Boolean).join(', ');
      
      const prompt = `
        بصفتك خبيرًا تربويًا، اقترح استراتيجية تدريس واحدة جديدة ومبتكرة وفعالة لمادة "${formData.subject}" للصف "${formData.grade}".
        الاستراتيجيات الحالية المستخدمة هي: [${existingStrategies}].
        يجب أن تكون الاستراتيجية المقترحة مكملة أو بديلة للنهج الحالي.
        يرجى تقديم اسم الاستراتيجية فقط باللغة العربية، بدون أي مقدمات أو شروحات إضافية.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const suggestedName = response.text.trim().replace(/["*.]/g, ''); // Clean up the output
      if (suggestedName) {
        const isDuplicate = formData.strategies.some(s => s.name.trim().toLowerCase() === suggestedName.toLowerCase());
        if (isDuplicate) {
           addToast(`الاستراتيجية المقترحة "${suggestedName}" موجودة بالفعل.`, 'info');
        } else {
           handleAddStrategy(suggestedName);
           addToast(`تم اقتراح الاستراتيجية: ${suggestedName}`, 'success');
        }
      } else {
        addToast('لم يتمكن الذكاء الاصطناعي من اقتراح استراتيجية. حاول مرة أخرى.', 'warning');
      }

    } catch (e) {
      console.error(e);
      let message = 'حدث خطأ أثناء الحصول على الاقتراح. يرجى المحاولة مرة أخرى.';
      if (e instanceof Error) {
        if (e.message.toLowerCase().includes('api key')) {
          message = 'مفتاح API غير صالح. يرجى الاتصال بالمسؤول.';
        } else if (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network')) {
          message = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
        }
      }
      addToast(message, 'error');
    } finally {
      setIsSuggesting(false);
    }
  };

  const openDescriptionModal = useCallback((id: number) => {
    setSelectedStrategyId(id);
    setIsModalOpen(true);
  }, []);

  const closeDescriptionModal = useCallback(() => {
    setSelectedStrategyId(null);
    setIsModalOpen(false);
  }, []);
  
  const saveStrategyDescription = useCallback((description: string) => {
    if (selectedStrategyId === null) return;
    setFormData(prev => ({
        ...prev,
        strategies: prev.strategies.map(s => s.id === selectedStrategyId ? { ...s, description } : s)
    }));
  }, [selectedStrategyId, setFormData]);
  
  const strategyForModal = useMemo(() => 
    formData.strategies.find(s => s.id === selectedStrategyId),
    [formData.strategies, selectedStrategyId]
  );
  
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
        const key = sortConfig.key as keyof Omit<StrategyUsage, 'id' | 'name' | 'description'>;
        if (a[key] < b[key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStrategies;
  }, [formData.strategies, sortConfig]);

  const strategyTotals = useMemo(() => {
    return formData.strategies.reduce(
      (acc, s) => {
        acc.traditional += s.traditional;
        acc.active += s.active;
        acc.research += s.research;
        return acc;
      },
      { traditional: 0, active: 0, research: 0 }
    );
  }, [formData.strategies]);

  return (
    <div className="p-8 bg-gray-50 min-h-full" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">لوحة الإدخال</h1>
      
      {isModalOpen && strategyForModal && (
        <StrategyDescriptionModal
          strategy={strategyForModal}
          onClose={closeDescriptionModal}
          onSave={saveStrategyDescription}
        />
      )}

      {/* General Information */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">معلومات عامة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InputField label="اسم المعلم" name="teacherName" value={formData.teacherName} onChange={handleInputChange} />
          <SelectField label="الفصل الدراسي" name="semester" value={formData.semester} onChange={handleInputChange} options={["الفصل الدراسي الأول", "الفصل الدراسي الثاني"]} />
          <SelectField label="الصف" name="grade" value={formData.grade} onChange={handleInputChange} options={GRADES} />
          <SelectField label="المادة" name="subject" value={formData.subject} onChange={handleInputChange} options={subjects} />
          <InputField label="عدد الوحدات" name="units" type="number" value={formData.units} onChange={handleInputChange} />
          <InputField label="عدد الدروس" name="lessons" type="number" value={formData.lessons} onChange={handleInputChange} />
        </div>
      </section>

      {/* Strategies Table */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-700">استراتيجيات التدريس</h2>
            <div className="flex space-x-2 space-x-reverse">
                <button onClick={() => handleAddStrategy('')} className="px-4 py-2 text-sm bg-custom-blue text-white font-semibold rounded-lg shadow-sm hover:bg-custom-blue/90 transition-colors">
                    + إضافة استراتيجية
                </button>
                <button onClick={handleSmartSuggest} disabled={isSuggesting} className="px-4 py-2 text-sm bg-custom-teal text-white font-semibold rounded-lg shadow-sm hover:bg-custom-teal/90 transition-colors disabled:opacity-50">
                    {isSuggesting ? '...جاري الاقتراح' : '💡 اقتراح ذكي'}
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-center text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 w-2/5 text-right">الاستراتيجية</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('traditional')}>
                          تقليدي {sortConfig.key === 'traditional' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('active')}>
                          نشط {sortConfig.key === 'active' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('research')}>
                          بحثي {sortConfig.key === 'research' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                        </th>
                        <th className="px-4 py-3">إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStrategies.map((s, index) => (
                       <StrategyRow 
                           key={s.id}
                           strategy={s}
                           index={index}
                           handleStrategyChange={handleStrategyChange}
                           openDescriptionModal={openDescriptionModal}
                           handleDeleteStrategy={handleDeleteStrategy}
                       />
                    ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold text-gray-800">
                    <tr>
                        <td className="px-4 py-2 text-right">الإجمالي</td>
                        <td className="px-4 py-2">{strategyTotals.traditional}</td>
                        <td className="px-4 py-2">{strategyTotals.active}</td>
                        <td className="px-4 py-2">{strategyTotals.research}</td>
                        <td className="px-4 py-2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </section>

      {/* Other Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <NestedInputSection 
          title="الأنشطة اللاصفية"
          data={formData.extracurricular}
          category="extracurricular"
          onChange={handleNestedInputChange}
          labels={{ trip: "رحلة", radio: "إذاعة", competition: "مسابقة", newspaper: "صحيفة", initiative: "مبادرة", visit: "زيارة", research: "بحث", other: "أخرى" }}
        />
        <NestedInputSection 
          title="غرف المصادر"
          data={formData.resourceRooms}
          category="resourceRooms"
          onChange={handleNestedInputChange}
          labels={{ library: "مكتبة", showroom: "معرض", interactiveBoard: "سبورة", scienceLab: "معمل", other: "أخرى" }}
        />
        <NestedInputSection 
          title="مخروط الخبرة"
          data={formData.experienceCone}
          category="experienceCone"
          onChange={handleNestedInputChange}
          labels={{ verbalSymbols: "رموز لفظية", visualSymbols: "رموز بصرية", sensoryObservation: "ملاحظة حسية", alternativeExperiences: "خبرات بديلة", directExperiences: "خبرات مباشرة" }}
        />
      </div>
    </div>
  );
};

export default Dashboard;