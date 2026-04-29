import { useContext, useState } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { AppStateContext } from '@/context/AppStateContext';

export default function LoginPage() {
  const appState = useContext(AppStateContext);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (!appState) return null;

  const { login, signup } = appState;

  return (
    <AuthPage
      mode={authMode}
      onLogin={login}
      onSignup={signup}
      onSwitchMode={setAuthMode}
    />
  );
}
