
import { useState } from 'react';
import { Test, Submission, StudentAnswer, QuestionResult, Student, SchoolClass, Session, Subject } from '../types';
import { gradeShortAnswer } from '../services/geminiService';

const sampleSessions: Session[] = [
    { id: 'ses1', name: '2024/2025', terms: ['First Term', 'Second Term', 'Third Term'], isArchived: false },
    { id: 'ses2', name: '2023/2024', terms: ['First Term', 'Second Term', 'Third Term'], isArchived: true },
];

const sampleSubjects: Subject[] = [
    { id: 'subj1', name: 'History' },
    { id: 'subj2', name: 'Mathematics' },
    { id: 'subj3', name: 'English Language' },
];

const sampleClasses: SchoolClass[] = [
    { id: 'class1', name: 'JSS 1A' },
    { id: 'class2', name: 'JSS 1B' },
];

const sampleStudents: Student[] = [
    { id: '123456', name: 'John Doe', classId: 'class1', parentName: 'Richard Doe', parentPhone: '123-456-7890', admissionDate: '2024-09-01' },
    { id: '654321', name: 'Jane Smith', classId: 'class1', parentName: 'Sarah Smith', parentPhone: '123-456-7891', admissionDate: '2024-09-01' },
    { id: '112233', name: 'Peter Jones', classId: 'class2', parentName: 'Chris Jones', parentPhone: '123-456-7892', admissionDate: '2024-09-01' },
];

const sampleTests: Test[] = [
  {
    id: 'test1',
    title: 'World War II Basics',
    subjectId: 'subj1',
    durationMinutes: 15,
    classId: 'class1',
    sessionId: 'ses1',
    term: 'First Term',
    questions: [
      { id: 'q1', questionType: 'multiple-choice', questionText: 'When did World War II begin?', options: ['1935', '1939', '1941', '1945'], correctAnswerIndex: 1 },
      { id: 'q2', questionType: 'multiple-choice', questionText: 'Which country was NOT part of the Axis powers?', options: ['Germany', 'Italy', 'Japan', 'Soviet Union'], correctAnswerIndex: 3 },
      { id: 'q3', questionType: 'short-answer', questionText: 'What was the significance of the D-Day landings?', modelAnswer: 'The D-Day landings on June 6, 1944, marked the beginning of the end for Nazi Germany. It was the largest seaborne invasion in history and opened a crucial second front in Western Europe, relieving pressure on the Soviet Union in the east and leading to the liberation of France.' },
    ],
  },
   {
    id: 'test2',
    title: 'Basic Algebra',
    subjectId: 'subj2',
    durationMinutes: 20,
    classId: 'class2',
    sessionId: 'ses1',
    term: 'First Term',
    questions: [
      { id: 'q1-alg', questionType: 'multiple-choice', questionText: 'What is the value of x in x + 5 = 12?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2 },
      { id: 'q2-alg', questionType: 'multiple-choice', questionText: 'What is 2x * 3x?', options: ['5x', '6x', '5x^2', '6x^2'], correctAnswerIndex: 3 },
    ],
  },
];

export const useSchoolData = () => {
  const [tests, setTests] = useState<Test[]>(sampleTests);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [classes, setClasses] = useState<SchoolClass[]>(sampleClasses);
  const [sessions, setSessions] = useState<Session[]>(sampleSessions);
  const [subjects, setSubjects] = useState<Subject[]>(sampleSubjects);
  
  const initialActiveSession = sampleSessions.find(s => !s.isArchived);
  const [activeSessionId, _setActiveSessionId] = useState<string>(initialActiveSession?.id || '');
  const [activeTerm, setActiveTerm] = useState<string>(initialActiveSession?.terms[0] || '');

  const getSubjectName = (subjectId: string): string => subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  const getSessionName = (sessionId: string): string => sessions.find(s => s.id === sessionId)?.name || 'Unknown Session';

  const setActiveSessionId = (sessionId: string) => {
    _setActiveSessionId(sessionId);
    const newSession = sessions.find(s => s.id === sessionId);
    if (newSession?.terms.length) {
        setActiveTerm(newSession.terms[0]);
    } else {
        setActiveTerm('');
    }
  };

  const handleCreateClass = (name: string) => {
    const newClass: SchoolClass = { id: crypto.randomUUID(), name };
    setClasses(prev => [...prev, newClass]);
  };

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newId = String(Math.floor(100000 + Math.random() * 900000));
    const newStudent: Student = { id: newId, ...studentData };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleCreateTest = (newTest: Omit<Test, 'id' | 'sessionId' | 'term'>) => {
    const testWithId: Test = { 
      ...newTest, 
      id: crypto.randomUUID(),
      sessionId: activeSessionId,
      term: activeTerm
    };
    setTests(prevTests => [...prevTests, testWithId]);
  };

  const handleUpdateTest = (updatedTest: Test) => {
    setTests(prevTests => prevTests.map(test => test.id === updatedTest.id ? updatedTest : test));
  };
  
  const handleCreateSession = (name: string, terms: string[]) => {
    const newSession: Session = { id: crypto.randomUUID(), name, terms, isArchived: false };
    setSessions(prev => [...prev, newSession]);
  };

  const handleArchiveSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isArchived: true } : s));
  };

  const handleCreateSubject = (name: string) => {
    const newSubject: Subject = { id: crypto.randomUUID(), name };
    setSubjects(prev => [...prev, newSubject]);
  };

  const handleTestSubmit = async (testId: string, answers: StudentAnswer, currentStudent: Student): Promise<Submission | undefined> => {
    const test = tests.find(t => t.id === testId);
    if (!test || !currentStudent) return undefined;

    const detailedResults: QuestionResult[] = [];
    
    for (const q of test.questions) {
        const answer = answers[q.id];
        if (answer === undefined) {
             detailedResults.push({ questionId: q.id, answer: '', isCorrect: false, feedback: "No answer submitted." });
             continue;
        };

        let result: QuestionResult;

        if (q.questionType === 'multiple-choice') {
            const isCorrect = answer === q.correctAnswerIndex;
            result = { questionId: q.id, answer, isCorrect };
        } else { // short-answer
            const studentText = answer as string;
            const gradingResult = await gradeShortAnswer(q.questionText, q.modelAnswer!, studentText);
            result = { questionId: q.id, answer, ...gradingResult };
        }
        detailedResults.push(result);
    }

    const correctCount = detailedResults.filter(r => r.isCorrect).length;
    const score = (correctCount / test.questions.length) * 100;

    const fullSubmission: Submission = {
      id: crypto.randomUUID(),
      studentId: currentStudent.id,
      testId,
      answers,
      detailedResults,
      score,
      submittedAt: new Date(),
    };
    setSubmissions(prevSubmissions => [...prevSubmissions, fullSubmission]);
    return fullSubmission;
  };

  return {
    tests,
    submissions,
    students,
    classes,
    sessions,
    subjects,
    activeSessionId,
    activeTerm,
    getSubjectName,
    getSessionName,
    setActiveSessionId,
    setActiveTerm,
    handleCreateClass,
    handleAddStudent,
    handleCreateTest,
    handleUpdateTest,
    handleTestSubmit,
    handleCreateSession,
    handleArchiveSession,
    handleCreateSubject,
  };
};
