"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_1 = require("dyna-node/dist/commonJs/node");
exports.COMMAND_RegisterReceiver = "COMMAND_RegisterReceiver";
exports.COMMAND_UnregisterReceiver = "COMMAND_UnregisterReceiver";
exports.COMMAND_Post = "COMMAND_Post";
var DynaNodeChannelsService = /** @class */ (function () {
    function DynaNodeChannelsService(config) {
        this.config = config;
        this.receivers = {};
        this.init();
    }
    DynaNodeChannelsService.prototype.init = function () {
        var _a;
        var _this = this;
        var _b = this.config, onChannelPost = _b.onChannelPost, onChannelRegister = _b.onChannelRegister, onChannelUnregister = _b.onChannelUnregister;
        this.service = new node_1.DynaNodeService({
            parallelRequests: this.config.parallelRequests,
            serviceRegistration: this.config.serviceRegistration,
            prefixServiceConnectionId: this.config.prefixServiceConnectionId,
            disk: this.config.disk,
            onServiceRegistrationFail: this.config.onServiceRegistrationFail,
            onMessageQueueError: this.config.onMessageQueueError,
            publicCommands: [
                exports.COMMAND_Post,
                exports.COMMAND_RegisterReceiver,
                exports.COMMAND_UnregisterReceiver,
            ],
            onCommand: (_a = {},
                _a[exports.COMMAND_RegisterReceiver] = {
                    execute: function (_a) {
                        var message = _a.message, reply = _a.reply, next = _a.next;
                        return __awaiter(_this, void 0, void 0, function () {
                            var receiverAddress, _b, channel, accessToken, valid, error_, e_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        receiverAddress = message.from, _b = message.args, channel = _b.channel, accessToken = _b.accessToken;
                                        valid = false;
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, onChannelRegister(channel, accessToken)];
                                    case 2:
                                        valid = _c.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_1 = _c.sent();
                                        error_ = e_1;
                                        return [3 /*break*/, 4];
                                    case 4:
                                        if (error_) {
                                            reply({
                                                command: 'error',
                                                data: {
                                                    code: 1912172010,
                                                    message: 'Internal error onChannelRegister'
                                                },
                                            }).catch(function () { return undefined; });
                                            next();
                                            return [2 /*return*/];
                                        }
                                        if (valid) {
                                            if (!this.receivers[channel])
                                                this.receivers[channel] = [];
                                            this.receivers[channel].push({
                                                receiverAddress: receiverAddress,
                                            });
                                            reply({ command: 'ok' }).catch(function () { return undefined; });
                                        }
                                        else {
                                            reply({ command: 'error/403' }).catch(function () { return undefined; });
                                        }
                                        next();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                },
                _a[exports.COMMAND_UnregisterReceiver] = {
                    execute: function (_a) {
                        var message = _a.message, reply = _a.reply, next = _a.next;
                        return __awaiter(_this, void 0, void 0, function () {
                            var receiverAddress, _b, channel, accessToken, valid, error_, e_2;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        receiverAddress = message.from, _b = message.args, channel = _b.channel, accessToken = _b.accessToken;
                                        valid = false;
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, onChannelUnregister(channel, accessToken)];
                                    case 2:
                                        valid = _c.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_2 = _c.sent();
                                        error_ = e_2;
                                        return [3 /*break*/, 4];
                                    case 4:
                                        if (error_) {
                                            reply({
                                                command: 'error',
                                                data: {
                                                    code: 1912172011,
                                                    message: 'Internal error onChannelUnregister'
                                                },
                                            }).catch(function () { return undefined; });
                                            next();
                                            return [2 /*return*/];
                                        }
                                        if (valid) {
                                            if (!this.receivers[channel])
                                                this.receivers[channel] = [];
                                            this.receivers[channel] =
                                                this.receivers[channel]
                                                    .filter(function (receiver) { return receiver.receiverAddress !== receiverAddress; });
                                            reply({ command: 'ok' }).catch(function () { return undefined; });
                                        }
                                        else {
                                            reply({ command: 'error/403' }).catch(function () { return undefined; });
                                        }
                                        next();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                },
                _a[exports.COMMAND_Post] = {
                    execute: function (_a) {
                        var message = _a.message, reply = _a.reply, next = _a.next;
                        return __awaiter(_this, void 0, void 0, function () {
                            var _b, channel, accessToken, valid, error_, e_3;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _b = message.args, channel = _b.channel, accessToken = _b.accessToken;
                                        valid = false;
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, onChannelPost(channel, accessToken)];
                                    case 2:
                                        valid = _c.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_3 = _c.sent();
                                        error_ = e_3;
                                        return [3 /*break*/, 4];
                                    case 4:
                                        if (error_) {
                                            reply({
                                                command: 'error',
                                                data: {
                                                    code: 1912172011,
                                                    message: 'Internal error onChannelPost'
                                                },
                                            }).catch(function () { return undefined; });
                                            next();
                                            return [2 /*return*/];
                                        }
                                        if (valid) {
                                            reply({ command: 'ok' }).catch(function () { return undefined; });
                                            this.sendFeed(message);
                                        }
                                        else {
                                            reply({ command: 'error/403' }).catch(function () { return undefined; });
                                        }
                                        next();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                },
                _a),
        });
    };
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
        var sender = message.from, channel = message.args.channel, _a = message.data, _b = _a.headers, headers = _b === void 0 ? {} : _b, args = _a.args, command = _a.command, data = _a.data, binaryData = message.binaryData;
        var testMode = !!headers.testMode;
        if (!this.receivers[channel])
            return; // exit, nobody is registerd so far
        this.receivers[channel].concat().forEach(function (receiver) {
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
                .catch(function (error) {
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
exports.DynaNodeChannelsService = DynaNodeChannelsService;
//# sourceMappingURL=DynaNodeChannelsService.js.map