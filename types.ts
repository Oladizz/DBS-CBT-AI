
export enum Role {
  NONE,
  TEACHER,
  STUDENT,
  IMAGE_TO_PDF,
  PROPRIETOR,
}

export type QuestionType = 'multiple-choice' | 'short-answer';

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  // For multiple-choice
  options?: string[];
  correctAnswerIndex?: number;
  // For short-answer
  modelAnswer?: string;
  // For AI features
  explanation?: string; 
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "JSS 1A", "Primary 5B"
}

export interface Session {
    id: string;
    name: string; // e.g., "2024/2025"
    terms: string[]; // e.g., ["First Term", "Second Term", "Third Term"]
    isArchived: boolean;
}

export interface Subject {
    id: string;
    name: string; // e.g., "Mathematics", "History"
}

export interface Test {
  id:string;
  title: string;
  subjectId: string; // Foreign key to Subject
  durationMinutes: number;
  questions: Question[];
  classId: string; // Foreign key to SchoolClass
  sessionId: string; // Foreign key to Session
  term: string; // e.g., "First Term"
}

// Stored student data
export interface Student {
    id: string; // Unique 6-digit ID for login
    name: string;
    classId: string; // Foreign key to SchoolClass
    parentName?: string;
    parentPhone?: string;
    admissionDate?: string;
}

// Student's answers before submission
export interface StudentAnswer {
  [questionId: string]: number | string; // value is selectedOptionIndex or text answer
}

// Stored result for a single question after grading
export interface QuestionResult {
    questionId: string;
    answer: number | string;
    isCorrect: boolean;
    feedback?: string; // For AI-graded short answers
}

export interface Submission {
  id: string;
  studentId: string; // Links to Student.id
  testId: string;
  answers: StudentAnswer; // The raw answers submitted
  detailedResults: QuestionResult[];
  score: number; // Percentage
  submittedAt: Date;
}

// New type for Lesson Plan
export interface LessonPlan {
    topic: string;
    learningObjective: string;
    keyConcepts: string[];
    activityIdea: string;
    checkForUnderstanding: string;
}

// New type for Chat Message
export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
}
