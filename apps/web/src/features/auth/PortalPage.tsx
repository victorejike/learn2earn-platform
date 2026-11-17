import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import techBg from '../../assets/tech-bg.jpg';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        username
        role
        status
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        role
        status
      }
    }
  }
`;

export default function PortalPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [emailOrUsername, setEmailOrUsername] = useState('victorejiki@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCampus] = useState('learn2earn');

  // Status & modal states
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [register, { loading: regLoading }] = useMutation(REGISTER_MUTATION);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { data } = await login({
        variables: {
          email: emailOrUsername.trim(),
          password,
        },
      });

      if (data?.login?.token) {
        localStorage.setItem('talent_token', data.login.token);
        const role = data.login.user.role;
        if (['APPLICANT', 'PISCINER'].includes(role)) {
          navigate('/application');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid username or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { data } = await register({
        variables: {
          input: {
            fullName: regFullName.trim(),
            username: regUsername.trim().toLowerCase(),
            email: regEmail.trim().toLowerCase(),
            password: regPassword,
          },
        },
      });

      if (data?.register?.token) {
        localStorage.setItem('talent_token', data.register.token);
        navigate('/application');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col justify-between overflow-x-hidden select-text font-sans">
      {/* 
        ========================================================================
        IMMERSIVE BLUE TECHNOLOGY BACKGROUND (Vibrant, Prominent, Lively)
        ========================================================================
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Full-bleed blue tech wallpaper image provided by user */}
        <img
          src={techBg}
          alt="1Talent Technology Network"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          style={{
            filter: 'brightness(0.9) contrast(1.15) saturate(1.25)',
          }}
        />

        {/* Dynamic lively ambient pulse glow */}
        <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay animate-pulse" style={{ animationDuration: '6s' }} />

        {/* Elegant subtle radial vignette so text is ultra-crisp while blue network shines bright */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.45)_0%,rgba(2,6,23,0.85)_80%,rgba(2,6,23,0.95)_100%)]" />

        {/* Subtle cyber grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* 
        ========================================================================
        TOP NAVIGATION & 1TALENT BRAND HEADER
        ========================================================================
      */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-950/30">
        <div className="flex items-center gap-3">
          {/* Custom 1Talent Geometric Cyber Icon */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center">
              <span className="font-mono text-base font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                1T
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                1TALENT
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/80 -mt-0.5">
              Engineering Platform
            </span>
          </div>
        </div>

        {/* Campus & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-cyan-500/30 backdrop-blur-md text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-medium">Campus: Learn2Earn</span>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN 2-COLUMN EXPERIENCE (1Talent Unique Identity)
        ========================================================================
      */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-16 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-16">
        
        {/* LEFT COLUMN: 1Talent Platform Narrative */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-medium mb-6 w-fit backdrop-blur-sm">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Native Engineering SaaS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Engineering Mastery. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
              Built on Real Code.
            </span>
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl font-normal">
            <strong className="text-white">1Talent</strong> is a multi-tenant engineering education platform. 
            Students master software engineering through real-world projects, automated sandbox testing, 
            and accountable peer-to-peer code reviews across an evolving dependency graph.
          </p>

          {/* Structured 4-Step Track */}
          <div className="space-y-3.5 max-w-xl">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-2">
              The Path to Admission:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
                  <span>01</span>
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span>REGISTER</span>
                </div>
                <p className="text-xs text-slate-300">Create your developer identity and select your campus.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
                  <span>02</span>
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span>ASSESSMENT</span>
                </div>
                <p className="text-xs text-slate-300">Complete the 60-minute timed logic &amp; cognitive test.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
                  <span>03</span>
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span>THE PISCINE</span>
                </div>
                <p className="text-xs text-slate-300">Qualify for the intensive 4-week selection bootcamp.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
                  <span>04</span>
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span>THE GRAPH</span>
                </div>
                <p className="text-xs text-slate-300">Unlock project nodes, audit peers, and earn your degree.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Frameless Clean Authentication Form */}
        <div className="w-full lg:w-5/12 max-w-md">
          <div className="p-8 sm:p-10 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(2,6,23,0.8)]">
            {mode === 'login' ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                    <Terminal className="w-4 h-4" />
                    <span>Workspace Access</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Sign in to 1Talent
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your credentials to access your terminal &amp; projects.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 text-xs font-mono text-red-300 bg-red-950/50 border border-red-500/30 rounded px-3 py-2">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email or Username */}
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Email or Username
                    </label>
                    <input
                      type="text"
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="victorejiki@gmail.com"
                      className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Password with Eye Toggle */}
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right pt-0.5">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold tracking-wide transition-all duration-200 shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loginLoading ? (
                        <span>AUTHENTICATING...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          SIGN IN <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Switch to Register */}
                  <div className="pt-4 text-center border-t border-white/10">
                    <p className="text-xs text-slate-400">
                      New to 1Talent?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setErrorMsg('');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold underline ml-1 transition-colors"
                      >
                        Apply for Admission
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Candidate Registration</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Apply to 1Talent
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Campus: Learn2Earn. No prior degree required.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 text-xs font-mono text-red-300 bg-red-950/50 border border-red-500/30 rounded px-3 py-2">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Victor Ejike"
                      className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="victor"
                        className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        Campus
                      </label>
                      <div className="px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400">
                        {regCampus}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="victorejiki@gmail.com"
                      className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold tracking-wide transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50"
                    >
                      {regLoading ? 'CREATING ACCOUNT...' : 'START COGNITIVE ASSESSMENT'}
                    </button>
                  </div>

                  <div className="pt-3 text-center border-t border-white/10">
                    <p className="text-xs text-slate-400">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMsg('');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold underline ml-1"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Dialog */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset Password</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your registered email address and we will dispatch a secure recovery token to your inbox.
            </p>
            <input
              type="email"
              placeholder="victorejiki@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <div className="flex justify-end gap-3 pt-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Reset link sent to your registered email address.');
                  setForgotModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-4 border-t border-white/10 backdrop-blur-md bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div>
          <span>© {new Date().getFullYear()} 1Talent Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Peer-Reviewed DAG Curriculum</span>
          <span>Automated Sandbox</span>
          <span>Campus: Learn2Earn</span>
        </div>
      </footer>
    </div>
  );
}
