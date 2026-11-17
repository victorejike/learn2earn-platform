import { useCallback, useEffect, useRef, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Braces, Check,
  CheckCircle2, Clock3, FileQuestion, Loader2, LockKeyhole,
  Send, TimerReset, XCircle,
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

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function AdmissionTestPage() {
  const { data, loading, error: queryError } = useQuery(MY_ADMISSION_TEST, { fetchPolicy: 'network-only' });
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
    if (data?.myAdmissionTest) setTest(data.myAdmissionTest);
  }, [data]);

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
      }
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Your assessment could not be submitted. Try again.');
      hasAutoSubmitted.current = false;
    }
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
      if (result.data?.startAdmissionTest) setTest(result.data.startAdmissionTest);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'The assessment could not be started.');
    }
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
      <div className="flex min-h-screen items-center justify-center bg-[#080b0a] text-stone-400">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-lime-300" /> Loading assessment…
      </div>
    );
  }

  if (queryError || !test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b0a] p-5 text-stone-100">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d110f] p-8 text-center">
          <FileQuestion className="mx-auto h-10 w-10 text-stone-600" />
          <h1 className="mt-5 text-2xl font-black">No assessment available</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">Your campus must review your application before an assessment is unlocked.</p>
          <Link to="/application" className="mt-7 inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 font-bold text-black">
            <ArrowLeft className="h-4 w-4" /> Application status
          </Link>
        </div>
      </div>
    );
  }

  if (test.status === 'INVITED') {
    const invitationDeadline = new Date(test.invitationExpiresAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
    return (
      <div className="min-h-screen bg-[#080b0a] text-stone-100">
        <AssessmentHeader />
        <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
          <Link to="/application" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to application</Link>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d110f]">
            <div className="border-b border-white/10 p-7 sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300"><TimerReset className="h-7 w-7" /></div>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-lime-300">Admission assessment</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">One focused hour.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-400">This challenge measures reasoning, basic technical awareness, and how you approach unfamiliar problems—not memorized syntax.</p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              <div className="bg-[#0d110f] p-6"><p className="text-xs uppercase tracking-wider text-stone-600">Time limit</p><p className="mt-2 text-xl font-bold">{test.durationMinutes} minutes</p></div>
              <div className="bg-[#0d110f] p-6"><p className="text-xs uppercase tracking-wider text-stone-600">Qualifying score</p><p className="mt-2 text-xl font-bold">{test.passScore}%</p></div>
              <div className="bg-[#0d110f] p-6"><p className="text-xs uppercase tracking-wider text-stone-600">Start deadline</p><p className="mt-2 text-sm font-bold leading-6">{invitationDeadline}</p></div>
            </div>
            <div className="p-7 sm:p-10">
              <h2 className="font-bold">Before you begin</h2>
              <ul className="mt-5 grid gap-4 text-sm leading-6 text-stone-400 sm:grid-cols-2">
                {[
                  'Use a stable internet connection and a charged device.',
                  'Find a quiet place where you will not be interrupted.',
                  'Complete the work yourself without outside help.',
                  'The timer continues if you refresh or close the browser.',
                ].map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-lime-300" />{item}</li>)}
              </ul>
              {error && <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-200">{error.replace(/^GraphQL error:\s*/i, '')}</div>}
              <div className="mt-9 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
                <p className="flex items-center gap-2 text-xs text-stone-600"><LockKeyhole className="h-4 w-4" /> Your start and submission times are recorded.</p>
                <button onClick={begin} disabled={starting} className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-7 py-3.5 font-bold text-black transition hover:bg-lime-200 disabled:opacity-50">
                  {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : <>Start assessment <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (test.status === 'SUBMITTED' || test.status === 'EXPIRED') {
    const passed = test.status === 'SUBMITTED' && test.passed;
    return (
      <div className="min-h-screen bg-[#080b0a] text-stone-100">
        <AssessmentHeader />
        <main className="mx-auto flex max-w-3xl items-center px-5 py-20 sm:px-8">
          <div className={`w-full rounded-[2rem] border p-8 text-center sm:p-12 ${passed ? 'border-lime-300/30 bg-lime-300 text-black' : 'border-white/10 bg-[#0d110f]'}`}>
            <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${passed ? 'bg-black text-lime-300' : 'bg-red-400/10 text-red-300'}`}>
              {passed ? <Check className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </span>
            <p className={`mt-7 text-xs font-black uppercase tracking-[0.2em] ${passed ? 'text-black/50' : 'text-stone-600'}`}>{test.status === 'EXPIRED' ? 'Time expired' : 'Assessment complete'}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">{passed ? 'You qualified for the Piscine.' : test.status === 'EXPIRED' ? 'Your assessment window closed.' : 'Your result is ready.'}</h1>
            {test.status === 'SUBMITTED' && <p className="mt-6 text-6xl font-black tracking-[-0.06em]">{Math.round(test.score ?? 0)}%</p>}
            <p className={`mx-auto mt-5 max-w-xl text-sm leading-6 ${passed ? 'text-black/60' : 'text-stone-500'}`}>{test.feedback}</p>
            <Link to="/application" className={`mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold ${passed ? 'bg-black text-white' : 'bg-lime-300 text-black'}`}>
              View application status <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const questions = test.questions ?? [];
  const question = questions[currentIndex];
  const answeredCount = questions.filter(item => answers[item.id]?.length).length;
  const urgent = remaining !== null && remaining <= 300;

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b0a] p-5 text-stone-100">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-300" />
          <p className="mt-4 font-bold">Assessment questions could not be loaded.</p>
          <p className="mt-2 text-sm text-stone-500">Refresh this page. Your server-side timer and saved answers will remain active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b0a] text-stone-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b0a]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-black"><Braces className="h-5 w-5" /></span>
            <div className="hidden sm:block"><p className="text-sm font-black">ADMISSION CHALLENGE</p><p className="text-[10px] uppercase tracking-widest text-stone-600">Attempt in progress</p></div>
          </div>
          <div className={`flex items-center gap-3 rounded-full border px-5 py-2.5 font-mono text-lg font-black ${urgent ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-white/10 bg-white/[0.03] text-white'}`}>
            <Clock3 className={`h-5 w-5 ${urgent ? 'animate-pulse' : 'text-lime-300'}`} />
            {remaining === null ? '--:--' : formatTime(remaining)}
          </div>
          <Link to="/application" className="text-sm font-semibold text-stone-500 transition hover:text-white">Exit safely</Link>
        </div>
        <div className="h-1 bg-white/5"><div className="h-full bg-lime-300 transition-all" style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }} /></div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[240px_1fr] lg:py-12">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-[#0d110f] p-5">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-stone-600">Questions</p><p className="text-xs font-semibold text-stone-500">{answeredCount}/{questions.length}</p></div>
            <div className="mt-5 grid grid-cols-5 gap-2 lg:grid-cols-4">
              {questions.map((item, index) => {
                const answered = Boolean(answers[item.id]?.length);
                const active = index === currentIndex;
                return (
                  <button key={item.id} onClick={() => setCurrentIndex(index)} aria-label={`Question ${index + 1}${answered ? ', answered' : ''}`} className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-bold transition ${active ? 'border-lime-300 bg-lime-300 text-black' : answered ? 'border-lime-300/20 bg-lime-300/[0.07] text-lime-300' : 'border-white/10 text-stone-600 hover:border-white/20 hover:text-white'}`}>
                    {answered && !active ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-stone-600">Answers are saved in this browser while the server keeps your official deadline.</div>
          </div>
        </aside>

        <section>
          {urgent && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Less than five minutes remain. Your current answers submit automatically at zero.
            </div>
          )}
          <div className="rounded-[2rem] border border-white/10 bg-[#0d110f] p-6 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">Question {currentIndex + 1} of {questions.length}</p>
              <p className="text-xs font-semibold text-stone-600">{question.points} points</p>
            </div>
            <h1 className="mt-7 max-w-3xl text-2xl font-bold leading-snug tracking-[-0.025em] sm:text-3xl">{question.prompt}</h1>
            {question.type === 'MULTIPLE_CHOICE' && <p className="mt-3 text-sm text-stone-500">Select every answer that applies.</p>}

            <div className="mt-9 space-y-3">
              {question.options.map((option, index) => {
                const selected = answers[question.id]?.includes(option.value) ?? false;
                return (
                  <button key={option.value} type="button" onClick={() => chooseOption(question, option.value)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${selected ? 'border-lime-300/60 bg-lime-300/[0.07]' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${selected ? 'border-lime-300 bg-lime-300 text-black' : 'border-white/10 text-stone-600'}`}>
                      {selected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + index)}
                    </span>
                    <span className={`text-sm font-semibold sm:text-base ${selected ? 'text-white' : 'text-stone-400'}`}>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {error && <div className="mt-7 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-200">{error.replace(/^GraphQL error:\s*/i, '')}</div>}

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-7">
              <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(index => Math.max(0, index - 1))} className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-stone-500 transition hover:text-white disabled:opacity-30"><ArrowLeft className="h-4 w-4" /> Previous</button>
              {currentIndex < questions.length - 1 ? (
                <button onClick={() => setCurrentIndex(index => Math.min(questions.length - 1, index + 1))} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-stone-200">Next <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button onClick={() => void submitAssessment(false)} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-bold text-black transition hover:bg-lime-200 disabled:opacity-50">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> Submit assessment</>}
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
    <header className="border-b border-white/10">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-black"><Braces className="h-6 w-6" /></span>
          <span className="font-black tracking-[-0.04em]">1TALENT</span>
        </Link>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600"><LockKeyhole className="h-4 w-4" /> Secure assessment</span>
      </div>
    </header>
  );
}
