
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { UserPlusIcon, ArrowLeftIcon, DocumentReportIcon, PrintIcon } from '../icons';
import { useSchool } from '../../contexts/SchoolContext';
import { Student } from '../../types';

interface ManageStudentsProps {
    onViewReportCard: (student: Student) => void;
    onBack: () => void;
    onPrintReportCard: (student: Student) => void;
}

const ManageStudents: React.FC<ManageStudentsProps> = ({ onViewReportCard, onBack, onPrintReportCard}) => {
    const { students, classes, handleAddStudent } = useSchool();
    const [newStudentName, setNewStudentName] = useState('');
    const [parentName, setParentName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
    
    const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'N/A';

    const handleAddClick = () => {
        if (newStudentName.trim() && selectedClassId) {
            handleAddStudent({ 
                name: newStudentName.trim(), 
                classId: selectedClassId,
                parentName: parentName.trim(),
                parentPhone: parentPhone.trim(),
                admissionDate
            });
            setNewStudentName('');
            setParentName('');
            setParentPhone('');
        }
    };

    return (
        <div className="animate-fade-in">
            <Button onClick={onBack} variant="secondary" className="mb-6">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Management
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Manage Students</h2>
            
            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center"><UserPlusIcon className="w-6 h-6 mr-2 text-indigo-600"/> Add New Student</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="student-name" className="block text-sm font-medium text-slate-700">Student Name</label>
                        <input 
                            type="text" 
                            id="student-name" 
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="e.g., Jane Doe" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                        />
                    </div>
                     <div>
                         <label htmlFor="class-select" className="block text-sm font-medium text-slate-700">Class</label>
                        <select
                            id="class-select"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                             disabled={classes.length === 0}
                        >
                            {classes.length > 0 ? (
                                classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            ) : (
                                <option>Please create a class first</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="parent-name" className="block text-sm font-medium text-slate-700">Parent/Guardian Name</label>
                        <input type="text" id="parent-name" value={parentName} onChange={(e) => setParentName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="parent-phone" className="block text-sm font-medium text-slate-700">Parent/Guardian Phone</label>
                        <input type="tel" id="parent-phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                </div>
                <div className="mt-4 text-right">
                     <Button onClick={handleAddClick} className="h-fit px-6" disabled={!newStudentName || !selectedClassId}>
                        Add Student
                    </Button>
                </div>
            </Card>

            <h3 className="text-xl font-semibold mb-4">Student Roster</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {students.length > 0 ? students.map(student => (
                        <li key={student.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex-grow">
                                <p className="font-medium text-slate-800">{student.name}</p>
                                <div className="text-sm flex flex-wrap gap-x-4">
                                  <span className="text-slate-500">ID: <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{student.id}</span></span>
                                  <span className="text-slate-500">Class: <span className="font-medium text-slate-700">{getClassName(student.classId)}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                                <Button onClick={() => onPrintReportCard(student)} variant="secondary" className="w-full sm:w-auto">
                                    <PrintIcon className="w-4 h-4 mr-2"/>
                                    Print
                                </Button>
                                <Button onClick={() => onViewReportCard(student)} variant="secondary" className="w-full sm:w-auto">
                                    <DocumentReportIcon className="w-4 h-4 mr-2"/>
                                    View Report Card
                                </Button>
                            </div>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-slate-500">No students added yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ManageStudents;
