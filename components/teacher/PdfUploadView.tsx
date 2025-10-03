import React, { useState } from 'react';
import { SchoolClass, Test } from '../../types';
import { parseTestFromPdf } from '../../services/geminiService';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import { ArrowLeftIcon, UploadIcon } from '../icons';
// FIX: Import useSchool hook to access school context
import { useSchool } from '../../contexts/SchoolContext';

interface PdfUploadViewProps {
    onTestCreated: (test: Omit<Test, 'id'>) => void;
    onBack: () => void;
}

const PdfUploadView: React.FC<PdfUploadViewProps> = ({ onTestCreated, onBack }) => {
    const { classes } = useSchool();
    const [file, setFile] = useState<File | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError("Please select a valid PDF file.");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }
         if (!selectedClassId) {
            setError("Please select a class for this test.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const newTest = await parseTestFromPdf(base64String);
                onTestCreated({ ...newTest, classId: selectedClassId });
            };
            reader.onerror = () => {
                throw new Error("Failed to read the file.");
            };
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during upload.');
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
             <Button onClick={onBack} variant="secondary" className="mb-6 md:hidden">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Upload Test from PDF</h2>
            <Card className="p-8 space-y-6">
                <div>
                     <label htmlFor="class-select" className="block text-sm font-medium text-slate-700">Class</label>
                    <select
                        id="class-select"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={classes.length === 0}
                    >
                        {classes.length > 0 ? (
                            classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        ) : (
                            <option>Please create a class first</option>
                        )}
                    </select>
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-12">
                    <UploadIcon className="w-16 h-16 text-slate-400" />
                    <label htmlFor="pdf-upload" className="mt-4 cursor-pointer relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
                        <UploadIcon className="w-5 h-5 mr-2" />
                        <span>Select PDF file</span>
                        <input id="pdf-upload" name="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                    </label>
                    {file && <p className="mt-2 text-sm text-slate-500">{file.name}</p>}
                </div>
                {error && <p className="mt-4 text-center text-red-600">{error}</p>}
                <div className="mt-6 text-center">
                     <Button onClick={handleUpload} disabled={!file || isLoading || !selectedClassId} className="w-full max-w-xs px-6 py-3">
                        {isLoading ? <><Spinner size="w-5 h-5 mr-2" /> Processing...</> : "Upload and Create Test"}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PdfUploadView;