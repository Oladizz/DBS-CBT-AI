
import React from 'react';

export const FullscreenWarning: React.FC<{ onReEnter: () => void }> = ({ onReEnter }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold text-red-600">Fullscreen Required</h2>
            <p className="mt-2 text-slate-600">You have exited fullscreen mode.</p>
            <p className="text-slate-600">Please re-enter to continue the test.</p>
            <button
                onClick={onReEnter}
                className="mt-6 w-full inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
                Re-enter Fullscreen
            </button>
        </div>
    </div>
);

export const ConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm w-full animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-800">Confirm Submission</h2>
            <p className="mt-2 text-slate-600">Are you sure you want to submit your test? You will not be able to change your answers.</p>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={onCancel} className="px-6 py-2 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    Yes, Submit
                </button>
            </div>
        </div>
    </div>
);
