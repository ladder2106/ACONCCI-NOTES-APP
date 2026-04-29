import React, { createContext, useCallback, useContext, useState } from 'react';

type LayoutMode = 'grid' | 'list';

interface LayoutContextType {
    layoutMode: LayoutMode;
    toggleLayout: () => void;
    setLayoutMode: (mode: LayoutMode) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

    const toggleLayout = useCallback(() => {
        setLayoutMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
    }, []);

    return (
        <LayoutContext.Provider value={{ layoutMode, toggleLayout, setLayoutMode }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout(): LayoutContextType {
    const ctx = useContext(LayoutContext);
    if (!ctx) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return ctx;
}
