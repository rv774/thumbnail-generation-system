import { atom } from 'jotai';

export interface FileItem {
    _id: string;
    originalFilename: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    thumbnailPath?: string;
    error?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const filesAtom = atom<FileItem[]>([]);
export const authAtom = atom<{ token: string | null; user: any | null }>({
    token: null,
    user: null,
});
