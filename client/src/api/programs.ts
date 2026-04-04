import apiClient from './client';
import type { ProgramResponse, ProgramWithRelations, ProgramCreatePayload } from './types';

export async function getPrograms(skip = 0, limit = 100): Promise<ProgramResponse[]> {
    const { data } = await apiClient.get<ProgramResponse[]>('/program', {
        params: { skip, limit },
    });
    return data;
}

export async function getProgram(programId: number): Promise<ProgramWithRelations> {
    const { data } = await apiClient.get<ProgramWithRelations>(`/program/${programId}`);
    return data;
}

export async function createProgram(payload: ProgramCreatePayload): Promise<ProgramResponse> {
    const { data } = await apiClient.post<ProgramResponse>('/program', payload);
    return data;
}
