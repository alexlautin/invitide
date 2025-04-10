'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const verified = searchParams.get('verified');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            return;
        }

        if (data?.user?.id) {
            const userId = data.user.id;

            // Check if profile exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (!existingProfile) {
                const displayName = data.user.user_metadata?.display_name || 'Anonymous';
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: userId,
                        display_name: displayName,
                    },
                ]);

                if (profileError) {
                    console.error('Failed to create profile:', profileError.message);
                }
            }

            router.push('/');
        }
    };

    const handleGitHubLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
        });

        if (error) {
            setError(error.message);
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center p-8 text-gray-900 bg-[#1F1F1F] font-mono">
            <Link href="/" className="absolute top-4 left-4 text-[#E4DDC4] hover:underline text-2xl">
                ← Back
            </Link>

            <div className="border-[#E4DDC4] border-[5px] p-8 rounded-lg shadow-md w-full max-w-md bg-[#1F1F1F]">
                <h1 className="text-2xl text-[#E4DDC4] font-semibold mb-6">Login</h1>

                {verified === 'true' && (
                    <p className="mb-4 text-green-500 font-medium text-center">
                        Email verified! You can now log in.
                    </p>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md bg-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#E4DDC4]"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md bg-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#E4DDC4]"
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-[#E4DDC4] text-[#E4DDC4] rounded-md hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                    >
                        Log In
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={handleGitHubLogin}
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-[#E4DDC4] text-[#E4DDC4] rounded-md hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                    >
                        <Image
                            src="/github_logo.png"
                            alt="GitHub Logo"
                            width={18}
                            height={18}
                            className="self-center brightness-0 saturate-100 invert sepia hue-rotate-[325deg] contrast-125"
                        />
                        Sign in with GitHub
                    </button>
                </div>

                <div className="mt-6 text-center text-[#E4DDC4]">
                    <span>Don&apos;t have an account? </span>
                    <Link href="/signup" className="underline hover:text-white">
                        Sign Up
                    </Link>
                </div>
            </div>
        </main>
    );
}