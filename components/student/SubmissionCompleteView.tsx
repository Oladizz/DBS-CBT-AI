
import React from 'react';
import { CheckCircleIcon } from '../icons';

interface SubmissionCompleteViewProps {
    onBackToDashboard: () => void;
}

const SubmissionCompleteView: React.FC<SubmissionCompleteViewProps> = ({ onBackToDashboard }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
            <CheckCircleIcon className="w-24 h-24 text-green-500" />
            <h2 className="mt-8 text-4xl font-bold text-slate-800">Test Submitted</h2>
            <p className="mt-2 text-lg text-slate-600">Your submission has been received. Your teacher will review your answers.</p>
            <button
                onClick={onBackToDashboard}
                className="mt-8 inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
                Return to Dashboard
            </button>
        </div>
    );
};

export default SubmissionCompleteView;
