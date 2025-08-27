
import React, { useState } from 'react';
import { Role, Test, Submission, StudentAnswer, QuestionResult, Student } from './types';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import { UserGroupIcon, AcademicCapIcon, ArrowLeftIcon, ArrowRightIcon } from './components/icons';
import Card from './components/common/Card';
import { gradeShortAnswer } from './services/geminiService';

// Sample data for initial state
const sampleStudents: Student[] = [
    { id: '123456', name: 'John Doe' },
];

const sampleTests: Test[] = [
  {
    id: 'test1',
    title: 'World War II Basics',
    subject: 'History',
    durationMinutes: 15,
    questions: [
      { id: 'q1', questionType: 'multiple-choice', questionText: 'When did World War II begin?', options: ['1935', '1939', '1941', '1945'], correctAnswerIndex: 1 },
      { id: 'q2', questionType: 'multiple-choice', questionText: 'Which country was NOT part of the Axis powers?', options: ['Germany', 'Italy', 'Japan', 'Soviet Union'], correctAnswerIndex: 3 },
      { id: 'q3', questionType: 'short-answer', questionText: 'What was the significance of the D-Day landings?', modelAnswer: 'The D-Day landings on June 6, 1944, marked the beginning of the end for Nazi Germany. It was the largest seaborne invasion in history and opened a crucial second front in Western Europe, relieving pressure on the Soviet Union in the east and leading to the liberation of France.' },
    ],
  },
];

const LoginScreen: React.FC<{ 
    onSelectRole: (role: Role) => void,
    onStudentLogin: (studentId: string) => boolean,
}> = ({ onSelectRole, onStudentLogin }) => {
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');

  const handleLoginClick = () => {
    setError('');
    if (onStudentLogin(studentId)) {
        // Success, App component will handle role change
    } else {
        setError('Invalid Student ID. Please try again.');
    }
  };

  if (showStudentLogin) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 animate-fade-in">
            <Card className="p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-slate-900 text-center">Student Login</h2>
                <div className="mt-6">
                    <label htmlFor="student-id" className="block text-sm font-medium text-slate-700">Enter your 6-digit Student ID</label>
                    <input 
                        type="text" 
                        id="student-id"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoginClick()}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                        maxLength={6}
                    />
                </div>
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                <div className="mt-6 flex flex-col gap-3">
                    <button onClick={handleLoginClick} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                        Login <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </button>
                    <button onClick={() => setShowStudentLogin(false)} className="w-full inline-flex items-center justify-center text-sm text-slate-600 hover:text-indigo-600">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to role selection
                    </button>
                </div>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-slate-800">Welcome to DE-BARMS SCHOOL AI CBT</h1>
        <p className="mt-4 text-xl text-slate-600">Please select your role to continue.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card onClick={() => onSelectRole(Role.TEACHER)} className="p-8 text-center">
            <UserGroupIcon className="w-20 h-20 mx-auto text-indigo-500"/>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">I am a Teacher</h2>
            <p className="mt-2 text-slate-500">Create and manage tests, view student results.</p>
        </Card>
        <Card onClick={() => setShowStudentLogin(true)} className="p-8 text-center">
            <AcademicCapIcon className="w-20 h-20 mx-auto text-sky-500"/>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">I am a Student</h2>
            <p className="mt-2 text-slate-500">Take tests and review your performance.</p>
        </Card>
      </div>
    </div>
  );
};


function App() {
  const [role, setRole] = useState<Role>(Role.NONE);
  const [tests, setTests] = useState<Test[]>(sampleTests);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const handleAddStudent = (name: string) => {
    const newId = String(Math.floor(100000 + Math.random() * 900000));
    const newStudent: Student = { id: newId, name };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleStudentLogin = (studentId: string): boolean => {
    const student = students.find(s => s.id === studentId);
    if (student) {
        setCurrentStudent(student);
        setRole(Role.STUDENT);
        return true;
    }
    return false;
  };

  const handleCreateTest = (newTest: Omit<Test, 'id'>) => {
    const testWithId: Test = { ...newTest, id: crypto.randomUUID() };
    setTests(prevTests => [...prevTests, testWithId]);
  };

  const handleUpdateTest = (updatedTest: Test) => {
    setTests(prevTests => prevTests.map(test => test.id === updatedTest.id ? updatedTest : test));
  };

  const handleTestSubmit = async (testId: string, answers: StudentAnswer): Promise<Submission | undefined> => {
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

  const handleExitRole = () => {
    setRole(Role.NONE);
    setCurrentStudent(null);
  };
  
  if (role === Role.NONE) {
    return <LoginScreen onSelectRole={setRole} onStudentLogin={handleStudentLogin} />;
  }

  return (
    <div className="container mx-auto max-w-7xl">
      {role === Role.TEACHER && (
        <TeacherView 
          tests={tests}
          submissions={submissions}
          students={students}
          handleCreateTest={handleCreateTest}
          handleUpdateTest={handleUpdateTest}
          handleAddStudent={handleAddStudent}
          onExit={handleExitRole}
        />
      )}
      {role === Role.STUDENT && currentStudent && (
        <StudentView
          student={currentStudent}
          tests={tests}
          submissions={submissions}
          handleTestSubmit={handleTestSubmit}
          onExit={handleExitRole}
        />
      )}
    </div>
  );
}

export default App;