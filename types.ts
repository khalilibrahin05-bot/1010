export interface SchoolInfo {
  name: string;
  logo: string | null;
  branch: string;
  academicYear: string;
}

export type AppView = 'dashboard' | 'reports' | 'settings';

export interface StrategyUsage {
  id: number;
  name: string;
  traditional: number;
  active: number;
  research: number;
  description: string;
}

export interface FormData {
  teacherName: string;
  semester: string;
  grade: string;
  subject: string;
  units: number;
  lessons: number;
  strategies: StrategyUsage[];
  extracurricular: {
    trip: number;
    radio: number;
    competition: number;
    newspaper: number;
    initiative: number;
    visit: number;
    research: number;
    other: number;
  };
  resourceRooms: {
    library: number;
    showroom: number;
    interactiveBoard: number;
    scienceLab: number;
    other: number;
  };
  experienceCone: {
    verbalSymbols: number;
    visualSymbols: number;
    sensoryObservation: number;
    alternativeExperiences: number;
    directExperiences: number;
  };
}