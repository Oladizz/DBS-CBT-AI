import { useState, useMemo, useEffect } from 'react';
import { useDatabase, useDatabaseObjectData } from 'reactfire';
import { ref, set, push, update } from 'firebase/database';
import { Test, Submission, StudentAnswer, QuestionResult, Student, SchoolClass, Session, Subject } from '../types';
import { gradeShortAnswer } from '../services/geminiService';

// This type helps us handle the fact that Firebase stores Dates as ISO strings
type FirebaseSubmission = Omit<Submission, 'id' | 'submittedAt'> & {
  submittedAt: string;
};

export const useSchoolData = () => {
  const db = useDatabase();

  // Define database references
  const testsRef = ref(db, 'tests');
  const submissionsRef = ref(db, 'submissions');
  const studentsRef = ref(db, 'students');
  const classesRef = ref(db, 'classes');
  const sessionsRef = ref(db, 'sessions');
  const subjectsRef = ref(db, 'subjects');

  // Fetch data from Firebase
  const { data: testsData } = useDatabaseObjectData<{ [key: string]: Test }>(testsRef);
  const { data: submissionsData } = useDatabaseObjectData<{ [key: string]: FirebaseSubmission }>(submissionsRef);
  const { data: studentsData } = useDatabaseObjectData<{ [key: string]: Student }>(studentsRef);
  const { data: classesData } = useDatabaseObjectData<{ [key: string]: SchoolClass }>(classesRef);
  const { data: sessionsData } = useDatabaseObjectData<{ [key: string]: Session }>(sessionsRef);
  const { data: subjectsData } = useDatabaseObjectData<{ [key: string]: Subject }>(subjectsRef);

  // Transform Firebase object data into arrays for the UI, using useMemo for performance
  const tests = useMemo(() => (testsData ? Object.entries(testsData).map(([id, data]) => ({ ...data, id })) : []), [testsData]);
  const submissions = useMemo(() => (submissionsData ? Object.entries(submissionsData).map(([id, data]) => ({ ...data, id, submittedAt: new Date(data.submittedAt) })) : []), [submissionsData]);
  const students = useMemo(() => (studentsData ? Object.entries(studentsData).map(([id, data]) => ({ ...data, id })) : []), [studentsData]);
  const classes = useMemo(() => (classesData ? Object.entries(classesData).map(([id, data]) => ({ ...data, id })) : []), [classesData]);
  const sessions = useMemo(() => (sessionsData ? Object.entries(sessionsData).map(([id, data]) => ({ ...data, id })) : []), [sessionsData]);
  const subjects = useMemo(() => (subjectsData ? Object.entries(subjectsData).map(([id, data]) => ({ ...data, id })) : []), [subjectsData]);

  // Active session and term are local UI state
  const [activeSessionId, _setActiveSessionId] = useState<string>('');
  const [activeTerm, setActiveTerm] = useState<string>('');

  // Effect to set the initial active session once data is loaded from Firebase
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      const initialActiveSession = sessions.find(s => !s.isArchived);
      if (initialActiveSession) {
        _setActiveSessionId(initialActiveSession.id);
        setActiveTerm(initialActiveSession.terms?.[0] || '');
      }
    }
  }, [sessions, activeSessionId]);

  // Helper functions to get names from IDs
  const getSubjectName = (subjectId: string): string => subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  const getSessionName = (sessionId: string): string => sessions.find(s => s.id === sessionId)?.name || 'Unknown Session';

  const setActiveSessionId = (sessionId: string) => {
    _setActiveSessionId(sessionId);
    const newSession = sessions.find(s => s.id === sessionId);
    setActiveTerm(newSession?.terms?.[0] || '');
  };

  // --- Data Mutation Functions ---

  const handleCreateClass = (name: string) => {
    const newClassRef = push(classesRef);
    set(newClassRef, { name });
  };

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    // Preserve original 6-digit random ID logic
    const newId = String(Math.floor(100000 + Math.random() * 900000));
    const newStudentRef = ref(db, `students/${newId}`);
    set(newStudentRef, studentData);
  };

  const handleCreateTest = (newTest: Omit<Test, 'id' | 'sessionId' | 'term'>) => {
    const newTestRef = push(testsRef);
    const testData = {
      ...newTest,
      sessionId: activeSessionId,
      term: activeTerm,
    };
    set(newTestRef, testData);
  };

  const handleUpdateTest = (updatedTest: Test) => {
    const { id, ...testData } = updatedTest;
    const testRef = ref(db, `tests/${id}`);
    update(testRef, testData);
  };

  const handleCreateSession = (name: string, terms: string[]) => {
    const newSessionRef = push(sessionsRef);
    set(newSessionRef, { name, terms, isArchived: false });
  };

  const handleArchiveSession = (sessionId: string) => {
    const sessionRef = ref(db, `sessions/${sessionId}`);
    update(sessionRef, { isArchived: true });
  };

  const handleCreateSubject = (name: string) => {
    const newSubjectRef = push(subjectsRef);
    set(newSubjectRef, { name });
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
      }

      let result: QuestionResult;
      if (q.questionType === 'multiple-choice') {
        result = { questionId: q.id, answer, isCorrect: answer === q.correctAnswerIndex };
      } else {
        const gradingResult = await gradeShortAnswer(q.questionText, q.modelAnswer!, answer as string);
        result = { questionId: q.id, answer, ...gradingResult };
      }
      detailedResults.push(result);
    }

    const score = (detailedResults.filter(r => r.isCorrect).length / test.questions.length) * 100;
    const newSubmissionRef = push(submissionsRef);

    const submissionData = {
      studentId: currentStudent.id,
      testId,
      answers,
      detailedResults,
      score,
      submittedAt: new Date().toISOString(), // Store as ISO string
    };

    await set(newSubmissionRef, submissionData);

    // Return a complete Submission object for immediate use in the UI
    return {
      ...submissionData,
      id: newSubmissionRef.key!,
      submittedAt: new Date(submissionData.submittedAt),
    };
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