import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import TechBackground from '../../components/TechBackground';
import TalentLogo from '../../components/TalentLogo';

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

  // Login form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCampus, setRegCampus] = useState('learn2earn');

  // Status & error states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Apollo mutations
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
        // Direct applicants/pisciners to admissions/test, students/staff to dashboard
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
        setSuccessMsg('Account created! Entering platform...');
        setTimeout(() => {
          navigate('/application');
        }, 800);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed. Please verify your details.');
    }
  };

  // Quick dev test fill
  const handleDevFill = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setEmailOrUsername('victor@1talent.local');
      setPassword('dev-password-123');
    } else {
      setEmailOrUsername('admin@1talent.local');
      setPassword('dev-password-123');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-white flex flex-col justify-between selection:bg-cyan-400 selection:text-black overflow-x-hidden font-sans">
      {/* Dynamic Animated High-Tech Network Wallpaper */}
      <TechBackground />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/[0.07] backdrop-blur-sm">
        <Link to="/" className="cursor-pointer">
          <TalentLogo size="md" />
        </Link>

        {/* Campus & Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Campus: Learn2Earn</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area (01Edu 2-Column Structure) */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 lg:py-16 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-16">
        
        {/* LEFT COLUMN: 01Edu Mirroring Welcome & Steps */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center select-text">
          {/* Main Monospace Welcome Title */}
          <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-8">
            Welcome to 1Talent !
          </h1>

          {/* Platform Intro Paragraph */}
          <p className="text-gray-300 sm:text-lg leading-relaxed mb-10 max-w-2xl font-light">
            <span className="text-cyan-400 font-medium">1Talent Platform</span> is our collaborative coding education platform.
          </p>

          {/* Instruction Block */}
          <div className="space-y-6 text-gray-200 text-sm sm:text-base font-light max-w-2xl">
            <p className="text-gray-300 font-normal">
              New here? Here&apos;s what you need to do:
            </p>

            <div className="space-y-3 font-mono text-gray-300 pl-2">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold shrink-0">1)</span>
                <span>Create an account, and log into the platform.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold shrink-0">2)</span>
                <span>Complete the online cognitive &amp; logic test.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold shrink-0">3)</span>
                <span>Wait to find out whether you&apos;ve made it to the next stage.</span>
              </div>
            </div>

            <p className="text-gray-400 text-sm sm:text-base pt-4 leading-relaxed">
              That&apos;s it! If you&apos;ve already created an account, sign in to complete your application or check for updates.
            </p>
          </div>

          {/* Architectural Pill / Trust Badges */}
          <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-wrap items-center gap-6 text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Peer-Evaluated (DAG Graph)
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" /> Piscine Intensive Bootcamp
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Multi-Tenant Org Ready
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: 01Edu Mirroring Login / Register Box */}
        <div className="w-full lg:w-5/12 max-w-md">
          <div className="relative rounded-2xl bg-[#070e20]/80 border border-cyan-500/25 p-8 sm:p-10 shadow-[0_0_50px_rgba(37,99,235,0.2)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40">
            
            {/* Ambient inner neon glow */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Mode Header */}
            {mode === 'login' ? (
              <div className="mb-8">
                {/* 01Edu Signature Purple/Cyan Monospace Header */}
                <h2 className="font-mono text-xl sm:text-2xl font-medium tracking-wide text-[#c084fc] mb-2">
                  Log in to resume your works
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  Enter your credentials to access your terminal &amp; projects.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="font-mono text-xl sm:text-2xl font-medium tracking-wide text-cyan-300 mb-2">
                  Create your 1Talent account
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  Join the Learn2Earn campus &amp; start the assessment.
                </p>
              </div>
            )}

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono flex items-start gap-2">
                <span className="text-red-400 font-bold">ERROR:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <span className="text-emerald-400 font-bold">SUCCESS:</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM (Mirrors 01Edu learn.reboot01.com) */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email or username field */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    Email or username
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="victor@1talent.local or victorejiki@gmail.com"
                    className="w-full bg-black/50 border-b-2 border-white/20 px-3 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:bg-black/70 transition-all font-mono text-sm"
                  />
                </div>

                {/* Password field with Show/Hide Eye Toggle */}
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/50 border-b-2 border-white/20 px-3 py-3 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:bg-black/70 transition-all font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-300 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link (Mirrors 01Edu) */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs font-mono text-gray-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password? <span className="underline">Click here!</span>
                  </button>
                </div>

                {/* LOGIN BUTTON (01Edu Purple / Neon Vibrant Action) */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-4 py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] hover:from-[#6d28d9] hover:to-[#4f46e5] text-white font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AUTHENTICATING...
                    </span>
                  ) : (
                    <span>LOGIN</span>
                  )}
                </button>

                {/* Bottom Register Switcher (Mirrors 01Edu: "New here? Join the fun! REGISTER NOW!") */}
                <div className="pt-6 text-center border-t border-white/[0.08]">
                  <p className="text-xs font-mono text-gray-400">
                    New here? Join the fun!{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg('');
                      }}
                      className="font-bold text-[#c084fc] hover:text-cyan-300 underline tracking-wider transition-colors ml-1"
                    >
                      REGISTER NOW!
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Victor Ejike"
                    className="w-full bg-black/50 border-b-2 border-white/20 px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="victor"
                      className="w-full bg-black/50 border-b-2 border-white/20 px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Campus
                    </label>
                    <select
                      value={regCampus}
                      onChange={(e) => setRegCampus(e.target.value)}
                      className="w-full bg-black/70 border-b-2 border-white/20 px-2 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                    >
                      <option value="learn2earn">Learn2Earn</option>
                      <option value="main">Global Campus</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-black/50 border-b-2 border-white/20 px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-black/50 border-b-2 border-white/20 px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-4 py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {regLoading ? 'CREATING ACCOUNT...' : 'START COGNITIVE TEST'}
                </button>

                <div className="pt-4 text-center border-t border-white/[0.08]">
                  <p className="text-xs font-mono text-gray-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="font-bold text-cyan-400 hover:text-cyan-300 underline tracking-wider transition-colors ml-1"
                    >
                      LOG IN HERE
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Quick Dev Credential Auto-Fill Strip */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-gray-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Dev Helper:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDevFill('student')}
                  className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleDevFill('admin')}
                  className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#091124] border border-cyan-500/30 p-6 space-y-4 font-mono shadow-2xl">
            <h3 className="text-lg font-bold text-cyan-300">Reset Password</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Enter your registered email address and we&apos;ll dispatch a secure recovery token to your inbox.
            </p>
            <input
              type="email"
              placeholder="you@1talent.local"
              className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-3 py-1.5 rounded text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Reset link sent to your registered email address.');
                  setForgotModalOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400"
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer Strip */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-gray-500">
        <div>
          <span>© {new Date().getFullYear()} 1Talent Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-gray-300 cursor-pointer">Security (ADR-001)</span>
          <span className="hover:text-gray-300 cursor-pointer">Piscine Guidelines</span>
          <Link to="/apply" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            Full Application Flow <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
