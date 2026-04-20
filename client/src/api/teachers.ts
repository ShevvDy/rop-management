import apiClient from './client';
import type { TeacherCreatePayload } from './types';

export async function createTeacher(payload: TeacherCreatePayload) {
    const { data } = await apiClient.post('/teacher', payload);
    return data;
}

export async function deleteTeacher(teacherId: number): Promise<void> {
    await apiClient.delete(`/teacher/${teacherId}`);
}
