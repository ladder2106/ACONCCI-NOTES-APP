import React, { createContext, useContext, ReactNode } from 'react';
import { useAppState } from '@/hooks/useAppState';

interface AppStateContextType {
  appState: ReturnType<typeof useAppState>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Use a demo user ID for now - this can be replaced with actual auth later
  const appState = useAppState('demo-user', null);

  return (
    <AppStateContext.Provider value={{ appState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppStateContext() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppStateContext must be used within an AppStateProvider');
  }
  return context.appState;
}
