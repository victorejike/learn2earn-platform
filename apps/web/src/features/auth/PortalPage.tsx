import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Eye, EyeOff } from 'lucide-react';
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
    <div className="relative min-h-screen w-full text-[#d1d5db] font-mono selection:bg-[#8b5cf6] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* 
        ========================================================================
        BLUE TECHNOLOGY BACKGROUND (Exact Image from User)
        ========================================================================
      */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${techBg})`,
          filter: 'brightness(0.95) contrast(1.15)',
        }}
      />
      {/* Soft left gradient so white text on left is crystal-clear while glowing blue tech on right shines through */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

      {/* 
        ========================================================================
        TOP-LEFT: 01 / 1T DOT-MATRIX LOGO
        ========================================================================
      */}
      <header className="relative z-10 w-full px-8 sm:px-16 pt-8 pb-4">
        <div className="flex items-center gap-2 select-none">
          <span className="font-mono text-2xl font-black tracking-wider text-white">
            01
          </span>
          <span className="text-gray-500 font-mono text-sm">/</span>
          <span className="font-mono text-base font-bold tracking-widest text-[#38bdf8]">
            1TALENT
          </span>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN SECTION: EXACT 01EDU 2-COLUMN STRUCTURE
        ========================================================================
      */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-8 sm:px-16 py-6 sm:py-10 flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-24">
        
        {/* LEFT COLUMN: EXACT 01EDU COPY & SPACING */}
        <div className="w-full lg:w-7/12 flex flex-col justify-start">
          {/* Main Title */}
          <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white mb-8">
            Welcome to 1Talent !
          </h1>

          {/* Description */}
          <p className="font-mono text-[#9ca3af] text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
            1Talent Platform is our collaborative coding education platform.
          </p>

          {/* 3 Steps */}
          <div className="space-y-4 max-w-xl text-sm sm:text-base">
            <p className="font-mono text-[#d1d5db]">
              New here? Here&apos;s what you need to do:
            </p>

            <div className="space-y-2 font-mono text-[#d1d5db]">
              <p>1) Create an account, and log into the platform.</p>
              <p>2) Complete the online cognitive test.</p>
              <p>3) Wait to find out whether you&apos;ve made it to the next stage.</p>
            </div>

            <p className="font-mono text-[#9ca3af] pt-4 leading-relaxed text-sm">
              That&apos;s it! If you&apos;ve already created an account, sign in to complete your application or check for updates.
            </p>
          </div>

          {/* Contact Link */}
          <div className="pt-8 text-xs font-mono text-[#9ca3af]">
            <span>Want to know more about us? </span>
            <span className="text-[#b895ff] hover:underline cursor-pointer">Contact us</span>
          </div>
        </div>

        {/* RIGHT COLUMN: EXACT 01EDU LOGIN FORM (NO CARD BOX) */}
        <div className="w-full lg:w-5/12 max-w-md">
          {mode === 'login' ? (
            <div>
              {/* Monospace Lavender Title */}
              <h2 className="font-mono text-2xl font-normal tracking-wide text-[#b895ff] mb-6">
                Log in to resume your works
              </h2>

              {errorMsg && (
                <div className="mb-4 text-xs font-mono text-red-400 bg-black/60 border-l-2 border-red-500 px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email or username */}
                <div>
                  <label className="block font-mono text-sm text-[#9ca3af] mb-1.5">
                    Email or username
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="victorejiki@gmail.com"
                    className="w-full bg-[#141824]/90 border-b border-[#334155] focus:border-[#b895ff] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors font-mono"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block font-mono text-sm text-[#9ca3af] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#141824]/90 border-b border-[#334155] focus:border-[#b895ff] px-3.5 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Right-Aligned */}
                <div className="text-right pt-0.5">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="font-mono text-xs text-[#9ca3af] hover:text-[#d1d5db] transition-colors"
                  >
                    Forgot password? <span className="underline">Click here!</span>
                  </button>
                </div>

                {/* LOGIN BUTTON (Right-Aligned Rectangular Purple Button like 01Edu) */}
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-44 py-2.5 px-6 rounded bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 text-center shadow-lg shadow-purple-500/20"
                  >
                    {loginLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>
                </div>

                {/* Bottom Register Switcher */}
                <div className="text-right pt-4">
                  <p className="font-mono text-xs text-[#9ca3af]">
                    New here? Join the fun!{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg('');
                      }}
                      className="text-[#b895ff] hover:text-white underline font-semibold ml-1 transition-colors"
                    >
                      REGISTER NOW!
                    </button>
                  </p>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {/* Register Mode */}
              <h2 className="font-mono text-2xl font-normal tracking-wide text-[#38bdf8] mb-6">
                Register to 1Talent
              </h2>

              {errorMsg && (
                <div className="mb-4 text-xs font-mono text-red-400 bg-black/60 border-l-2 border-red-500 px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[#9ca3af] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Victor Ejike"
                    className="w-full bg-[#141824]/90 border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-xs text-[#9ca3af] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="victor"
                      className="w-full bg-[#141824]/90 border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#9ca3af] mb-1">
                      Campus
                    </label>
                    <div className="px-3 py-2 bg-[#141824]/90 border-b border-[#334155] text-xs font-mono text-[#38bdf8]">
                      Learn2Earn
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#9ca3af] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="victorejiki@gmail.com"
                    className="w-full bg-[#141824]/90 border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#9ca3af] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#141824]/90 border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-48 py-2.5 px-6 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 text-center"
                  >
                    {regLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                </div>

                <div className="text-right pt-3">
                  <p className="font-mono text-xs text-[#9ca3af]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="text-[#38bdf8] hover:text-white underline font-semibold ml-1 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#12151f] border border-white/10 rounded-lg p-6 space-y-4 font-mono shadow-2xl">
            <h3 className="text-base font-medium text-white">Reset Password</h3>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              Enter your email address and we will dispatch a reset link.
            </p>
            <input
              type="email"
              placeholder="victorejiki@gmail.com"
              className="w-full bg-[#1b2030] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
            />
            <div className="flex justify-end gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-3 py-1.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Reset link sent to your registered email address.');
                  setForgotModalOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-[#8b5cf6] text-white font-medium hover:bg-[#7c3aed]"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discreet bottom footer matching 01Edu */}
      <footer className="relative z-10 w-full px-8 sm:px-16 py-4 text-xs font-mono text-[#6b7280] flex justify-between items-center">
        <span>1Talent Platform</span>
        <span>Campus: Learn2Earn</span>
      </footer>
    </div>
  );
}
