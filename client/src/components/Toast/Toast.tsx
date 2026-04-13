import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    text: string;
}

interface ToastContextValue {
    success: (text: string) => void;
    error: (text: string) => void;
    warning: (text: string) => void;
    info: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const add = useCallback((type: ToastType, text: string) => {
        const id = ++_nextId;
        setToasts((prev) => [...prev, { id, type, text }]);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const ctx: ToastContextValue = {
        success: (t) => add('success', t),
        error: (t) => add('error', t),
        warning: (t) => add('warning', t),
        info: (t) => add('info', t),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            <div className={styles.container}>
                {toasts.map((t) => (
                    <ToastEntry key={t.id} item={t} onDone={() => remove(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    error: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    ),
    warning: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L1.5 16h15L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M9 7v3.5M9 13v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    ),
    info: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9 8v4M9 6v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    ),
};

const ToastEntry: React.FC<{ item: ToastItem; onDone: () => void }> = ({ item, onDone }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setExiting(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (exiting) {
            const timer = setTimeout(onDone, 300);
            return () => clearTimeout(timer);
        }
    }, [exiting, onDone]);

    return (
        <div
            className={`${styles.toast} ${styles[item.type]} ${exiting ? styles.exit : ''}`}
            onClick={() => setExiting(true)}
        >
            <span className={styles.icon}>{ICONS[item.type]}</span>
            <span className={styles.text}>{item.text}</span>
        </div>
    );
};

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}
