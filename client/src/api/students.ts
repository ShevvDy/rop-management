import apiClient from './client';
import type { StudentBase, StudentCreatePayload } from './types';

export async function createStudent(payload: StudentCreatePayload): Promise<StudentBase> {
    const { data } = await apiClient.post<StudentBase>('/student', payload);
    return data;
}

export async function deleteStudent(studentId: number): Promise<void> {
    await apiClient.delete(`/student/${studentId}`);
}
