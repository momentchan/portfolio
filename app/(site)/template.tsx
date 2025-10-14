'use client';

import { ReactNode } from 'react';
import styles from './transition.module.css';

interface TemplateProps {
  children: ReactNode;
}

/**
 * Template component that re-renders on every route change
 * Provides fade in/out transition for page changes
 */
export default function Template({ children }: TemplateProps) {
  return (
    <div className={styles.fadeIn}>
      {children}
    </div>
  );
}

