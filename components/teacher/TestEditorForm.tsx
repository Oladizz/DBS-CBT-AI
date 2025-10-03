
import React, { useState, useEffect } from 'react';
import { Test, Question, QuestionType } from '../../types';
import { generateQuestions } from '../../services/geminiService';
import { useSchool } from '../../contexts/SchoolContext';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import { SparklesIcon, TrashIcon, RefreshIcon, PlusIcon, ArrowLeftIcon, CheckCircleIcon } from '../icons';

interface TestEditorFormProps {
  onSave: (test: Omit<Test, 'id'> | Test) => void;
  onCancel: () => void;
  initialTest?: Test;
}

const TestEditorForm: React.FC<TestEditorFormProps> = ({ onSave, onCancel, initialTest }) => {
  // FIX: Get active session and term from context to correctly build the test object.
  const { classes, subjects, activeSessionId, activeTerm } = useSchool();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>(initialTest?.subjectId || subjects[0]?.id || '');
  const [duration, setDuration] = useState(30);
  const [classId, setClassId] = useState<string>(initialTest?.classId || classes[0]?.id || '');
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
          setSubjectId(initialTest.subjectId);
          setDuration(initialTest.durationMinutes);
          setGeneratedQuestions(initialTest.questions);
          setClassId(initialTest.classId);
      }
  }, [initialTest]);

  const handleGenerateQuestions = async (indexToReplace?: number) => {
    if (!aiTopic.trim()) {
      setError('Please provide a topic for question generation.');
      return;
    }
    const subjectName = subjects.find(s => s.id === subjectId)?.name || 'General';
    setIsLoading(true);
    setError(null);
    try {
      const questionsToGen = indexToReplace !== undefined ? 1 : numQuestions;
      const newQuestions = await generateQuestions(aiTopic, questionsToGen, subjectName, questionType);
      
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
    if (!title || !subjectId || !classId || generatedQuestions.length === 0) {
      setError('Please fill in all fields, select a class and subject, and add questions before saving.');
      return;
    }
    // FIX: Add session and term info to the new test object to match the expected type.
    const newTest: Omit<Test, 'id'> | Test = {
      ...(initialTest ? { id: initialTest.id, sessionId: initialTest.sessionId, term: initialTest.term } : { sessionId: activeSessionId, term: activeTerm }),
      title,
      subjectId,
      durationMinutes: duration,
      questions: generatedQuestions,
      classId,
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
            <select id="subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={subjects.length === 0}>
                {subjects.length > 0 ? (
                  subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                ) : <option>Please create a subject first</option>}
            </select>
          </div>
           <div>
              <label htmlFor="class" className="block text-sm font-medium text-slate-700">Class</label>
              <select id="class" value={classId} onChange={e => setClassId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={classes.length === 0}>
                  {classes.length > 0 ? (
                    classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  ) : <option>Please create a class first</option>}
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-slate-700">Duration (minutes)</label>
              <input type="number" id="duration" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
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
                <Button onClick={() => handleGenerateQuestions()} disabled={isLoading || !subjectId} className="h-fit px-6 py-2 text-base">
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

export default TestEditorForm;
