import apiClient from './client';
import type { UserWithRelations, UserUpdatePayload, TagBase } from './types';

export async function getUsers(skip = 0, limit = 100): Promise<UserWithRelations[]> {
    const { data } = await apiClient.get<UserWithRelations[]>('/user', {
        params: { skip, limit },
    });
    return data;
}

export async function getUser(userId: number): Promise<UserWithRelations> {
    const { data } = await apiClient.get<UserWithRelations>(`/user/${userId}`);
    return data;
}

export async function updateUser(userId: number, payload: UserUpdatePayload): Promise<UserWithRelations> {
    const { data } = await apiClient.put<UserWithRelations>(`/user/${userId}`, payload);
    return data;
}

export async function deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/user/${userId}`);
}

export async function getTags(skip = 0, limit = 100): Promise<TagBase[]> {
    const { data } = await apiClient.get<TagBase[]>('/tag', {
        params: { skip, limit },
    });
    return data;
}
