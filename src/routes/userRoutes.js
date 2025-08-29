import { Router } from 'express';
import { getExamForUser, submitExam } from '../controllers/userController.js';
import { requireEmail } from '../middleware/requireEmail.js';

const router = Router();
router.get('/exams/:id', requireEmail, getExamForUser);
router.post('/exams/:id/submit', requireEmail, submitExam);
export default router;
