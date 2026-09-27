import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findQuestions: vi.fn(),
  findQuestionById: vi.fn(),
  findQuestionByIdAndUpdate: vi.fn(),
  deleteQuestionById: vi.fn(),
  saveQuestion: vi.fn(),
  findAnswers: vi.fn(),
  countAnswers: vi.fn(),
  deleteAnswers: vi.fn(),
  findTag: vi.fn(),
  createTag: vi.fn(),
  handleVote: vi.fn(),
}));

vi.mock('../../../src/models/Question.js', () => ({
  default: class Question {
    constructor(fields) { Object.assign(this, fields); }
    save() { return mocks.saveQuestion(this); }
    static find(...args) { return mocks.findQuestions(...args); }
    static findById(...args) { return mocks.findQuestionById(...args); }
    static findByIdAndUpdate(...args) { return mocks.findQuestionByIdAndUpdate(...args); }
    static findByIdAndDelete(...args) { return mocks.deleteQuestionById(...args); }
  },
}));
vi.mock('../../../src/models/Answer.js', () => ({
  default: {
    find: (...args) => mocks.findAnswers(...args),
    countDocuments: (...args) => mocks.countAnswers(...args),
    deleteMany: (...args) => mocks.deleteAnswers(...args),
  },
}));
vi.mock('../../../src/models/Tag.js', () => ({
  default: {
    findOne: (...args) => mocks.findTag(...args),
    create: (...args) => mocks.createTag(...args),
  },
}));
vi.mock('../../../src/services/voteService.js', () => ({
  handleVote: (...args) => mocks.handleVote(...args),
}));

import {
  getAllQuestionsService,
  getQuestionByIdService,
  createQuestionService,
  updateQuestionService,
  deleteQuestionService,
  upvoteQuestionService,
  downvoteQuestionService,
} from '../../../src/services/questionService.js';

const listQuery = (result) => ({
  populate() { return this; },
  sort: vi.fn().mockResolvedValue(result),
});
const detailQuery = (result) => ({
  populate() { return this; },
  then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
});
const questionDoc = (overrides = {}) => {
  const question = {
    _id: 'question-1', author: 'owner', title: 'Original', description: 'Body', tags: [],
    toObject() { return { _id: this._id, title: this.title, tags: this.tags, views: this.views }; },
    ...overrides,
  };
  question.save = vi.fn().mockResolvedValue(question);
  return question;
};
const owner = { id: 'owner', isAdmin: false };
const stranger = { id: 'stranger', isAdmin: false };
const admin = { id: 'stranger', isAdmin: true };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.saveQuestion.mockResolvedValue(undefined);
});

describe('getAllQuestionsService', () => {
  // Ensure each question receives its own answer count.
  it('returns populated questions with their individual answer counts', async () => {
    const first = questionDoc({ _id: 'first' });
    const second = questionDoc({ _id: 'second' });
    mocks.findQuestions.mockReturnValue(listQuery([first, second]));
    mocks.countAnswers.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

    const result = await getAllQuestionsService();

    expect(result.map(({ answerCount }) => answerCount)).toEqual([2, 0]);
    expect(mocks.countAnswers).toHaveBeenCalledWith({ questionId: 'first' });
    expect(mocks.countAnswers).toHaveBeenCalledWith({ questionId: 'second' });
  });

  // An empty query result follows the not-found contract.
  it('rejects an empty collection with a 404 application error', async () => {
    mocks.findQuestions.mockReturnValue(listQuery([]));
    await expect(getAllQuestionsService()).rejects.toMatchObject({ statusCode: 404 });
  });

  // A null query result also follows the not-found contract.
  it('returns 404 when the database query resolves to null', async () => {
    mocks.findQuestions.mockReturnValue(listQuery(null));
    await expect(getAllQuestionsService()).rejects.toMatchObject({ statusCode: 404 });
  });

  // Database read failures must reach the caller unchanged.
  it('propagates a database read failure', async () => {
    const failure = new Error('database unavailable');
    mocks.findQuestions.mockReturnValue({ populate() { return this; }, sort: vi.fn().mockRejectedValue(failure) });
    await expect(getAllQuestionsService()).rejects.toBe(failure);
  });
});

describe('getQuestionByIdService', () => {
  // Detail returns the new view count and attached answers.
  it('returns the updated view count and answers for the requested question', async () => {
    const question = questionDoc({ views: 4 });
    mocks.findQuestionByIdAndUpdate.mockReturnValue(detailQuery(question));
    mocks.findAnswers.mockReturnValue({ populate: vi.fn().mockResolvedValue([{ _id: 'answer-1' }]) });

    const result = await getQuestionByIdService('question-1');

    expect(result.views).toBe(4);
    expect(result.answers).toEqual([{ _id: 'answer-1' }]);
    expect(mocks.findQuestionByIdAndUpdate).toHaveBeenCalledWith('question-1', { $inc: { views: 1 } }, { new: true });
  });

  // A missing question must not trigger an answer query.
  it('returns 404 when the question does not exist', async () => {
    mocks.findQuestionByIdAndUpdate.mockReturnValue(detailQuery(null));
    await expect(getQuestionByIdService('missing')).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.findAnswers).not.toHaveBeenCalled();
  });

  // A failed view update must not produce partial detail.
  it('propagates a failed view update', async () => {
    const failure = new Error('write failed');
    mocks.findQuestionByIdAndUpdate.mockImplementation(() => { throw failure; });
    await expect(getQuestionByIdService('question-1')).rejects.toBe(failure);
  });
});

describe('createQuestionService', () => {
  // Resolve existing and new tag names before saving.
  it('uses existing tags and creates missing tags before saving', async () => {
    mocks.findTag.mockImplementation(async ({ name }) => name === 'node' ? { _id: 'tag-node' } : null);
    mocks.createTag.mockResolvedValue({ _id: 'tag-new' });

    const result = await createQuestionService({ title: 'New', description: 'Body', tags: 'node, new', author: 'owner' });

    expect(result.tags).toEqual(['tag-node', 'tag-new']);
    expect(result.author).toBe('owner');
    expect(mocks.saveQuestion).toHaveBeenCalledOnce();
  });

  // Blank and repeated names must not create extra tag references.
  it('ignores blank and duplicate tag names', async () => {
    mocks.findTag.mockResolvedValue({ _id: 'tag-node' });
    const result = await createQuestionService({ title: 'New', description: 'Body', tags: ' node, , node ', author: 'owner' });
    expect(result.tags).toEqual(['tag-node']);
    expect(mocks.findTag).toHaveBeenCalledOnce();
  });

  // Reject invalid tag input before any question write.
  it('rejects tags that are not a comma-separated string', async () => {
    await expect(createQuestionService({ title: 'New', description: 'Body', tags: ['node'], author: 'owner' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.saveQuestion).not.toHaveBeenCalled();
  });
});

describe('updateQuestionService', () => {
  // The owner can persist supplied fields and tags.
  it('lets the owner change fields and resolve tags', async () => {
    const question = questionDoc();
    mocks.findQuestionById.mockResolvedValue(question);
    mocks.findTag.mockResolvedValue({ _id: 'tag-node' });
    const result = await updateQuestionService('question-1', 'Updated', 'New body', 'node', owner);
    expect(result.title).toBe('Updated');
    expect(result.description).toBe('New body');
    expect(result.tags).toEqual(['tag-node']);
    expect(question.save).toHaveBeenCalledOnce();
  });

  // Admin edits must preserve fields omitted from the request.
  it('lets an admin update while retaining fields omitted from the request', async () => {
    const question = questionDoc();
    mocks.findQuestionById.mockResolvedValue(question);
    await updateQuestionService('question-1', undefined, 'Admin edit', undefined, admin);
    expect(question.title).toBe('Original');
    expect(question.description).toBe('Admin edit');
    expect(mocks.findTag).not.toHaveBeenCalled();
  });

  // Authorization must run before changing the document.
  it('rejects a non-owner before changing anything', async () => {
    const question = questionDoc();
    mocks.findQuestionById.mockResolvedValue(question);
    await expect(updateQuestionService('question-1', 'Denied', 'Body', 'node', stranger))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(question.save).not.toHaveBeenCalled();
  });

  // A missing update target returns the service 404.
  it('returns 404 when the question is missing', async () => {
    mocks.findQuestionById.mockResolvedValue(null);
    await expect(updateQuestionService('missing', 'Title', 'Body', 'node', owner))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteQuestionService', () => {
  // Owner deletion must also remove related answers.
  it('deletes the owner question and its answers', async () => {
    const question = questionDoc();
    mocks.findQuestionById.mockResolvedValue(question);
    const result = await deleteQuestionService('question-1', owner);
    expect(result).toBe(question);
    expect(mocks.deleteQuestionById).toHaveBeenCalledWith('question-1');
    expect(mocks.deleteAnswers).toHaveBeenCalledWith({ questionId: 'question-1' });
  });

  // Admin authority permits deletion without ownership.
  it('allows an admin to delete someone else’s question', async () => {
    mocks.findQuestionById.mockResolvedValue(questionDoc());
    await deleteQuestionService('question-1', admin);
    expect(mocks.deleteAnswers).toHaveBeenCalledOnce();
  });

  // A denied delete must leave both collections alone.
  it('rejects a non-owner without deleting records', async () => {
    mocks.findQuestionById.mockResolvedValue(questionDoc());
    await expect(deleteQuestionService('question-1', stranger)).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.deleteQuestionById).not.toHaveBeenCalled();
    expect(mocks.deleteAnswers).not.toHaveBeenCalled();
  });

  // A missing delete target must not trigger removal.
  it('returns 404 for a missing question', async () => {
    mocks.findQuestionById.mockResolvedValue(null);
    await expect(deleteQuestionService('missing', owner)).rejects.toMatchObject({ statusCode: 404 });
  });
});

for (const [name, vote, direction] of [
  ['upvoteQuestionService', upvoteQuestionService, 'upvote'],
  ['downvoteQuestionService', downvoteQuestionService, 'downvote'],
]) {
  describe(name, () => {
    // The vote wrapper returns the helper result.
    it('returns the updated question from the shared vote service', async () => {
      const question = questionDoc({ voteCount: direction === 'upvote' ? 1 : -1 });
      mocks.handleVote.mockResolvedValue(question);
      await expect(vote('question-1', 'voter')).resolves.toBe(question);
      expect(mocks.handleVote).toHaveBeenCalledWith(expect.any(Function), 'question-1', 'voter', direction);
    });

    // A falsy vote result becomes a 400 application error.
    it('returns a 400 application error for a falsy vote result', async () => {
      mocks.handleVote.mockResolvedValue(null);
      await expect(vote('question-1', 'voter')).rejects.toMatchObject({ statusCode: 400 });
    });

    // Vote persistence errors must pass through unchanged.
    it('propagates a vote persistence error', async () => {
      const failure = new Error('vote failed');
      mocks.handleVote.mockRejectedValue(failure);
      await expect(vote('question-1', 'voter')).rejects.toBe(failure);
    });
  });
}
