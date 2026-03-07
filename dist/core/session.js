const SESSION_KEY = 'session_user';
export function getSessionUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}
export function setSessionUser(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
export function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}
