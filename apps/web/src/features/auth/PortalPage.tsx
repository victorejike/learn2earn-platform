import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="relative min-h-screen w-full bg-[#0d0f15] text-[#e2e4e9] font-mono selection:bg-[#7c3aed] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* 
        Background:
        Subtle, elegant blue technology network wallpaper anchored softly on the right.
        Darkened with sophisticated radial and linear gradients so it NEVER interferes with reading.
      */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-right sm:bg-[right_center] bg-no-repeat opacity-35"
          style={{
            backgroundImage: `url('/assets/tech-bg.jpg')`,
            filter: 'contrast(1.2) brightness(0.65)',
          }}
        />
        {/* Dark subtle overlay to blend tech wallpaper seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f15] via-[#0d0f15]/90 to-[#0d0f15]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f15]/60 via-transparent to-[#0d0f15]" />
      </div>

      {/* Top Left: Clean Monospace Dot-Matrix Logo (matching 01Edu's 01 placement) */}
      <header className="relative z-10 w-full px-8 sm:px-14 pt-8 pb-4">
        <div className="flex items-center gap-2 select-none">
          {/* Authentic 01Edu-style 01 / 1T pixel glyph */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] border border-white/10 rounded">
            <span className="font-mono text-xs font-bold tracking-widest text-[#94a3b8]">01</span>
            <span className="text-[10px] text-[#475569]">/</span>
            <span className="font-mono text-xs font-bold tracking-wider text-[#38bdf8]">1T</span>
          </div>
          <span className="font-mono text-sm tracking-widest text-[#94a3b8] font-medium">
            1TALENT
          </span>
        </div>
      </header>

      {/* Main 01Edu 2-Column Section (No Cards, Direct on Background) */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-8 sm:px-14 py-8 sm:py-12 flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-20">
        
        {/* LEFT COLUMN: 01Edu Authentic Content & Typography */}
        <div className="w-full lg:w-7/12 flex flex-col justify-start pt-4 lg:pt-8">
          {/* Welcome title matching 01Edu */}
          <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white mb-8">
            Welcome to 1Talent !
          </h1>

          {/* Description paragraph */}
          <p className="font-mono text-[#94a3b8] text-sm sm:text-base leading-relaxed mb-10 max-w-xl">
            1Talent Platform is our collaborative coding education platform.
          </p>

          {/* 3 Step Onboarding Instructions */}
          <div className="space-y-6 max-w-xl">
            <p className="font-mono text-sm text-[#cbd5e1]">
              New here? Here&apos;s what you need to do:
            </p>

            <div className="space-y-2.5 font-mono text-sm text-[#cbd5e1] pl-1">
              <p>1) Create an account, and log into the platform.</p>
              <p>2) Complete the online cognitive test.</p>
              <p>3) Wait to find out whether you&apos;ve made it to the next stage.</p>
            </div>

            <p className="font-mono text-sm text-[#94a3b8] pt-4 leading-relaxed">
              That&apos;s it! If you&apos;ve already created an account, sign in to complete your application or check for updates
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: 01Edu Authentic Login Form (NO CARD CONTAINER) */}
        <div className="w-full lg:w-5/12 max-w-md pt-4 lg:pt-8">
          {mode === 'login' ? (
            <div>
              {/* Header: Exact 01Edu lavender/purple monospace title */}
              <h2 className="font-mono text-2xl sm:text-[26px] font-normal tracking-wide text-[#b895ff] mb-6">
                Log in to resume your works
              </h2>

              {errorMsg && (
                <div className="mb-4 text-xs font-mono text-red-400 bg-red-950/30 border-l-2 border-red-500 px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email or username */}
                <div>
                  <label className="block font-mono text-sm text-[#94a3b8] mb-1.5">
                    Email or username
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="victorejiki@gmail.com"
                    className="w-full bg-[#161a23] border-b border-[#334155] focus:border-[#a855f7] px-3.5 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none transition-colors font-mono"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block font-mono text-sm text-[#94a3b8] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#161a23] border-b border-[#334155] focus:border-[#a855f7] px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[#475569] focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#cbd5e1] transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="text-right pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="font-mono text-xs text-[#94a3b8] hover:text-[#e2e4e9] transition-colors"
                  >
                    Forgot password? <span className="underline">Click here!</span>
                  </button>
                </div>

                {/* 01Edu Signature Purple Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 px-6 rounded bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-mono text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {loginLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>
                </div>

                {/* Bottom Register Prompt matching 01Edu */}
                <div className="text-right pt-4">
                  <p className="font-mono text-xs text-[#94a3b8]">
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
              <h2 className="font-mono text-2xl sm:text-[26px] font-normal tracking-wide text-[#38bdf8] mb-6">
                Register to 1Talent
              </h2>

              {errorMsg && (
                <div className="mb-4 text-xs font-mono text-red-400 bg-red-950/30 border-l-2 border-red-500 px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[#94a3b8] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Victor Ejike"
                    className="w-full bg-[#161a23] border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-xs text-[#94a3b8] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="victor"
                      className="w-full bg-[#161a23] border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#94a3b8] mb-1">
                      Campus
                    </label>
                    <div className="px-3 py-2 bg-[#161a23] border-b border-[#334155] text-xs text-[#38bdf8] font-mono">
                      Learn2Earn
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#94a3b8] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="victorejiki@gmail.com"
                    className="w-full bg-[#161a23] border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#94a3b8] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#161a23] border-b border-[#334155] focus:border-[#38bdf8] px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-2.5 px-6 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-mono text-sm font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {regLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                </div>

                <div className="text-right pt-3">
                  <p className="font-mono text-xs text-[#94a3b8]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#12151d] border border-white/10 rounded-lg p-6 space-y-4 font-mono">
            <h3 className="text-base font-medium text-white">Reset Password</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Enter your email address and we&apos;ll send instructions to reset your password.
            </p>
            <input
              type="email"
              placeholder="victorejiki@gmail.com"
              className="w-full bg-[#1a1f2c] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8b5cf6]"
            />
            <div className="flex justify-end gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-3 py-1.5 text-[#94a3b8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Reset link sent to your email.');
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

      {/* Discreet bottom footer */}
      <footer className="relative z-10 w-full px-8 sm:px-14 py-4 text-xs font-mono text-[#475569] flex justify-between items-center">
        <span>1Talent • Campus Learn2Earn</span>
        <span>Peer-to-Peer Engineering</span>
      </footer>
    </div>
  );
}
