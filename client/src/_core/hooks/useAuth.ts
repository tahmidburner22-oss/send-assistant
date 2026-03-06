// Auth is handled entirely by AppContext (localStorage).
export function useAuth(_options?: any) {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: () => {},
    logout: () => {},
  };
}
