export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  masterPassword: string | null;
}
