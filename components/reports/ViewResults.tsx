
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { ArrowLeftIcon, ChartBarIcon, SparklesIcon, DocumentTextIcon, EyeIcon } from '../icons';
import { useSchool } from '../../contexts/SchoolContext';
import { Test, Submission, LessonPlan } from '../../types';
import { analyzeTestResults, generateLessonPlan } from '../../services/geminiService';

interface ViewResultsProps {
    test: Test;
    onBack: () => void;
    onSelectSubmission: (submission: Submission) => void;
}

const ViewResults: React.FC<ViewResultsProps> = ({ test, onBack, onSelectSubmission }) => {
    const { submissions, students, classes, getSubjectName } = useSchool();
    const relevantSubmissions = submissions.filter(s => s.testId === test.id);
    const averageScore = relevantSubmissions.length > 0 ? relevantSubmissions.reduce((acc, s) => acc + s.score, 0) / relevantSubmissions.length : 0;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<{ summary: string; struggledTopics: string[] } | null>(null);
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [isGeneratingPlans, setIsGeneratingPlans] = useState(false);
    
    const className = classes.find(c => c.id === test.classId)?.name || 'Unknown Class';
    const subjectName = getSubjectName(test.subjectId);

    const getStudentName = (studentId: string) => {
        return students.find(s => s.id === studentId)?.name || 'Unknown Student';
    }

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysis(null);
        setLessonPlans([]);
        const result = await analyzeTestResults({ ...test, subject: subjectName }, relevantSubmissions);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const handleGeneratePlans = async () => {
        if (!analysis?.struggledTopics.length) return;
        setIsGeneratingPlans(true);
        setLessonPlans([]);
        try {
            const plans = await Promise.all(
                analysis.struggledTopics.map(topic => generateLessonPlan(topic, subjectName))
            );
            setLessonPlans(plans);
        } catch (error) {
            console.error("Error generating lesson plans:", error);
        } finally {
            setIsGeneratingPlans(false);
        }
    };
    
    return (
        <div className="animate-fade-in">
             <Button onClick={onBack} variant="secondary" className="mb-6">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{test.title} - Results</h2>
            <p className="text-slate-500 mb-6">Class: {className} | Subject: {subjectName}</p>

            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold">Summary</h3>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Submissions</p>
                        <p className="text-2xl font-bold">{relevantSubmissions.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Average Score</p>
                        <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-2 flex items-center"><ChartBarIcon className="w-6 h-6 mr-2 text-indigo-600"/> AI Analysis & Lesson Planner</h3>
                <p className="text-sm text-slate-500 mb-4">Get AI-powered insights and lesson plan suggestions.</p>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || relevantSubmissions.length === 0}>
                    {isAnalyzing ? <><Spinner size="w-5 h-5 mr-2"/> Analyzing...</> : <><SparklesIcon className="w-5 h-5 mr-2"/>Generate Analysis</>}
                </Button>
                {analysis && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg whitespace-pre-wrap font-sans">
                        <p className="text-indigo-800">{analysis.summary}</p>
                    </div>
                )}
                {analysis && analysis.struggledTopics.length > 0 && (
                    <div className="mt-4">
                        <Button onClick={handleGeneratePlans} disabled={isGeneratingPlans}>
                            {isGeneratingPlans ? <><Spinner size="w-5 h-5 mr-2" /> Generating Plans...</> : <><DocumentTextIcon className="w-5 h-5 mr-2"/> Generate Lesson Plan Suggestions</>}
                        </Button>
                    </div>
                )}
                 {lessonPlans.length > 0 && (
                    <div className="mt-6 space-y-6">
                        <h4 className="text-lg font-semibold text-slate-800">Lesson Plan Suggestions</h4>
                        {lessonPlans.map((plan, index) => (
                            <Card key={index} className="p-4 bg-slate-50 border-l-4 border-indigo-400">
                                <h5 className="font-bold text-indigo-700">Topic: {plan.topic}</h5>
                                <div className="mt-3 text-sm space-y-2">
                                    <p><span className="font-semibold">Objective:</span> {plan.learningObjective}</p>
                                    <div>
                                    <p className="font-semibold">Key Concepts:</p>
                                    <ul className="list-disc list-inside ml-2 text-slate-600">
                                        {plan.keyConcepts.map((concept, i) => <li key={i}>{concept}</li>)}
                                    </ul>
                                    </div>
                                    <p><span className="font-semibold">Activity Idea:</span> {plan.activityIdea}</p>
                                    <p><span className="font-semibold">Check for Understanding:</span> {plan.checkForUnderstanding}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                 {relevantSubmissions.length === 0 && !analysis && <p className="mt-4 text-sm text-amber-700 bg-amber-100 p-3 rounded-md">Analysis requires at least one submission.</p>}
            </Card>

            <h3 className="text-xl font-semibold mb-4">All Submissions</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {relevantSubmissions.length > 0 ? relevantSubmissions.map(sub => (
                        <li key={sub.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <p className="font-medium">{getStudentName(sub.studentId)}</p>
                                <p className="text-sm text-slate-500">Submitted at: {sub.submittedAt.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 text-sm font-medium rounded-full ${sub.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    Score: {sub.score.toFixed(1)}%
                                </div>
                                <Button variant="secondary" onClick={() => onSelectSubmission(sub)}>
                                    <EyeIcon className="w-4 h-4 mr-2" /> View
                                </Button>
                            </div>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-slate-500">No submissions for this test yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ViewResults;
