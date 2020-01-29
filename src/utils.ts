export const getHttpURLScheme = (secure: boolean) => (secure ? 'https' : 'http')
export const getWsURLScheme = (secure: boolean) => (secure ? 'wss' : 'ws')