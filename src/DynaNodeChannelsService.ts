import {
  DynaNodeService,
  IDynaNodeServiceCommandConfig,
  DynaNodeMessage,
} from "dyna-node/dist/commonJs/node";
import { IError } from "dyna-interfaces";

export interface IDynaNodeFeederServiceConfig {
  parallelRequests?: number;                                // default: 5

  serviceRegistration?: {                                   // required to have public name (connaction id), otherwise it will have the guid connection id
    serverDynaNodeAddress: string;
    serviceConnectionId: string;
    encryptionKey: string;
    accessKey: string;
    requestExpirationInMinutes?: number;                    // default: 0.5 min
  };

  prefixServiceConnectionId?: {
    serverDynaNodeAddress: string;                          // required for prefixing, this is used from services without serviceRegistration, these are the worker services
    prefix: string;
  };

  disk: {                                                   // physical or virtual disk access
    set: (key: string, data: any) => Promise<void>;
    get: (key: string) => Promise<any>;
    del: (key: string) => Promise<void>;
    delAll: () => Promise<void>;
  };

  onChannelRegister: (channel: string, accessToken: string) => Promise<boolean>;
  onChannelUnregister: (channel: string, accessToken: string) => Promise<boolean>;
  onChannelPost: (channel: string, accessToken: string) => Promise<boolean>;

  onServiceRegistrationFail: (error: IError) => void;                 // this is where the server doesn't allow the registration of this service or any other network error
  onMessageQueueError: (error: IError) => void;                       // if this happen is a hardware disk error!
}

export const COMMAND_RegisterReceiver = "COMMAND_RegisterReceiver";

export interface ICOMMAND_RegisterReceiver_args {
  channel: string;
  accessToken: string;
}

export const COMMAND_UnregisterReceiver = "COMMAND_UnregisterReceiver";

export interface ICOMMAND_UnregisterReceiver_args {
  channel: string;
  accessToken: string;
}

export const COMMAND_Post = "COMMAND_Post";

export interface ICOMMAND_Post_args {
  channel: string;
  accessToken: string;
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

export class DynaNodeChannelsService {
  private service: DynaNodeService;
  private receivers: IReceivers = {};

  constructor(private readonly config: IDynaNodeFeederServiceConfig) {
    this.init();
  }

  private init(): void {
    const {
      onChannelPost,
      onChannelRegister,
      onChannelUnregister,
    } = this.config;

    this.service = new DynaNodeService({
      parallelRequests: this.config.parallelRequests,
      serviceRegistration: this.config.serviceRegistration,
      prefixServiceConnectionId: this.config.prefixServiceConnectionId,
      disk: this.config.disk,
      onServiceRegistrationFail: this.config.onServiceRegistrationFail,
      onMessageQueueError: this.config.onMessageQueueError,

      publicCommands: [
        COMMAND_Post,
        COMMAND_RegisterReceiver,
        COMMAND_UnregisterReceiver,
      ],

      onCommand: {

        [COMMAND_RegisterReceiver]: {
          execute: async ({message, reply, next}) => {
            const {
              from: receiverAddress,
              args: {
                channel,
                accessToken,
              }
            } = message;

            let valid = false;
            let error_: any;

            try {
              valid = await onChannelRegister(channel, accessToken);
            } catch (e) {
              error_ = e;
            }

            if (error_) {
              reply({
                command: 'error',
                data: {
                  code: 1912172010,
                  message: 'Internal error onChannelRegister'
                } as IError,
              }).catch(() => undefined);
              next();
              return;
            }

            if (valid) {
              if (!this.receivers[channel]) this.receivers[channel] = [];
              this.receivers[channel].push({
                receiverAddress,
              });
              reply({command: 'ok'}).catch(() => undefined);
            }
            else {
              reply({command: 'error/403'}).catch(() => undefined);
            }

            next();
          },
        } as IDynaNodeServiceCommandConfig<ICOMMAND_RegisterReceiver_args, null>,

        [COMMAND_UnregisterReceiver]: {
          execute: async ({message, reply, next}) => {
            const {
              from: receiverAddress,
              args: {
                channel,
                accessToken,
              }
            } = message;

            let valid = false;
            let error_: any;

            try {
              valid = await onChannelUnregister(channel, accessToken);
            } catch (e) {
              error_ = e;
            }

            if (error_) {
              reply({
                command: 'error',
                data: {
                  code: 1912172011,
                  message: 'Internal error onChannelUnregister'
                } as IError,
              }).catch(() => undefined);
              next();
              return;
            }

            if (valid) {
              if (!this.receivers[channel]) this.receivers[channel] = [];
              this.receivers[channel] =
                this.receivers[channel]
                  .filter(receiver => receiver.receiverAddress !== receiverAddress);
              reply({command: 'ok'}).catch(() => undefined);
            }
            else {
              reply({command: 'error/403'}).catch(() => undefined);
            }

            next();
          },
        } as IDynaNodeServiceCommandConfig<ICOMMAND_UnregisterReceiver_args, null>,

        [COMMAND_Post]: {
          execute: async ({message, reply, next}) => {
            const {
              args: {
                channel,
                accessToken,
              }
            } = message;

            let valid = false;
            let error_: any;

            try {
              valid = await onChannelPost(channel, accessToken);
            } catch (e) {
              error_ = e;
            }

            if (error_) {
              reply({
                command: 'error',
                data: {
                  code: 1912172011,
                  message: 'Internal error onChannelPost'
                } as IError,
              }).catch(() => undefined);
              next();
              return;
            }

            if (valid) {
              reply({command: 'ok'}).catch(() => undefined);
              this.sendFeed(message);
            }
            else {
              reply({command: 'error/403'}).catch(() => undefined);
            }

            next();
          },
        } as IDynaNodeServiceCommandConfig<ICOMMAND_Post_args, ICOMMAND_Post_data>,

      },
    });
  }

  public start(): Promise<void> {
    return this.service.start();
  }

  public stop(): Promise<void> {
    return this.service.stop();
  }

  public get stats(): IStats {
    return {
      receivers: this.receivers,
    };
  }

  private sendFeed(message: DynaNodeMessage<ICOMMAND_Post_args, ICOMMAND_Post_data>): void {
    const {
      from: sender,
      args: {
        channel,
      },
      data: {
        headers = {},
        args,
        command,
        data,
      },
      binaryData,
    } = message;
    const testMode = !!headers.testMode;

    if (!this.receivers[channel]) return; // exit, nobody is registerd so far

    this.receivers[channel].concat().forEach(receiver => {
      this.service.send({
        headers: {
          ...headers,
          dynaNodeChannelSender: sender,
          dynaNodeAckTimeout: testMode
            ? 500
            : 10000,
        },
        command,
        args,
        to: receiver.receiverAddress,
        data,
        binaryData,
      })
        .catch((error: IError) => {
          if (error.code === 133.144) {
            // Remove the listener, it doesn't exist anymore
            console.debug('removing listener', receiver.receiverAddress);
            this.receivers[channel] =
              this.receivers[channel]
                .filter(scanReceiver => scanReceiver.receiverAddress !== receiver.receiverAddress);
          }
        });
    });
  }

}
