
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Test, StudentAnswer } from '../../types';
import Card from '../common/Card';
import { ClockIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon } from '../icons';
import Spinner from '../common/Spinner';
import { FullscreenWarning, ConfirmationModal } from './modals';

interface TestTakerProps {
  test: Test;
  onSubmit: (answers: StudentAnswer) => void;
  isSubmitting: boolean;
  submissionError: string | null;
}

const TestTaker: React.FC<TestTakerProps> = ({ test, onSubmit, isSubmitting, submissionError }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer>({});
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  }, []);

  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement) {
        setShowFullscreenWarning(true);
        if (timerRef.current) clearInterval(timerRef.current);
    } else {
        setShowFullscreenWarning(false);
    }
  }, []);

  const handleConfirmSubmit = useCallback(() => {
      setIsConfirming(false);
      if (document.fullscreenElement) {
          document.exitFullscreen();
      }
      onSubmit(answers);
  }, [answers, onSubmit]);

  useEffect(() => {
    requestFullscreen();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Are you sure you want to leave? Your test is still in progress.';
      return event.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };
  }, [handleFullscreenChange, requestFullscreen]);


  useEffect(() => {
    if (showFullscreenWarning) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (document.fullscreenElement) document.exitFullscreen();
          onSubmit(answers);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showFullscreenWarning, answers, onSubmit]);

  const currentQuestion = test.questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeLow = timeLeft <= 60 && timeLeft > 0;
  
  if (isSubmitting) {
      return (
          <div className="flex flex-col items-center justify-center h-64">
              <Spinner size="w-16 h-16"/>
              <h2 className="mt-4 text-2xl font-semibold text-slate-700">Submitting...</h2>
              <p className="text-slate-500">Please wait.</p>
          </div>
      )
  }

  return (
    <div className="animate-fade-in pb-24 sm:pb-0">
       <style>{`
          @keyframes fade-in-up { 
              0% { opacity: 0; transform: translateY(20px) scale(0.95); } 
              100% { opacity: 1; transform: translateY(0) scale(1); } 
          }
          .animate-fade-in-up { animation: fade-in-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>
      {isConfirming && <ConfirmationModal onConfirm={handleConfirmSubmit} onCancel={() => setIsConfirming(false)} />}
      {showFullscreenWarning && <FullscreenWarning onReEnter={requestFullscreen} />}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-4 z-10">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">{test.title}</h2>
            <p className="text-slate-500">Question {currentQuestionIndex + 1} of {test.questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className={`flex items-center text-xl font-medium ${isTimeLow ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
              <ClockIcon className={`w-6 h-6 mr-2 ${isTimeLow ? 'text-red-600' : 'text-slate-500'}`} />
              <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
            <button 
              onClick={() => setIsConfirming(true)} 
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Submit
            </button>
          </div>
        </div>
      </div>

      <Card className="p-8">
        <h3 className="text-xl font-semibold mb-6">{currentQuestionIndex + 1}. {currentQuestion.questionText}</h3>
        <div className="space-y-4">
          {currentQuestion.questionType === 'multiple-choice' ? (
             currentQuestion.options?.map((option, index) => (
                <label key={index} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === index ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name={currentQuestion.id} checked={answers[currentQuestion.id] === index} onChange={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: index }))} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                    <span className="ml-4 text-slate-700">{option}</span>
                </label>
             ))
          ) : (
            <div>
                <label htmlFor="short-answer" className="block text-sm font-medium text-slate-700 mb-2">Your Answer:</label>
                <textarea 
                    id="short-answer"
                    rows={5} 
                    value={(answers[currentQuestion.id] as string) || ''} 
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
          )}
        </div>
      </Card>
      
      {submissionError && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md text-center">
          {submissionError}
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="inline-flex items-center justify-center px-6 py-2 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowLeftIcon className="w-5 h-5 mr-2" /> Previous
        </button>
        {currentQuestionIndex === test.questions.length - 1 ? (
          <button onClick={() => setIsConfirming(true)} className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            Finish & Submit <CheckCircleIcon className="w-5 h-5 ml-2" />
          </button>
        ) : (
          <button onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))} className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Next <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>

       <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-3 z-20">
         <button onClick={() => setIsConfirming(true)} className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <CheckCircleIcon className="w-5 h-5 mr-2" /> Submit Test
          </button>
       </div>
    </div>
  );
};

export default TestTaker;
