import { Link } from 'react-router-dom';
import {
  ArrowRight, Braces, CheckCircle2, Clock3, Code2,
  GitBranch, Network, ShieldCheck, Users, Zap,
} from 'lucide-react';

const journey = [
  {
    number: '01',
    title: 'Apply',
    copy: 'Tell us who you are, how you think, and why you are ready to build.',
  },
  {
    number: '02',
    title: 'Take the challenge',
    copy: 'Complete a timed logic and engineering-readiness assessment online.',
  },
  {
    number: '03',
    title: 'Enter the Piscine',
    copy: 'Four intense weeks of projects, peers, deadlines, and rapid growth.',
  },
  {
    number: '04',
    title: 'Master the graph',
    copy: 'Unlock a project-based curriculum and progress by proving your skills.',
  },
];

const principles = [
  {
    icon: Code2,
    title: 'Learn by building',
    copy: 'No passive lecture track. Every skill is earned through real projects and working code.',
  },
  {
    icon: Users,
    title: 'Learn with peers',
    copy: 'Explain your choices, review other people’s work, and grow through honest feedback.',
  },
  {
    icon: GitBranch,
    title: 'Progress is earned',
    copy: 'Projects unlock through prerequisites. Pass the work in front of you to move forward.',
  },
  {
    icon: ShieldCheck,
    title: 'Ability over pedigree',
    copy: 'Your background does not decide your future here. Curiosity, discipline, and effort do.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#080b0a] text-stone-100">
      <header className="relative z-20 border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="1Talent home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-black">
              <Braces className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-black tracking-[-0.04em]">1TALENT</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-stone-400 md:flex" aria-label="Main navigation">
            <a href="#method" className="transition hover:text-white">How it works</a>
            <a href="#journey" className="transition hover:text-white">The journey</a>
            <a href="#eligibility" className="transition hover:text-white">Who can apply</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-semibold text-stone-300 transition hover:text-white sm:block">
              Sign in
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-lime-200"
            >
              Apply now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(190,242,100,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(190,242,100,.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="pointer-events-none absolute left-1/2 top-12 h-80 w-80 -translate-x-1/2 rounded-full bg-lime-300/10 blur-[120px]" />

          <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:py-28">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-200">
                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_16px_rgba(190,242,100,.9)]" />
                Applications are open
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-[88px]">
                Don’t study tech.
                <span className="block text-lime-300">Become an engineer.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-400 sm:text-xl">
                A peer-led, project-based engineering programme where you learn by solving hard problems—without lectures, grades, or shortcuts.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/apply"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-lime-300 px-7 py-4 font-bold text-black transition hover:-translate-y-0.5 hover:bg-lime-200"
                >
                  Start your application <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#journey"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 font-semibold text-stone-200 transition hover:border-white/30 hover:bg-white/5"
                >
                  See the journey
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-stone-500">
                {['No prior degree required', 'Project-first', 'Peer evaluated'].map(item => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lime-300" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mx-0">
              <div className="absolute -inset-8 rounded-full bg-lime-300/5 blur-3xl" />
              <div className="relative rotate-1 rounded-[2rem] border border-white/10 bg-[#101512] p-3 shadow-2xl shadow-black/60">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#090c0a] p-6 sm:p-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Your path</p>
                      <p className="mt-1 text-xl font-bold">Engineering journey</p>
                    </div>
                    <Network className="h-8 w-8 text-stone-600" />
                  </div>
                  <div className="relative mt-8 space-y-3">
                    <div className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-lime-300 via-lime-300/40 to-white/10" />
                    {journey.map((item, index) => (
                      <div key={item.number} className="relative flex items-center gap-5 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                        <span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-black ${index === 0 ? 'border-lime-300 bg-lime-300 text-black' : 'border-white/15 bg-[#0c100d] text-stone-500'}`}>
                          {item.number}
                        </span>
                        <div>
                          <p className="font-bold text-stone-100">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-stone-500">{index === 0 ? 'You are here' : item.copy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="border-y border-white/10 bg-[#0d110f] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">A different way to learn</p>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">The work is the teacher.</h2>
              <p className="mt-6 text-lg leading-8 text-stone-400">
                1Talent puts you in control of your education. The platform gives you the path, the tools, and the community. You bring the effort.
              </p>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
              {principles.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="bg-[#0d110f] p-7 sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-8 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-500">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">From applicant to engineer</p>
                <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Your first four steps.</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Clock3 className="h-4 w-4" /> Application takes about 8 minutes
              </div>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-4">
              {journey.map((item, index) => (
                <article key={item.number} className="group relative min-h-72 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-1 hover:border-lime-300/30">
                  <span className="text-6xl font-black tracking-[-0.08em] text-white/[0.06] transition group-hover:text-lime-300/10">{item.number}</span>
                  <div className="absolute bottom-7 left-7 right-7">
                    <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-stone-500">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-stone-500">{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="eligibility" className="px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-lime-300/20 bg-lime-300 text-black lg:grid-cols-[1fr_.8fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <Zap className="h-10 w-10" fill="currentColor" />
              <h2 className="mt-10 max-w-xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">Ready to find out what you can build?</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-black/65">
                You do not need a computer-science degree or years of coding experience. You need persistence, curiosity, and the time to commit.
              </p>
              <Link
                to="/apply"
                className="mt-9 inline-flex items-center gap-3 rounded-full bg-black px-7 py-4 font-bold text-white transition hover:-translate-y-0.5"
              >
                Begin application <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="border-t border-black/15 bg-black/5 p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-16">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/55">You should be</p>
              <ul className="mt-8 space-y-6">
                {[
                  'Ready to work through difficult problems',
                  'Available for an intensive Piscine',
                  'Open to giving and receiving peer feedback',
                  'Able to learn independently and ask focused questions',
                ].map(item => (
                  <li key={item} className="flex gap-4 font-semibold">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 text-sm text-stone-600 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} 1Talent. Built for people who build.</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-stone-300">Sign in</Link>
            <Link to="/apply" className="hover:text-stone-300">Apply</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
