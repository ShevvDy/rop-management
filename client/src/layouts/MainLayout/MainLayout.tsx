import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                <Header />
                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
