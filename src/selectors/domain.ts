export function domainSelector() {
    const { host } = document.location!;
    return host.indexOf('localhost') !== -1 || host.indexOf('www.') !== -1 ? host : `www.${host}`;
}
