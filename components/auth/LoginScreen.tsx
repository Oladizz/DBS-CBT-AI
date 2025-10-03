
import React, { useState } from 'react';
import { Role } from '../../types';
import Card from '../common/Card';
import { UserGroupIcon, AcademicCapIcon, ArrowLeftIcon, ArrowRightIcon, DocumentTextIcon, ChartBarIcon } from '../icons';

interface LoginScreenProps {
    onSelectRole: (role: Role) => void;
    onStudentLogin: (studentId: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole, onStudentLogin }) => {
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
        <p className="mt-4 text-xl text-slate-600">Please select a role or use our tools.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card onClick={() => onSelectRole(Role.PROPRIETOR)} className="p-8 text-center">
            <ChartBarIcon className="w-20 h-20 mx-auto text-purple-500"/>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">Proprietor</h2>
            <p className="mt-2 text-slate-500">Oversee school performance and analytics.</p>
        </Card>
        <Card onClick={() => onSelectRole(Role.TEACHER)} className="p-8 text-center">
            <UserGroupIcon className="w-20 h-20 mx-auto text-indigo-500"/>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">Teacher</h2>
            <p className="mt-2 text-slate-500">Create tests and manage your classes.</p>
        </Card>
        <Card onClick={() => setShowStudentLogin(true)} className="p-8 text-center">
            <AcademicCapIcon className="w-20 h-20 mx-auto text-sky-500"/>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">I am a Student</h2>
            <p className="mt-2 text-slate-500">Take tests and review your performance.</p>
        </Card>
        <Card onClick={() => onSelectRole(Role.IMAGE_TO_PDF)} className="p-8 text-center">
            <DocumentTextIcon className="w-20 h-20 mx-auto text-emerald-500"/>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">Image to PDF</h2>
            <p className="mt-2 text-slate-500">Convert JPG and PNG images into a single PDF document.</p>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;
