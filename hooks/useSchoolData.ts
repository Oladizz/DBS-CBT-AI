import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, doc, addDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Test, Submission, StudentAnswer, QuestionResult, Student, SchoolClass, Session, Subject } from '../types';
import { gradeShortAnswer } from '../services/geminiService';

// This type helps us handle the fact that Firestore stores Dates as Timestamps
type FirestoreSubmission = Omit<Submission, 'submittedAt'> & {
  submittedAt: Timestamp;
};

export const useSchoolData = () => {
  const firestore = useFirestore();

  // Define collection references
  const testsCollection = collection(firestore, 'tests');
  const submissionsCollection = collection(firestore, 'submissions');
  const studentsCollection = collection(firestore, 'students');
  const classesCollection = collection(firestore, 'classes');
  const sessionsCollection = collection(firestore, 'sessions');
  const subjectsCollection = collection(firestore, 'subjects');

  // Fetch data from Firestore collections, specifying the ID field
  const { data: tests } = useFirestoreCollectionData<Test>(testsCollection, { idField: 'id' });
  const { data: submissionsData } = useFirestoreCollectionData<FirestoreSubmission>(submissionsCollection, { idField: 'id' });
  const { data: students } = useFirestoreCollectionData<Student>(studentsCollection, { idField: 'id' });
  const { data: classes } = useFirestoreCollectionData<SchoolClass>(classesCollection, { idField: 'id' });
  const { data: sessions } = useFirestoreCollectionData<Session>(sessionsCollection, { idField: 'id' });
  const { data: subjects } = useFirestoreCollectionData<Subject>(subjectsCollection, { idField: 'id' });

  // Convert submission timestamps to Date objects for use in the app
  const submissions: Submission[] = useMemo(() => (submissionsData || []).map(sub => ({
    ...sub,
    submittedAt: sub.submittedAt.toDate(),
  })), [submissionsData]);

  // Active session and term are local UI state
  const [activeSessionId, _setActiveSessionId] = useState<string>('');
  const [activeTerm, setActiveTerm] = useState<string>('');

  // Effect to set the initial active session once data is loaded
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      const initialActiveSession = sessions.find(s => !s.isArchived);
      if (initialActiveSession) {
        _setActiveSessionId(initialActiveSession.id);
        setActiveTerm(initialActiveSession.terms?.[0] || '');
      }
    }
  }, [sessions, activeSessionId]);

  // Helper functions to get names from IDs
  const getSubjectName = (subjectId: string): string => subjects?.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  const getSessionName = (sessionId: string): string => sessions?.find(s => s.id === sessionId)?.name || 'Unknown Session';

  const setActiveSessionId = (sessionId: string) => {
    _setActiveSessionId(sessionId);
    const newSession = sessions?.find(s => s.id === sessionId);
    setActiveTerm(newSession?.terms?.[0] || '');
  };

  // --- Data Mutation Functions ---

  const handleCreateClass = async (name: string) => {
    await addDoc(classesCollection, { name });
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    const newId = String(Math.floor(100000 + Math.random() * 900000));
    const studentDocRef = doc(firestore, 'students', newId);
    await setDoc(studentDocRef, studentData);
  };

  const handleCreateTest = async (newTest: Omit<Test, 'id' | 'sessionId' | 'term'>) => {
    const testData = {
      ...newTest,
      sessionId: activeSessionId,
      term: activeTerm,
    };
    await addDoc(testsCollection, testData);
  };

  const handleUpdateTest = async (updatedTest: Test) => {
    const { id, ...testData } = updatedTest;
    const testDocRef = doc(firestore, 'tests', id);
    await updateDoc(testDocRef, testData);
  };

  const handleCreateSession = async (name: string, terms: string[]) => {
    await addDoc(sessionsCollection, { name, terms, isArchived: false });
  };

  const handleArchiveSession = async (sessionId: string) => {
    const sessionDocRef = doc(firestore, 'sessions', sessionId);
    await updateDoc(sessionDocRef, { isArchived: true });
  };

  const handleCreateSubject = async (name: string) => {
    await addDoc(subjectsCollection, { name });
  };

  const handleTestSubmit = async (testId: string, answers: StudentAnswer, currentStudent: Student): Promise<Submission | undefined> => {
    const test = tests?.find(t => t.id === testId);
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

    const submissionData = {
      studentId: currentStudent.id,
      testId,
      answers,
      detailedResults,
      score,
      submittedAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(submissionsCollection, submissionData);

    return {
      ...submissionData,
      id: docRef.id,
      submittedAt: submissionData.submittedAt.toDate(),
    };
  };

  return {
    tests: tests || [],
    submissions: submissions || [],
    students: students || [],
    classes: classes || [],
    sessions: sessions || [],
    subjects: subjects || [],
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