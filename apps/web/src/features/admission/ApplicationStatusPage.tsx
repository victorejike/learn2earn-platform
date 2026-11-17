import { gql, useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Braces, Check, Circle, Clock3, FileCheck2,
  Loader2, LockKeyhole, LogOut, MapPin, PartyPopper, XCircle,
} from 'lucide-react';

const APPLICATION_STATUS_QUERY = gql`
  query MyApplicationStatus {
    me { id fullName email role status }
    myAdmissionApplication {
      id reference status submittedAt reviewNotes
      campus { id name city country isVirtual }
    }
    myAdmissionTest {
      id status durationMinutes invitationExpiresAt startedAt expiresAt
      submittedAt score passScore passed feedback
    }
  }
`;

const statusCopy: Record<string, { eyebrow: string; title: string; copy: string }> = {
  SUBMITTED: {
    eyebrow: 'Application received',
    title: 'You’ve taken the first step.',
    copy: 'Your application is in the review queue. The campus team will check it before opening your assessment.',
  },
  UNDER_REVIEW: {
    eyebrow: 'Under review',
    title: 'Your application is with the team.',
    copy: 'No action is needed right now. We will update this page as soon as a decision is made.',
  },
  INVITED: {
    eyebrow: 'Assessment unlocked',
    title: 'Your challenge is ready.',
    copy: 'You have been invited to the timed admission assessment. Start only when you have a quiet, uninterrupted hour.',
  },
  ASSESSMENT_IN_PROGRESS: {
    eyebrow: 'Assessment in progress',
    title: 'The clock is running.',
    copy: 'Return to your assessment now. Your deadline continues even if this browser is closed.',
  },
  ASSESSMENT_SUBMITTED: {
    eyebrow: 'Assessment submitted',
    title: 'Your answers are in.',
    copy: 'Your result is being finalized. This page will update automatically.',
  },
  ACCEPTED: {
    eyebrow: 'Piscine offer',
    title: 'You’re in. The hard work starts now.',
    copy: 'You qualified for the next stage. Your campus will share cohort dates and check-in instructions here.',
  },
  REJECTED: {
    eyebrow: 'Application complete',
    title: 'Not this time.',
    copy: 'Your current application will not progress further. The result does not define your ability—keep building and watch for a future application window.',
  },
};

const timeline = [
  { title: 'Application', copy: 'Profile and commitment submitted' },
  { title: 'Campus review', copy: 'Eligibility and availability checked' },
  { title: 'Online assessment', copy: 'Timed logic and engineering challenge' },
  { title: 'Piscine', copy: 'Intensive project-based selection' },
];

function activeTimelineIndex(status: string): number {
  if (status === 'SUBMITTED') return 1;
  if (status === 'UNDER_REVIEW') return 1;
  if (status === 'INVITED' || status === 'ASSESSMENT_IN_PROGRESS' || status === 'ASSESSMENT_SUBMITTED') return 2;
  if (status === 'ACCEPTED') return 3;
  if (status === 'REJECTED') return 2;
  return 0;
}

export default function ApplicationStatusPage() {
  const { data, loading, error } = useQuery(APPLICATION_STATUS_QUERY, { pollInterval: 15_000 });

  const logout = () => {
    localStorage.removeItem('talent_token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b0a] text-stone-400">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-lime-300" /> Loading your application…
      </div>
    );
  }

  const application = data?.myAdmissionApplication;
  const test = data?.myAdmissionTest;
  const user = data?.me;

  if (error || !application) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b0a] p-5 text-stone-100">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d110f] p-8 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-stone-600" />
          <h1 className="mt-5 text-2xl font-black">No application found</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">This account is not connected to an admission application.</p>
          <Link to="/" className="mt-7 inline-flex rounded-full bg-lime-300 px-6 py-3 font-bold text-black">Return home</Link>
        </div>
      </div>
    );
  }

  const copy = statusCopy[application.status] ?? statusCopy.SUBMITTED;
  const activeIndex = activeTimelineIndex(application.status);
  const canOpenAssessment = test && ['INVITED', 'IN_PROGRESS'].includes(test.status);
  const invitationDeadline = test?.invitationExpiresAt
    ? new Date(test.invitationExpiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="min-h-screen bg-[#080b0a] text-stone-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-black">
              <Braces className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[-0.04em]">1TALENT</span>
              <span className="block text-[10px] uppercase tracking-widest text-stone-600">Applicant portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone-500 sm:block">{user?.fullName}</span>
            <button onClick={logout} className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-stone-400 transition hover:border-white/20 hover:text-white">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <div className={`relative overflow-hidden rounded-[2rem] border p-7 sm:p-10 ${application.status === 'ACCEPTED' ? 'border-lime-300/30 bg-lime-300 text-black' : application.status === 'REJECTED' ? 'border-white/10 bg-[#0d110f]' : 'border-lime-300/20 bg-[#0d110f]'}`}>
              {application.status === 'ACCEPTED' && <PartyPopper className="absolute -right-8 -top-8 h-48 w-48 rotate-12 text-black/5" />}
              <div className="relative">
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${application.status === 'ACCEPTED' ? 'text-black/55' : application.status === 'REJECTED' ? 'text-stone-500' : 'text-lime-300'}`}>
                  {copy.eyebrow}
                </p>
                <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">{copy.title}</h1>
                <p className={`mt-5 max-w-2xl text-base leading-7 ${application.status === 'ACCEPTED' ? 'text-black/65' : 'text-stone-400'}`}>
                  {copy.copy}
                </p>

                {canOpenAssessment && (
                  <div className="mt-9">
                    <Link to="/assessment" className={`inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-bold transition ${application.status === 'ACCEPTED' ? 'bg-black text-white' : 'bg-lime-300 text-black hover:bg-lime-200'}`}>
                      {test.status === 'IN_PROGRESS' ? 'Continue assessment' : 'View assessment instructions'}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    {test.status === 'INVITED' && invitationDeadline && (
                      <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                        <Clock3 className="h-3.5 w-3.5" /> Start before {invitationDeadline}
                      </p>
                    )}
                  </div>
                )}

                {test?.status === 'SUBMITTED' && (
                  <div className={`mt-9 inline-flex items-center gap-4 rounded-2xl border px-5 py-4 ${application.status === 'ACCEPTED' ? 'border-black/15 bg-black/5' : 'border-white/10 bg-black/20'}`}>
                    <span className={`text-3xl font-black ${application.status === 'ACCEPTED' ? 'text-black' : test.passed ? 'text-lime-300' : 'text-white'}`}>{Math.round(test.score ?? 0)}%</span>
                    <span className={`text-sm ${application.status === 'ACCEPTED' ? 'text-black/60' : 'text-stone-500'}`}>Assessment score<br />Pass mark: {test.passScore}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#0d110f] p-7 sm:p-9">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600">Admission path</p>
                  <h2 className="mt-2 text-xl font-bold">Your progress</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-mono text-stone-500">{application.reference}</span>
              </div>

              <ol className="mt-9 space-y-0">
                {timeline.map((item, index) => {
                  const complete = index < activeIndex || application.status === 'ACCEPTED';
                  const active = index === activeIndex && application.status !== 'ACCEPTED';
                  const failed = application.status === 'REJECTED' && index === activeIndex;
                  return (
                    <li key={item.title} className="relative flex gap-5 pb-8 last:pb-0">
                      {index < timeline.length - 1 && (
                        <span className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px ${complete ? 'bg-lime-300/60' : 'bg-white/10'}`} />
                      )}
                      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${failed ? 'border-red-400/50 bg-red-400/10 text-red-300' : complete ? 'border-lime-300 bg-lime-300 text-black' : active ? 'border-lime-300 bg-[#0d110f] text-lime-300' : 'border-white/10 bg-[#0d110f] text-stone-700'}`}>
                        {failed ? <XCircle className="h-4 w-4" /> : complete ? <Check className="h-4 w-4" /> : active ? <Clock3 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </span>
                      <div className="pt-1">
                        <p className={`font-semibold ${complete || active || failed ? 'text-stone-100' : 'text-stone-600'}`}>{item.title}</p>
                        <p className="mt-1 text-sm text-stone-600">{item.copy}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0d110f] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600">Application details</p>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="text-stone-600">Applicant</dt>
                  <dd className="mt-1 font-semibold text-stone-200">{user?.fullName}</dd>
                </div>
                <div>
                  <dt className="text-stone-600">Campus</dt>
                  <dd className="mt-1 flex items-center gap-2 font-semibold text-stone-200">
                    <MapPin className="h-4 w-4 text-lime-300" />
                    {application.campus?.name ?? 'To be assigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-600">Submitted</dt>
                  <dd className="mt-1 font-semibold text-stone-200">{new Date(application.submittedAt).toLocaleDateString([], { dateStyle: 'long' })}</dd>
                </div>
                <div>
                  <dt className="text-stone-600">Reference</dt>
                  <dd className="mt-1 font-mono font-semibold text-stone-200">{application.reference}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <LockKeyhole className="h-6 w-6 text-stone-600" />
              <h3 className="mt-4 font-bold">Keep your account secure</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">Assessment access is tied to this account. Never share your password or ask someone else to complete it.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
