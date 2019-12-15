import {
  DynaNodeService,
  IDynaNodeServiceCommandConfig,
  DynaNodeMessage,
} from "dyna-node/dist/commonJs/node";
import { IError } from "dyna-interfaces";

export interface IDynaNodeFeederServiceConfig {
  compressMessages?: boolean;                               // default: true

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

  broadcasters: ISendersConfig;                            // Configuration who can post
  receivers: IReceiversConfig;                         // Configuration who can read

  onServiceRegistrationFail: (error: IError) => void;                 // this is where the server doesn't allow the registration of this service or any other network error
  onMessageQueueError: (error: IError) => void;                       // if this happen is a hardware disk error!
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

export const COMMAND_RegisterReceiver = "COMMAND_RegisterReceiver";

export interface ICOMMAND_RegisterReceiver_args {
  channel: string;
  accessKey: string;
}

export const COMMAND_UnregisterReceiver = "COMMAND_UnregisterReceiver";

export interface ICOMMAND_UnregisterReceiver_args {
  channel: string;
  accessKey: string;
}

export const COMMAND_Post = "COMMAND_Post";

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

export class DynaNodeChannelsService {
  private service: DynaNodeService;
  private receivers: IReceivers = {};

  constructor(private readonly config: IDynaNodeFeederServiceConfig) {
    this.service = new DynaNodeService({
      ...config,
      publicCommands: [
        COMMAND_Post,
        COMMAND_RegisterReceiver,
        COMMAND_UnregisterReceiver,
      ],
      onCommand: {
        [COMMAND_RegisterReceiver]: {
          execute: ({ message, reply, next }) => {
            const {
              from: receiverAddress,
              args: {
                channel,
                accessKey,
              }
            } = message;

            if (!this.config.receivers[channel]) {
              reply({
                command: 'error/404',
                data: {
                  message: `Channel not found [${channel}]`,
                } as IError,
              });
              next();
              return;
            }

            if (this.config.receivers[channel].accessKey !== accessKey) {
              reply({
                command: 'error/403',
                data: {
                  message: `Access denied for channel [${channel}], wrong access key`,
                } as IError,
              });
              next();
              return;
            }

            if (!this.receivers[channel]) this.receivers[channel] = [];
            this.receivers[channel].push({
              receiverAddress,
            });

            reply({ command: 'ok' }).catch(() => undefined);
            next();
          },
        } as IDynaNodeServiceCommandConfig<ICOMMAND_RegisterReceiver_args, null>,
        [COMMAND_UnregisterReceiver]: {
          execute: ({ message, reply, next }) => {
            const {
              from: receiverAddress,
              args: {
                channel,
                accessKey,
              }
            } = message;

            if (!this.config.receivers[channel]) {
              reply({
                command: 'error/404',
                data: {
                  message: `Channel not found [${channel}]`,
                } as IError,
              });
              next();
              return;
            }

            if (this.config.receivers[channel].accessKey !== accessKey) {
              reply({
                command: 'error/403',
                data: {
                  message: `Access denied for channel [${channel}], wrong access key`,
                } as IError,
              });
              next();
              return;
            }

            if (!this.receivers[channel]) this.receivers[channel] = [];
            this.receivers[channel] =
              this.receivers[channel]
                .filter(receiver => receiver.receiverAddress !== receiverAddress);

            reply({ command: 'ok' }).catch(() => undefined);
            next();
          },
        } as IDynaNodeServiceCommandConfig<ICOMMAND_UnregisterReceiver_args, null>,
        [COMMAND_Post]: {
          execute: ({ message, reply, next }) => {
            const {
              from: sender,
              args: {
                channel,
                accessKey,
              },
            } = message;

            if (!this.config.broadcasters[channel]) {
              reply({
                command: 'error/404',
                data: {
                  message: `Channel not found [${channel}]`,
                } as IError,
              });
              next();
              return;
            }

            if (this.config.broadcasters[channel].accessKey !== accessKey) {
              reply({
                command: 'error/403',
                data: {
                  message: `Access denied for channel [${channel}], wrong access key`,
                } as IError,
              });
              next();
              return;
            }

            if (
              this.config.broadcasters[channel].senderDynaNodeAddresses.length
              && this.config.broadcasters[channel].senderDynaNodeAddresses.indexOf(sender) > -1
            ) {
              reply({
                command: 'error/403',
                data: {
                  message: `Access denied for channel [${channel}], you are not in senderDynaNodeAddresses list`,
                } as IError,
              });
              next();
              return;
            }

            reply({ command: 'ok' }).catch(() => undefined);
            this.sendFeed(message);
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
        headers,
        args,
        command,
        data,
      },
      binaryData,
    } = message;
    const testMode = !!headers.testMode;

    if (!this.receivers[channel]) return; // exit, nobody is registerd so far

    this.receivers[channel].concat().forEach(receiver => {
      console.debug('sending message to', testMode, receiver.receiverAddress);
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
        .then(() => console.debug('send success'))
        .catch((error: IError) => {
          console.debug('send failed', error);
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
