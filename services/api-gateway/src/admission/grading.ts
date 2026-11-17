export interface GradableQuestion {
  id: string;
  answerKey: string[];
  points: number;
}

export interface AdmissionAnswer {
  questionId: string;
  selectedOptions: string[];
}

export interface GradeResult {
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  correctCount: number;
  questionCount: number;
}

function normalizedSet(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))].sort();
}

function isExactAnswer(expected: string[], actual: string[]): boolean {
  const expectedValues = normalizedSet(expected);
  const actualValues = normalizedSet(actual);

  return expectedValues.length === actualValues.length
    && expectedValues.every((value, index) => value === actualValues[index]);
}

export function gradeAdmissionAnswers(
  questions: GradableQuestion[],
  answers: AdmissionAnswer[]
): GradeResult {
  const answerByQuestion = new Map(
    answers.map(answer => [answer.questionId, answer.selectedOptions])
  );

  let earnedPoints = 0;
  let correctCount = 0;
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  for (const question of questions) {
    const selected = answerByQuestion.get(question.id) ?? [];
    if (isExactAnswer(question.answerKey, selected)) {
      earnedPoints += question.points;
      correctCount += 1;
    }
  }

  const percentage = totalPoints === 0
    ? 0
    : Math.round((earnedPoints / totalPoints) * 10_000) / 100;

  return {
    earnedPoints,
    totalPoints,
    percentage,
    correctCount,
    questionCount: questions.length,
  };
}
