/* ═══════════════════════════════════════════
   API response types — mirrors backend schemas
   ═══════════════════════════════════════════ */

export interface FacultyBase {
    faculty_id: number;
    name: string;
    short_name: string | null;
}

export interface TagBase {
    tag_id: number;
    name: string;
}

export interface UserBase {
    user_id: number;
    name: string;
    surname: string;
    patronymic?: string | null;
    email?: string | null;
    phone?: string | null;
    telegram?: string | null;
    isu_id?: number | null;
    avatar?: string | null;
    is_admin: boolean;
}

export interface UserResponse extends UserBase {
    tags: TagBase[];
}

export interface UserWithRelations extends UserResponse {
    student_data: StudentRecord[];
    teacher_data: TeacherRecord[];
    directed_cohorts: CohortWithProgram[];
    managed_cohorts: CohortWithProgram[];
}

export interface StudentRecord {
    student_id: number;
    start_date: string;
    end_date: string;
    status?: string | null;
    cohort: CohortWithProgram;
}

export interface TeacherRecord {
    teacher_id: number;
    start_date: string;
    end_date: string | null;
    position?: string | null;
}

export interface TeacherCreatePayload {
    user_id: number;
    faculty_id: number;
    start_date: string;
    end_date?: string | null;
}

export interface CohortWithProgram {
    cohort_id: number;
    cohort_year: number;
    program: ProgramBase;
}

export interface UserUpdatePayload {
    name?: string;
    surname?: string;
    patronymic?: string | null;
    is_admin?: boolean;
    email?: string | null;
    phone?: string | null;
    telegram?: string | null;
    isu_id?: number | null;
    avatar?: string | null;
    tags_ids?: number[];
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

/* ── Student ── */

export interface StudentBase {
    student_id: number;
    user: UserBase;
    specialization_id: number | null;
}

export interface Specialization {
    specialization_id: number;
    name: string;
}

export interface CohortStudentsResponse {
    students: StudentBase[];
    specializations: Specialization[];
}

export interface StudentUpdatePayload {
    student_id: number;
    specialization_id: number | null;
}

export interface StudentCreatePayload {
    user_id: number;
    cohort_id: number;
    start_date: string;
    end_date: string;
    specialization_id?: number | null;
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
    elective_students_ids?: number[];
    teachers_ids?: number[];
    specialization_id?: number | null;
    specialization_name?: string | null;
    tags_data?: TagBase[];
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
    elective_students_ids?: number[];
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
