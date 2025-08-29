import { prisma } from '../db/prisma.js';
import { seededShuffle } from '../utils/seedShuffle.js';

async function ensureUser(email) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email } });
  return user;
}

export async function getExamForUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid exam id' });
    const email = req.userEmail;
    await ensureUser(email);

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } }
    });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Deterministic shuffle by user+exam
    const seed = `${email}|${exam.id}`;
    const shuffledQuestions = seededShuffle(exam.questions, seed)
      .slice(0, exam.questionsInExam)
      .map(q => ({
        id: q.id,
        number: q.number,
        text: q.text,
        type: q.type,
        // shuffle options per user as well (only return id & text)
        options: seededShuffle(q.options, seed + '|' + q.id).map(o => ({ id: o.id, text: o.text }))
      }));

    res.json({
      id: exam.id,
      name: exam.name,
      questionsInExam: exam.questionsInExam,
      passingPercentage: exam.passingPercentage,
      startDate: exam.startDate,
      questions: shuffledQuestions
    });
  } catch (err) { next(err); }
}

export async function submitExam(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid exam id' });
    const email = req.userEmail;
    await ensureUser(email);

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } }
    });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    if (answers.length === 0) return res.status(400).json({ error: 'answers array is required' });

    // Build lookup maps
    const questionMap = new Map(exam.questions.map(q => [q.id, q]));

    let correct = 0;

    for (const ans of answers) {
      const q = questionMap.get(Number(ans.questionId));
      if (!q) continue;

      const correctOptions = new Set(q.options.filter(o => o.isCorrect).map(o => o.id));
      const selected = new Set((ans.selectedOptionIds || []).map(Number));

      if (q.type === 'SINGLE') {
        // SINGLE: exactly one selected and it must match the only correct
        if (selected.size === 1) {
          const sel = [...selected][0];
          const onlyCorrect = [...correctOptions][0];
          if (sel === onlyCorrect) correct++;
        }
      } else { // MULTI: must match set equality
        if (selected.size === correctOptions.size) {
          let allMatch = true;
          for (const id of correctOptions) if (!selected.has(id)) { allMatch = false; break; }
          if (allMatch) correct++;
        }
      }
    }

    const totalConsidered = exam.questionsInExam; // score out of number of questions in exam
    // score out of 100
    const scorePct = Math.round((correct / totalConsidered) * 100);
    const status = scorePct >= exam.passingPercentage ? 'PASS' : 'FAIL';

    res.json({
      score: `${scorePct} of 100`,
      right_questions: correct,
      status
    });
  } catch (err) { next(err); }
}
