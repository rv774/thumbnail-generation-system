'use client';

import { useAtom } from 'jotai';
import { authAtom } from '../atoms';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { socket } from '../lib/socket';

export function useAuth() {
    const [auth, setAuth] = useAtom(authAtom);
    const router = useRouter();

    const login = (token: string, user: any) => {
        localStorage.setItem('token', token);
        setAuth({ token, user });
        console.log('🔌 Connecting socket with token:', token?.slice(0, 10) + '...');
        socket.auth = { token };
        socket.connect();
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuth({ token: null, user: null });
        socket.disconnect();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !auth.token) {
            // ideally validate token key here or just let api fail later
            setAuth({ token, user: {} });
            socket.auth = { token };
            socket.connect();
        }
    }, []);

    return { auth, login, logout };
}
