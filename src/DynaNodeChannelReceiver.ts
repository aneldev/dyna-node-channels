import {
  DynaNodeMessage,
  DynaNodeClient,
} from "dyna-node/dist/commonJs/node";

import {
  COMMAND_RegisterReceiver,
  ICOMMAND_RegisterReceiver_args,
  COMMAND_UnregisterReceiver, ICOMMAND_UnregisterReceiver_args,
} from "./DynaNodeChannelsService";
import {validateChannelName} from "./validateChannelName";

export interface IDynaNodeChannelReceiverConfig {
  dynaNodeChannelServiceAddress: string;          // The address of the Channels service
  prefixAddress?: string;                         // Prefix the sender address of the broadcaster
  channel: string;                                // The channel to listen
  accessToken: string;                            // Access token to get registered to this channel as receiver
  onMessage: (message: DynaNodeMessage) => void;  // Callback for any message posted on this channel
}

export class DynaNodeChannelReceiver {
  private readonly client: DynaNodeClient;

  constructor(private readonly config: IDynaNodeChannelReceiverConfig) {
    this.client = new DynaNodeClient({
      prefixAddress: `${config.prefixAddress && config.prefixAddress + '--' || ''}channelReceiver[${config.channel}]`,
      onMessage: config.onMessage,
    });
  }

  public async start(): Promise<void> {
    const validationError = validateChannelName(this.config.channel);
    if (validationError) {
      throw {
        code: 202001280911,
        message: `DynaNodeChannelReceiver: Invalid channel name [${this.config.channel}]: ${validationError}`,
      };
    }

    const response = await this.client.sendReceive<ICOMMAND_RegisterReceiver_args>({
      to: this.config.dynaNodeChannelServiceAddress,
      command: COMMAND_RegisterReceiver,
      args: {
        channel: this.config.channel,
        accessToken: this.config.accessToken,
      },
    });
    if (response.command !== 'ok') {
      throw response.data;
    }
  }

  public async stop(): Promise<void> {
    await this.client.sendReceive<ICOMMAND_UnregisterReceiver_args>({
      to: this.config.dynaNodeChannelServiceAddress,
      command: COMMAND_UnregisterReceiver,
      args: {
        channel: this.config.channel,
      },
    });
    await this.client.stopConnections();
  }

}
