/// <reference types="node" />
export interface IDynaNodeChannelBroadcasterConfig {
    dynaNodeChannelServiceAddress: string;
    prefixAddress?: string;
    channel: string;
    accessToken: string;
}
export declare class DynaNodeChannelBroadcaster {
    private readonly config;
    private client;
    constructor(config: IDynaNodeChannelBroadcasterConfig);
    stop(): Promise<void>;
    send<TArgs = void, TData = void>({ headers, args, command, data, binaryData, }: {
        headers?: any;
        args?: TArgs;
        command: string;
        data?: TData;
        binaryData?: Buffer;
    }): Promise<void>;
}
