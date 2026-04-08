import apiClient from './client';
import type { CourseBase } from './types';

export interface CourseUpdatePayload {
    name?: string;
    code?: string;
    semester_number?: number;
    credits?: number;
    form?: string;
    is_elective?: boolean;
    syllabus_link?: string | null;
    rpd_link?: string | null;
    is_last?: boolean;
}

export async function updateCourse(courseId: number, payload: CourseUpdatePayload): Promise<CourseBase> {
    const { data } = await apiClient.put<CourseBase>(`/course/${courseId}`, payload);
    return data;
}
