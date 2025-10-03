
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { PlusIcon, ArrowLeftIcon } from '../icons';
import { useSchool } from '../../contexts/SchoolContext';

interface ManageSubjectsProps {
    onBack: () => void;
}

const ManageSubjects: React.FC<ManageSubjectsProps> = ({ onBack }) => {
    const { subjects, handleCreateSubject } = useSchool();
    const [newSubjectName, setNewSubjectName] = useState('');

    const handleAddClick = () => {
        if (newSubjectName.trim()) {
            handleCreateSubject(newSubjectName.trim());
            setNewSubjectName('');
        }
    };

    return (
        <div className="animate-fade-in">
            <Button onClick={onBack} variant="secondary" className="mb-6">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Management
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Manage Subjects</h2>
            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center"><PlusIcon className="w-6 h-6 mr-2 text-indigo-600"/> Add New Subject</h3>
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="subject-name" className="block text-sm font-medium text-slate-700">Subject Name</label>
                        <input 
                            type="text" 
                            id="subject-name" 
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                            placeholder="e.g., Mathematics" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                        />
                    </div>
                    <Button onClick={handleAddClick} className="h-fit px-6">
                        Add Subject
                    </Button>
                </div>
            </Card>

            <h3 className="text-xl font-semibold mb-4">Existing Subjects</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {subjects.length > 0 ? subjects.map(s => (
                        <li key={s.id} className="p-4 flex justify-between items-center">
                            <p className="font-medium text-slate-800">{s.name}</p>
                            <span className="font-mono text-xs text-slate-400">{s.id}</span>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-slate-500">No subjects created yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ManageSubjects;
