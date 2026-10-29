export const DEVICE_SESSION_KEY = 'device_session';
export const DEVICE_SESSION_CHANGED = 'device-session-changed';

export function clearDeviceSession() {
    localStorage.removeItem(DEVICE_SESSION_KEY);
    sessionStorage.removeItem('whitelist_session');
    localStorage.removeItem('user_cedula');
    window.dispatchEvent(new Event(DEVICE_SESSION_CHANGED));
}

export function getDeviceToken() {
    return typeof window === 'undefined' ? null : localStorage.getItem(DEVICE_SESSION_KEY);
}
