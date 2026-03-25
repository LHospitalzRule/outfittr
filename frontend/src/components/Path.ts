const app_name = 'outfittr.xyz';

export function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
        return 'http://' + app_name + ':5000/' + route;
    } else {
        return 'http://localhost:5000/' + route;
    }
}