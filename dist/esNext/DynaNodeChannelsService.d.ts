import { IError } from "dyna-interfaces";
export interface IDynaNodeFeederServiceConfig {
    compressMessages?: boolean;
    parallelRequests?: number;
    serviceRegistration?: {
        serverDynaNodeAddress: string;
        serviceConnectionId: string;
        encryptionKey: string;
        accessKey: string;
        requestExpirationInMinutes?: number;
    };
    prefixServiceConnectionId?: {
        serverDynaNodeAddress: string;
        prefix: string;
    };
    disk: {
        set: (key: string, data: any) => Promise<void>;
        get: (key: string) => Promise<any>;
        del: (key: string) => Promise<void>;
        delAll: () => Promise<void>;
    };
    broadcasters: ISendersConfig;
    receivers: IReceiversConfig;
    onServiceRegistrationFail: (error: IError) => void;
    onMessageQueueError: (error: IError) => void;
}
export interface ISendersConfig {
    [channel: string]: {
        accessKey: string;
        senderDynaNodeAddresses: string[];
    };
}
export interface IReceiversConfig {
    [channel: string]: {
        accessKey: string;
    };
}
export declare const COMMAND_RegisterReceiver = "COMMAND_RegisterReceiver";
export interface ICOMMAND_RegisterReceiver_args {
    channel: string;
    accessKey: string;
}
export declare const COMMAND_UnregisterReceiver = "COMMAND_UnregisterReceiver";
export interface ICOMMAND_UnregisterReceiver_args {
    channel: string;
    accessKey: string;
}
export declare const COMMAND_Post = "COMMAND_Post";
export interface ICOMMAND_Post_args {
    channel: string;
    accessKey: string;
}
export interface ICOMMAND_Post_data {
    headers?: any;
    args?: any;
    command: string;
    data?: any;
    binaryData?: any;
}
export interface IStats {
    receivers: IReceivers;
}
interface IReceivers {
    [channel: string]: Array<{
        receiverAddress: string;
    }>;
}
export declare class DynaNodeChannelsService {
    private readonly config;
    private service;
    private receivers;
    constructor(config: IDynaNodeFeederServiceConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    get stats(): IStats;
    private sendFeed;
}
export {};
