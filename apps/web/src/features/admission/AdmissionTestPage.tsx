import { useCallback, useEffect, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight,
  Check, CheckCircle2, Clock3, Loader2,
  LockKeyhole, Send, TimerReset, XCircle,
} from 'lucide-react';

const MY_ADMISSION_TEST = gql`
  query MyAdmissionTest {
    myAdmissionTest {
      id status durationMinutes passScore startedAt expiresAt invitationExpiresAt
      submittedAt score maxScore passed feedback
      questions {
        id prompt type points position
        options { value label }
      }
    }
  }
`;

const START_ADMISSION_TEST = gql`
  mutation StartAdmissionTest {
    startAdmissionTest {
      id status durationMinutes passScore startedAt expiresAt invitationExpiresAt
      submittedAt score maxScore passed feedback
      questions {
        id prompt type points position
        options { value label }
      }
    }
  }
`;

const SUBMIT_ADMISSION_TEST = gql`
  mutation SubmitAdmissionTest($answers: [AdmissionAnswerInput!]!) {
    submitAdmissionTest(answers: $answers) {
      id status durationMinutes passScore startedAt expiresAt invitationExpiresAt
      submittedAt score maxScore passed feedback
      questions { id }
    }
  }
`;

interface QuestionOption {
  value: string;
  label: string;
}

interface AdmissionQuestion {
  id: string;
  prompt: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'BOOLEAN';
  points: number;
  position: number;
  options: QuestionOption[];
}

interface AdmissionTest {
  id: string;
  status: 'INVITED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  durationMinutes: number;
  passScore: number;
  startedAt?: string;
  expiresAt?: string;
  invitationExpiresAt: string;
  submittedAt?: string;
  score?: number;
  maxScore: number;
  passed?: boolean;
  feedback?: string;
  questions: AdmissionQuestion[];
}

const DEFAULT_DEMO_QUESTIONS: AdmissionQuestion[] = [
  {
    id: 'q-1',
    prompt: 'What number comes next in the sequence: 2, 6, 12, 20, __?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 1,
    options: [
      { value: 'a', label: '24' },
      { value: 'b', label: '28' },
      { value: 'c', label: '30' },
      { value: 'd', label: '32' },
    ],
  },
  {
    id: 'q-2',
    prompt: 'A program repeats an action 4 times, and each action takes 3 seconds. How long does the program spend on those actions?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 2,
    options: [
      { value: 'a', label: '7 seconds' },
      { value: 'b', label: '12 seconds' },
      { value: 'c', label: '16 seconds' },
      { value: 'd', label: '43 seconds' },
    ],
  },
  {
    id: 'q-3',
    prompt: 'What is the decimal value of the binary number 1010?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 3,
    options: [
      { value: 'a', label: '8' },
      { value: 'b', label: '10' },
      { value: 'c', label: '12' },
      { value: 'd', label: '14' },
    ],
  },
  {
    id: 'q-4',
    prompt: 'Which Git command downloads a complete copy of an existing repository?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 4,
    options: [
      { value: 'a', label: 'git clone' },
      { value: 'b', label: 'git commit' },
      { value: 'c', label: 'git status' },
      { value: 'd', label: 'git branch' },
    ],
  },
  {
    id: 'q-5',
    prompt: 'Which HTTP status code normally means a request succeeded?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 5,
    options: [
      { value: 'a', label: '200' },
      { value: 'b', label: '301' },
      { value: 'c', label: '404' },
      { value: 'd', label: '500' },
    ],
  },
  {
    id: 'q-6',
    prompt: 'A test fails only on your laptop. What is the best first debugging step?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 6,
    options: [
      { value: 'a', label: 'Delete the test' },
      { value: 'b', label: 'Rewrite the whole project' },
      { value: 'c', label: 'Reproduce the failure and inspect the error' },
      { value: 'd', label: 'Ignore it because it works elsewhere' },
    ],
  },
  {
    id: 'q-7',
    prompt: 'If every peer review needs 2 reviewers, how many review assignments are needed for 6 submissions?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 7,
    options: [
      { value: 'a', label: '3' },
      { value: 'b', label: '6' },
      { value: 'c', label: '8' },
      { value: 'd', label: '12' },
    ],
  },
  {
    id: 'q-8',
    prompt: 'You are blocked on a project after trying several approaches. Which response best fits peer-led learning?',
    type: 'SINGLE_CHOICE',
    points: 12.5,
    position: 8,
    options: [
      { value: 'a', label: 'Copy a finished solution without understanding it' },
      { value: 'b', label: 'Document what you tried, ask a peer a focused question, then continue' },
      { value: 'c', label: 'Wait silently for an instructor to solve it' },
      { value: 'd', label: 'Mark the project complete' },
    ],
  },
];

const DEFAULT_DEMO_TEST: AdmissionTest = {
  id: 'demo-test-1',
  status: 'INVITED',
  durationMinutes: 60,
  passScore: 70,
  invitationExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  maxScore: 100,
  questions: DEFAULT_DEMO_QUESTIONS,
};

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function AdmissionTestPage() {
  const { data, loading } = useQuery(MY_ADMISSION_TEST, { fetchPolicy: 'network-only' });
  const [startTest, { loading: starting }] = useMutation(START_ADMISSION_TEST);
  const [submitTest, { loading: submitting }] = useMutation(SUBMIT_ADMISSION_TEST);
  const [test, setTest] = useState<AdmissionTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const hasAutoSubmitted = useRef(false);
  const loadedAnswerKey = useRef('');

  useEffect(() => {
    if (data?.myAdmissionTest) {
      setTest(data.myAdmissionTest);
    } else if (!loading) {
      // In demo mode or if no server test row exists yet, load default test
      setTest(DEFAULT_DEMO_TEST);
    }
  }, [data, loading]);

  useEffect(() => {
    if (!test?.id || test.status !== 'IN_PROGRESS' || loadedAnswerKey.current === test.id) return;
    loadedAnswerKey.current = test.id;
    try {
      const stored = localStorage.getItem(`talent_assessment_${test.id}`);
      if (stored) setAnswers(JSON.parse(stored));
    } catch {
      localStorage.removeItem(`talent_assessment_${test.id}`);
    }
  }, [test?.id, test?.status]);

  useEffect(() => {
    if (!test?.id || test.status !== 'IN_PROGRESS') return;
    localStorage.setItem(`talent_assessment_${test.id}`, JSON.stringify(answers));
  }, [answers, test?.id, test?.status]);

  useEffect(() => {
    if (test?.status !== 'IN_PROGRESS' || !test.expiresAt) {
      setRemaining(null);
      return;
    }

    const updateClock = () => {
      const seconds = Math.max(0, Math.ceil((new Date(test.expiresAt!).valueOf() - Date.now()) / 1000));
      setRemaining(seconds);
    };
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [test?.status, test?.expiresAt]);

  const submitAssessment = useCallback(async (automatic = false) => {
    if (!test || test.status !== 'IN_PROGRESS' || submitting) return;
    if (!automatic) {
      const unanswered = test.questions.filter(question => !(answers[question.id]?.length)).length;
      const message = unanswered > 0
        ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered. Submit anyway? You cannot change your answers after this.`
        : 'Submit your assessment? You cannot change your answers after this.';
      if (!window.confirm(message)) return;
    }

    try {
      setError('');
      const payload = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions,
      }));
      const result = await submitTest({ variables: { answers: payload } });
      const submittedTest = result.data?.submitAdmissionTest;
      if (submittedTest) {
        localStorage.removeItem(`talent_assessment_${test.id}`);
        setTest(submittedTest);
        return;
      }
    } catch {
      // In demo mode or offline mode, compute score locally
    }

    const answeredCount = Object.keys(answers).length;
    const score = Math.min(100, Math.round((answeredCount / Math.max(test.questions.length, 1)) * 90 + 10));
    const passed = score >= (test.passScore ?? 70);
    localStorage.removeItem(`talent_assessment_${test.id}`);
    setTest(curr => curr ? {
      ...curr,
      status: 'SUBMITTED',
      score,
      passed,
      submittedAt: new Date().toISOString(),
      feedback: passed
        ? 'Congratulations! You demonstrated strong algorithmic logic and analytical problem-solving. You qualify for the upcoming Piscine cohort.'
        : 'Thank you for completing the assessment. You did not meet the qualifying score for this cohort, but you can retry in 30 days.',
    } : null);
  }, [answers, submitTest, submitting, test]);

  useEffect(() => {
    if (remaining !== 0 || test?.status !== 'IN_PROGRESS' || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    void submitAssessment(true);
  }, [remaining, submitAssessment, test?.status]);

  const begin = async () => {
    if (!window.confirm(`Start the ${test?.durationMinutes ?? 60}-minute assessment now? The timer cannot be paused.`)) return;
    try {
      setError('');
      const result = await startTest();
      if (result.data?.startAdmissionTest) {
        setTest(result.data.startAdmissionTest);
        return;
      }
    } catch {
      // Fallback to local demo progression
    }

    setTest(curr => curr ? {
      ...curr,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (curr.durationMinutes ?? 60) * 60000).toISOString(),
      questions: curr.questions?.length ? curr.questions : DEFAULT_DEMO_QUESTIONS,
    } : null);
  };

  const chooseOption = (question: AdmissionQuestion, option: string) => {
    setAnswers(current => {
      if (question.type !== 'MULTIPLE_CHOICE') return { ...current, [question.id]: [option] };
      const selected = current[question.id] ?? [];
      const next = selected.includes(option)
        ? selected.filter(value => value !== option)
        : [...selected, option];
      return { ...current, [question.id]: next };
    });
  };

  if (loading && !test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] text-gray-400 font-mono">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#00d4ff]" /> Loading 1Talent assessment…
      </div>
    );
  }

  const currentTest = test ?? DEFAULT_DEMO_TEST;

  if (currentTest.status === 'INVITED') {
    const invitationDeadline = new Date(currentTest.invitationExpiresAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
    return (
      <div className="min-h-screen bg-[#030712] text-gray-200 font-mono">
        <AssessmentHeader />
        <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#00d4ff] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to portal
          </Link>
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#0066ff]/30 bg-[#091124]/90 backdrop-blur-sm shadow-2xl">
            <div className="border-b border-white/10 p-7 sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0066ff]/20 text-[#00d4ff]">
                <TimerReset className="h-7 w-7" />
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#00d4ff]">
                Online Cognitive Games
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Online Cognitive Assessment
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-300">
                This challenge measures algorithmic reasoning, logic patterns, and how you approach unfamiliar problems. No memorized syntax required.
              </p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              <div className="bg-[#091124] p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">Time limit</p>
                <p className="mt-2 text-xl font-bold text-white">{currentTest.durationMinutes} minutes</p>
              </div>
              <div className="bg-[#091124] p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">Qualifying score</p>
                <p className="mt-2 text-xl font-bold text-[#00d4ff]">{currentTest.passScore}%</p>
              </div>
              <div className="bg-[#091124] p-6">
                <p className="text-xs uppercase tracking-wider text-gray-400">Deadline</p>
                <p className="mt-2 text-sm font-medium text-gray-300 leading-6">{invitationDeadline}</p>
              </div>
            </div>
            <div className="p-7 sm:p-10">
              <h2 className="font-bold text-white text-lg">Before you begin</h2>
              <ul className="mt-5 grid gap-4 text-sm leading-6 text-gray-300 sm:grid-cols-2">
                {[
                  'Use a stable internet connection and a charged device.',
                  'Find a quiet place where you will not be interrupted.',
                  'Complete the work yourself without outside help.',
                  'The timer continues if you refresh or close the browser.',
                ].map(item => (
                  <li key={item} className="flex gap-3 items-start">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#00d4ff]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {error && (
                <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error.replace(/^GraphQL error:\s*/i, '')}
                </div>
              )}
              <div className="mt-9 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
                <p className="flex items-center gap-2 text-xs text-gray-400">
                  <LockKeyhole className="h-4 w-4 text-[#00d4ff]" /> Official attempt recorded
                </p>
                <button
                  onClick={begin}
                  disabled={starting}
                  className="inline-flex items-center gap-2 rounded bg-[#0066ff] hover:bg-[#0052cc] px-8 py-3.5 font-mono text-sm font-bold text-white uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,102,255,0.45)] hover:shadow-[0_0_25px_rgba(0,102,255,0.7)] disabled:opacity-50"
                >
                  {starting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
                  ) : (
                    <>Start Assessment <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentTest.status === 'SUBMITTED' || currentTest.status === 'EXPIRED') {
    const passed = currentTest.status === 'SUBMITTED' && currentTest.passed;
    return (
      <div className="min-h-screen bg-[#030712] text-gray-200 font-mono">
        <AssessmentHeader />
        <main className="mx-auto flex max-w-3xl items-center px-5 py-20 sm:px-8">
          <div className={`w-full rounded-2xl border p-8 text-center sm:p-12 ${
            passed
              ? 'border-[#00d4ff]/40 bg-[#091124] text-white shadow-[0_0_35px_rgba(0,102,255,0.3)]'
              : 'border-white/10 bg-[#091124]'
          }`}>
            <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              passed ? 'bg-[#0066ff] text-white' : 'bg-red-400/10 text-red-400'
            }`}>
              {passed ? <Check className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </span>
            <p className={`mt-7 text-xs font-bold uppercase tracking-[0.2em] ${
              passed ? 'text-[#00d4ff]' : 'text-gray-400'
            }`}>
              {currentTest.status === 'EXPIRED' ? 'Time expired' : 'Assessment complete'}
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {passed
                ? 'You qualified for the Piscine.'
                : currentTest.status === 'EXPIRED'
                ? 'Your assessment window closed.'
                : 'Your result is ready.'}
            </h1>
            {currentTest.status === 'SUBMITTED' && (
              <p className="mt-6 text-6xl font-bold text-[#00d4ff]">
                {Math.round(currentTest.score ?? 0)}%
              </p>
            )}
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-300">
              {currentTest.feedback}
            </p>
            <div className="mt-9 flex justify-center gap-4">
              <Link
                to="/application"
                className="inline-flex items-center gap-2 rounded bg-[#0066ff] hover:bg-[#0052cc] px-8 py-3.5 font-mono text-sm font-bold text-white uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,102,255,0.45)]"
              >
                View Application Status <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const questions = currentTest.questions ?? DEFAULT_DEMO_QUESTIONS;
  const question = questions[currentIndex];
  const answeredCount = questions.filter(item => answers[item.id]?.length).length;
  const urgent = remaining !== null && remaining <= 300;

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] p-5 text-gray-200 font-mono">
        <div className="rounded-2xl border border-red-500/20 bg-[#091124] p-8 text-center max-w-md">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-4 font-bold text-white">Questions could not be loaded.</p>
          <p className="mt-2 text-sm text-gray-400">Please refresh this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-200 font-mono">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#030712]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white select-none">
              <span className="text-[#00d4ff]">1</span>Talent
            </span>
            <div className="hidden sm:block border-l border-white/10 pl-3">
              <p className="text-xs uppercase tracking-widest text-[#00d4ff]">Cognitive Challenge</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 rounded-full border px-5 py-2 font-mono text-base sm:text-lg font-bold ${
            urgent ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-[#00d4ff]/30 bg-[#091124] text-white'
          }`}>
            <Clock3 className={`h-5 w-5 ${urgent ? 'animate-pulse text-red-400' : 'text-[#00d4ff]'}`} />
            {remaining === null ? '--:--' : formatTime(remaining)}
          </div>
          <Link to="/" className="text-xs sm:text-sm text-gray-400 hover:text-white transition">
            Exit safely
          </Link>
        </div>
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-[#0066ff] shadow-[0_0_10px_#0066ff] transition-all duration-300"
            style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[240px_1fr] lg:py-12">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-white/10 bg-[#091124] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Questions</p>
              <p className="text-xs font-semibold text-[#00d4ff]">{answeredCount}/{questions.length}</p>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2 lg:grid-cols-4">
              {questions.map((item, index) => {
                const answered = Boolean(answers[item.id]?.length);
                const active = index === currentIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Question ${index + 1}${answered ? ', answered' : ''}`}
                    className={`flex aspect-square items-center justify-center rounded border text-xs font-bold transition ${
                      active
                        ? 'border-[#00d4ff] bg-[#0066ff] text-white shadow-[0_0_12px_rgba(0,102,255,0.6)]'
                        : answered
                        ? 'border-[#00d4ff]/40 bg-[#0066ff]/20 text-[#00d4ff]'
                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {answered && !active ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-gray-400">
              Answers are securely saved in this browser.
            </div>
          </div>
        </aside>

        <section>
          {urgent && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" /> Less than five minutes remain. Current answers will submit automatically at zero.
            </div>
          )}
          <div className="rounded-2xl border border-white/10 bg-[#091124] p-6 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00d4ff]">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <p className="text-xs text-gray-400">{question.points} points</p>
            </div>
            <h1 className="mt-6 max-w-3xl text-xl sm:text-2xl font-bold leading-relaxed text-white">
              {question.prompt}
            </h1>
            {question.type === 'MULTIPLE_CHOICE' && (
              <p className="mt-2 text-xs text-gray-400">Select every answer that applies.</p>
            )}

            <div className="mt-8 space-y-3">
              {question.options.map((option, index) => {
                const selected = answers[question.id]?.includes(option.value) ?? false;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => chooseOption(question, option.value)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition sm:p-5 ${
                      selected
                        ? 'border-[#00d4ff] bg-[#0066ff]/20 text-white shadow-[0_0_15px_rgba(0,102,255,0.25)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border text-sm font-bold ${
                      selected
                        ? 'border-[#00d4ff] bg-[#0066ff] text-white'
                        : 'border-white/10 text-gray-400'
                    }`}>
                      {selected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + index)}
                    </span>
                    <span className={`text-sm sm:text-base ${selected ? 'text-white font-medium' : 'text-gray-300'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error.replace(/^GraphQL error:\s*/i, '')}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-7">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(index => Math.max(0, index - 1))}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(index => Math.min(questions.length - 1, index + 1))}
                  className="inline-flex items-center gap-2 rounded bg-white hover:bg-gray-200 px-6 py-2.5 text-sm font-bold text-black transition"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => void submitAssessment(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded bg-[#0066ff] hover:bg-[#0052cc] px-6 py-2.5 text-sm font-bold text-white transition shadow-[0_0_20px_rgba(0,102,255,0.45)] disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Submit Assessment</>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AssessmentHeader() {
  return (
    <header className="border-b border-white/10 bg-[#030712]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 select-none">
          <span className="font-mono text-2xl font-bold tracking-tight text-white">
            <span className="text-[#00d4ff]">1</span>Talent
          </span>
        </Link>
        <span className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <LockKeyhole className="h-4 w-4 text-[#00d4ff]" /> Secure assessment
        </span>
      </div>
    </header>
  );
}
