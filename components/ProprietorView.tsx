import React, { useState } from 'react';
import { Test, Submission, Student } from '../types';
import { useSchool } from '../../contexts/SchoolContext';
import Card from './common/Card';
import Button from './common/Button';
import ManageStudents from './management/ManageStudents';
import ManageClasses from './management/ManageClasses';
import ManageSessions from './management/ManageSessions';
import ManageSubjects from './management/ManageSubjects';
import ViewResults from './reports/ViewResults';
import StudentReportCard from './reports/StudentReportCard';
import TestReport from './common/TestReport';
import FooterNav from './common/FooterNav';
import SideNav, { NavItem } from './common/SideNav';
import SessionSelector from './common/SessionSelector';
import { BookOpenIcon, ClockIcon, UserGroupIcon, ChartBarIcon, HomeIcon, ClipboardListIcon } from './icons';

interface ProprietorViewProps {
  onExit: () => void;
  onPrintStudentReport: (student: Student) => void;
}

const ProprietorView: React.FC<ProprietorViewProps> = ({ onExit, onPrintStudentReport }) => {
  type ViewState = 'dashboard' | 'results' | 'manage_students' | 'manage_classes' | 'report_card' | 'view_submission' | 'management' | 'manage_sessions' | 'manage_subjects';
  const { tests, submissions, students, classes, activeSessionId, activeTerm, getSubjectName, getSessionName } = useSchool();
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const proprietorNavItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { key: 'management', label: 'Management', icon: <ClipboardListIcon /> },
  ];
  
  const handleNavigate = (v: string) => {
    setSelectedTest(null);
    setSelectedStudent(null);
    setSelectedSubmission(null);
    setView(v as ViewState);
  };

  const handleViewResults = (test: Test) => {
    setSelectedTest(test);
    setView('results');
  };
  
  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setView('view_submission');
  };

  const handleViewReportCard = (student: Student) => {
    setSelectedStudent(student);
    setView('report_card');
  }

  const renderContent = () => {
    switch (view) {
        case 'results':
            if (selectedTest) {
                return <ViewResults test={selectedTest} onBack={() => setView('dashboard')} onSelectSubmission={handleSelectSubmission}/>;
            }
            return null;
        case 'view_submission':
             if (selectedTest && selectedSubmission) {
                const student = students.find(s => s.id === selectedSubmission.studentId);
                return <TestReport
                    test={selectedTest}
                    submission={selectedSubmission}
                    studentName={student?.name || 'Unknown Student'}
                    onBack={() => {
                        setSelectedSubmission(null);
                        setView('results');
                    }}
                />
            }
            return null;
        case 'management':
            return (
                <div className="animate-fade-in">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6">School Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card onClick={() => setView('manage_students')} className="p-6">
                            <UserGroupIcon className="w-10 h-10 text-indigo-500 mb-3" />
                            <h3 className="text-xl font-bold">Manage Students</h3>
                            <p className="text-slate-500 mt-1">Add new students and view report cards.</p>
                        </Card>
                        <Card onClick={() => setView('manage_classes')} className="p-6">
                            <ClipboardListIcon className="w-10 h-10 text-sky-500 mb-3" />
                            <h3 className="text-xl font-bold">Manage Classes</h3>
                            <p className="text-slate-500 mt-1">Create and organize school classes.</p>
                        </Card>
                         <Card onClick={() => setView('manage_sessions')} className="p-6">
                            <ClockIcon className="w-10 h-10 text-amber-500 mb-3" />
                            <h3 className="text-xl font-bold">Manage Sessions</h3>
                            <p className="text-slate-500 mt-1">Define academic sessions and terms.</p>
                        </Card>
                        <Card onClick={() => setView('manage_subjects')} className="p-6">
                            <BookOpenIcon className="w-10 h-10 text-emerald-500 mb-3" />
                            <h3 className="text-xl font-bold">Manage Subjects</h3>
                            <p className="text-slate-500 mt-1">Add subjects offered by the school.</p>
                        </Card>
                    </div>
                </div>
            );
        case 'manage_students':
            return <ManageStudents onViewReportCard={handleViewReportCard} onBack={() => setView('management')} onPrintReportCard={onPrintStudentReport} />;
        case 'manage_classes':
            return <ManageClasses onBack={() => setView('management')} />;
        case 'manage_sessions':
            return <ManageSessions onBack={() => setView('management')} />;
        case 'manage_subjects':
            return <ManageSubjects onBack={() => setView('management')} />;
        case 'report_card':
            if (selectedStudent) {
                return <StudentReportCard student={selectedStudent} onBack={() => setView('manage_students')} />;
            }
            return null;
        case 'dashboard':
        default:
            const filteredTests = tests.filter(t => t.sessionId === activeSessionId && t.term === activeTerm);
            const filteredSubmissions = submissions.filter(s => {
                const test = tests.find(t => t.id === s.testId);
                return test && test.sessionId === activeSessionId && test.term === activeTerm;
            });
            const schoolAverageScore = filteredSubmissions.length > 0 
                ? filteredSubmissions.reduce((acc, sub) => acc + sub.score, 0) / filteredSubmissions.length
                : 0;
            
            return (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-bold text-slate-800">School Dashboard</h2>
                   <div className="hidden md:flex">
                    <Button onClick={() => setView('management')} variant="secondary">
                      <ClipboardListIcon className="w-5 h-5 mr-2" /> School Management
                    </Button>
                  </div>
                </div>
                <div className="mb-8 p-4 bg-slate-100 rounded-lg">
                    <SessionSelector />
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Insights for {getSessionName(activeSessionId)} - {activeTerm}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center"><p className="text-3xl font-bold text-indigo-600">{students.length}</p><p className="text-sm text-slate-500">Total Students</p></Card>
                        <Card className="p-4 text-center"><p className="text-3xl font-bold text-indigo-600">{classes.length}</p><p className="text-sm text-slate-500">Total Classes</p></Card>
                        <Card className="p-4 text-center"><p className="text-3xl font-bold text-indigo-600">{filteredTests.length}</p><p className="text-sm text-slate-500">Tests This Term</p></Card>
                        <Card className="p-4 text-center"><p className="text-3xl font-bold text-indigo-600">{schoolAverageScore.toFixed(1)}%</p><p className="text-sm text-slate-500">Term Avg. Score</p></Card>
                    </div>
                </div>
                
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-700">Tests This Term</h3>
                </div>

                {filteredTests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTests.map(test => {
                      const className = classes.find(c => c.id === test.classId)?.name || 'N/A';
                      return (
                      <Card key={test.id} className="flex flex-col">
                        <div className="p-6 flex-grow">
                          <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{className}</span>
                          <h4 className="text-xl font-bold text-slate-900 mt-3">{test.title}</h4>
                          <div className="mt-2 flex items-center text-sm text-slate-500">
                              <BookOpenIcon className="w-4 h-4 mr-2" />
                              <span>{getSubjectName(test.subjectId)}</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-slate-500">
                              <ClockIcon className="w-4 h-4 mr-2" />
                              <span>{test.durationMinutes} minutes</span>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t">
                            <Button onClick={() => handleViewResults(test)} variant="secondary" className="w-full">
                                View Results ({submissions.filter(s => s.testId === test.id).length})
                            </Button>
                        </div>
                      </Card>
                    )})}
                  </div>
                ) : (
                  <Card className="text-center p-12 border-2 border-dashed border-slate-300">
                    <h3 className="text-lg font-medium">No tests found for this term.</h3>
                    <p className="text-slate-500 mt-2">A teacher needs to create a test, or you can select a different session/term.</p>
                  </Card>
                )}
              </div>
            );
    }
  };
  
  const mainFooterViews: ViewState[] = ['dashboard', 'management'];
  const showNav = mainFooterViews.includes(view);
  const headerContent = (
    <div className="w-full flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-600 flex items-center">
            <ChartBarIcon className="w-7 h-7 mr-2"/> Proprietor Portal
        </h1>
        <button onClick={onExit} className="text-sm font-medium text-slate-600 hover:text-indigo-600 hidden md:block">
            Switch Role
        </button>
    </div>
  );

  return (
    <div className="md:pl-64">
       <SideNav 
        navItems={proprietorNavItems}
        activeItem={view}
        onNavigate={handleNavigate}
        header={headerContent}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <header className="md:hidden flex justify-between items-center mb-8 no-print">
            {headerContent}
            <button onClick={onExit} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Switch Role</button>
        </header>
        {renderContent()}
      </main>
      {showNav && (
        <FooterNav
          navItems={proprietorNavItems}
          activeItem={view}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default ProprietorView;
