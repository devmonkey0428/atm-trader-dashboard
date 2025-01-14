export function isEmbedded() {
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
}
