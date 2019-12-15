var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { DynaNodeService, } from "dyna-node/dist/commonJs/node";
export var COMMAND_RegisterReceiver = "COMMAND_RegisterReceiver";
export var COMMAND_UnregisterReceiver = "COMMAND_UnregisterReceiver";
export var COMMAND_Post = "COMMAND_Post";
var DynaNodeChannelsService = /** @class */ (function () {
    function DynaNodeChannelsService(config) {
        var _a;
        var _this = this;
        this.config = config;
        this.receivers = {};
        this.service = new DynaNodeService(__assign(__assign({}, config), { publicCommands: [
                COMMAND_Post,
                COMMAND_RegisterReceiver,
                COMMAND_UnregisterReceiver,
            ], onCommand: (_a = {},
                _a[COMMAND_RegisterReceiver] = {
                    execute: function (_a) {
                        var message = _a.message, reply = _a.reply, next = _a.next;
                        var receiverAddress = message.from, _b = message.args, channel = _b.channel, accessKey = _b.accessKey;
                        if (!_this.config.receivers[channel]) {
                            reply({
                                command: 'error/404',
                                data: {
                                    message: "Channel not found [" + channel + "]",
                                },
                            });
                            next();
                            return;
                        }
                        if (_this.config.receivers[channel].accessKey !== accessKey) {
                            reply({
                                command: 'error/403',
                                data: {
                                    message: "Access denied for channel [" + channel + "], wrong access key",
                                },
                            });
                            next();
                            return;
                        }
                        if (!_this.receivers[channel])
                            _this.receivers[channel] = [];
                        _this.receivers[channel].push({
                            receiverAddress: receiverAddress,
                        });
                        reply({ command: 'ok' }).catch(function () { return undefined; });
                        next();
                    },
                },
                _a[COMMAND_UnregisterReceiver] = {
                    execute: function (_a) {
                        var message = _a.message, reply = _a.reply, next = _a.next;
                        var receiverAddress = message.from, _b = message.args, channel = _b.channel, accessKey = _b.accessKey;
                        if (!_this.config.receivers[channel]) {
                            reply({
                                command: 'error/404',
                                data: {
                                    message: "Channel not found [" + channel + "]",
                                },
                            });
                            next();
                            return;
                        }
                        if (_this.config.receivers[channel].accessKey !== accessKey) {
                            reply({
                                command: 'error/403',
                                data: {
                                    message: "Access denied for channel [" + channel + "], wrong access key",
                                },
                            });
                            next();
                            return;
                        }
                        if (!_this.receivers[channel])
                            _this.receivers[channel] = [];
                        _this.receivers[channel] =
                            _this.receivers[channel]
                                .filter(function (receiver) { return receiver.receiverAddress !== receiverAddress; });
                        reply({ command: 'ok' }).catch(function () { return undefined; });
                        next();
                    },
                },
                _a[COMMAND_Post] = {
                    execute: function (_a) {
                        var message = _a.message, reply = _a.reply, next = _a.next;
                        var sender = message.from, _b = message.args, channel = _b.channel, accessKey = _b.accessKey;
                        if (!_this.config.broadcasters[channel]) {
                            reply({
                                command: 'error/404',
                                data: {
                                    message: "Channel not found [" + channel + "]",
                                },
                            });
                            next();
                            return;
                        }
                        if (_this.config.broadcasters[channel].accessKey !== accessKey) {
                            reply({
                                command: 'error/403',
                                data: {
                                    message: "Access denied for channel [" + channel + "], wrong access key",
                                },
                            });
                            next();
                            return;
                        }
                        if (_this.config.broadcasters[channel].senderDynaNodeAddresses.length
                            && _this.config.broadcasters[channel].senderDynaNodeAddresses.indexOf(sender) > -1) {
                            reply({
                                command: 'error/403',
                                data: {
                                    message: "Access denied for channel [" + channel + "], you are not in senderDynaNodeAddresses list",
                                },
                            });
                            next();
                            return;
                        }
                        reply({ command: 'ok' }).catch(function () { return undefined; });
                        _this.sendFeed(message);
                        next();
                    },
                },
                _a) }));
    }
    DynaNodeChannelsService.prototype.start = function () {
        return this.service.start();
    };
    DynaNodeChannelsService.prototype.stop = function () {
        return this.service.stop();
    };
    Object.defineProperty(DynaNodeChannelsService.prototype, "stats", {
        get: function () {
            return {
                receivers: this.receivers,
            };
        },
        enumerable: true,
        configurable: true
    });
    DynaNodeChannelsService.prototype.sendFeed = function (message) {
        var _this = this;
        var sender = message.from, channel = message.args.channel, _a = message.data, headers = _a.headers, args = _a.args, command = _a.command, data = _a.data, binaryData = message.binaryData;
        var testMode = !!headers.testMode;
        if (!this.receivers[channel])
            return; // exit, nobody is registerd so far
        this.receivers[channel].concat().forEach(function (receiver) {
            console.debug('sending message to', testMode, receiver.receiverAddress);
            _this.service.send({
                headers: __assign(__assign({}, headers), { dynaNodeChannelSender: sender, dynaNodeAckTimeout: testMode
                        ? 500
                        : 10000 }),
                command: command,
                args: args,
                to: receiver.receiverAddress,
                data: data,
                binaryData: binaryData,
            })
                .then(function () { return console.debug('send success'); })
                .catch(function (error) {
                console.debug('send failed', error);
                if (error.code === 133.144) {
                    // Remove the listener, it doesn't exist anymore
                    console.debug('removing listener', receiver.receiverAddress);
                    _this.receivers[channel] =
                        _this.receivers[channel]
                            .filter(function (scanReceiver) { return scanReceiver.receiverAddress !== receiver.receiverAddress; });
                }
            });
        });
    };
    return DynaNodeChannelsService;
}());
export { DynaNodeChannelsService };
//# sourceMappingURL=DynaNodeChannelsService.js.map