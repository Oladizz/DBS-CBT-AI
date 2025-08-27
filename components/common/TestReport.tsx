
import React, { useState, useEffect, useRef } from 'react';
import { Test, Submission, Question, ChatMessage } from '../../types';
import Card from './Card';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon, ArrowLeftIcon, ChatBubbleLeftRightIcon } from '../icons';
import { createTutorChat, generateExplanation } from '../../services/geminiService';
import Spinner from './Spinner';
import { Chat } from '@google/genai';


// Sub-component: AIExplanation
const AIExplanation: React.FC<{ question: Question; userAnswerIndex: number }> = ({ question, userAnswerIndex }) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchExplanation = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateExplanation(question, userAnswerIndex);
            setExplanation(result);
        } catch (err: any) {
            setError(err.message || "Failed to fetch explanation.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (explanation) {
        return <div className="mt-3 p-3 bg-sky-50 text-sky-800 border-l-4 border-sky-400 rounded-r-lg">{explanation}</div>
    }

    return (
        <div className="mt-3">
            <button onClick={fetchExplanation} disabled={isLoading} className="inline-flex items-center text-sm px-3 py-1 border border-sky-300 rounded-md text-sky-600 bg-white hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? <><Spinner size="w-4 h-4 mr-2" /> Getting...</> : <><LightbulbIcon className="w-4 h-4 mr-2"/> Get Explanation</>}
            </button>
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
};

// Sub-component: AITutorChatModal
const AITutorChatModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    chatSession: Chat | null;
}> = ({ isOpen, onClose, chatSession }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatSession?.history) {
            const historyMessages: ChatMessage[] = chatSession.history.flatMap((item, index) => {
                const text = item.parts.map(p => 'text' in p ? p.text : '').join('');
                if (text) {
                    return {
                        id: `hist-${index}`,
                        text: text,
                        sender: item.role === 'model' ? 'ai' : 'user'
                    };
                }
                return [];
            });
            setMessages(historyMessages);
        } else {
            setMessages([]);
        }
    }, [chatSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || !chatSession || isTyping) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), text: currentMessage, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const messageToSend = currentMessage;
        setCurrentMessage('');
        setIsTyping(true);

        try {
            const stream = await chatSession.sendMessageStream({ message: messageToSend });

            let aiResponse = '';
            const aiMessageId = crypto.randomUUID();
            
            setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

            for await (const chunk of stream) {
                aiResponse += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: aiResponse } : m));
            }
        } catch (error) {
            console.error("Error sending message to tutor:", error);
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), text: "Sorry, I encountered an error. Please try again.", sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] max-h-[700px] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center"><ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-indigo-600"/> AI Tutor</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl font-bold">&times;</button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">AI</div>}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                {msg.text === '' ? <Spinner size="w-4 h-4"/> : msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    ))}
                    {isTyping && messages[messages.length-1].sender === 'user' && (
                         <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">AI</div>
                            <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-slate-100 text-slate-800">
                               <Spinner size="w-5 h-5" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="p-4 border-t bg-white flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={currentMessage}
                            onChange={e => setCurrentMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask a follow-up question..."
                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isTyping}
                        />
                        <button onClick={handleSendMessage} disabled={isTyping || !currentMessage.trim()} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">Send</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


// Sub-component: TestReport
const TestReport: React.FC<{
  test: Test;
  submission: Submission;
  studentName: string;
  onBack: () => void;
}> = ({ test, submission, studentName, onBack }) => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = (question: Question, userAnswer: string | number) => {
      const session = createTutorChat(question, userAnswer);
      setChatSession(session);
      setIsChatOpen(true);
  };

  const handleCloseChat = () => {
      setIsChatOpen(false);
      setChatSession(null);
  };
    
  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
      </button>
      <Card className="p-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold">Test Report: {test.title}</h2>
            <p className="text-lg text-slate-600 mt-1">Student: {studentName}</p>
            <div className={`mt-6 text-6xl font-bold ${submission.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                {submission.score.toFixed(1)}%
            </div>
            <p className="text-slate-500">Final score</p>
        </div>
      </Card>

      <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Review of Answers</h3>
          <div className="space-y-4">
              {test.questions.map((q, index) => {
                  const result = submission.detailedResults.find(r => r.questionId === q.id);
                  if (!result) return null;

                  const isCorrect = result.isCorrect;
                  const userAnswer = result.answer;

                  return (
                      <Card key={q.id} className={`p-6 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                          <div className="flex justify-between items-start">
                              <p className="font-semibold">{index + 1}. {q.questionText}</p>
                              {isCorrect ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 ml-4"/> : <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 ml-4"/>}
                          </div>
                          <div className="mt-4 space-y-2">
                              {q.questionType === 'multiple-choice' ? (
                                  <>
                                    {q.options?.map((opt, i) => {
                                        let style = 'text-slate-700';
                                        if (i === q.correctAnswerIndex) style = 'text-green-700 font-bold';
                                        else if (i === userAnswer) style = 'text-red-700 line-through';
                                        return <p key={i} className={style}>{opt}</p>;
                                    })}
                                    {!isCorrect && <AIExplanation question={q} userAnswerIndex={userAnswer as number} />}
                                  </>
                              ) : (
                                  <div>
                                    <p className="font-medium text-slate-800">Your Answer:</p>
                                    <p className="italic text-slate-600 mb-3">"{userAnswer as string}"</p>
                                    <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>AI Feedback:</p>
                                        <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{result.feedback}</p>
                                    </div>
                                  </div>
                              )}
                          </div>
                           <div className="mt-4 border-t pt-4 flex justify-end">
                                <button onClick={() => handleOpenChat(q, userAnswer)} className="inline-flex items-center text-sm px-3 py-1 border border-transparent rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 shadow-sm">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" /> Ask AI Tutor
                                </button>
                            </div>
                      </Card>
                  )
              })}
          </div>
      </div>
       <AITutorChatModal 
          isOpen={isChatOpen} 
          onClose={handleCloseChat}
          chatSession={chatSession}
      />
    </div>
  )
};

export default TestReport;
