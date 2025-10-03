
import React, { createContext, useContext } from 'react';
import { Test, Submission, Student, SchoolClass, StudentAnswer, Session, Subject } from '../types';
import { useSchoolData } from '../hooks/useSchoolData';

interface SchoolContextType {
    tests: Test[];
    submissions: Submission[];
    students: Student[];
    classes: SchoolClass[];
    sessions: Session[];
    subjects: Subject[];
    activeSessionId: string;
    activeTerm: string;
    getSubjectName: (subjectId: string) => string;
    getSessionName: (sessionId: string) => string;
    setActiveSessionId: (sessionId: string) => void;
    setActiveTerm: (term: string) => void;
    handleCreateClass: (name: string) => void;
    handleAddStudent: (student: Omit<Student, 'id'>) => void;
    handleCreateTest: (test: Omit<Test, 'id' | 'sessionId' | 'term'>) => void;
    handleUpdateTest: (test: Test) => void;
    handleTestSubmit: (testId: string, answers: StudentAnswer, currentStudent: Student) => Promise<Submission | undefined>;
    handleCreateSession: (name: string, terms: string[]) => void;
    handleArchiveSession: (sessionId: string) => void;
    handleCreateSubject: (name: string) => void;
}

const SchoolContext = createContext<SchoolContextType | null>(null);

export const SchoolDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const schoolData = useSchoolData();
    return <SchoolContext.Provider value={schoolData}>{children}</SchoolContext.Provider>;
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (!context) {
        throw new Error('useSchool must be used within a SchoolDataProvider');
    }
    return context;
};
