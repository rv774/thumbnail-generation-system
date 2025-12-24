'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = isLogin ? '/auth/login' : '/auth/signup';

        try {
            const res = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error connecting to server');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{isLogin ? 'Login' : 'Sign Up'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full">
                            {isLogin ? 'Login' : 'Sign Up'}
                        </Button>
                        <p
                            className="text-sm text-center text-blue-500 cursor-pointer"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
