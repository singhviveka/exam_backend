import { z } from 'zod';

export const examSchema = z.object({
  name: z.string().min(1),
  totalQuestions: z.number().int().positive(),
  questionsInExam: z.number().int().positive(),
  passingPercentage: z.number().int().min(0).max(100),
  startDate: z.string().datetime()
});

export function validateExamPayload(body) {
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error('Invalid exam payload');
    err.status = 400;
    err.details = parsed.error.flatten();
    throw err;
  }
  const payload = parsed.data;
  // Future date validation
  const start = new Date(payload.startDate);
  if (isNaN(start.getTime()) || start <= new Date()) {
    const err = new Error('Exam Start Date must be a future date');
    err.status = 400;
    throw err;
  }
  if (payload.totalQuestions <= 0 || payload.questionsInExam <= 0) {
    const err = new Error('No of Questions must be greater than 0');
    err.status = 400;
    throw err;
  }
  return payload;
}
