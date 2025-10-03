
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { PlusIcon, ArrowLeftIcon } from '../icons';
import { useSchool } from '../../contexts/SchoolContext';

interface ManageSessionsProps {
    onBack: () => void;
}

const ManageSessions: React.FC<ManageSessionsProps> = ({ onBack }) => {
    const { sessions, handleCreateSession, handleArchiveSession } = useSchool();
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionTerms, setNewSessionTerms] = useState('First Term, Second Term, Third Term');

    const handleAddClick = () => {
        if (newSessionName.trim() && newSessionTerms.trim()) {
            const termsArray = newSessionTerms.split(',').map(t => t.trim()).filter(Boolean);
            if (termsArray.length > 0) {
                handleCreateSession(newSessionName.trim(), termsArray);
                setNewSessionName('');
                setNewSessionTerms('First Term, Second Term, Third Term');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <Button onClick={onBack} variant="secondary" className="mb-6">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Management
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Manage Academic Sessions</h2>
            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center"><PlusIcon className="w-6 h-6 mr-2 text-indigo-600"/> Add New Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="session-name" className="block text-sm font-medium text-slate-700">Session Name</label>
                        <input 
                            type="text" 
                            id="session-name" 
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="e.g., 2024/2025" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="session-terms" className="block text-sm font-medium text-slate-700">Terms (comma-separated)</label>
                        <input 
                            type="text" 
                            id="session-terms" 
                            value={newSessionTerms}
                            onChange={(e) => setNewSessionTerms(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                        />
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <Button onClick={handleAddClick} className="h-fit px-6">
                        Add Session
                    </Button>
                </div>
            </Card>

            <h3 className="text-xl font-semibold mb-4">Existing Sessions</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {sessions.map(s => (
                        <li key={s.id} className={`p-4 flex justify-between items-center ${s.isArchived ? 'bg-slate-50' : ''}`}>
                            <div>
                                <p className={`font-medium ${s.isArchived ? 'text-slate-500' : 'text-slate-800'}`}>{s.name} {s.isArchived && '(Archived)'}</p>
                                <p className="text-sm text-slate-500">{s.terms.join(' • ')}</p>
                            </div>
                            <Button onClick={() => handleArchiveSession(s.id)} variant="secondary" disabled={s.isArchived}>
                                Archive
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ManageSessions;
