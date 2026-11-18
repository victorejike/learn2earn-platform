import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { ChevronDown, Home } from 'lucide-react';
import { Reboot01Logo, RebootRobotAvatar } from '../../components/RebootAssets';

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

  // Restore saved candidate profile if previously entered
  const savedProfile = (() => {
    try {
      const raw = localStorage.getItem('talent_applicant_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const fullName =
    data?.me?.fullName ??
    (savedProfile?.lastName ? `${savedProfile?.firstName} ${savedProfile?.lastName}` : 'Victor Ejike');
  const nameParts = fullName.trim().split(' ');
  const defaultFirst = savedProfile?.firstName || nameParts[0] || 'Victor';
  const defaultLast = savedProfile?.lastName || nameParts.slice(1).join(' ') || 'Ejike';
  const username = data?.me?.username || 'evictor';
  const auditRatio = data?.me?.auditRatio ?? 1.0;

  // Form states matching 01Edu screenshot
  const [lastName, setLastName] = useState(defaultLast);
  const [firstName, setFirstName] = useState(defaultFirst);
  const [phoneNumber, setPhoneNumber] = useState(savedProfile?.phoneNumber || '16160101');
  const [cprNumber, setCprNumber] = useState(savedProfile?.cprNumber || '');
  const [gender, setGender] = useState(savedProfile?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(savedProfile?.dateOfBirth || '2002-05-14');
  const [city, setCity] = useState(savedProfile?.city || 'Manama');
  const [country, setCountry] = useState(savedProfile?.country || 'Bahrain');
  const [education, setEducation] = useState(savedProfile?.education || 'bachelor');
  const [codingExperience, setCodingExperience] = useState(savedProfile?.codingExperience || 'beginner');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
    <div className="min-h-screen w-full bg-[#1e1e21] text-[#e5e7eb] font-mono flex flex-col selection:bg-[#9065ff] selection:text-white">
      {/* 
        ========================================================================
        01Edu-IDENTICAL INTRA NAVIGATION BAR
        ========================================================================
      */}
      <header className="w-full border-b border-[#29292e] bg-[#141416] px-6 sm:px-12 py-3 flex items-center justify-between sticky top-0 z-40">
        {/* Left: 9-dots + 01 Logo / 1Talent + DASHBOARD link */}
        <div className="flex items-center gap-6 select-none">
          {/* 9-dot grid launcher */}
          <div className="grid grid-cols-3 gap-1 w-3.5 h-3.5 cursor-pointer opacity-85 hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
            <div className="w-1 h-1 bg-white rounded-[0.5px]" />
          </div>

          {/* Authentic Dot-Matrix Block Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Reboot01Logo className="w-7 h-6 text-white" />
            <span className="font-mono text-xl font-bold tracking-tight text-white">
              1Talent
            </span>
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

        {/* Right: Yellow Ratio Badge + #username + 01Edu Robot Avatar */}
        <div className="flex items-center gap-4 select-none">
          {/* Yellow Ratio Badge [ ● 1.0 ] */}
          <div className="border border-yellow-400/90 bg-transparent px-2.5 py-0.5 rounded-[2px] text-yellow-400 font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_8px_rgba(250,204,21,0.2)]">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>{auditRatio.toFixed(1)}</span>
          </div>

          {/* Student Handle */}
          <span className="font-mono text-sm text-gray-200 font-medium">
            #{username}
          </span>

          {/* Authentic 01Edu Pixel Robot Avatar */}
          <div className="cursor-pointer hover:scale-105 transition-transform">
            <RebootRobotAvatar className="w-9 h-9" />
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN BODY: "Tell us more about you"
        Layout: Left-aligned with ~110px padding, 430px wide inputs,
        matching learn.reboot01.com/intra/bahrain down to the exact pixel.
        ========================================================================
      */}
      <main className="flex-1 w-full px-6 sm:px-12 md:pl-28 py-10 sm:py-14">
        {/* Large Monospace Heading */}
        <h1 className="font-mono text-4xl sm:text-5xl font-normal text-white tracking-wide mb-10 sm:mb-14">
          Tell us more about you
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-[430px]">
          {/* 
            Field 1: Last Name (Ejike)
            No label above, red asterisk floating at right end of the line
          */}
          <div className="relative pt-2">
            <span className="absolute right-0 top-1 text-red-500 font-mono text-sm select-none">*</span>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-150 font-mono"
            />
          </div>

          {/* 
            Field 2: First Name (Victor)
            No label above, red asterisk floating at right end of the line
          */}
          <div className="relative pt-2">
            <span className="absolute right-0 top-1 text-red-500 font-mono text-sm select-none">*</span>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-150 font-mono"
            />
          </div>

          {/* 
            Field 3: Phone Number
            Label with red asterisk above value (16160101)
          */}
          <div className="relative pt-3">
            <label className="block font-mono text-xs text-gray-400 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="16160101"
              className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-150 font-mono"
            />
          </div>

          {/* 
            Field 4: CPR Number / National ID
            Label with red asterisk above input
          */}
          <div className="relative pt-3">
            <label className="block font-mono text-xs text-gray-400 mb-1">
              CPR Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={cprNumber}
              onChange={(e) => setCprNumber(e.target.value)}
              placeholder=""
              className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-150 font-mono"
            />
          </div>

          {/* 
            Field 5: Gender Selector Box
            Compact rectangle box (~175px wide) with red asterisk floating to its right
          */}
          <div className="relative pt-4">
            <div className="relative inline-block w-[175px]">
              <span className="absolute -right-3.5 top-0 text-red-500 font-mono text-sm select-none">*</span>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full appearance-none bg-transparent border border-[#52525b] focus:border-[#9065ff] px-3 py-2 text-xs text-white focus:outline-none font-mono cursor-pointer rounded-[1px] hover:border-gray-400 transition-colors"
              >
                <option value="" disabled className="bg-[#141416] text-gray-400">
                  Select your gender
                </option>
                <option value="male" className="bg-[#141416] text-white">
                  Male
                </option>
                <option value="female" className="bg-[#141416] text-white">
                  Female
                </option>
                <option value="other" className="bg-[#141416] text-white">
                  Other / Prefer not to say
                </option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="relative pt-3">
            <label className="block font-mono text-xs text-gray-400 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white focus:outline-none transition-all duration-150 font-mono"
            />
          </div>

          {/* City / Country */}
          <div className="grid grid-cols-2 gap-6 pt-3">
            <div className="relative">
              <label className="block font-mono text-xs text-gray-400 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Manama"
                className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-150 font-mono"
              />
            </div>

            <div className="relative">
              <label className="block font-mono text-xs text-gray-400 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Bahrain"
                className="w-full bg-transparent focus:bg-[#282c3c]/70 border-0 border-b border-[#4b5563] focus:border-[#9065ff] px-1 pb-2 pt-1 text-base text-white placeholder-gray-500 focus:outline-none transition-all duration-150 font-mono"
              />
            </div>
          </div>

          {/* Education & Experience */}
          <div className="grid grid-cols-2 gap-6 pt-3">
            <div className="relative">
              <label className="block font-mono text-xs text-gray-400 mb-1">
                Highest Education <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-[#52525b] focus:border-[#9065ff] px-3 py-2 text-xs text-white focus:outline-none font-mono cursor-pointer rounded-[1px] hover:border-gray-400 transition-colors"
                >
                  <option value="" disabled className="bg-[#141416] text-gray-400">
                    Select education
                  </option>
                  <option value="high_school" className="bg-[#141416] text-white">
                    High School
                  </option>
                  <option value="bachelor" className="bg-[#141416] text-white">
                    Bachelor&apos;s Degree
                  </option>
                  <option value="master" className="bg-[#141416] text-white">
                    Master&apos;s Degree
                  </option>
                  <option value="self_taught" className="bg-[#141416] text-white">
                    Self-taught / Other
                  </option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <label className="block font-mono text-xs text-gray-400 mb-1">
                Coding Experience <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={codingExperience}
                  onChange={(e) => setCodingExperience(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-[#52525b] focus:border-[#9065ff] px-3 py-2 text-xs text-white focus:outline-none font-mono cursor-pointer rounded-[1px] hover:border-gray-400 transition-colors"
                >
                  <option value="" disabled className="bg-[#141416] text-gray-400">
                    Select experience
                  </option>
                  <option value="none" className="bg-[#141416] text-white">
                    None
                  </option>
                  <option value="beginner" className="bg-[#141416] text-white">
                    Beginner
                  </option>
                  <option value="intermediate" className="bg-[#141416] text-white">
                    Intermediate
                  </option>
                  <option value="advanced" className="bg-[#141416] text-white">
                    Advanced
                  </option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Submit Button (Authentic 01Edu Purple) */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-36 py-2 px-6 rounded-[2px] bg-[#9065ff] hover:bg-[#7c3aed] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 disabled:opacity-50 text-center shadow-[0_0_15px_rgba(144,101,255,0.35)] hover:shadow-[0_0_20px_rgba(144,101,255,0.5)]"
            >
              {submitting ? 'SAVING...' : 'CONTINUE'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
