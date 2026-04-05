import apiClient from './client';
import type { CohortResponse, CohortCreatePayload, EducationPlanGraph, EducationPlanPayload } from './types';

export async function getCohorts(skip = 0, limit = 100): Promise<CohortResponse[]> {
    const { data } = await apiClient.get<CohortResponse[]>('/cohort', {
        params: { skip, limit },
    });
    return data;
}

export async function getCohort(cohortId: number): Promise<CohortResponse> {
    const { data } = await apiClient.get<CohortResponse>(`/cohort/${cohortId}`);
    return data;
}

export async function createCohort(payload: CohortCreatePayload): Promise<CohortResponse> {
    // Backend schema requires cohort_id but create_node() auto-generates it
    const { data } = await apiClient.post<CohortResponse>('/cohort', { cohort_id: 0, ...payload });
    return data;
}

export async function getCohortGraph(cohortId: number): Promise<EducationPlanGraph> {
    const { data } = await apiClient.get<EducationPlanGraph>(`/cohort/${cohortId}/graph`);
    return data;
}

export async function updateCohortGraph(cohortId: number, payload: EducationPlanPayload): Promise<EducationPlanGraph> {
    const { data } = await apiClient.put<EducationPlanGraph>(`/cohort/${cohortId}/graph`, payload);
    return data;
}
