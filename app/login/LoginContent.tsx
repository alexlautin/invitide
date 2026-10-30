'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { signIn, signInWithGitHub, isSupabaseConfigured } from '@/lib/data';
import { enableDemo } from '@/lib/demo/flag';
import Image from 'next/image';
import { useDemoMode } from '@/lib/demo/useDemoMode';

export default function LoginContent() {
    const router = useRouter();
    const demo = useDemoMode();
    // With no backend configured, the form is a showcase that signs in as the demo user.
    const showcase = !demo && !isSupabaseConfigured();
    const demoTip = demo ? 'Sign-in is disabled in demo mode' : undefined;
    const searchParams = useSearchParams();
    const verified = searchParams.get('verified');
    const [email, setEmail] = useState(isSupabaseConfigured() ? '' : 'demo.host@example.com');
    const [password, setPassword] = useState(isSupabaseConfigured() ? '' : 'demo-password');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (showcase) {
            enableDemo();
            router.push('/my-events');
            return;
        }

        const { error } = await signIn(email, password);

        if (error) {
            setError(error);
            return;
        }

        router.push('/');
    };

    const handleGitHubLogin = async () => {
        const { error } = await signInWithGitHub();

        if (error) {
            setError(error);
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

                {demo && (
                    <p className="mb-4 text-sm text-[#E4DDC4] border border-[#E4DDC4] rounded-md p-3">
                        Sign-in is off in demo mode. You&apos;re already signed in as the host.
                    </p>
                )}

                {showcase && (
                    <p className="mb-4 text-sm text-[#E4DDC4] border border-[#E4DDC4] rounded-md p-3">
                        Accounts are turned off for this portfolio version. Sign in as the demo user to try the full app.
                    </p>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-[#E4DDC4]">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            readOnly={showcase}
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
                            readOnly={showcase}
                            required
                            className="w-full px-3 py-2 border text-[#E4DDC4] border-gray-300 rounded-md bg-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#E4DDC4]"
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={demo}
                        title={demoTip}
                        className="w-full py-2 px-4 border border-[#E4DDC4] text-[#E4DDC4] rounded-md hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#E4DDC4]"
                    >
                        {showcase ? 'Sign in as demo user' : 'Log In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={handleGitHubLogin}
                        disabled={demo || showcase}
                        title={demo ? 'GitHub sign-in is disabled in demo mode' : showcase ? 'Accounts are turned off for this portfolio version' : undefined}
                        className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#E4DDC4] flex items-center justify-center gap-2 w-full py-2 px-4 border border-[#E4DDC4] text-[#E4DDC4] rounded-md hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
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

                {!demo && !showcase && (
                    <div className="mt-6">
                        <Link
                    href="/demo"
                    className="block w-full py-2 px-4 text-center bg-[#E4DDC4] text-[#1F1F1F] rounded-md border border-[#E4DDC4] hover:bg-transparent hover:text-[#E4DDC4] transition duration-300"
                >
                    Try the demo
                </Link>
                    </div>
                )}

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