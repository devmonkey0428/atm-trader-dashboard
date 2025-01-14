export function validateEmbedding() {
    const allowedOrigins = [ 'http://18.225.2.2', 'http://wireless.atmtrader.com', 'https://wireless.atmtrader.com', 'https://atmtrader.com'];
    const currentOrigin = window.location.origin;

    if (!allowedOrigins.includes(currentOrigin)) {
        document.body.innerHTML = '<h1>Unauthorized Embedding</h1>';
        return false;
    }

    return true;
}
