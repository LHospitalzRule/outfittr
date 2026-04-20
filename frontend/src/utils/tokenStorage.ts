export function storeToken(tok: { accessToken: string } | string): void {
    try {
        const accessToken = typeof tok === 'string' ? tok : tok.accessToken;
        localStorage.setItem('token_data', accessToken);
    } catch (e) {
        console.log(e);
    }
}

export function retrieveToken(): string | null {
    try {
        return localStorage.getItem('token_data');
    } catch (e) {
        console.log(e);
        return null;
    }
}
