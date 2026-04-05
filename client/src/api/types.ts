/* ═══════════════════════════════════════════
   API response types — mirrors backend schemas
   ═══════════════════════════════════════════ */

export interface FacultyBase {
    faculty_id: number;
    name: string;
    short_name: string | null;
}

export interface UserBase {
    user_id: number;
    name: string;
    surname: string;
    patronymic?: string | null;
    email?: string | null;
    phone?: string | null;
    isu_id?: number | null;
    avatar?: string | null;
}

/* ── Program ── */

export interface ProgramBase {
    program_id: number;
    name: string;
    accreditation_year: number;
    level: 'bachelor' | 'master' | 'phd';
    form: 'offline' | 'online' | 'combined';
    lang: 'ru' | 'en';
    duration_years: number;
}

export interface ProgramResponse extends ProgramBase {
    faculty: FacultyBase;
}

export interface CohortInProgram {
    cohort_id: number;
    cohort_year: number;
    director: UserBase | null;
    manager: UserBase | null;
}

export interface ProgramWithRelations extends ProgramResponse {
    cohorts: CohortInProgram[];
}

export interface ProgramCreatePayload {
    name: string;
    accreditation_year: number;
    level: 'bachelor' | 'master' | 'phd';
    form?: 'offline' | 'online' | 'combined';
    lang: 'ru' | 'en';
    duration_years: number;
    faculty_id: number;
}

/* ── Cohort ── */

export interface CohortBase {
    cohort_id: number;
    cohort_year: number;
}

export interface CohortResponse extends CohortBase {
    program: ProgramBase;
    director: UserBase | null;
    manager: UserBase | null;
}

export interface CohortCreatePayload {
    cohort_id?: number;
    cohort_year: number;
    program_id: number;
    director_id?: number | null;
    manager_id?: number | null;
}

/* ── Course ── */

export interface CourseBase {
    course_id: number;
    name: string;
    code: string;
    semester_number: number;
    credits: number;
    form: string;
    is_elective: boolean;
    syllabus_link?: string | null;
    rpd_link?: string | null;
    is_last?: boolean;
}

export interface EducationPlanEdge {
    source: number | string;
    target: number | string;
}

export interface EducationPlanGraph {
    nodes: CourseBase[];
    edges: EducationPlanEdge[];
}

export interface EducationPlanNodePayload {
    course_id?: number | null;
    name: string;
    code: string;
    semester_number: number;
    credits: number;
    form: string;
    is_elective: boolean;
    syllabus_link?: string | null;
    rpd_link?: string | null;
    is_last?: boolean;
}

export interface EducationPlanPayload {
    nodes: EducationPlanNodePayload[];
    edges: EducationPlanEdge[];
}

/* ── Faculty ── */

export interface FacultyResponse extends FacultyBase {
    programs: ProgramBase[];
}

export interface FacultyCreatePayload {
    name: string;
    short_name?: string | null;
}
