import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { FormData, SchoolInfo } from '../types';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';


const BarChart: React.FC<{data: Record<string, number>, labels: Record<string, string>, color: string}> = ({ data, labels, color }) => {
    const maxValue = Math.max(...Object.values(data), 1);
    return (
        <div className="space-y-4 p-4 bg-white rounded-lg border">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex items-center">
                    <span className="w-28 text-sm font-medium text-gray-600">{labels[key] || key}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div
                            className="h-6 rounded-full text-white text-xs flex items-center justify-center"
                            style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: color }}
                        >
                            {value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} fontSize={16} fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333">{`القيمة: ${value}`}</text>
      <text x={cx} y={cy + 30} dy={8} textAnchor="middle" fill="#999">
        {`(النسبة: ${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const InteractivePieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };
    
    const totalValue = data.reduce((sum, entry) => sum + entry.value, 0);
    if (totalValue === 0) {
        return <div className="flex items-center justify-center h-64 text-center text-gray-500">لا توجد بيانات لعرضها.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <RechartsPieChart>
                {/* FIX: The recharts types are outdated and are missing the `activeIndex` and `activeShape` props on the Pie component. Using @ts-ignore to suppress the type error. */}
                {/* @ts-ignore */}
                <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                >
                    {data.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                </Pie>
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};


const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const formatText = (inputText: string) => {
        return inputText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(\r\n|\n|\r)/gm, '<br />');
    };
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
};

// FIX: Added missing 'ReportsProps' interface to define component props.
interface ReportsProps {
  data: FormData;
  schoolInfo: SchoolInfo;
}

const Reports: React.FC<ReportsProps> = ({ data, schoolInfo }) => {
  const [aiInsight, setAiInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInsight = async () => {
    setIsLoading(true);
    setError('');
    setAiInsight('');

    if (!process.env.API_KEY) {
      setError("مفتاح API غير مهيأ. يرجى الاتصال بالمسؤول.");
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        **Role**: You are an expert educational consultant.
        **Task**: Analyze the provided teacher performance data and generate a concise, constructive, and actionable report in Arabic.
        **Format**: Use Markdown for clear structure with headings.
        
        **Data for Analysis**:
        - **Teacher**: ${data.teacherName}
        - **Subject & Grade**: ${data.subject} for ${data.grade}
        - **Semester Units & Lessons**: ${data.units} units, ${data.lessons} lessons.
        - **Teaching Strategies**: ${JSON.stringify(data.strategies.filter(s => s.name && (s.active > 0 || s.traditional > 0 || s.research > 0)))}
        - **Extracurricular Activities**: ${JSON.stringify(data.extracurricular)}
        - **Resource Room Usage**: ${JSON.stringify(data.resourceRooms)}
        - **Dale's Cone of Experience Distribution**: ${JSON.stringify(data.experienceCone)}

        **Report Structure**:
        1.  **"ملخص الأداء" (Performance Summary)**: A brief overview of the teacher's approach.
        2.  **"نقاط القوة" (Strengths)**: Identify 2-3 key strengths with examples from the data.
        3.  **"فرص للتطوير" (Opportunities for Development)**: Suggest 2-3 specific areas for improvement, framed positively.
        4.  **"توصيات عملية" (Actionable Recommendations)**: Provide 3 concrete, easy-to-implement suggestions to enhance teaching effectiveness.

        **Tone**: Professional, supportive, and encouraging.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiInsight(response.text);
    } catch (e) {
      console.error(e);
      let message = 'حدث خطأ أثناء إنشاء التحليل. يرجى المحاولة مرة أخرى لاحقًا.';
      if (e instanceof Error) {
        if (e.message.toLowerCase().includes('api key')) {
          message = 'مفتاح API غير صالح. يرجى الاتصال بالمسؤول.';
        } else if (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network')) {
          message = 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const strategyTotals = data.strategies.reduce((acc, s) => {
    acc.traditional += s.traditional;
    acc.active += s.active;
    acc.research += s.research;
    return acc;
  }, { traditional: 0, active: 0, research: 0 });

  const strategyClassificationData = [
    { name: 'تقليدي', value: strategyTotals.traditional, color: '#60A5FA' },
    { name: 'نشط', value: strategyTotals.active, color: '#34D399' },
    { name: 'بحثي', value: strategyTotals.research, color: '#FBBF24' },
  ];

  const experienceConeData = [
      { name: 'الرموز اللفظية (كلمات ومحاضرات)', value: data.experienceCone.verbalSymbols, color: '#0088FE' },
      { name: 'الرموز البصرية (صور وفيديوهات)', value: data.experienceCone.visualSymbols, color: '#00C49F' },
      { name: 'الملاحظة الحسية (مشاهدات وعروض)', value: data.experienceCone.sensoryObservation, color: '#FFBB28' },
      { name: 'الخبرات البديلة (نماذج وعينات)', value: data.experienceCone.alternativeExperiences, color: '#FF8042' },
      { name: 'الخبرات المباشرة (تركيب وصيانة)', value: data.experienceCone.directExperiences, color: '#AF19FF' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-full" dir="rtl">
      {/* Action Buttons - Hidden on Print */}
      <div className="mb-8 flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold text-gray-800">تقرير الأداء</h1>
        <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={generateInsight}
              disabled={isLoading}
              className="px-6 py-2 bg-custom-green text-white font-semibold rounded-lg shadow-sm hover:bg-custom-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...جاري التحليل' : 'تحليل بالذكاء الاصطناعي'}
            </button>
            <button
                onClick={handlePrint}
                className="px-6 py-2 bg-custom-blue text-white font-semibold rounded-lg shadow-sm hover:bg-custom-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-blue transition-colors duration-200"
            >
              طباعة التقرير
            </button>
        </div>
      </div>
      
      {/* Report Content */}
      <div id="report-content" className="bg-white p-8 rounded-lg shadow-lg">
        <header className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-8">
            <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-800">{schoolInfo.name}</h2>
                <p className="text-gray-600">{schoolInfo.branch}</p>
                <p className="text-gray-500 text-sm">{schoolInfo.academicYear}</p>
            </div>
            {schoolInfo.logo && <img src={schoolInfo.logo} alt="School Logo" className="h-24 w-24 rounded-full object-cover" />}
        </header>
        
        <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-gray-100 p-2 rounded">معلومات عامة</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-800">
                <p><strong>اسم المعلم:</strong> {data.teacherName}</p>
                <p><strong>الفصل الدراسي:</strong> {data.semester}</p>
                <p><strong>الصف:</strong> {data.grade}</p>
                <p><strong>المادة:</strong> {data.subject}</p>
                <p><strong>عدد الوحدات:</strong> {data.units}</p>
                <p><strong>عدد الدروس:</strong> {data.lessons}</p>
            </div>
        </section>

        {(aiInsight || isLoading || error) && (
            <section className="mb-8 p-4 border border-custom-blue/30 rounded-lg bg-custom-blue/5 print:hidden">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">💡 تحليل الذكاء الاصطناعي</h3>
                {isLoading && <p className="text-gray-600 animate-pulse">يتم الآن تحليل البيانات لتقديم رؤى قيمة...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {aiInsight && <div className="text-gray-800 leading-relaxed"><SimpleMarkdown text={aiInsight} /></div>}
            </section>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
             <section className="bg-white p-4 rounded-lg border">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">تصنيف استراتيجيات التدريس</h3>
                <InteractivePieChart data={strategyClassificationData} />
            </section>
             <section className="bg-white p-4 rounded-lg border">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">تحليل مخروط الخبرة</h3>
                <InteractivePieChart data={experienceConeData} />
            </section>
        </div>

        <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-gray-100 p-2 rounded">استخدام غرف المصادر</h3>
            <BarChart data={data.resourceRooms} labels={{ library: "مكتبة", showroom: "معرض", interactiveBoard: "سبورة", scienceLab: "معمل", other: "أخرى" }} color="#818CF8" />
        </section>

        <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-gray-100 p-2 rounded">تفاصيل استراتيجيات التدريس</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="px-4 py-2">الاستراتيجية</th>
                            <th className="px-4 py-2">تقليدي</th>
                            <th className="px-4 py-2">نشط</th>
                            <th className="px-4 py-2">بحثي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.strategies.filter(s => s.name).map(s => (
                            <tr key={s.id} className="border-b">
                                <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                                <td className="px-4 py-2">{s.traditional}</td>
                                <td className="px-4 py-2">{s.active}</td>
                                <td className="px-4 py-2">{s.research}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>

      </div>
    </div>
  );
};

export default Reports;