import { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
  CheckCircle2, ChevronDown, ChevronUp, Clock3, FileText,
  Loader2, Mail, MapPin, Send, UserRound, XCircle,
} from 'lucide-react';

const ADMISSIONS_QUERY = gql`
  query AdmissionApplications($status: AdmissionApplicationStatus) {
    admissionApplications(status: $status, limit: 100) {
      id reference status dateOfBirth country city highestEducation
      codingExperience motivation availability referralSource reviewNotes
      submittedAt reviewedAt
      user { id fullName username email status }
      campus { id name city country isVirtual }
    }
  }
`;

const REVIEW_APPLICATION = gql`
  mutation ReviewAdmissionApplication($applicationId: ID!, $decision: AdmissionReviewDecision!, $notes: String) {
    reviewAdmissionApplication(applicationId: $applicationId, decision: $decision, notes: $notes) {
      id status reviewNotes reviewedAt
    }
  }
`;

interface AdmissionApplication {
  id: string;
  reference: string;
  status: string;
  dateOfBirth: string;
  country: string;
  city: string;
  highestEducation: string;
  codingExperience: string;
  motivation: string;
  availability: string;
  referralSource?: string;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  user: { id: string; fullName: string; username: string; email: string; status: string };
  campus?: { id: string; name: string; city?: string; country?: string; isVirtual: boolean };
}

const filters: Array<{ label: string; value?: string }> = [
  { label: 'All' },
  { label: 'Needs review', value: 'SUBMITTED' },
  { label: 'Invited', value: 'INVITED' },
  { label: 'In assessment', value: 'ASSESSMENT_IN_PROGRESS' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function StatusPill({ status }: { status: string }) {
  const style: Record<string, string> = {
    SUBMITTED: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    UNDER_REVIEW: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    INVITED: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    ASSESSMENT_IN_PROGRESS: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
    ASSESSMENT_SUBMITTED: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    ACCEPTED: 'border-lime-500/30 bg-lime-500/10 text-lime-300',
    REJECTED: 'border-red-500/30 bg-red-500/10 text-red-300',
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style[status] ?? 'border-gray-700 bg-gray-800 text-gray-400'}`}>{status.replace(/_/g, ' ')}</span>;
}

export default function AdmissionsPage() {
  const [status, setStatus] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const { data, loading, error, refetch } = useQuery(ADMISSIONS_QUERY, { variables: { status } });
  const [reviewApplication] = useMutation(REVIEW_APPLICATION);

  const applications: AdmissionApplication[] = data?.admissionApplications ?? [];

  const review = async (application: AdmissionApplication, decision: 'INVITE' | 'REJECT') => {
    if (decision === 'REJECT' && !window.confirm(`Reject ${application.user.fullName}'s application?`)) return;
    setActiveReview(application.id);
    setMessage(null);
    try {
      await reviewApplication({
        variables: {
          applicationId: application.id,
          decision,
          notes: notes[application.id]?.trim() || null,
        },
      });
      setMessage({
        kind: 'success',
        text: decision === 'INVITE'
          ? `${application.user.fullName} can now start the admission assessment.`
          : `${application.user.fullName}'s application was closed.`,
      });
      await refetch();
    } catch (caught: unknown) {
      setMessage({ kind: 'error', text: caught instanceof Error ? caught.message : 'Review could not be saved.' });
    } finally {
      setActiveReview(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">Selection pipeline</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Admissions</h1>
          <p className="mt-2 text-sm text-gray-400">Review applicants and unlock their timed admission challenge.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400">
          <FileText className="h-4 w-4 text-indigo-400" />
          <span><strong className="text-white">{applications.length}</strong> shown</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(filter => (
          <button key={filter.label} onClick={() => setStatus(filter.value)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${status === filter.value ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-700 hover:text-gray-300'}`}>
            {filter.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.kind === 'success' ? 'border-green-800 bg-green-900/20 text-green-300' : 'border-red-800 bg-red-900/20 text-red-300'}`}>
          {message.text.replace(/^GraphQL error:\s*/i, '')}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 py-20 text-gray-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading applications…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900 bg-red-950/20 p-8 text-center text-red-300">{error.message}</div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 py-20 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-4 font-medium text-gray-300">No applications in this view</p>
          <p className="mt-1 text-sm text-gray-600">New submissions will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(application => {
            const isExpanded = expanded === application.id;
            const canReview = ['SUBMITTED', 'UNDER_REVIEW', 'INVITED'].includes(application.status);
            const isSaving = activeReview === application.id;
            return (
              <article key={application.id} className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg font-bold text-indigo-300">
                      {application.user.fullName.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate font-semibold text-white">{application.user.fullName}</h2>
                        <StatusPill status={application.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{application.user.email}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{application.campus?.name ?? 'No campus'}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{new Date(application.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canReview && (
                      <>
                        <button disabled={isSaving} onClick={() => void review(application, 'REJECT')} className="inline-flex items-center gap-2 rounded-lg border border-red-900/70 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/20 disabled:opacity-50">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                        <button disabled={isSaving || application.status === 'INVITED'} onClick={() => void review(application, 'INVITE')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {application.status === 'INVITED' ? 'Invited' : 'Invite to test'}
                        </button>
                      </>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : application.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 text-gray-500 transition hover:bg-gray-800 hover:text-white" aria-label={isExpanded ? 'Collapse application' : 'Expand application'}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid gap-8 border-t border-gray-800 bg-gray-950/40 p-5 lg:grid-cols-[1fr_300px]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Why 1Talent?</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-300">{application.motivation}</p>
                      <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          ['Location', `${application.city}, ${application.country}`],
                          ['Education', application.highestEducation.replace(/_/g, ' ')],
                          ['Coding experience', application.codingExperience.replace(/_/g, ' ')],
                          ['Availability', application.availability.replace(/_/g, ' ')],
                          ['Username', `@${application.user.username}`],
                          ['Reference', application.reference],
                        ].map(([label, value]) => (
                          <div key={label}><dt className="text-xs text-gray-600">{label}</dt><dd className="mt-1 text-sm font-medium capitalize text-gray-300">{value}</dd></div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Internal review note</label>
                      <textarea value={notes[application.id] ?? application.reviewNotes ?? ''} onChange={event => setNotes(current => ({ ...current, [application.id]: event.target.value }))} maxLength={3000} placeholder="Add context for this decision…" className="mt-3 min-h-32 w-full resize-y rounded-xl border border-gray-800 bg-gray-900 p-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-indigo-500" />
                      {application.status === 'ACCEPTED' && <p className="mt-4 flex items-center gap-2 text-sm text-lime-300"><CheckCircle2 className="h-4 w-4" /> Qualified for Piscine</p>}
                      <p className="mt-4 flex items-center gap-2 text-xs text-gray-600"><UserRound className="h-3.5 w-3.5" /> Date of birth: {new Date(`${application.dateOfBirth}T00:00:00`).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
