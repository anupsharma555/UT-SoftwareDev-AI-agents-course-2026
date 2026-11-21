import {
  getAnswersByQuestionIdService,
  createAnswerService,
  updateAnswerService,
  deleteAnswerService,
  upvoteAnswerService,
  downvoteAnswerService,
} from '../services/answerService.js';

// Keep vote responses limited to the fields clients need.
function voteData({ _id, upvotes, downvotes, voteCount }) {
  return { _id, upvotes, downvotes, voteCount };
}

export async function getAnswersByQuestionId(req, res) {
  const answers = await getAnswersByQuestionIdService(req.params.questionId);
  res.status(200).json({
    success: true,
    message: 'Answers fetched successfully',
    data: answers,
  });
}

export async function createAnswer(req, res) {
  const answer = await createAnswerService({
    questionId: req.params.questionId,
    answerText: req.body.answerText,
    author: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Answer created successfully',
    data: answer,
  });
}

export async function updateAnswer(req, res) {
  const answer = await updateAnswerService(
    req.params.answerId,
    req.body.answerText,
    req.user,
  );

  res.status(200).json({
    success: true,
    message: 'Answer updated successfully',
    data: answer,
  });
}

export async function deleteAnswer(req, res) {
  await deleteAnswerService(req.params.answerId, req.user);
  res.status(200).json({
    success: true,
    message: 'Answer deleted successfully',
  });
}

export async function upvoteAnswer(req, res) {
  const answer = await upvoteAnswerService(req.params.answerId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Answer upvoted successfully',
    data: voteData(answer),
  });
}

export async function downvoteAnswer(req, res) {
  const answer = await downvoteAnswerService(req.params.answerId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Answer downvoted successfully',
    data: voteData(answer),
  });
}
