
import React, { useState } from 'react';
import { Role, Student } from './types';
import { SchoolDataProvider, useSchool } from './contexts/SchoolContext';
import LoginScreen from './components/auth/LoginScreen';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import ProprietorView from './components/ProprietorView';
import ImageToPdfConverter from './components/ImageToPdfConverter';
import StudentReportCard from './components/reports/StudentReportCard';

const AppContent: React.FC = () => {
  const [role, setRole] = useState<Role>(Role.NONE);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [printingStudent, setPrintingStudent] = useState<Student | null>(null);
  const { students, handleTestSubmit } = useSchool();

  const handleStudentLogin = (studentId: string): boolean => {
    const student = students.find(s => s.id === studentId);
    if (student) {
        setCurrentStudent(student);
        setRole(Role.STUDENT);
        return true;
    }
    return false;
  };

  const handleExitRole = () => {
    setRole(Role.NONE);
    setCurrentStudent(null);
  };
  
  if (printingStudent) {
    return (
        <div className="container mx-auto max-w-7xl">
            <StudentReportCard 
                student={printingStudent} 
                onBack={() => setPrintingStudent(null)} 
                isPrintView={true} 
            />
        </div>
    );
  }

  if (role === Role.NONE) {
    return <LoginScreen onSelectRole={setRole} onStudentLogin={handleStudentLogin} />;
  }

  return (
    <div className="container mx-auto max-w-7xl">
      {role === Role.PROPRIETOR && <ProprietorView onExit={handleExitRole} onPrintStudentReport={setPrintingStudent} />}
      {role === Role.TEACHER && <TeacherView onExit={handleExitRole} onPrintStudentReport={setPrintingStudent} />}
      {role === Role.STUDENT && currentStudent && (
        <StudentView
          student={currentStudent}
          handleTestSubmit={(testId, answers) => handleTestSubmit(testId, answers, currentStudent)}
          onExit={handleExitRole}
        />
      )}
      {role === Role.IMAGE_TO_PDF && <ImageToPdfConverter onExit={handleExitRole} />}
    </div>
  );
}


function App() {
  return (
    <SchoolDataProvider>
      <AppContent />
    </SchoolDataProvider>
  )
}

export default App;
