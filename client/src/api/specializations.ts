import apiClient from './client';
import type { Specialization } from './types';

export interface SpecializationCreatePayload {
    name: string;
    cohort_id: number;
}

export async function createSpecialization(payload: SpecializationCreatePayload): Promise<Specialization> {
    const { data } = await apiClient.post('/specialization', payload);
    return { specialization_id: data.specialization_id, name: data.name };
}

export async function deleteSpecialization(specId: number): Promise<void> {
    await apiClient.delete(`/specialization/${specId}`);
}
