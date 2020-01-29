"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChannelName = function (channel) {
    if (channel.indexOf('@') > -1)
        return 'Channel name cannot have the "@" character';
    if (channel.indexOf(' ') > -1)
        return 'Channel name cannot have spaces';
    return '';
};
//# sourceMappingURL=validateChannelName.js.map