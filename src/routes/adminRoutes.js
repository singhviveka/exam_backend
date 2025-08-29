import { Router } from 'express';
import { listExams, createExam, updateExam, saveQuestions } from '../controllers/adminController.js';

const router = Router();
router.get('/exams', listExams);
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.post('/exams/:id/questions', saveQuestions);
export default router;
