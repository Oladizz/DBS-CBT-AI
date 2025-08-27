import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Test, Question, Submission, StudentAnswer, Student } from '../types';
import Card from './common/Card';
import { AcademicCapIcon, BookOpenIcon, ClockIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, PlayIcon, DocumentReportIcon, HomeIcon, ClipboardListIcon } from './icons';
import Spinner from './common/Spinner';
import TestReport from './common/TestReport';
import FooterNav, { NavItem } from './common/FooterNav';

// Props for StudentView
interface StudentViewProps {
  student: Student;
  tests: Test[];
  submissions: Submission[];
  handleTestSubmit: (testId: string, answers: StudentAnswer) => Promise<Submission | undefined>;
  onExit: () => void;
}

const FullscreenWarning: React.FC<{ onReEnter: () => void }> = ({ onReEnter }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold text-red-600">Fullscreen Required</h2>
            <p className="mt-2 text-slate-600">You have exited fullscreen mode.</p>
            <p className="text-slate-600">Please re-enter to continue the test.</p>
            <button
                onClick={onReEnter}
                className="mt-6 w-full inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
                Re-enter Fullscreen
            </button>
        </div>
    </div>
);

// Sub-component: TestTaker
const TestTaker: React.FC<{
  test: Test;
  onSubmit: (answers: StudentAnswer) => void;
  isSubmitting: boolean;
}> = ({ test, onSubmit, isSubmitting }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer>({});
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  }, []);

  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement) {
        setShowFullscreenWarning(true);
        if (timerRef.current) clearInterval(timerRef.current);
    } else {
        setShowFullscreenWarning(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to submit?')) {
      if (document.fullscreenElement) {
          document.exitFullscreen();
      }
      onSubmit(answers);
    }
  }, [answers, onSubmit]);

  useEffect(() => {
    requestFullscreen();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };
  }, [handleFullscreenChange, requestFullscreen]);


  useEffect(() => {
    if (showFullscreenWarning) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (document.fullscreenElement) document.exitFullscreen();
          onSubmit(answers);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showFullscreenWarning, answers, onSubmit]);

  const currentQuestion = test.questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  if (isSubmitting) {
      return (
          <div className="flex flex-col items-center justify-center h-64">
              <Spinner size="w-16 h-16"/>
              <h2 className="mt-4 text-2xl font-semibold text-slate-700">Submitting & Grading...</h2>
              <p className="text-slate-500">Please wait while we grade your answers.</p>
          </div>
      )
  }

  return (
    <div className="animate-fade-in">
      {showFullscreenWarning && <FullscreenWarning onReEnter={requestFullscreen} />}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-4 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{test.title}</h2>
            <p className="text-slate-500">{test.subject}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-red-600 font-bold text-2xl">
              <ClockIcon className="w-7 h-7 mr-2" />
              <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
            <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {test.questions.length}</p>
          </div>
        </div>
      </div>

      <Card className="p-8">
        <h3 className="text-xl font-semibold mb-6">{currentQuestionIndex + 1}. {currentQuestion.questionText}</h3>
        <div className="space-y-4">
          {currentQuestion.questionType === 'multiple-choice' ? (
             currentQuestion.options?.map((option, index) => (
                <label key={index} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === index ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name={currentQuestion.id} checked={answers[currentQuestion.id] === index} onChange={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: index }))} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                    <span className="ml-4 text-slate-700">{option}</span>
                </label>
             ))
          ) : (
            <div>
                <label htmlFor="short-answer" className="block text-sm font-medium text-slate-700 mb-2">Your Answer:</label>
                <textarea 
                    id="short-answer"
                    rows={5} 
                    value={(answers[currentQuestion.id] as string) || ''} 
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
          )}
        </div>
      </Card>
      
      <div className="mt-8 flex justify-between items-center">
        <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="inline-flex items-center justify-center px-6 py-2 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowLeftIcon className="w-5 h-5 mr-2" /> Previous
        </button>
        {currentQuestionIndex === test.questions.length - 1 ? (
          <button onClick={handleSubmit} className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <CheckCircleIcon className="w-5 h-5 mr-2" /> Submit Test
          </button>
        ) : (
          <button onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))} className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Next <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

// Main StudentView Component
const StudentView: React.FC<StudentViewProps> = ({ student, tests, submissions, handleTestSubmit, onExit }) => {
  const [view, setView] = useState<'dashboard' | 'taking_test' | 'report'>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<'available' | 'completed'>('available');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentNavItems: NavItem[] = [
    { key: 'available', label: 'Available', icon: <HomeIcon /> },
    { key: 'completed', label: 'Completed', icon: <ClipboardListIcon /> },
  ];

  const handleStartTest = (test: Test) => {
    setSelectedTest(test);
    setView('taking_test');
  };

  const onTestSubmit = async (answers: StudentAnswer) => {
    if (!selectedTest) return;
    
    setIsSubmitting(true);
    const newSubmission = await handleTestSubmit(selectedTest.id, answers);
    setIsSubmitting(false);

    if (newSubmission) {
      handleViewReport(newSubmission);
    } else {
      // Fallback in case submission fails
      setView('dashboard');
    }
    setSelectedTest(null);
  };
  
  const handleViewReport = (submission: Submission) => {
      const test = tests.find(t => t.id === submission.testId);
      if (test) {
          setSelectedTest(test);
          setViewingSubmission(submission);
          setView('report');
      }
  };
  
  const onBackToDashboard = () => {
    setView('dashboard');
    setSelectedTest(null);
    setViewingSubmission(null);
  };

  const renderContent = () => {
    if (view === 'taking_test' && selectedTest) {
      return <TestTaker test={selectedTest} onSubmit={onTestSubmit} isSubmitting={isSubmitting}/>;
    }
    
    if (view === 'report' && selectedTest && viewingSubmission) {
      return <TestReport 
        test={selectedTest} 
        submission={viewingSubmission} 
        studentName={student.name}
        onBack={onBackToDashboard} 
      />;
    }

    // Dashboard view
    const takenTestIds = new Set(submissions.filter(s => s.studentId === student.id).map(s => s.testId));
    const availableTests = tests.filter(t => !takenTestIds.has(t.id));
    const completedSubmissions = submissions.filter(s => s.studentId === student.id).sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    return (
      <div className="animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Student Dashboard</h2>
        <p className="text-slate-500 mb-6 -mt-4">Welcome back, {student.name}!</p>
        
        <div className={`${dashboardTab === 'available' ? 'block' : 'hidden md:block'} mb-10`}>
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Available Tests</h3>
            {availableTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTests.map(test => (
                        <Card key={test.id} className="flex flex-col">
                            <div className="p-6 flex-grow">
                                <h4 className="text-xl font-bold">{test.title}</h4>
                                <div className="mt-2 flex items-center text-sm text-slate-500"><BookOpenIcon className="w-4 h-4 mr-2" /><span>{test.subject}</span></div>
                                <div className="mt-1 flex items-center text-sm text-slate-500"><ClockIcon className="w-4 h-4 mr-2" /><span>{test.durationMinutes} minutes</span></div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t">
                                <button onClick={() => handleStartTest(test)} className="w-full inline-flex items-center justify-center text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                    <PlayIcon className="w-5 h-5 mr-2" /> Start Test
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center p-8 border-2 border-dashed border-slate-300">
                    <h3 className="text-lg font-medium">No new tests available.</h3>
                    <p className="text-slate-500 mt-2">Check back later!</p>
                </Card>
            )}
        </div>

        <div className={`${dashboardTab === 'completed' ? 'block' : 'hidden md:block'}`}>
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Completed Tests</h3>
            {completedSubmissions.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <ul className="divide-y divide-slate-200">
                        {completedSubmissions.map(sub => {
                            const test = tests.find(t => t.id === sub.testId);
                            if (!test) return null;
                            return (
                                <li key={sub.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                    <div>
                                        <p className="font-bold">{test.title}</p>
                                        <p className="text-sm text-slate-500">{test.subject}</p>
                                        <p className="text-sm text-slate-500">Completed: {sub.submittedAt.toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                        <div className={`px-3 py-1 text-sm font-medium rounded-full ${sub.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            Score: {sub.score.toFixed(1)}%
                                        </div>
                                        <button onClick={() => handleViewReport(sub)} className="inline-flex items-center px-4 py-2 border border-indigo-200 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm">
                                            <DocumentReportIcon className="w-5 h-5 mr-2" /> View Report
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <Card className="text-center p-8 border-2 border-dashed border-slate-300">
                    <h3 className="text-lg font-medium">You haven't completed any tests yet.</h3>
                </Card>
            )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-indigo-600 flex items-center"><AcademicCapIcon className="w-8 h-8 mr-2"/> Student Portal</h1>
        <button onClick={onExit} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Switch Role</button>
      </header>
      <main>
        {renderContent()}
      </main>
      {view === 'dashboard' && (
        <FooterNav 
            navItems={studentNavItems} 
            activeItem={dashboardTab} 
            onNavigate={(key) => setDashboardTab(key as 'available' | 'completed')} 
        />
      )}
    </div>
  );
};

export default StudentView;