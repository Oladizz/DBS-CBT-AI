import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Question, QuestionResult, Submission, Test, QuestionType, Student, LessonPlan } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const mcqSchema = {
    type: Type.OBJECT,
    properties: {
        questionText: {
            type: Type.STRING,
            description: "The text of the question."
        },
        options: {
            type: Type.ARRAY,
            description: "An array of 4 possible answers.",
            items: {
                type: Type.STRING
            }
        },
        correctAnswerIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the correct answer in the 'options' array."
        }
    },
    required: ["questionText", "options", "correctAnswerIndex"]
};

const shortAnswerSchema = {
    type: Type.OBJECT,
    properties: {
        questionText: {
            type: Type.STRING,
            description: "The text of the short-answer question."
        },
        modelAnswer: {
            type: Type.STRING,
            description: "A comprehensive, ideal answer to the question that can be used for grading."
        }
    },
    required: ["questionText", "modelAnswer"]
};

export const generateQuestions = async (topic: string, numQuestions: number, subject: string, questionType: QuestionType): Promise<Omit<Question, 'id'>[]> => {
  try {
    const isMCQ = questionType === 'multiple-choice';
    const prompt = `Generate ${numQuestions} ${isMCQ ? 'multiple-choice questions' : 'short-answer questions'} for a test on the topic of "${topic}" for a "${subject}" class. ${isMCQ ? 'Each multiple-choice question must have exactly 4 options and a correct answer index.' : 'Each short-answer question should have a model answer for grading.'}`;
    
    const baseSchema = {
        type: Type.ARRAY,
        items: isMCQ ? mcqSchema : shortAnswerSchema,
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: baseSchema,
      },
    });

    const jsonText = response.text;
    const generatedQuestions = JSON.parse(jsonText);
    
    if (!Array.isArray(generatedQuestions)) {
        throw new Error("AI response is not an array.");
    }

    return generatedQuestions.map(q => ({
        ...q,
        questionType: questionType,
        // Validate MCQ options
        options: isMCQ ? (Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D']) : undefined,
    }));

  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions with AI. Please check the topic and try again.");
  }
};


export const gradeShortAnswer = async (questionText: string, modelAnswer: string, studentAnswer: string): Promise<{ isCorrect: boolean; feedback: string }> => {
    try {
        const prompt = `
            A student was asked the following question:
            "${questionText}"

            The model answer is:
            "${modelAnswer}"

            The student's answer was:
            "${studentAnswer}"

            Please evaluate the student's answer. Determine if it is correct and provide concise feedback for the student.
            The student's answer does not need to be a perfect match to the model answer, but should capture the key concepts.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                isCorrect: {
                    type: Type.BOOLEAN,
                    description: "Whether the student's answer is substantially correct."
                },
                feedback: {
                    type: Type.STRING,
                    description: "Concise feedback for the student explaining what was right or wrong."
                }
            },
            required: ['isCorrect', 'feedback']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error grading short answer:", error);
        return { isCorrect: false, feedback: "Could not automatically grade this answer." };
    }
};

export const generateExplanation = async (question: Question, userAnswerIndex: number): Promise<string> => {
    try {
        if (question.questionType !== 'multiple-choice' || !question.options) {
            return "Explanations are only available for multiple-choice questions.";
        }
        const userAnswer = question.options[userAnswerIndex];
        const correctAnswer = question.options[question.correctAnswerIndex!];

        const prompt = `
            For the multiple-choice question: "${question.questionText}", a student incorrectly chose "${userAnswer}" when the correct answer was "${correctAnswer}". 
            
            Please provide a concise explanation for the student. Explain why their selected answer is incorrect and why the other answer is correct. Be encouraging.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating explanation:", error);
        return "Sorry, we couldn't generate an explanation at this time.";
    }
};

// FIX: Update function signature to accept a 'subject' property on the test object.
export const analyzeTestResults = async (test: Test & { subject: string }, submissions: Submission[]): Promise<{ summary: string; struggledTopics: string[] }> => {
    if (submissions.length === 0) {
        return { summary: "No submissions yet. Analysis is not available.", struggledTopics: [] };
    }

    try {
        const questionPerformance = test.questions.map(q => {
            const resultsForQuestion = submissions.map(s => s.detailedResults.find(dr => dr.questionId === q.id)).filter(Boolean) as QuestionResult[];
            const correctCount = resultsForQuestion.filter(r => r.isCorrect).length;
            const accuracy = resultsForQuestion.length > 0 ? (correctCount / resultsForQuestion.length) * 100 : 0;
            return {
                questionText: q.questionText,
                accuracy: accuracy.toFixed(1) + '%'
            };
        });

        const prompt = `
            As an expert teaching assistant, analyze the following test results for a test titled "${test.title}" on the subject of "${test.subject}".
            The overall class performance data for each question is as follows:
            ${JSON.stringify(questionPerformance, null, 2)}

            Based on this data, provide a JSON object with two keys:
            1. "summary": A concise, actionable summary for the teacher. Start with a general overview, then identify the 1-2 questions the class struggled with the most (lowest accuracy), and suggest potential topics that might need re-teaching based on these difficult questions.
            2. "struggledTopics": An array of strings, where each string is a specific topic or concept from a question with less than 60% accuracy.
        `;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                struggledTopics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ['summary', 'struggledTopics']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
            }
        });

        const parsedResponse = JSON.parse(response.text);
        
        if (typeof parsedResponse.summary !== 'string' || !Array.isArray(parsedResponse.struggledTopics)) {
            throw new Error("Invalid format from AI analysis.");
        }

        return parsedResponse;

    } catch (error) {
        console.error("Error analyzing results:", error);
        return { summary: "Could not perform AI analysis at this time.", struggledTopics: [] };
    }
};

export const parseTestFromPdf = async (pdfBase64: string): Promise<Omit<Test, 'id'>> => {
    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    };

    const prompt = `
        You are an AI assistant specialized in parsing educational documents. Analyze the provided PDF file, which contains a test or exam. Your task is to extract the test's title, subject, and all its questions.
        
        - If the document has a clear title and subject, use them. If not, infer a suitable title and subject from the questions' content.
        - Estimate a reasonable duration in minutes for the test, assuming roughly 1.5 minutes per question.
        - For each question, determine if it is a 'multiple-choice' or 'short-answer' question.
        - For multiple-choice questions, extract the question text, all options (typically 4), and identify the index of the correct answer (0-based). The correct answer may be marked with an asterisk (*), bolding, or listed in an answer key.
        - For short-answer questions, extract the question text and a model answer if provided.
        
        Structure your entire output as a single JSON object. Do not include any text, notes, or markdown formatting outside of the JSON object.
    `;

    const testSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The title of the test." },
            subject: { type: Type.STRING, description: "The subject of the test." },
            durationMinutes: { type: Type.INTEGER, description: "The estimated duration of the test in minutes." },
            questions: {
                type: Type.ARRAY,
                description: "The list of questions in the test.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionText: { type: Type.STRING },
                        questionType: { type: Type.STRING, enum: ['multiple-choice', 'short-answer'] },
                        options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Options for multiple-choice questions.",
                        },
                        correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct option for MCQs." },
                        modelAnswer: { type: Type.STRING, description: "The model answer for short-answer questions." }
                    },
                    required: ["questionText", "questionType"]
                }
            }
        },
        required: ["title", "subject", "durationMinutes", "questions"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [pdfPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: testSchema,
            },
        });
        const parsedTest = JSON.parse(response.text);
        
        // Add validation and cleaning logic here if necessary
        if (!parsedTest.questions || !Array.isArray(parsedTest.questions)) {
            throw new Error("AI did not return a valid questions array.");
        }
        
        return parsedTest;

    } catch (error) {
        console.error("Error parsing PDF with AI:", error);
        throw new Error("Failed to parse the PDF file. The document might be malformed or unreadable. Please try a different file.");
    }
};

// FIX: Update function signature to accept a 'subject' property on each test object.
export const generateStudentReportSummary = async (student: Student, submissions: Submission[], tests: (Test & { subject: string })[]): Promise<string> => {
    try {
        const performanceData = submissions.map(sub => {
            const test = tests.find(t => t.id === sub.testId);
            return {
                testTitle: test?.title || "Unknown Test",
                subject: test?.subject || "Unknown Subject",
                score: sub.score.toFixed(1) + '%',
                date: sub.submittedAt.toLocaleDateString(),
            };
        });

        if (performanceData.length === 0) {
            return "This student has not completed any tests yet.";
        }

        const prompt = `
            You are an encouraging and insightful educational advisor. Analyze the test performance of the student named "${student.name}".
            Here is their performance data:
            ${JSON.stringify(performanceData, null, 2)}

            Based on this data, write a brief summary for their report card. The tone should be positive and constructive.
            - Start with a general statement about their effort or performance.
            - Highlight subjects or areas where they are performing well.
            - Gently point out subjects where they might need more focus or practice, framing it as an opportunity for growth.
            - Keep the summary to 2-4 sentences.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating student report summary:", error);
        return "Could not generate an AI summary at this time.";
    }
};

export const generateLessonPlan = async (topic: string, subject: string): Promise<LessonPlan> => {
    try {
        const prompt = `
            Create a brief, practical lesson plan outline for teaching the topic "${topic}" in a "${subject}" class.
            The plan should be structured as a JSON object.
        `;

        const lessonPlanSchema = {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                learningObjective: { type: Type.STRING, description: "A clear, measurable learning objective for the lesson." },
                keyConcepts: { 
                    type: Type.ARRAY, 
                    description: "A list of 3-5 key concepts or vocabulary terms to cover.",
                    items: { type: Type.STRING }
                },
                activityIdea: { type: Type.STRING, description: "A suggestion for a simple, engaging opening activity or discussion prompt." },
                checkForUnderstanding: { type: Type.STRING, description: "A question or short task to quickly assess student understanding at the end of the lesson." }
            },
            required: ["topic", "learningObjective", "keyConcepts", "activityIdea", "checkForUnderstanding"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: lessonPlanSchema,
            },
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error(`Error generating lesson plan for topic "${topic}":`, error);
        throw new Error(`Failed to generate a lesson plan for "${topic}".`);
    }
};

export const createTutorChat = (question: Question, userAnswer: string | number): Chat => {
    let studentAnswerText: string;
    if (question.questionType === 'multiple-choice' && typeof userAnswer === 'number') {
        studentAnswerText = question.options?.[userAnswer] ?? "Invalid option";
    } else {
        studentAnswerText = userAnswer as string;
    }

    const systemInstruction = `You are a friendly and patient AI Tutor for the DE-BARMS SCHOOL. Your goal is to help a student understand a concept from a test they just took.
- Do not just give them the answer. Guide them to understand the 'why'.
- Be encouraging and use simple language.
- Start the conversation by acknowledging their question and asking how you can help.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        },
        history: [
            { // Pre-seed the conversation with context
                role: 'user',
                parts: [{ text: `I have a question about this test problem I got wrong.\n\nQuestion: "${question.questionText}"\nMy Answer: "${studentAnswerText}"` }]
            },
            {
                role: 'model',
                parts: [{ text: `I see! Thanks for sharing. This can be a tricky topic. What part of the question is confusing you, or what would you like to understand better?` }]
            }
        ]
    });
    return chat;
};