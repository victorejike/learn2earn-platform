import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { Bot, ChevronDown, Home } from 'lucide-react';

const ME_QUERY = gql`
  query IntraProfileMe {
    me {
      id
      username
      fullName
      role
      status
      auditRatio
    }
  }
`;

export default function IntraProfilePage() {
  const navigate = useNavigate();
  const { data } = useQuery(ME_QUERY);

  // Parse fullName into firstName and lastName if available
  const fullName = data?.me?.fullName ?? 'Victor Ejike';
  const nameParts = fullName.trim().split(' ');
  const defaultFirst = nameParts[0] || 'Victor';
  const defaultLast = nameParts.slice(1).join(' ') || 'Ejike';
  const username = data?.me?.username || 'evictor';
  const auditRatio = data?.me?.auditRatio ?? 1.0;

  // Form states matching 01Edu screenshot
  const [lastName, setLastName] = useState(defaultLast);
  const [firstName, setFirstName] = useState(defaultFirst);
  const [phoneNumber, setPhoneNumber] = useState('16160101');
  const [cprNumber, setCprNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2002-05-14');
  const [city, setCity] = useState('Manama');
  const [country, setCountry] = useState('Bahrain');
  const [education, setEducation] = useState('bachelor');
  const [codingExperience, setCodingExperience] = useState('beginner');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Save locally and proceed smoothly to cognitive games
    localStorage.setItem(
      'talent_applicant_profile',
      JSON.stringify({
        firstName,
        lastName,
        phoneNumber,
        cprNumber,
        gender,
        dateOfBirth,
        city,
        country,
        education,
        codingExperience,
      })
    );

    setTimeout(() => {
      setSubmitting(false);
      navigate('/assessment');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-[#d1d5db] font-mono flex flex-col selection:bg-[#0066ff] selection:text-white">
      {/* 
        ========================================================================
        01Edu-IDENTICAL INTRA NAVIGATION BAR
        ========================================================================
      */}
      <header className="w-full border-b border-[#1f2937] bg-[#030712]/95 backdrop-blur px-6 sm:px-12 py-3.5 flex items-center justify-between sticky top-0 z-40">
        {/* Left: 9-dots + 1Talent logo + DASHBOARD link */}
        <div className="flex items-center gap-6 select-none">
          {/* 9-dot grid icon */}
          <div className="grid grid-cols-3 gap-1 w-4 h-4 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
            <div className="w-1 h-1 bg-white rounded-[1px]" />
          </div>

          {/* 1Talent Brand Wordmark */}
          <Link to="/" className="font-mono text-2xl font-bold tracking-tight text-white hover:opacity-90">
            <span className="text-[#00d4ff]">1</span>Talent
          </Link>

          {/* DASHBOARD Link */}
          <Link
            to="/dashboard"
            className="hidden sm:flex items-center gap-2 text-xs font-mono font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors ml-2"
          >
            <Home className="w-3.5 h-3.5 text-gray-400" />
            <span>DASHBOARD</span>
          </Link>
        </div>

        {/* Right: Yellow Ratio Badge + #username + Avatar */}
        <div className="flex items-center gap-4 select-none">
          {/* Yellow Ratio Badge (● 1.0) */}
          <div className="border border-yellow-400/80 bg-yellow-400/10 px-3 py-1 rounded-[2px] text-yellow-400 font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>{auditRatio.toFixed(1)}</span>
          </div>

          {/* Student Handle */}
          <span className="font-mono text-sm text-gray-300 font-medium">
            #{username}
          </span>

          {/* Robot Avatar */}
          <div className="w-9 h-9 rounded-full border border-purple-400/70 bg-purple-500/15 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Bot className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: "Tell us more about you"
        ========================================================================
      */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 sm:px-12 py-10 sm:py-16">
        <h1 className="font-mono text-4xl sm:text-5xl font-normal text-white tracking-wide mb-12 sm:mb-16">
          Tell us more about you
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          {/* Last Name */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-xs text-gray-400">Last Name</label>
              <span className="text-red-500 font-mono text-xs">*</span>
            </div>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ejike"
              className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
            />
          </div>

          {/* First Name */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-xs text-gray-400">First Name</label>
              <span className="text-red-500 font-mono text-xs">*</span>
            </div>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Victor"
              className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
            />
          </div>

          {/* Phone Number */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-xs text-gray-400">Phone Number</label>
              <span className="text-red-500 font-mono text-xs">*</span>
            </div>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="16160101"
              className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
            />
          </div>

          {/* CPR Number */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-xs text-gray-400">CPR Number / National ID</label>
              <span className="text-red-500 font-mono text-xs">*</span>
            </div>
            <input
              type="text"
              required
              value={cprNumber}
              onChange={(e) => setCprNumber(e.target.value)}
              placeholder="987654321"
              className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
            />
          </div>

          {/* Gender Selector Box */}
          <div className="relative pt-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-mono text-xs text-gray-400">Gender</span>
              <span className="text-red-500 font-mono text-xs">*</span>
            </div>
            <div className="relative">
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full appearance-none bg-transparent border border-gray-600 focus:border-[#00d4ff] px-4 py-3 text-sm text-white focus:outline-none font-mono cursor-pointer rounded-[1px] hover:border-gray-500 transition-colors"
              >
                <option value="" disabled className="bg-[#091124] text-gray-400">
                  Select your gender
                </option>
                <option value="male" className="bg-[#091124] text-white">
                  Male
                </option>
                <option value="female" className="bg-[#091124] text-white">
                  Female
                </option>
                <option value="other" className="bg-[#091124] text-white">
                  Other / Prefer not to say
                </option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-xs text-gray-400">Date of Birth</label>
              <span className="text-red-500 font-mono text-xs">*</span>
            </div>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
            />
          </div>

          {/* City / Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="font-mono text-xs text-gray-400">City</label>
                <span className="text-red-500 font-mono text-xs">*</span>
              </div>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Manama"
                className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="font-mono text-xs text-gray-400">Country</label>
                <span className="text-red-500 font-mono text-xs">*</span>
              </div>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Bahrain"
                className="w-full bg-transparent focus:bg-[#131d36]/75 border-0 border-b border-gray-600 focus:border-[#00d4ff] px-2.5 pb-2 pt-2 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-200 font-mono rounded-t-sm"
              />
            </div>
          </div>

          {/* Education & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-xs text-gray-400">Highest Education</span>
                <span className="text-red-500 font-mono text-xs">*</span>
              </div>
              <div className="relative">
                <select
                  required
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-gray-600 focus:border-[#00d4ff] px-4 py-3 text-sm text-white focus:outline-none font-mono cursor-pointer rounded-[1px] hover:border-gray-500 transition-colors"
                >
                  <option value="" disabled className="bg-[#091124] text-gray-400">
                    Select education
                  </option>
                  <option value="high_school" className="bg-[#091124] text-white">
                    High School
                  </option>
                  <option value="bachelor" className="bg-[#091124] text-white">
                    Bachelor&apos;s Degree
                  </option>
                  <option value="master" className="bg-[#091124] text-white">
                    Master&apos;s Degree or higher
                  </option>
                  <option value="self_taught" className="bg-[#091124] text-white">
                    Self-taught / Other
                  </option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-xs text-gray-400">Coding Experience</span>
                <span className="text-red-500 font-mono text-xs">*</span>
              </div>
              <div className="relative">
                <select
                  required
                  value={codingExperience}
                  onChange={(e) => setCodingExperience(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-gray-600 focus:border-[#00d4ff] px-4 py-3 text-sm text-white focus:outline-none font-mono cursor-pointer rounded-[1px] hover:border-gray-500 transition-colors"
                >
                  <option value="" disabled className="bg-[#091124] text-gray-400">
                    Select experience
                  </option>
                  <option value="none" className="bg-[#091124] text-white">
                    No prior coding experience
                  </option>
                  <option value="beginner" className="bg-[#091124] text-white">
                    Beginner (basics of HTML/JS/Python)
                  </option>
                  <option value="intermediate" className="bg-[#091124] text-white">
                    Intermediate (built personal projects)
                  </option>
                  <option value="advanced" className="bg-[#091124] text-white">
                    Advanced (professional / extensive)
                  </option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Submit Button (Electric Blue) */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-52 py-3 px-8 rounded bg-[#0066ff] hover:bg-[#0052cc] text-white font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 text-center shadow-[0_0_20px_rgba(0,102,255,0.45)] hover:shadow-[0_0_25px_rgba(0,102,255,0.7)]"
            >
              {submitting ? 'SAVING...' : 'CONTINUE'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
