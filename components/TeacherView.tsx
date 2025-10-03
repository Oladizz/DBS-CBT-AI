import React, { useState } from 'react';
import { Test, Submission, Student } from '../types';
import { useSchool } from '../../contexts/SchoolContext';
import Card from './common/Card';
import Button from './common/Button';
import TestEditorForm from './teacher/TestEditorForm';
import PdfUploadView from './teacher/PdfUploadView';
import ManageStudents from './management/ManageStudents';
import ManageClasses from './management/ManageClasses';
import ViewResults from './reports/ViewResults';
import StudentReportCard from './reports/StudentReportCard';
import TestReport from './common/TestReport';
import FooterNav from './common/FooterNav';
import SideNav, { NavItem } from './common/SideNav';
import SessionSelector from './common/SessionSelector';
import { BookOpenIcon, ClockIcon, UserGroupIcon, UploadIcon, PlusIcon, EditIcon, HomeIcon, ClipboardListIcon } from './icons';

interface TeacherViewProps {
  onExit: () => void;
  onPrintStudentReport: (student: Student) => void;
}

const TeacherView: React.FC<TeacherViewProps> = ({ onExit, onPrintStudentReport }) => {
  type ViewState = 'dashboard' | 'create' | 'edit_test' | 'results' | 'manage_students' | 'manage_classes' | 'upload_pdf' | 'report_card' | 'view_submission';
  const { tests, submissions, classes, handleCreateTest, handleUpdateTest, activeSessionId, activeTerm, getSubjectName } = useSchool();
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const teacherNavItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { key: 'manage_classes', label: 'Classes', icon: <ClipboardListIcon /> },
    { key: 'manage_students', label: 'Students', icon: <UserGroupIcon /> },
    { key: 'create', label: 'New Test', icon: <PlusIcon /> },
    { key: 'upload_pdf', label: 'Upload PDF', icon: <UploadIcon /> },
  ];
  
  const handleNavigate = (v: string) => {
    // Reset selections when navigating between main views
    setSelectedTest(null);
    setSelectedStudent(null);
    setSelectedSubmission(null);
    setView(v as ViewState);
  };

  const onSaveTest = (testData: Omit<Test, 'id'> | Test) => {
    if ('id' in testData && testData.id) {
        handleUpdateTest(testData as Test);
    } else {
        handleCreateTest(testData as Omit<Test, 'id' | 'sessionId' | 'term'>);
    }
    setView('dashboard');
  };

  const handleEditTest = (test: Test) => {
      setSelectedTest(test);
      setView('edit_test');
  }

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
        case 'create':
            return <TestEditorForm onSave={onSaveTest} onCancel={() => setView('dashboard')} />;
        case 'edit_test':
            if (selectedTest) {
                return <TestEditorForm initialTest={selectedTest} onSave={onSaveTest} onCancel={() => setView('dashboard')} />;
            }
            return null;
        case 'upload_pdf':
            return <PdfUploadView onTestCreated={(test) => {handleCreateTest(test); setView('dashboard')}} onBack={() => setView('dashboard')} />;
        case 'results':
            if (selectedTest) {
                return <ViewResults test={selectedTest} onBack={() => setView('dashboard')} onSelectSubmission={handleSelectSubmission}/>;
            }
            return null;
        case 'view_submission':
             if (selectedTest && selectedSubmission) {
                const { students } = useSchool();
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
        case 'manage_students':
            return <ManageStudents onViewReportCard={handleViewReportCard} onBack={() => setView('dashboard')} onPrintReportCard={onPrintStudentReport} />;
        case 'manage_classes':
            return <ManageClasses onBack={() => setView('dashboard')} />;
        case 'report_card':
            if (selectedStudent) {
                return <StudentReportCard student={selectedStudent} onBack={() => setView('manage_students')} />;
            }
            return null;
        case 'dashboard':
        default:
            const testsForTerm = tests.filter(t => t.sessionId === activeSessionId && t.term === activeTerm);
            const filteredTests = selectedClassId === 'all' ? testsForTerm : testsForTerm.filter(t => t.classId === selectedClassId);
            
            return (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-bold text-slate-800">Teacher Dashboard</h2>
                   <div className="hidden md:flex flex-wrap items-center gap-3">
                     <Button onClick={() => setView('upload_pdf')} variant="secondary">
                        <UploadIcon className="w-5 h-5 mr-2"/> Upload from PDF
                    </Button>
                    <Button onClick={() => setView('create')}>
                      <PlusIcon className="w-5 h-5 mr-2"/> Create New Test
                    </Button>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-slate-100 rounded-lg">
                    <SessionSelector />
                </div>

                <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <h3 className="text-xl font-semibold text-slate-700">Test Management</h3>
                    <div>
                         <label htmlFor="class-filter" className="sr-only">Filter by Class</label>
                        <select id="class-filter" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="block w-full sm:w-64 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                           <option value="all">All Classes</option>
                           {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {filteredTests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTests.map(test => {
                      const hasSubmissions = submissions.some(s => s.testId === test.id);
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
                          <div className="mt-1 flex items-center text-sm text-slate-500">
                              <span>{test.questions.length} questions</span>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row gap-2">
                             <Button onClick={() => handleEditTest(test)} variant="secondary" className="flex-1" disabled={hasSubmissions} title={hasSubmissions ? "Cannot edit tests with submissions" : "Edit test"}>
                                <EditIcon className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button onClick={() => handleViewResults(test)} variant="secondary" className="flex-1">
                                Results ({submissions.filter(s => s.testId === test.id).length})
                            </Button>
                        </div>
                      </Card>
                    )})}
                  </div>
                ) : (
                  <Card className="text-center p-12 border-2 border-dashed border-slate-300">
                    <h3 className="text-lg font-medium">No tests found for this term.</h3>
                    <p className="text-slate-500 mt-2">{selectedClassId === 'all' ? 'Create a new test to get started.' : 'Create a test for this class or select "All Classes".'}</p>
                  </Card>
                )}
              </div>
            );
    }
  };

  const mainFooterViews: ViewState[] = ['dashboard', 'create', 'manage_students', 'manage_classes', 'upload_pdf'];
  const showNav = mainFooterViews.includes(view);
  const headerContent = (
    <div className="w-full flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center">
            <UserGroupIcon className="w-7 h-7 mr-2"/> Teacher Portal
        </h1>
        <button onClick={onExit} className="text-sm font-medium text-slate-600 hover:text-indigo-600 hidden md:block">
            Switch Role
        </button>
    </div>
  );
  
  return (
    <div className="md:pl-64">
      <SideNav 
        navItems={teacherNavItems}
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
          navItems={teacherNavItems}
          activeItem={view}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default TeacherView;
