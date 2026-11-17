import assert from 'node:assert/strict';
import test from 'node:test';
import { gradeAdmissionAnswers } from './grading.js';

const questions = [
  { id: 'one', answerKey: ['b'], points: 25 },
  { id: 'two', answerKey: ['a', 'c'], points: 75 },
];

test('grades exact single and multiple-choice answers', () => {
  const result = gradeAdmissionAnswers(questions, [
    { questionId: 'one', selectedOptions: ['b'] },
    { questionId: 'two', selectedOptions: ['c', 'a'] },
  ]);

  assert.deepEqual(result, {
    earnedPoints: 100,
    totalPoints: 100,
    percentage: 100,
    correctCount: 2,
    questionCount: 2,
  });
});

test('does not award partial credit or count unknown answers', () => {
  const result = gradeAdmissionAnswers(questions, [
    { questionId: 'one', selectedOptions: ['not-an-option'] },
    { questionId: 'two', selectedOptions: ['a'] },
    { questionId: 'unknown', selectedOptions: ['a'] },
  ]);

  assert.equal(result.earnedPoints, 0);
  assert.equal(result.percentage, 0);
  assert.equal(result.correctCount, 0);
});

test('treats duplicate selections as one selection', () => {
  const result = gradeAdmissionAnswers(questions, [
    { questionId: 'one', selectedOptions: ['b', 'b'] },
  ]);

  assert.equal(result.earnedPoints, 25);
  assert.equal(result.percentage, 25);
});
