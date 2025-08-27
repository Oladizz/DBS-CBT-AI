
import React, { useState, useEffect } from 'react';
import { Test, Question, Submission, QuestionType, Student, LessonPlan } from '../types';
import { generateQuestions, analyzeTestResults, parseTestFromPdf, generateStudentReportSummary, generateLessonPlan } from '../services/geminiService';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { BookOpenIcon, ClockIcon, SparklesIcon, UserGroupIcon, TrashIcon, RefreshIcon, ChartBarIcon, UserPlusIcon, UploadIcon, DocumentReportIcon, PrintIcon, PlusIcon, ArrowLeftIcon, CheckCircleIcon, EditIcon, EyeIcon, HomeIcon, DocumentTextIcon } from './icons';
import TestReport from './common/TestReport';
import FooterNav, { NavItem } from './common/FooterNav';

// Props for TeacherView
interface TeacherViewProps {
  tests: Test[];
  submissions: Submission[];
  students: Student[];
  handleCreateTest: (test: Omit<Test, 'id'>) => void;
  handleUpdateTest: (test: Test) => void;
  handleAddStudent: (name: string) => void;
  onExit: () => void;
}

const Button: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
    title?: string;
}> = ({ onClick, children, className = '', variant = 'primary', disabled = false, title = '' }) => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const styles = {
        primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-indigo-500',
        danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
        success: 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${styles[variant]} ${className}`} title={title}>
            {children}
        </button>
    );
};

// Sub-component: PdfUploadView
const PdfUploadView: React.FC<{
    onTestCreated: (test: Omit<Test, 'id'>) => void;
    onBack: () => void;
}> = ({ onTestCreated, onBack }) => {
    const [file, setFile] = useState<File | null>(null);
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
        setIsLoading(true);
        setError(null);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const newTest = await parseTestFromPdf(base64String);
                onTestCreated(newTest);
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
            <Card className="p-8">
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
                     <Button onClick={handleUpload} disabled={!file || isLoading} className="w-full max-w-xs px-6 py-3">
                        {isLoading ? <><Spinner size="w-5 h-5 mr-2" /> Processing...</> : "Upload and Create Test"}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

// Sub-component: StudentReportCardView
const StudentReportCardView: React.FC<{
    student: Student;
    submissions: Submission[];
    tests: Test[];
    onBack: () => void;
}> = ({ student, submissions, tests, onBack }) => {
    const studentSubmissions = submissions.filter(s => s.studentId === student.id);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        const summary = await generateStudentReportSummary(student, studentSubmissions, tests);
        setAiSummary(summary);
        setIsSummaryLoading(false);
    };

    const overallAverage = studentSubmissions.length > 0
        ? studentSubmissions.reduce((acc, sub) => acc + sub.score, 0) / studentSubmissions.length
        : 0;
    
    const performanceBySubject = studentSubmissions.reduce((acc, sub) => {
        const test = tests.find(t => t.id === sub.testId);
        const subject = test?.subject || 'Uncategorized';
        if (!acc[subject]) {
            acc[subject] = { scores: [], count: 0 };
        }
        acc[subject].scores.push(sub.score);
        acc[subject].count++;
        return acc;
    }, {} as Record<string, { scores: number[], count: number }>);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-fade-in">
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #report-card-printable, #report-card-printable * {
                        visibility: visible;
                    }
                    #report-card-printable {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>
            <div className="flex justify-between items-center mb-6 no-print">
                 <Button onClick={onBack} variant="secondary">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Student Roster
                </Button>
                 <Button onClick={handlePrint}>
                    <PrintIcon className="w-5 h-5 mr-2" /> Print Report
                </Button>
            </div>
            <div id="report-card-printable">
              <Card className="p-8">
                <div className="border-b border-slate-200 pb-6 mb-6">
                    <h2 className="text-3xl font-bold text-slate-900">Student Report Card</h2>
                    <div className="mt-2 flex justify-between">
                      <p className="text-xl font-semibold text-slate-700">{student.name}</p>
                      <p className="text-lg text-slate-500">Student ID: {student.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <p className="text-sm font-medium text-slate-500">Tests Completed</p>
                        <p className="text-3xl font-bold text-slate-800">{studentSubmissions.length}</p>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <p className="text-sm font-medium text-slate-500">Overall Average Score</p>
                        <p className={`text-3xl font-bold ${overallAverage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {overallAverage.toFixed(1)}%
                        </p>
                    </div>
                </div>
                
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-indigo-500"/> AI Performance Summary</h3>
                     <Button onClick={handleGenerateSummary} disabled={isSummaryLoading || studentSubmissions.length === 0} className="no-print">
                        {isSummaryLoading ? <><Spinner size="w-5 h-5 mr-2"/> Generating...</> : <><SparklesIcon className="w-5 h-5 mr-2" />Generate Summary</>}
                    </Button>
                    {aiSummary && (
                        <div className="mt-4 p-4 bg-indigo-50 text-indigo-800 rounded-lg">{aiSummary}</div>
                    )}
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Performance by Subject</h3>
                    <div className="space-y-3">
                         {Object.keys(performanceBySubject).length > 0 ? Object.entries(performanceBySubject).map(([subject, data]) => {
                             const avg = data.scores.reduce((a, b) => a + b, 0) / data.count;
                             return (
                                <div key={subject} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <p className="font-medium text-slate-700">{subject}</p>
                                    <p className={`font-bold text-lg ${avg >= 70 ? 'text-green-700' : 'text-red-700'}`}>{avg.toFixed(1)}%</p>
                                </div>
                             )
                         }) : <p className="text-slate-500">No subject data to analyze.</p>}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold mb-4">Test History</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Submitted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {studentSubmissions.length > 0 ? studentSubmissions.map(sub => {
                                    const test = tests.find(t => t.id === sub.testId);
                                    return (
                                        <tr key={sub.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{test?.title || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">{test?.subject || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">{sub.submittedAt.toLocaleDateString()}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap font-bold ${sub.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>{sub.score.toFixed(1)}%</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-500">No tests completed yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              </Card>
            </div>
        </div>
    );
};

// Sub-component: ManageStudents
const ManageStudents: React.FC<{
    students: Student[];
    onAddStudent: (name: string) => void;
    onViewReportCard: (student: Student) => void;
    onBack: () => void;
}> = ({ students, onAddStudent, onViewReportCard, onBack}) => {
    const [newStudentName, setNewStudentName] = useState('');

    const handleAddClick = () => {
        if (newStudentName.trim()) {
            onAddStudent(newStudentName.trim());
            setNewStudentName('');
        }
    };

    return (
        <div className="animate-fade-in">
            <Button onClick={onBack} variant="secondary" className="mb-6 md:hidden">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Manage Students</h2>
            
            <Card className="p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center"><UserPlusIcon className="w-6 h-6 mr-2 text-indigo-600"/> Add New Student</h3>
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="student-name" className="block text-sm font-medium text-slate-700">Student Name</label>
                        <input 
                            type="text" 
                            id="student-name" 
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                            placeholder="e.g., Jane Doe" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <Button onClick={handleAddClick} className="h-fit px-6">
                        Add
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
                                <div className="text-sm">
                                  <span className="text-slate-500">Login ID: </span>
                                  <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{student.id}</span>
                                </div>
                            </div>
                             <Button onClick={() => onViewReportCard(student)} variant="secondary" className="w-full sm:w-auto">
                                <DocumentReportIcon className="w-4 h-4 mr-2"/>
                                View Report Card
                            </Button>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-slate-500">No students added yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};


// Sub-component: TestEditorForm (for creating and editing tests)
const TestEditorForm: React.FC<{
  onSave: (test: Omit<Test, 'id'> | Test) => void;
  onCancel: () => void;
  initialTest?: Test;
}> = ({ onSave, onCancel, initialTest }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(30);
  const [aiTopic, setAiTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialTest;

  useEffect(() => {
      if (initialTest) {
          setTitle(initialTest.title);
          setSubject(initialTest.subject);
          setDuration(initialTest.durationMinutes);
          setGeneratedQuestions(initialTest.questions);
      }
  }, [initialTest]);

  const handleGenerateQuestions = async (indexToReplace?: number) => {
    if (!aiTopic.trim()) {
      setError('Please provide a topic for question generation.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const questionsToGen = indexToReplace !== undefined ? 1 : numQuestions;
      const newQuestions = await generateQuestions(aiTopic, questionsToGen, subject || 'General', questionType);
      
      const questionsWithIds = newQuestions.map(q => ({...q, id: crypto.randomUUID()}));

      if (indexToReplace !== undefined) {
         setGeneratedQuestions(current => {
            const newQuestionsList = [...current];
            newQuestionsList[indexToReplace] = questionsWithIds[0];
            return newQuestionsList;
         });
      } else {
         setGeneratedQuestions(current => [...current, ...questionsWithIds]);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveQuestion = (index: number) => {
      setGeneratedQuestions(current => current.filter((_, i) => i !== index));
  }

  const handleSaveTest = () => {
    if (!title || !subject || generatedQuestions.length === 0) {
      setError('Please fill in all fields and add questions before saving.');
      return;
    }
    const newTest = {
      id: initialTest?.id,
      title,
      subject,
      durationMinutes: duration,
      questions: generatedQuestions,
    };
    onSave(newTest);
  };

  return (
    <div className="animate-fade-in">
      <Button onClick={onCancel} variant="secondary" className="mb-6 md:hidden">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
      </Button>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">{isEditMode ? 'Edit Test' : 'Create New Test'}</h2>
      <div className="space-y-6 bg-white p-8 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Test Title</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
            <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-700">Duration (minutes)</label>
          <input type="number" id="duration" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        
        <div className="p-6 rounded-lg bg-indigo-50 border border-indigo-200">
          <h3 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-indigo-500" /> AI Question Generator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ai-topic" className="block text-sm font-medium text-slate-700">Topic</label>
                <input type="text" id="ai-topic" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g., The American Revolution" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="q-type" className="block text-sm font-medium text-slate-700">Question Type</label>
                <select id="q-type" value={questionType} onChange={e => setQuestionType(e.target.value as QuestionType)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="short-answer">Short Answer</option>
                </select>
              </div>
          </div>
           <div className="mt-4 flex items-end gap-4">
               <div>
                  <label htmlFor="num-questions" className="block text-sm font-medium text-slate-700"># of Questions</label>
                  <input type="number" id="num-questions" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
               </div>
                <Button onClick={() => handleGenerateQuestions()} disabled={isLoading} className="h-fit px-6 py-2 text-base">
                    {isLoading ? <Spinner size="w-5 h-5" /> : <><PlusIcon className="w-5 h-5 mr-2" /> Add Questions</>}
                </Button>
           </div>
        </div>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Test Questions ({generatedQuestions.length})</h3>
            {generatedQuestions.length > 0 ? (
                generatedQuestions.map((q, index) => (
                    <Card key={q.id || index} className="p-4 bg-slate-50 relative group">
                        <p className="font-semibold pr-20">{index + 1}. {q.questionText}</p>
                        {q.questionType === 'multiple-choice' ? (
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                {q.options?.map((opt, i) => (
                                    <li key={i} className={`${i === q.correctAnswerIndex ? 'text-green-700 font-medium' : 'text-slate-600'}`}>{opt} {i === q.correctAnswerIndex && '(Correct)'}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="mt-2 text-sm">
                                <p className="font-semibold text-slate-500">Model Answer:</p>
                                <p className="text-slate-600 italic">"{q.modelAnswer}"</p>
                            </div>
                        )}
                         <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleGenerateQuestions(index)} title="Regenerate" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-indigo-600 disabled:text-slate-300" disabled={isLoading}>{isLoading ? <Spinner size="w-5 h-5"/> :<RefreshIcon className="w-5 h-5"/>}</button>
                             <button onClick={() => handleRemoveQuestion(index)} title="Delete" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                         </div>
                    </Card>
                ))
            ) : <p className="text-slate-500 text-center py-4">No questions added yet. Use the generator above.</p>}
        </div>

        <div className="flex justify-end space-x-4">
          <Button onClick={onCancel} variant="secondary" className="px-6 py-2 text-base hidden md:inline-flex">
            Cancel
          </Button>
          <Button onClick={handleSaveTest} variant="success" disabled={generatedQuestions.length === 0} className="px-6 py-2 text-base">
            <CheckCircleIcon className="w-5 h-5 mr-2" /> {isEditMode ? 'Save Changes' : 'Save Test'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: ViewResults
const ViewResults: React.FC<{
  test: Test;
  submissions: Submission[];
  students: Student[];
  onBack: () => void;
  onSelectSubmission: (submission: Submission) => void;
}> = ({ test, submissions, students, onBack, onSelectSubmission }) => {
    const relevantSubmissions = submissions.filter(s => s.testId === test.id);
    const averageScore = relevantSubmissions.length > 0 ? relevantSubmissions.reduce((acc, s) => acc + s.score, 0) / relevantSubmissions.length : 0;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<{ summary: string; struggledTopics: string[] } | null>(null);
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [isGeneratingPlans, setIsGeneratingPlans] = useState(false);


    const getStudentName = (studentId: string) => {
        return students.find(s => s.id === studentId)?.name || 'Unknown Student';
    }

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysis(null);
        setLessonPlans([]);
        const result = await analyzeTestResults(test, relevantSubmissions);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const handleGeneratePlans = async () => {
        if (!analysis?.struggledTopics.length) return;
        setIsGeneratingPlans(true);
        setLessonPlans([]);
        try {
            const plans = await Promise.all(
                analysis.struggledTopics.map(topic => generateLessonPlan(topic, test.subject))
            );
            setLessonPlans(plans);
        } catch (error) {
            console.error("Error generating lesson plans:", error);
            // Optionally, set an error state to show in the UI
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
            <p className="text-slate-500 mb-6">Subject: {test.subject}</p>

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

// Main TeacherView Component
const TeacherView: React.FC<TeacherViewProps> = ({ tests, submissions, students, handleCreateTest, handleUpdateTest, handleAddStudent, onExit }) => {
  type ViewState = 'dashboard' | 'create' | 'edit_test' | 'results' | 'manage_students' | 'upload_pdf' | 'report_card' | 'view_submission';
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const teacherNavItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { key: 'manage_students', label: 'Students', icon: <UserGroupIcon /> },
    { key: 'create', label: 'New Test', icon: <PlusIcon /> },
    { key: 'upload_pdf', label: 'Upload', icon: <UploadIcon /> },
  ];

  const onSaveTest = (testData: Omit<Test, 'id'> | Test) => {
    if ('id' in testData && testData.id) {
        handleUpdateTest(testData as Test);
    } else {
        handleCreateTest(testData as Omit<Test, 'id'>);
    }
    setView('dashboard');
  };

  const handleEditTest = (test: Test) => {
      setSelectedTest(test);
      setView('edit_test');
  }

  const handleViewResults = (test: Test) => {
    setSelectedTest(test);
    setView('results');
  };
  
  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setView('view_submission');
  };

  const handleViewReportCard = (student: Student) => {
    setSelectedStudent(student);
    setView('report_card');
  }

  const renderContent = () => {
    switch (view) {
        case 'create':
            return <TestEditorForm onSave={onSaveTest} onCancel={() => setView('dashboard')} />;
        case 'edit_test':
            if (selectedTest) {
                return <TestEditorForm initialTest={selectedTest} onSave={onSaveTest} onCancel={() => setView('dashboard')} />;
            }
            return null;
        case 'upload_pdf':
            return <PdfUploadView onTestCreated={(test) => {handleCreateTest(test); setView('dashboard')}} onBack={() => setView('dashboard')} />;
        case 'results':
            if (selectedTest) {
                return <ViewResults test={selectedTest} submissions={submissions} students={students} onBack={() => setView('dashboard')} onSelectSubmission={handleSelectSubmission}/>;
            }
            return null;
        case 'view_submission':
             if (selectedTest && selectedSubmission) {
                const student = students.find(s => s.id === selectedSubmission.studentId);
                return <TestReport
                    test={selectedTest}
                    submission={selectedSubmission}
                    studentName={student?.name || 'Unknown Student'}
                    onBack={() => {
                        setSelectedSubmission(null);
                        setView('results');
                    }}
                />
            }
            return null;
        case 'manage_students':
            return <ManageStudents students={students} onAddStudent={handleAddStudent} onViewReportCard={handleViewReportCard} onBack={() => setView('dashboard')} />;
        case 'report_card':
            if (selectedStudent) {
                return <StudentReportCardView student={selectedStudent} submissions={submissions} tests={tests} onBack={() => setView('manage_students')} />;
            }
            return null;
        case 'dashboard':
        default:
            return (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-800">Teacher Dashboard</h2>
                  <div className="hidden md:flex flex-wrap items-center gap-3">
                     <Button onClick={() => setView('upload_pdf')} variant="secondary">
                        <UploadIcon className="w-5 h-5 mr-2"/> Upload from PDF
                    </Button>
                    <Button onClick={() => setView('manage_students')} variant="secondary">
                      <UserGroupIcon className="w-5 h-5 mr-2" /> Manage Students
                    </Button>
                    <Button onClick={() => setView('create')}>
                      <PlusIcon className="w-5 h-5 mr-2"/> Create New Test
                    </Button>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-4">My Tests</h3>
                {tests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests.map(test => {
                      const hasSubmissions = submissions.some(s => s.testId === test.id);
                      return (
                      <Card key={test.id} className="flex flex-col">
                        <div className="p-6 flex-grow">
                          <h4 className="text-xl font-bold text-slate-900">{test.title}</h4>
                          <div className="mt-2 flex items-center text-sm text-slate-500">
                              <BookOpenIcon className="w-4 h-4 mr-2" />
                              <span>{test.subject}</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-slate-500">
                              <ClockIcon className="w-4 h-4 mr-2" />
                              <span>{test.durationMinutes} minutes</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-slate-500">
                              <span>{test.questions.length} questions</span>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row gap-2">
                             <Button onClick={() => handleEditTest(test)} variant="secondary" className="flex-1" disabled={hasSubmissions} title={hasSubmissions ? "Cannot edit tests with submissions" : "Edit test"}>
                                <EditIcon className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button onClick={() => handleViewResults(test)} variant="secondary" className="flex-1">
                                Results ({submissions.filter(s => s.testId === test.id).length})
                            </Button>
                        </div>
                      </Card>
                    )})}
                  </div>
                ) : (
                  <Card className="text-center p-12 border-2 border-dashed border-slate-300">
                    <h3 className="text-lg font-medium">No tests created yet.</h3>
                    <p className="text-slate-500 mt-2">Use one of the creation methods above to get started.</p>
                  </Card>
                )}
              </div>
            );
    }
  };

  const mainFooterViews: ViewState[] = ['dashboard', 'create', 'manage_students', 'upload_pdf'];
  const showFooter = mainFooterViews.includes(view);
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8 no-print">
        <h1 className="text-2xl font-bold text-indigo-600 flex items-center"><UserGroupIcon className="w-8 h-8 mr-2"/> Teacher Portal</h1>
        <button onClick={onExit} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Switch Role</button>
      </header>
      <main>
        {renderContent()}
      </main>
      {showFooter && (
        <FooterNav
          navItems={teacherNavItems}
          activeItem={view}
          onNavigate={(v) => {
            // Reset selections when navigating between main views
            setSelectedTest(null);
            setSelectedStudent(null);
            setSelectedSubmission(null);
            setView(v as ViewState);
          }}
        />
      )}
    </div>
  );
};

export default TeacherView;
