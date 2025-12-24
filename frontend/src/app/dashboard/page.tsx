'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { filesAtom } from '@/atoms';
import { useAuth } from '@/hooks/useAuth';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
    const { auth, logout } = useAuth();
    const [files, setFiles] = useAtom(filesAtom);

    useEffect(() => {
        if (!auth.token) return;

        // Fetch initial files
        fetch('http://localhost:3001/upload', {
            headers: { Authorization: `Bearer ${auth.token}` }
        })
            .then(res => res.json())
            .then(data => setFiles(data))
            .catch(err => console.error(err));

        // Connect socket explicitly
        socket.connect();

        // Debug connection
        socket.on('connect', () => console.log('🟢 Socket connected:', socket.id));
        socket.on('connect_error', (err) => console.error('🔴 Socket connection error:', err));
        socket.on('disconnect', () => console.log('🟠 Socket disconnected'));

        // Listen for updates
        socket.on('file:update', (updatedFile: any) => {
            console.log('⚡ Received update:', updatedFile);
            setFiles(prev => {
                console.log('Current files:', prev.map(f => f._id));
                const target = prev.find(f => f._id === updatedFile.fileId);
                console.log('Scanning for match:', updatedFile.fileId, target ? 'FOUND' : 'NOT FOUND');

                return prev.map(f => f._id === updatedFile.fileId ? { ...f, ...updatedFile } : f);
            });
        });

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('disconnect');
            socket.off('file:update');
            socket.disconnect();
        };
    }, [auth.token]);

    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const res = await fetch('http://localhost:3001/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${auth.token}` },
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Upload failed: ${res.status} ${errorText}`);
            }

            const data = await res.json();
            // Add new queued files locally
            setFiles(prev => [...data.files, ...prev]);
        } catch (err: any) {
            console.error('Upload Error:', err);
            // Don't alert for network errors/timeouts as the server might still be processing
            if (err.message.includes('Failed to fetch')) {
                console.warn('Network timeout likely - server might still be processing large file.');
            } else {
                alert(`Upload failed: ${err.message}`);
            }
        } finally {
            setIsUploading(false);
        }
        // Reset input
        e.target.value = '';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'processing': return 'bg-yellow-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <Button variant="outline" onClick={logout}>Logout</Button>
            </div>

            <Card className="p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload New Files {isUploading && '(Uploading...)'}</h2>
                <Input type="file" multiple onChange={handleUpload} accept="image/*,video/*" disabled={isUploading} />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map(file => (
                    <Card key={file._id} className="p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <span className="font-medium truncate max-w-[200px]" title={file.originalFilename}>
                                {file.originalFilename}
                            </span>
                            <Badge className={getStatusColor(file.status)}>
                                {file.status}
                            </Badge>
                        </div>

                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {file.status === 'completed' && file.thumbnailPath ? (
                                <img
                                    src={`http://localhost:3001${file.thumbnailPath}?t=${new Date(file.updatedAt || Date.now()).getTime()}`}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-gray-400 capitalize">{file.status}...</span>
                            )}
                        </div>

                        {file.status === 'completed' && file.thumbnailPath && (
                            <div className="flex gap-2 w-full">
                                <Button asChild size="sm" variant="outline" className="flex-1">
                                    <a
                                        href={`http://localhost:3001${file.thumbnailPath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View
                                    </a>
                                </Button>
                                <Button asChild size="sm" className="flex-1">
                                    <a
                                        href={`http://localhost:3001${file.thumbnailPath}`}
                                        download={`thumb-${file.originalFilename}.png`}
                                    >
                                        Download
                                    </a>
                                </Button>
                            </div>
                        )}

                        {file.status === 'failed' && (
                            <p className="text-xs text-red-500">{file.error}</p>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
