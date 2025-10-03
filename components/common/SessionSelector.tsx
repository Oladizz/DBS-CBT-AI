
import React from 'react';
import { useSchool } from '../../contexts/SchoolContext';

const SessionSelector: React.FC = () => {
    const { sessions, activeSessionId, setActiveSessionId, activeTerm, setActiveTerm } = useSchool();
    
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const availableSessions = sessions.filter(s => !s.isArchived);

    const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSessionId = e.target.value;
        setActiveSessionId(newSessionId);
    };

    const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveTerm(e.target.value);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <label htmlFor="session-selector" className="block text-sm font-medium text-slate-700">
                    Academic Session
                </label>
                <select 
                    id="session-selector" 
                    value={activeSessionId} 
                    onChange={handleSessionChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {availableSessions.map(session => (
                        <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                     {sessions.filter(s => s.isArchived).length > 0 && <option disabled>-- Archived --</option>}
                     {sessions.filter(s => s.isArchived).map(session => (
                        <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1">
                 <label htmlFor="term-selector" className="block text-sm font-medium text-slate-700">
                    Term
                </label>
                <select 
                    id="term-selector" 
                    value={activeTerm} 
                    onChange={handleTermChange}
                    disabled={!activeSession || activeSession.terms.length === 0}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {activeSession?.terms.map(term => (
                        <option key={term} value={term}>{term}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default SessionSelector;
