
import React, { useState, useCallback } from 'react';
import { Test, Submission, StudentAnswer, Student } from '../types';
import { useSchool } from '../contexts/SchoolContext';
import Card from './common/Card';
import { AcademicCapIcon, BookOpenIcon, ClockIcon, CheckCircleIcon, PlayIcon, HomeIcon, ClipboardListIcon } from './icons';
// FIX: NavItem is not exported from FooterNav. It is defined in and should be imported from SideNav.
import FooterNav from './common/FooterNav';
import { NavItem } from './common/SideNav';
import TestTaker from './student/TestTaker';
import SubmissionCompleteView from './student/SubmissionCompleteView';

interface StudentViewProps {
  student: Student;
  handleTestSubmit: (testId: string, answers: StudentAnswer) => Promise<Submission | undefined>;
  onExit: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({ student, handleTestSubmit, onExit }) => {
  const { tests, submissions, classes, getSubjectName } = useSchool();
  const [view, setView] = useState<'dashboard' | 'taking_test' | 'submission_complete'>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<'available' | 'completed'>('available');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const className = classes.find(c => c.id === student.classId)?.name || 'Unknown Class';

  const studentNavItems: NavItem[] = [
    { key: 'available', label: 'Available', icon: <HomeIcon /> },
    { key: 'completed', label: 'Completed', icon: <ClipboardListIcon /> },
  ];

  const handleStartTest = (test: Test) => {
    setSelectedTest(test);
    setView('taking_test');
  };

  const onTestSubmit = useCallback(async (answers: StudentAnswer) => {
    if (!selectedTest) {
        console.error("onTestSubmit called without a selected test context.");
        setSubmissionError("An internal error occurred and the test could not be submitted. Please exit and try again.");
        return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);
    
    try {
      const newSubmission = await handleTestSubmit(selectedTest.id, answers);
      if (newSubmission) {
        setView('submission_complete');
      } else {
        throw new Error("Submission process did not return a valid result.");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmissionError("Failed to submit test. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTest, handleTestSubmit]);
  
  const onBackToDashboard = () => {
    setView('dashboard');
    setSelectedTest(null);
    setSubmissionError(null);
  };

  const renderContent = () => {
    if (view === 'taking_test' && selectedTest) {
      return <TestTaker test={selectedTest} onSubmit={onTestSubmit} isSubmitting={isSubmitting} submissionError={submissionError}/>;
    }

    if (view === 'submission_complete') {
      return <SubmissionCompleteView onBackToDashboard={onBackToDashboard} />;
    }
    
    const studentTests = tests.filter(t => t.classId === student.classId);
    const takenTestIds = new Set(submissions.filter(s => s.studentId === student.id).map(s => s.testId));
    const availableTests = studentTests.filter(t => !takenTestIds.has(t.id));
    const completedSubmissions = submissions.filter(s => s.studentId === student.id).sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    return (
      <div className="animate-fade-in">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Student Dashboard</h2>
        <p className="text-slate-500 mb-6 -mt-4">Welcome back, {student.name}! ({className})</p>
        
        <div className={`${dashboardTab === 'available' ? 'block' : 'hidden md:block'} mb-10`}>
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Available Tests</h3>
            {availableTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTests.map(test => (
                        <Card key={test.id} className="flex flex-col">
                            <div className="p-6 flex-grow">
                                <h4 className="text-xl font-bold">{test.title}</h4>
                                <div className="mt-2 flex items-center text-sm text-slate-500"><BookOpenIcon className="w-4 h-4 mr-2" /><span>{getSubjectName(test.subjectId)}</span></div>
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
                                        <p className="text-sm text-slate-500">{getSubjectName(test.subjectId)}</p>
                                        <p className="text-sm text-slate-500">Completed: {sub.submittedAt.toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                        <div className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                            Submitted
                                        </div>
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