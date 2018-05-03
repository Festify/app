if ((window as any).WebComponents && (window as any).WebComponents.ready) {
    import('./entry');
} else {
    window.addEventListener('WebComponentsReady', () => {
        import('./entry');
    });
}
