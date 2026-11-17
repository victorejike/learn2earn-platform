import { useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Braces, Check, ChevronRight,
  Globe2, GraduationCap, Loader2, MapPin, UserRound,
} from 'lucide-react';

const CAMPUSES_QUERY = gql`
  query ApplicationCampuses {
    applicationCampuses {
      id name city country isVirtual
    }
  }
`;

const SUBMIT_APPLICATION = gql`
  mutation SubmitAdmissionApplication($input: SubmitAdmissionApplicationInput!) {
    submitAdmissionApplication(input: $input) {
      token
      user { id role status }
      application { id reference status }
    }
  }
`;

interface Campus {
  id: string;
  name: string;
  city?: string;
  country?: string;
  isVirtual: boolean;
}

interface ApplicationForm {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  country: string;
  city: string;
  highestEducation: string;
  codingExperience: string;
  motivation: string;
  campusId: string;
  availability: string;
  referralSource: string;
  termsAccepted: boolean;
  dataConsent: boolean;
}

const initialForm: ApplicationForm = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  dateOfBirth: '',
  country: '',
  city: '',
  highestEducation: '',
  codingExperience: '',
  motivation: '',
  campusId: '',
  availability: '',
  referralSource: '',
  termsAccepted: false,
  dataConsent: false,
};

const steps = [
  { label: 'Your account', icon: UserRound },
  { label: 'Your background', icon: GraduationCap },
  { label: 'Your commitment', icon: Globe2 },
];

const inputClass = 'mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-lime-300/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-lime-300/10';
const labelClass = 'block text-sm font-semibold text-stone-300';

export default function ApplicationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { data: campusData, loading: campusesLoading } = useQuery(CAMPUSES_QUERY);
  const [submitApplication, { loading: submitting }] = useMutation(SUBMIT_APPLICATION);

  const campuses: Campus[] = useMemo(() => campusData?.applicationCampuses ?? [], [campusData]);

  const update = <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) => {
    setForm(current => ({ ...current, [key]: value }));
    setError('');
  };

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 0) {
      if (!form.fullName.trim() || !form.email.trim() || !form.username.trim() || !form.password) {
        return 'Complete all required account fields.';
      }
      if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(form.username.trim().toLowerCase())) {
        return 'Username must be 3–30 characters using letters, numbers, dots, dashes, or underscores.';
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
    }

    if (currentStep === 1) {
      if (!form.dateOfBirth || !form.country.trim() || !form.city.trim() || !form.highestEducation || !form.codingExperience) {
        return 'Complete all required background fields.';
      }
      if (form.motivation.trim().length < 80) {
        return 'Tell us a little more about your motivation (at least 80 characters).';
      }
    }

    if (currentStep === 2) {
      if (!form.campusId || !form.availability) return 'Select a campus and your availability.';
      if (!form.termsAccepted || !form.dataConsent) return 'Accept both confirmations to submit your application.';
    }

    return null;
  };

  const next = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(current => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateStep(2);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError('');
      const { data } = await submitApplication({
        variables: {
          input: {
            ...form,
            username: form.username.trim().toLowerCase(),
            email: form.email.trim().toLowerCase(),
            fullName: form.fullName.trim(),
            phone: form.phone.trim() || null,
            country: form.country.trim(),
            city: form.city.trim(),
            motivation: form.motivation.trim(),
            referralSource: form.referralSource || null,
          },
        },
      });
      localStorage.setItem('talent_token', data.submitAdmissionApplication.token);
      navigate('/application', { replace: true });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'We could not submit your application. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080b0a] text-stone-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-black">
              <Braces className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="font-black tracking-[-0.04em]">1TALENT</span>
          </Link>
          <p className="text-sm text-stone-500">
            Already applied? <Link to="/login" className="font-semibold text-stone-200 hover:text-lime-300">Sign in</Link>
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[280px_1fr] lg:py-20">
        <aside>
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to overview
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Application</p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">Start your journey.</h1>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Be honest and specific. We care more about how you think and commit than what credentials you already have.
          </p>

          <ol className="mt-10 space-y-2" aria-label="Application progress">
            {steps.map(({ label, icon: Icon }, index) => {
              const complete = index < step;
              const active = index === step;
              return (
                <li key={label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${active ? 'border-lime-300/30 bg-lime-300/[0.06]' : 'border-transparent'}`}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${complete ? 'bg-lime-300 text-black' : active ? 'border border-lime-300 text-lime-300' : 'border border-white/10 text-stone-600'}`}>
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">Step {index + 1}</p>
                    <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-stone-500'}`}>{label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-[#0d110f] p-6 shadow-2xl shadow-black/30 sm:p-10 lg:p-12">
          <div className="mb-9 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-600">Step {step + 1} of {steps.length}</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{steps[step].label}</h2>
            </div>
            <span className="text-sm font-semibold text-lime-300">{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="mb-10 h-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-lime-300 transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>

          <form onSubmit={submit}>
            {step === 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <label className={`${labelClass} sm:col-span-2`}>
                  Full name <span className="text-lime-300">*</span>
                  <input className={inputClass} required autoComplete="name" value={form.fullName} onChange={event => update('fullName', event.target.value)} placeholder="Your legal name" />
                </label>
                <label className={labelClass}>
                  Username <span className="text-lime-300">*</span>
                  <input className={inputClass} required autoComplete="username" value={form.username} onChange={event => update('username', event.target.value.toLowerCase())} placeholder="future.engineer" />
                  <span className="mt-2 block text-xs font-normal text-stone-600">This becomes your public peer identity.</span>
                </label>
                <label className={labelClass}>
                  Email address <span className="text-lime-300">*</span>
                  <input className={inputClass} required type="email" autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="you@example.com" />
                </label>
                <label className={labelClass}>
                  Phone number
                  <input className={inputClass} type="tel" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="+234 …" />
                </label>
                <label className={labelClass}>
                  Create a password <span className="text-lime-300">*</span>
                  <input className={inputClass} required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={event => update('password', event.target.value)} placeholder="At least 8 characters" />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <label className={labelClass}>
                  Date of birth <span className="text-lime-300">*</span>
                  <input className={inputClass} required type="date" value={form.dateOfBirth} onChange={event => update('dateOfBirth', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Country <span className="text-lime-300">*</span>
                  <input className={inputClass} required autoComplete="country-name" value={form.country} onChange={event => update('country', event.target.value)} placeholder="Nigeria" />
                </label>
                <label className={labelClass}>
                  City <span className="text-lime-300">*</span>
                  <input className={inputClass} required autoComplete="address-level2" value={form.city} onChange={event => update('city', event.target.value)} placeholder="Lagos" />
                </label>
                <label className={labelClass}>
                  Highest education <span className="text-lime-300">*</span>
                  <select className={inputClass} required value={form.highestEducation} onChange={event => update('highestEducation', event.target.value)}>
                    <option value="">Choose one</option>
                    <option value="secondary">Secondary school</option>
                    <option value="diploma">Diploma / vocational training</option>
                    <option value="undergraduate">Currently at university</option>
                    <option value="degree">University degree</option>
                    <option value="postgraduate">Postgraduate degree</option>
                    <option value="other">Other / self-directed</option>
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Coding experience <span className="text-lime-300">*</span>
                  <select className={inputClass} required value={form.codingExperience} onChange={event => update('codingExperience', event.target.value)}>
                    <option value="">Choose one</option>
                    <option value="none">None yet</option>
                    <option value="beginner">I have tried tutorials or small exercises</option>
                    <option value="intermediate">I have built a few projects</option>
                    <option value="experienced">I have professional experience</option>
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  Why do you want to join 1Talent? <span className="text-lime-300">*</span>
                  <textarea className={`${inputClass} min-h-36 resize-y`} required maxLength={3000} value={form.motivation} onChange={event => update('motivation', event.target.value)} placeholder="Tell us what you want to build, what you are prepared to commit, and why peer-led learning fits you…" />
                  <span className={`mt-2 block text-right text-xs font-normal ${form.motivation.trim().length < 80 ? 'text-stone-600' : 'text-lime-300'}`}>
                    {form.motivation.trim().length} / 80 minimum
                  </span>
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <fieldset>
                  <legend className="text-sm font-semibold text-stone-300">Preferred campus <span className="text-lime-300">*</span></legend>
                  {campusesLoading ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 p-5 text-sm text-stone-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading campuses…
                    </div>
                  ) : campuses.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-200">No campus is currently accepting applications.</div>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {campuses.map(campus => (
                        <label key={campus.id} className={`cursor-pointer rounded-2xl border p-5 transition ${form.campusId === campus.id ? 'border-lime-300/60 bg-lime-300/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                          <input className="sr-only" type="radio" name="campus" value={campus.id} checked={form.campusId === campus.id} onChange={() => update('campusId', campus.id)} />
                          <span className="flex items-start justify-between gap-4">
                            <span>
                              <span className="block font-bold text-white">{campus.name}</span>
                              <span className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                                <MapPin className="h-3.5 w-3.5" />
                                {campus.isVirtual ? 'Virtual campus' : [campus.city, campus.country].filter(Boolean).join(', ')}
                              </span>
                            </span>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${form.campusId === campus.id ? 'border-lime-300 bg-lime-300 text-black' : 'border-white/20'}`}>
                              {form.campusId === campus.id && <Check className="h-3 w-3" />}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>

                <div className="grid gap-6 sm:grid-cols-2">
                  <label className={labelClass}>
                    Piscine availability <span className="text-lime-300">*</span>
                    <select className={inputClass} required value={form.availability} onChange={event => update('availability', event.target.value)}>
                      <option value="">Choose one</option>
                      <option value="full_time">Full-time, including evenings</option>
                      <option value="daytime">Weekday daytime</option>
                      <option value="evenings">Evenings and weekends</option>
                      <option value="next_cohort">I need a future cohort</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    How did you hear about us?
                    <select className={inputClass} value={form.referralSource} onChange={event => update('referralSource', event.target.value)}>
                      <option value="">Choose one</option>
                      <option value="community">Community / event</option>
                      <option value="friend">Friend or alumnus</option>
                      <option value="social">Social media</option>
                      <option value="search">Web search</option>
                      <option value="school">School or employer</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-stone-400">
                    <input className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-lime-300" type="checkbox" checked={form.termsAccepted} onChange={event => update('termsAccepted', event.target.checked)} />
                    <span>I confirm that the information in this application is accurate and that I will complete the assessment myself.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-stone-400">
                    <input className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-lime-300" type="checkbox" checked={form.dataConsent} onChange={event => update('dataConsent', event.target.checked)} />
                    <span>I consent to 1Talent processing this information for admission and cohort placement.</span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-7 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
                {error.replace(/^GraphQL error:\s*/i, '')}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-7">
              <button
                type="button"
                disabled={step === 0 || submitting}
                onClick={() => { setStep(current => Math.max(0, current - 1)); setError(''); }}
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-stone-500 transition hover:text-white disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 font-bold text-black transition hover:bg-lime-200">
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={submitting || campuses.length === 0} className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 font-bold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Submit application <ArrowRight className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
