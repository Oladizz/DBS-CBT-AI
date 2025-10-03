
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Student, Submission, Test } from '../../types';
import { generateStudentReportSummary } from '../../services/geminiService';
import { useSchool } from '../../contexts/SchoolContext';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import PerformanceChart from './PerformanceChart';
import { SparklesIcon, PrintIcon, ArrowLeftIcon, DocumentDownloadIcon } from '../icons';

interface StudentReportCardViewProps {
    student: Student;
    onBack: () => void;
    isPrintView?: boolean;
}

const StudentReportCardView: React.FC<StudentReportCardViewProps> = ({ student, onBack, isPrintView = false }) => {
    const { submissions, tests, classes, getSubjectName, getSessionName } = useSchool();
    const studentSubmissions = submissions.filter(s => s.studentId === student.id);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const className = classes.find(c => c.id === student.classId)?.name || 'Unknown Class';

    useEffect(() => {
        if (isPrintView) {
            const handleAfterPrint = () => { onBack(); };
            window.addEventListener('afterprint', handleAfterPrint);
            
            const timer = setTimeout(() => window.print(), 500);

            return () => {
                window.removeEventListener('afterprint', handleAfterPrint);
                clearTimeout(timer);
            };
        }
    }, [isPrintView, onBack]);

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        const testsForSummary = tests.map(t => ({...t, subject: getSubjectName(t.subjectId)}));
        const summary = await generateStudentReportSummary(student, studentSubmissions, testsForSummary);
        setAiSummary(summary);
        setIsSummaryLoading(false);
    };

    const overallAverage = studentSubmissions.length > 0
        ? studentSubmissions.reduce((acc, sub) => acc + sub.score, 0) / studentSubmissions.length
        : 0;
    
    const performanceBySubject = studentSubmissions.reduce<Record<string, { scores: number[], count: number }>>((acc, sub) => {
        const test = tests.find(t => t.id === sub.testId);
        const subject = test ? getSubjectName(test.subjectId) : 'Uncategorized';
        if (!acc[subject]) {
            acc[subject] = { scores: [], count: 0 };
        }
        acc[subject].scores.push(sub.score);
        acc[subject].count++;
        return acc;
    }, {});

    const subjectAverages = Object.entries(performanceBySubject).map(([subject, data]) => ({
        name: subject,
        average: data.scores.reduce((a, b) => a + b, 0) / data.count
    })).sort((a, b) => b.average - a.average);

    const bestSubject = subjectAverages.length > 0 ? { name: subjectAverages[0].name, score: subjectAverages[0].average } : null;
    const areaForFocus = subjectAverages.length > 1 && subjectAverages[subjectAverages.length - 1].average < 70 ? { name: subjectAverages[subjectAverages.length - 1].name, score: subjectAverages[subjectAverages.length - 1].average } : null;

    const submissionsByTerm = studentSubmissions.reduce<Record<string, Submission[]>>((acc, sub) => {
        const test = tests.find(t => t.id === sub.testId);
        if(test) {
            const key = `${test.sessionId}-${test.term}`;
            if(!acc[key]) acc[key] = [];
            acc[key].push(sub);
        }
        return acc;
    }, {});


    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const reportCardElement = document.getElementById('report-card-printable');
        if (!reportCardElement) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(reportCardElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            let imgWidth = pdfWidth;
            let imgHeight = imgWidth / ratio;
            if(imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = imgHeight * ratio;
            }
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${student.name.replace(/\s/g, '_')}_Report_Card.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="animate-fade-in">
             <style>{`@media print { body * { visibility: hidden; } #report-card-printable, #report-card-printable * { visibility: visible; } #report-card-printable { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none; } }`}</style>
            <div className="flex justify-between items-center mb-6 no-print">
                 <Button onClick={onBack} variant="secondary"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back</Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                        {isDownloading ? <><Spinner size="w-5 h-5 mr-2" /> Downloading...</> : <><DocumentDownloadIcon className="w-5 h-5 mr-2" /> Download PDF</>}
                    </Button>
                     <Button onClick={handlePrint}><PrintIcon className="w-5 h-5 mr-2" /> Print Report</Button>
                </div>
            </div>
            <div id="report-card-printable" className="bg-slate-50 p-4 sm:p-6 lg:p-8 rounded-2xl">
                <div className="border-b border-slate-200 pb-6 mb-6">
                    <h2 className="text-3xl font-bold text-slate-900">Student Performance Report</h2>
                     <div className="mt-2 flex flex-col sm:flex-row justify-between sm:items-center">
                      <p className="text-2xl font-semibold text-slate-800">{student.name}</p>
                      <p className="text-base text-slate-500 font-mono">ID: {student.id}</p>
                    </div>
                    <div className="mt-2 text-sm text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                        <p><span className="font-semibold">Class:</span> {className}</p>
                        {student.parentName && <p><span className="font-semibold">Parent:</span> {student.parentName}</p>}
                        {student.parentPhone && <p><span className="font-semibold">Parent Phone:</span> {student.parentPhone}</p>}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-indigo-500"/> AI Performance Summary</h3>
                            {aiSummary ? <div className="p-4 bg-indigo-50 text-indigo-800 rounded-lg text-sm">{aiSummary}</div> : <Button onClick={handleGenerateSummary} disabled={isSummaryLoading || studentSubmissions.length === 0}>{isSummaryLoading ? <><Spinner size="w-5 h-5 mr-2"/> Generating...</> : <>Generate Summary</>}</Button>}
                            {studentSubmissions.length === 0 && <p className="mt-2 text-xs text-slate-500">Summary requires completed tests.</p>}
                        </Card>
                         {Object.keys(performanceBySubject).length > 0 && <Card className="p-6"><h3 className="font-semibold text-slate-800 mb-4">Performance by Subject</h3><div className="space-y-3">{subjectAverages.map(({ name, average }) => <div key={name} className="flex items-center justify-between text-sm"><p className="font-medium text-slate-700">{name}</p><p className={`font-bold ${average >= 70 ? 'text-green-700' : 'text-red-700'}`}>{average.toFixed(1)}%</p></div>)}</div></Card>}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center"><p className="text-sm font-medium text-slate-500">Tests Taken</p><p className="text-3xl font-bold text-slate-800">{studentSubmissions.length}</p></div>
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center"><p className="text-sm font-medium text-slate-500">Average</p><p className={`text-3xl font-bold ${overallAverage >= 70 ? 'text-green-600' : 'text-slate-800'}`}>{overallAverage.toFixed(1)}%</p></div>
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center"><p className="text-sm font-medium text-slate-500">Best Subject</p>{bestSubject ? <><p className="text-xl font-bold text-green-600 truncate">{bestSubject.name}</p><p className="text-xs text-slate-500">{bestSubject.score.toFixed(1)}% Avg</p></> : <p className="text-2xl font-bold text-slate-400">-</p>}</div>
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center"><p className="text-sm font-medium text-slate-500">Area for Focus</p>{areaForFocus ? <><p className="text-xl font-bold text-red-600 truncate">{areaForFocus.name}</p><p className="text-xs text-slate-500">{areaForFocus.score.toFixed(1)}% Avg</p></> : <p className="text-2xl font-bold text-slate-400">-</p>}</div>
                        </div>

                        <Card className="p-6"><h3 className="font-semibold text-slate-800 mb-4">Performance Over Time</h3><PerformanceChart submissions={studentSubmissions} /></Card>
                        
                        <div className="space-y-4">
                            {Object.entries(submissionsByTerm).map(([key, termSubmissions]) => {
                                const [sessionId, term] = key.split('-');
                                return (
                                <Card className="overflow-hidden" key={key}>
                                    <h3 className="font-semibold text-slate-800 p-6 pb-2">{getSessionName(sessionId)} - {term}</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Test Title</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th></tr></thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {termSubmissions.map(sub => {
                                                    const test = tests.find(t => t.id === sub.testId);
                                                    return (<tr key={sub.id}>
                                                        <td className="px-6 py-4"><div className="text-sm font-medium text-slate-900">{test?.title || 'N/A'}</div><div className="text-sm text-slate-500">{test ? getSubjectName(test.subjectId) : 'N/A'}</div></td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">{sub.submittedAt.toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-sm"><div className="flex items-center"><span className={`h-2.5 w-2.5 rounded-full ${getScoreColor(sub.score)} mr-2`}></span><span className="font-bold">{sub.score.toFixed(1)}%</span></div></td>
                                                    </tr>);
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                                )
                            })}
                             {studentSubmissions.length === 0 && <Card className="p-8 text-center text-slate-500">No test history available.</Card>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentReportCardView;
