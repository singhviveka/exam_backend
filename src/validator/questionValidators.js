import { z } from 'zod';

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean()
});

const questionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
  type: z.enum(['SINGLE', 'MULTI']),
  options: z.array(optionSchema).min(2)
});

export const bulkQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1)
});

/**
 * Validate questions payload and rules:
 * - unique numeric question numbers
 * - SINGLE has exactly one correct option
 * - MULTI has at least two correct options
 * - total pool size > questionsInExam
 * - if totalQuestions provided, it must match created count
 */
export function validateQuestionConfig(body, questionsInExam, totalQuestions) {
  const parsed = bulkQuestionsSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error('Invalid question payload');
    err.status = 400;
    err.details = parsed.error.flatten();
    throw err;
  }
  const { questions } = parsed.data;
  // Unique numeric question numbers
  const numbers = questions.map(q => q.number);
  const numberSet = new Set(numbers);
  if (numberSet.size !== numbers.length) {
    const err = new Error('Question number must be unique within exam');
    err.status = 400;
    throw err;
  }
  // Type-based correct answers validation
  for (const q of questions) {
    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (q.type === 'SINGLE' && correctCount !== 1) {
      const err = new Error(`Question ${q.number}: SINGLE must have exactly one correct answer`);
      err.status = 400;
      throw err;
    }
    if (q.type === 'MULTI' && correctCount < 2) {
      const err = new Error(`Question ${q.number}: MULTI must have more than one correct answer`);
      err.status = 400;
      throw err;
    }
  }
  // Pool size must be greater than configured questionsInExam
  if (!(questions.length > questionsInExam)) {
    const err = new Error('Total questions created should be greater than No of questions configured for exam');
    err.status = 400;
    throw err;
  }
  // Also ensure totalQuestions field is respected (if provided)
  if (typeof totalQuestions === 'number' && questions.length !== totalQuestions) {
    const err = new Error('Total No of Questions must equal the number of questions created');
    err.status = 400;
    throw err;
  }
  return questions;
}
