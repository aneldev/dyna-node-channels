export var validateChannelName = function (channel) {
    if (channel.indexOf('@') > -1)
        return 'Channel name cannot have the "@" character';
    if (channel.indexOf(' ') > -1)
        return 'Channel name cannot have spaces';
    return '';
};
//# sourceMappingURL=validateChannelName.js.map