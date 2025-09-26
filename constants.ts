import { FormData } from './types';

export const GRADES = Array.from({ length: 12 }, (_, i) => `الصف ${i + 1}`);
export const INITIAL_SUBJECTS = ["القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "الرياضيات", "العلوم"];
export const SECTIONS = Array.from({ length: 10 }, (_, i) => `شعبة ${i + 1}`);

export const INITIAL_STRATEGIES = [
  { id: 1, name: "اشطب وربح", traditional: 1, active: 3, research: 1, description: "" },
  { id: 2, name: "الاستنتاج", traditional: 0, active: 3, research: 4, description: "" },
  { id: 3, name: "استراتيجية الأركان الأربعة", traditional: 0, active: 3, research: 0, description: "" },
  { id: 4, name: "الاستنتاج", traditional: 0, active: 4, research: 0, description: "" },
  { id: 5, name: "البحث عن الكنز", traditional: 0, active: 5, research: 0, description: "" },
  { id: 6, name: "البحث عن الكنز", traditional: 0, active: 2, research: 0, description: "" },
  { id: 7, name: "التدريس التبادلي", traditional: 0, active: 4, research: 0, description: "" },
  { id: 8, name: "الاستنتاج", traditional: 0, active: 3, research: 0, description: "" },
  { id: 9, name: "البحث عن الكنز", traditional: 0, active: 1, research: 0, description: "" },
  { id: 10, name: "التدريس التبادلي", traditional: 0, active: 3, research: 0, description: "" },
  { id: 11, name: "الجكسو", traditional: 0, active: 3, research: 0, description: "" },
  { id: 12, name: "القصة", traditional: 0, active: 4, research: 0, description: "" },
  { id: 13, name: "التعليم باللعب", traditional: 0, active: 4, research: 0, description: "" },
  { id: 14, name: "", traditional: 0, active: 0, research: 0, description: "" },
  { id: 15, name: "", traditional: 0, active: 0, research: 0, description: "" },
  { id: 16, name: "ارسم ما تسمع", traditional: 0, active: 0, research: 0, description: "" },
  { id: 17, name: "استراتيجية الأركان الأربعة", traditional: 0, active: 4, research: 0, description: "" },
  { id: 18, name: "البحث عن الكنز", traditional: 0, active: 0, research: 0, description: "" },
  { id: 19, name: "", traditional: 0, active: 0, research: 0, description: "" },
  { id: 20, name: "", traditional: 0, active: 0, research: 0, description: "" },
  { id: 21, name: "", traditional: 0, active: 0, research: 0, description: "" },
];

export const INITIAL_FORM_DATA: FormData = {
  teacherName: "أ. خليل المخلافي",
  semester: "الفصل الدراسي الأول",
  grade: "الصف السابع",
  subject: "اللغة العربية",
  units: 2,
  lessons: 15,
  strategies: INITIAL_STRATEGIES,
  extracurricular: {
    trip: 1,
    radio: 1,
    competition: 1,
    newspaper: 1,
    initiative: 1,
    visit: 1,
    research: 2,
    other: 1,
  },
  resourceRooms: {
    library: 3,
    showroom: 5,
    interactiveBoard: 4,
    scienceLab: 1,
    other: 2,
  },
  experienceCone: {
    verbalSymbols: 10,
    visualSymbols: 15,
    sensoryObservation: 10,
    alternativeExperiences: 2,
    directExperiences: 0,
  },
};