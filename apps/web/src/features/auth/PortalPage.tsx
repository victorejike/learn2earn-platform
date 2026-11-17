import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Eye, EyeOff } from 'lucide-react';
import techBgWide from '../../assets/tech-bg-wide.jpg';
import ElectronNetwork from '../../components/ElectronNetwork';

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

  // Login form states
  const [emailOrUsername, setEmailOrUsername] = useState('victorejiki@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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
      setErrorMsg(err instanceof Error ? err.message : 'Invalid credentials');
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
    <div className="relative min-h-screen w-full bg-[#030712] text-[#e2e8f0] font-mono selection:bg-[#0066ff] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* 
        ========================================================================
        PANORAMIC BLUE TECHNOLOGY BACKGROUND
        ========================================================================
      */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${techBgWide})`,
          filter: 'brightness(1.0) contrast(1.15)',
        }}
      />

      {/* 
        ========================================================================
        FULL-PAGE LIVING ELECTRON WEB (Lively, soft, ambient)
        ========================================================================
      */}
      <ElectronNetwork />

      {/* Smooth left-side dark gradient to ensure pure, crisp text legibility */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-r from-[#030712]/92 via-[#030712]/60 to-transparent" />

      {/* 
        ========================================================================
        TOP-LEFT: 1TALENT BRAND HEADER
        ========================================================================
      */}
      <header className="relative z-10 w-full px-8 sm:px-16 pt-8 pb-4">
        <div className="flex items-center gap-3 select-none">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            <span className="text-[#00d4ff]">1</span>talent
          </span>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN SECTION: BIG, BOLD & READABLE 2-COLUMN EXPERIENCE
        ========================================================================
      */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-8 sm:px-16 py-8 sm:py-14 flex flex-col lg:flex-row items-start justify-between gap-14 lg:gap-24">
        
        {/* LEFT COLUMN: BIG, BOLD & CONFIDENT TYPOGRAPHY */}
        <div className="w-full lg:w-7/12 flex flex-col justify-start">
          
          {/* Main Title - Big, Bold, locked on one line */}
          <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-bold tracking-tight text-white mb-8 whitespace-nowrap leading-none">
            Welcome to 1talent !
          </h1>

          {/* Platform Intro Paragraph */}
          <p className="font-mono text-gray-300 text-lg sm:text-xl lg:text-2xl leading-relaxed mb-10 max-w-2xl font-normal">
            1talent is our collaborative coding education platform.
          </p>

          {/* Onboarding Instructions */}
          <div className="space-y-6 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed">
            <p className="font-mono text-white font-semibold">
              New here? Here&apos;s what you need to do:
            </p>

            <div className="space-y-3.5 font-mono text-gray-200 pl-1">
              <p className="flex items-start gap-2">
                <span className="text-[#00d4ff] font-bold">1)</span>
                <span>Create an account, and log into the platform.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-[#00d4ff] font-bold">2)</span>
                <span>Complete the online cognitive test.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-[#00d4ff] font-bold">3)</span>
                <span>Wait to find out whether you&apos;ve made it to the next stage.</span>
              </p>
            </div>

            <p className="font-mono text-gray-400 text-base sm:text-lg pt-4 leading-relaxed">
              That&apos;s it! If you&apos;ve already created an account, sign in to complete your application or check for updates.
            </p>
          </div>

          {/* Contact link */}
          <div className="pt-10 text-sm sm:text-base font-mono text-gray-400">
            <span>Want to know more about us? </span>
            <span className="text-[#00d4ff] hover:underline cursor-pointer font-medium">Contact us</span>
          </div>
        </div>

        {/* RIGHT COLUMN: BIG, CLEAN, READABLE AUTH FORM */}
        <div className="w-full lg:w-5/12 max-w-lg">
          {mode === 'login' ? (
            <div className="pt-2">
              {/* Monospace Cyan Title */}
              <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-normal tracking-wide text-[#38bdf8] mb-8">
                Log in to resume your works
              </h2>

              {errorMsg && (
                <div className="mb-6 text-sm font-mono text-red-400 bg-black/70 border-l-4 border-red-500 px-4 py-3 rounded">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email or username */}
                <div>
                  <label className="block font-mono text-sm sm:text-base font-medium text-gray-300 mb-2">
                    Email or username
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="victorejiki@gmail.com"
                    className="w-full bg-[#0a1124]/90 border-b-2 border-slate-700 focus:border-[#00d4ff] px-4 py-3.5 text-base sm:text-lg text-white placeholder-gray-500 focus:outline-none transition-colors font-mono rounded-t"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block font-mono text-sm sm:text-base font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0a1124]/90 border-b-2 border-slate-700 focus:border-[#00d4ff] px-4 py-3.5 pr-12 text-base sm:text-lg text-white placeholder-gray-500 focus:outline-none transition-colors font-mono rounded-t"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00d4ff] transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Right-Aligned */}
                <div className="text-right pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="font-mono text-xs sm:text-sm text-gray-400 hover:text-[#00d4ff] transition-colors"
                  >
                    Forgot password? <span className="underline font-semibold">Click here!</span>
                  </button>
                </div>

                {/* LOGIN BUTTON (Bold, Confident, Electric Blue) */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-48 sm:w-52 py-3 px-8 rounded-md bg-[#0066ff] hover:bg-[#0052cc] text-white font-mono text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 text-center shadow-[0_0_25px_rgba(0,102,255,0.5)] hover:shadow-[0_0_35px_rgba(0,102,255,0.8)]"
                  >
                    {loginLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>
                </div>

                {/* Bottom Register Switcher */}
                <div className="text-right pt-6">
                  <p className="font-mono text-sm sm:text-base text-gray-400">
                    New here? Join the fun!{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg('');
                      }}
                      className="text-[#00d4ff] hover:text-white underline font-bold tracking-wider ml-1.5 transition-colors"
                    >
                      REGISTER NOW!
                    </button>
                  </p>
                </div>
              </form>
            </div>
          ) : (
            <div className="pt-2">
              {/* Register Mode */}
              <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-normal tracking-wide text-[#00d4ff] mb-8">
                Register to 1talent
              </h2>

              {errorMsg && (
                <div className="mb-6 text-sm font-mono text-red-400 bg-black/70 border-l-4 border-red-500 px-4 py-3 rounded">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block font-mono text-sm font-medium text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Victor Ejike"
                    className="w-full bg-[#0a1124]/90 border-b-2 border-slate-700 focus:border-[#00d4ff] px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none font-mono rounded-t"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-sm font-medium text-gray-300 mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="victor"
                      className="w-full bg-[#0a1124]/90 border-b-2 border-slate-700 focus:border-[#00d4ff] px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none font-mono rounded-t"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-sm font-medium text-gray-300 mb-1.5">
                      Campus
                    </label>
                    <div className="px-4 py-3 bg-[#0a1124]/90 border-b-2 border-slate-700 text-sm font-mono text-[#00d4ff] font-bold rounded-t">
                      Learn2Earn
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-sm font-medium text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="victorejiki@gmail.com"
                    className="w-full bg-[#0a1124]/90 border-b-2 border-slate-700 focus:border-[#00d4ff] px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none font-mono rounded-t"
                  />
                </div>

                <div>
                  <label className="block font-mono text-sm font-medium text-gray-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0a1124]/90 border-b-2 border-slate-700 focus:border-[#00d4ff] px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none font-mono rounded-t"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-56 py-3 px-8 rounded-md bg-[#0066ff] hover:bg-[#0052cc] text-white font-mono text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 text-center shadow-[0_0_25px_rgba(0,102,255,0.5)] hover:shadow-[0_0_35px_rgba(0,102,255,0.8)]"
                  >
                    {regLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                </div>

                <div className="text-right pt-5">
                  <p className="font-mono text-sm sm:text-base text-gray-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="text-[#00d4ff] hover:text-white underline font-bold tracking-wider ml-1.5 transition-colors"
                    >
                      LOGIN HERE
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Forgot Password Dialog */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#091124] border border-[#00d4ff]/40 rounded-xl p-8 space-y-5 font-mono shadow-2xl">
            <h3 className="text-xl font-bold text-white">Reset Password</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Enter your email address and we will dispatch a password recovery link to your inbox.
            </p>
            <input
              type="email"
              placeholder="victorejiki@gmail.com"
              className="w-full bg-[#030712] border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-[#00d4ff]"
            />
            <div className="flex justify-end gap-3 pt-3 text-sm">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Reset link sent to your registered email address.');
                  setForgotModalOpen(false);
                }}
                className="px-5 py-2 rounded-lg bg-[#0066ff] text-white font-bold hover:bg-[#0052cc] transition-colors shadow-lg"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discreet bottom footer */}
      <footer className="relative z-10 w-full px-8 sm:px-16 py-5 text-xs sm:text-sm font-mono text-[#64748b] flex justify-between items-center border-t border-white/[0.05]">
        <span>1talent</span>
        <span>Campus: Learn2Earn</span>
      </footer>
    </div>
  );
}
