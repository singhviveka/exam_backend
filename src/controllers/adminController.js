import { prisma } from '../db/prisma.js';
import { validateExamPayload } from '../validator/examValidators.js';
import { validateQuestionConfig } from '../validator/questionValidators.js';
import { buildPagination } from '../utils/pagination.js';

export async function listExams(req, res, next) {
  try {
    const { page, limit, sortBy = 'createdAt', order = 'desc', name, startGte, startLte } = req.query;
    const { take, skip, current } = buildPagination({ page, limit });
    const where = {};
    if (name) where.name = { contains: String(name), mode: 'insensitive' };
    if (startGte || startLte) {
      where.startDate = {};
      if (startGte) where.startDate.gte = new Date(String(startGte));
      if (startLte) where.startDate.lte = new Date(String(startLte));
    }
    const orderBy = {};
    orderBy[String(sortBy)] = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      prisma.exam.findMany({ where, orderBy, skip, take }),
      prisma.exam.count({ where })
    ]);
    res.json({ page: current, limit: take, total, items });
  } catch (err) { next(err); }
}

export async function createExam(req, res, next) {
  try {
    const payload = validateExamPayload(req.body);
    if (!(payload.totalQuestions > payload.questionsInExam)) {
      return res.status(400).json({ error: 'Total No of Questions must be greater than No of questions in Exam' });
    }
    const exam = await prisma.exam.create({ data: payload });
    res.status(201).json(exam);
  } catch (err) { next(err); }
}

export async function updateExam(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid exam id' });
    const payload = validateExamPayload(req.body);
    if (!(payload.totalQuestions > payload.questionsInExam)) {
      return res.status(400).json({ error: 'Total No of Questions must be greater than No of questions in Exam' });
    }
    const exam = await prisma.exam.update({ where: { id }, data: payload });
    res.json(exam);
  } catch (err) { next(err); }
}

export async function saveQuestions(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid exam id' });

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const questions = validateQuestionConfig(req.body, exam.questionsInExam, exam.totalQuestions);

    // Replace existing questions for idempotence:
    // Delete options then questions that belong to this exam.
    await prisma.$transaction([
      prisma.option.deleteMany({ where: { question: { examId: id } } }),
      prisma.question.deleteMany({ where: { examId: id } })
    ]);

    // Create questions with options
    await prisma.$transaction(async (tx) => {
      for (const q of questions) {
        await tx.question.create({
          data: {
            examId: id,
            number: q.number,
            text: q.text,
            type: q.type,
            options: { create: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) }
          }
        });
      }
    });

    const created = await prisma.question.findMany({ where: { examId: id }, include: { options: true } });
    res.status(201).json({ examId: id, questions: created });
  } catch (err) { next(err); }
}
