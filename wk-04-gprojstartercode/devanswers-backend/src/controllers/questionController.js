import {
  getAllQuestionsService,
  getQuestionByIdService,
  createQuestionService,
  updateQuestionService,
  deleteQuestionService,
  upvoteQuestionService,
  downvoteQuestionService,
} from '../services/questionService.js';

// Keep vote responses limited to the fields clients need.
function voteData({ _id, upvotes, downvotes, voteCount }) {
  return { _id, upvotes, downvotes, voteCount };
}

export async function getAllQuestions(req, res) {
  const questions = await getAllQuestionsService();
  res.status(200).json({
    success: true,
    message: 'Questions fetched successfully',
    data: questions,
  });
}

export async function getQuestionById(req, res) {
  const question = await getQuestionByIdService(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Question fetched successfully',
    data: question,
  });
}

export async function createQuestion(req, res) {
  const { title, description, tags } = req.body;
  const question = await createQuestionService({
    title,
    description,
    tags,
    author: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: question,
  });
}

export async function updateQuestion(req, res) {
  const { title, description, tags } = req.body;
  const question = await updateQuestionService(
    req.params.id,
    title,
    description,
    tags,
    req.user,
  );

  res.status(200).json({
    success: true,
    message: 'Question updated successfully',
    data: question,
  });
}

export async function deleteQuestion(req, res) {
  const question = await deleteQuestionService(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Question deleted successfully',
    data: question,
  });
}

export async function upvoteQuestion(req, res) {
  const question = await upvoteQuestionService(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Question upvoted successfully',
    data: voteData(question),
  });
}

export async function downvoteQuestion(req, res) {
  const question = await downvoteQuestionService(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Question downvoted successfully',
    data: voteData(question),
  });
}
