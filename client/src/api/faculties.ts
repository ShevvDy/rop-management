import apiClient from './client';
import type { FacultyResponse, FacultyCreatePayload } from './types';

export async function getFaculties(skip = 0, limit = 100): Promise<FacultyResponse[]> {
    const { data } = await apiClient.get<FacultyResponse[]>('/faculty', {
        params: { skip, limit },
    });
    return data;
}

export async function createFaculty(payload: FacultyCreatePayload): Promise<FacultyResponse> {
    const { data } = await apiClient.post<FacultyResponse>('/faculty', payload);
    return data;
}
