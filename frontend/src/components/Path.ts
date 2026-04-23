const app_name = 'outfittr.xyz';
const developmentApiPort = '5000';

export function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
        return 'http://' + app_name + '/' + route;
    } else {
        return 'http://localhost:' + developmentApiPort + '/' + route;
    }
}
