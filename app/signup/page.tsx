'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    let userId = signUpData.user?.id;

    if (!userId) {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id;
    }

    if (!userId) {
      setError('Signup succeeded, but could not retrieve user ID.');
      return;
    }

    console.log('Inserting profile with userId:', userId, 'and displayName:', username);
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        display_name: username,
      },
    ]);

    if (profileError) {
      setError('Signup succeeded, but profile creation failed.');
      console.error('Profile insert error:', profileError.message);
      return;
    }

    console.log('Profile insert succeeded.');
    router.push('/login');
  };

  const handleGitHubSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-8 text-gray-900">
      <Link href="/" className="absolute top-4 left-4 text-[#E4DDC4] hover:underline text-2xl">
        Back
      </Link>
      <div className="border-[#E4DDC4] border-[5px] p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl text-[#E4DDC4] font-semibold mb-6">Sign Up</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Display Name</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 accent-[#E4DDC4] cursor-pointer"
            />
            <label
              htmlFor="showPassword"
              className="text-sm text-[#E4DDC4] cursor-pointer hover:text-white transition-colors duration-200"
            >
              Show Password
            </label>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-[#E4DDC4] text-[#E4DDC4] rounded-md hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
          >
            Register
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleGitHubSignup}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-[#E4DDC4] text-[#E4DDC4] rounded-md hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
          >
            <Image
              src="/github_logo.png"
              alt="GitHub Logo"
              width={18}
              height={18}
              className="self-center brightness-0 saturate-100 invert sepia hue-rotate-[325deg] contrast-125"
            />
            Sign up with GitHub
          </button>
        </div>
      </div>
    </main>
  );
}