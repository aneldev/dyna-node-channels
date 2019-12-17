import { DynaNodeMessage } from "dyna-node/dist/commonJs/node";
export interface IDynaNodeChannelReceiverConfig {
    dynaNodeChannelServiceAddress: string;
    channel: string;
    accessToken: string;
    onMessage: (message: DynaNodeMessage) => void;
}
export declare class DynaNodeChannelReceiver {
    private readonly config;
    private readonly client;
    constructor(config: IDynaNodeChannelReceiverConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
}
