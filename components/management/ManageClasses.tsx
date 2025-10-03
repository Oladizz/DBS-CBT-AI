
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { PlusIcon, ArrowLeftIcon } from '../icons';
import { useSchool } from '../../contexts/SchoolContext';

interface ManageClassesProps {
    onBack: () => void;
}

const ManageClasses: React.FC<ManageClassesProps> = ({ onBack }) => {
    const { classes, handleCreateClass } = useSchool();
    const [newClassName, setNewClassName] = useState('');

    const handleAddClick = () => {
        if (newClassName.trim()) {
            handleCreateClass(newClassName.trim());
            setNewClassName('');
        }
    };

    return (
        <div className="animate-fade-in">
            <Button onClick={onBack} variant="secondary" className="mb-6 md:hidden">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Manage Classes</h2>
            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center"><PlusIcon className="w-6 h-6 mr-2 text-indigo-600"/> Add New Class</h3>
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="class-name" className="block text-sm font-medium text-slate-700">Class Name</label>
                        <input 
                            type="text" 
                            id="class-name" 
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                            placeholder="e.g., JSS 1A" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <Button onClick={handleAddClick} className="h-fit px-6">
                        Add Class
                    </Button>
                </div>
            </Card>

            <h3 className="text-xl font-semibold mb-4">Existing Classes</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {classes.length > 0 ? classes.map(c => (
                        <li key={c.id} className="p-4 flex justify-between items-center">
                            <p className="font-medium text-slate-800">{c.name}</p>
                            <span className="font-mono text-xs text-slate-400">{c.id}</span>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-slate-500">No classes created yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ManageClasses;
