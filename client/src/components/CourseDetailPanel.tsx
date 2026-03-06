import React, { useState, useEffect } from 'react';

interface Material {
    name: string;
    size: string;
    date: string;
    type: 'pdf' | 'pptx' | 'code';
}

interface Teacher {
    name: string;
    role: string;
    avatar: string;
}

interface CourseDetail {
    id: string;
    code: string;
    name: string;
    semester: string;
    type: 'required' | 'elective' | 'core';
    credits: number;
    summary: string;
    students: { avatars: string[]; total: number };
    teachers: Teacher[];
    materials: Material[];
}

interface CourseDetailPanelProps {
    course: CourseDetail | null;
    onClose: () => void;
    onSave?: (updated: CourseDetail) => void;
}

const typeLabels: Record<string, { label: string; bg: string; color: string }> = {
    required: { label: 'ОБЯЗАТЕЛЬНО', bg: '#135BEC', color: '#fff' },
    elective: { label: 'ПО ВЫБОРУ', bg: '#F59E0B', color: '#fff' },
    core: { label: 'БАЗОВЫЙ', bg: '#F1F5F9', color: '#64748B' },
};

const materialIcons: Record<string, React.ReactNode> = {
    pdf: (
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#EF4444" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#EF4444" strokeWidth="1.3" /></svg>
        </div>
    ),
    pptx: (
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 1.5H4.5a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-9l-4.5-4.5z" stroke="#3B82F6" strokeWidth="1.3" /><path d="M10.5 1.5V6h4.5" stroke="#3B82F6" strokeWidth="1.3" /></svg>
        </div>
    ),
    code: (
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.75 5.25L3 9l3.75 3.75M11.25 5.25L15 9l-3.75 3.75" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
    ),
};

/* ── Edit Modal ── */
interface EditForm {
    name: string;
    code: string;
    semester: string;
    type: 'required' | 'elective' | 'core';
    credits: number;
    summary: string;
}

interface CourseEditModalProps {
    course: CourseDetail;
    onClose: () => void;
    onSave: (form: EditForm) => void;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({ course, onClose, onSave }) => {
    const [form, setForm] = useState<EditForm>({
        name: course.name,
        code: course.code,
        semester: course.semester,
        type: course.type,
        credits: course.credits,
        summary: course.summary,
    });

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="edit-modal-backdrop" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h3 className="edit-modal-title">Редактировать дисциплину</h3>
                    <button className="edit-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <form className="edit-modal-body" onSubmit={handleSubmit}>
                    <div className="edit-modal-row">
                        <div className="edit-modal-field edit-modal-field--grow">
                            <label className="edit-modal-label">Название дисциплины</label>
                            <input
                                className="edit-modal-input"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Название"
                                required
                            />
                        </div>
                        <div className="edit-modal-field edit-modal-field--short">
                            <label className="edit-modal-label">Код</label>
                            <input
                                className="edit-modal-input"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                placeholder="CS-101"
                                required
                            />
                        </div>
                    </div>

                    <div className="edit-modal-row">
                        <div className="edit-modal-field edit-modal-field--grow">
                            <label className="edit-modal-label">Семестр</label>
                            <input
                                className="edit-modal-input"
                                value={form.semester}
                                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                placeholder="Осенний семестр"
                            />
                        </div>
                        <div className="edit-modal-field edit-modal-field--medium">
                            <label className="edit-modal-label">Тип</label>
                            <div className="edit-modal-select-wrapper">
                                <select
                                    className="edit-modal-select"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as EditForm['type'] })}
                                >
                                    <option value="required">Обязательно</option>
                                    <option value="elective">По выбору</option>
                                    <option value="core">Базовый</option>
                                </select>
                                <svg className="edit-modal-select-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="edit-modal-field edit-modal-field--short">
                            <label className="edit-modal-label">Кредиты</label>
                            <input
                                className="edit-modal-input"
                                type="number"
                                min={1}
                                max={12}
                                value={form.credits}
                                onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="edit-modal-field">
                        <label className="edit-modal-label">Описание</label>
                        <textarea
                            className="edit-modal-textarea"
                            value={form.summary}
                            onChange={(e) => setForm({ ...form, summary: e.target.value })}
                            placeholder="Краткое описание дисциплины..."
                            rows={4}
                        />
                    </div>

                    <div className="edit-modal-footer">
                        <button type="button" className="edit-modal-btn-cancel" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="edit-modal-btn-save">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.333 2H4L2 4v9.333C2 13.7 2.3 14 2.667 14h10.666c.368 0 .667-.3.667-.667V2.667C14 2.3 13.7 2 13.333 2z" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M5.333 2v4h5.334V2M4.667 14V9.333h6.666V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Detail Panel ── */
const CourseDetailPanel: React.FC<CourseDetailPanelProps> = ({ course, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (!course) return null;

    const typeInfo = typeLabels[course.type] || typeLabels.core;

    const handleSave = (form: EditForm) => {
        onSave?.({ ...course, ...form });
        setIsEditing(false);
    };

    return (
        <>
            <div className="detail-panel-overlay" onClick={onClose}>
                <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
                    {/* Close button */}
                    <button className="detail-panel-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="detail-panel-header">
                        <div className="detail-panel-badges">
                            <span
                                className="detail-badge"
                                style={{ background: typeInfo.bg, color: typeInfo.color }}
                            >
                                {typeInfo.label}
                            </span>
                            <span className="detail-badge detail-badge-outline">
                                {course.credits} КРЕДИТА
                            </span>
                        </div>
                        <h2 className="detail-panel-title">{course.name}</h2>
                        <p className="detail-panel-subtitle">
                            {course.code} • {course.semester}
                        </p>
                        <div className="detail-panel-actions">
                            <button className="detail-edit-btn" onClick={() => setIsEditing(true)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1 1-3.667 9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Редактировать
                            </button>
                            <button className="detail-more-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="4" r="1" fill="currentColor" />
                                    <circle cx="8" cy="8" r="1" fill="currentColor" />
                                    <circle cx="8" cy="12" r="1" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="detail-section">
                        <h4 className="detail-section-title">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M8 5v3M8 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            ЧТО ИЗУЧИЛИ (САММЕРИ)
                        </h4>
                        <p className="detail-section-text">{course.summary}</p>
                    </div>

                    {/* Students */}
                    <div className="detail-section">
                        <div className="detail-section-header">
                            <h4 className="detail-section-title">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                                    <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                СТУДЕНТЫ
                            </h4>
                            <button className="detail-view-all">Все</button>
                        </div>
                        <div className="detail-students-avatars">
                            {course.students.avatars.map((avatar, i) => (
                                <img
                                    key={i}
                                    src={avatar}
                                    alt="student"
                                    className="detail-student-avatar"
                                    style={{ marginLeft: i > 0 ? -8 : 0, zIndex: course.students.avatars.length - i }}
                                />
                            ))}
                            {course.students.total > course.students.avatars.length && (
                                <span className="detail-students-more" style={{ marginLeft: -8 }}>
                                    +{course.students.total - course.students.avatars.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Teachers */}
                    <div className="detail-section">
                        <h4 className="detail-section-title">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2l-6 3 6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M2 8l6 3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            ПРЕПОДАВАТЕЛИ
                        </h4>
                        {course.teachers.map((teacher, i) => (
                            <div key={i} className="detail-teacher-row">
                                <img
                                    src={teacher.avatar}
                                    alt={teacher.name}
                                    className="detail-teacher-avatar"
                                />
                                <div className="detail-teacher-info">
                                    <span className="detail-teacher-name">{teacher.name}</span>
                                    <span className="detail-teacher-role">{teacher.role}</span>
                                </div>
                                <button className="detail-teacher-email">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M2.667 2.667h10.666c.734 0 1.334.6 1.334 1.333v8c0 .733-.6 1.333-1.334 1.333H2.667c-.734 0-1.334-.6-1.334-1.333V4c0-.733.6-1.333 1.334-1.333z" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M14.667 4L8 8.667 1.333 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Materials */}
                    <div className="detail-section">
                        <h4 className="detail-section-title">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14 10v3.333c0 .368-.298.667-.667.667H2.667A.667.667 0 012 13.333V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                <path d="M2 6.667h12V10a.667.667 0 01-.667.667H2.667A.667.667 0 012 10V6.667z" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M6.667 2h2.666l1.334 4.667H5.333L6.667 2z" stroke="currentColor" strokeWidth="1.2" />
                            </svg>
                            МАТЕРИАЛЫ
                        </h4>
                        <div className="detail-materials-list">
                            {course.materials.map((material, i) => (
                                <div key={i} className="detail-material-row">
                                    {materialIcons[material.type]}
                                    <div className="detail-material-info">
                                        <span className="detail-material-name">{material.name}</span>
                                        <span className="detail-material-meta">{material.size} • {material.date}</span>
                                    </div>
                                    <button className="detail-material-download">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                            <path d="M5.333 7.333L8 10l2.667-2.667M8 10V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="detail-panel-footer">
                        <button className="detail-history-btn">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M8 4.667V8l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            История изменений
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <CourseEditModal
                    course={course}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

export default CourseDetailPanel;
export type { CourseDetail };
