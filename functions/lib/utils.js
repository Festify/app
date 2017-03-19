exports.unsafeGetProviderAndId = function (trackId) {
    const separatorIndex = trackId.indexOf('-');
    return [
        trackId.substring(0, separatorIndex),
        trackId.substring(separatorIndex + 1)
    ];
};