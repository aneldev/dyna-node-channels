import {
  DynaNodeMessage,
  DynaNodeClient,
} from "dyna-node/dist/commonJs/node";

import {
  COMMAND_RegisterReceiver,
  ICOMMAND_RegisterReceiver_args,
  COMMAND_UnregisterReceiver,
} from "./DynaNodeChannelsService";

export interface IDynaNodeChannelReceiverConfig {
  dynaNodeChannelServiceAddress: string;
  channel: string;
  accessKey: string;
  onMessage: (message: DynaNodeMessage) => void;
}

export class DynaNodeChannelReceiver {
  private readonly client: DynaNodeClient;

  constructor(private readonly config: IDynaNodeChannelReceiverConfig) {
    this.client = new DynaNodeClient({
      onMessage: config.onMessage,
    });
  }

  public async start(): Promise<void> {
    const response = await this.client.sendReceive<ICOMMAND_RegisterReceiver_args>({
      to: this.config.dynaNodeChannelServiceAddress,
      command: COMMAND_RegisterReceiver,
      args: {
        channel: this.config.channel,
        accessKey: this.config.accessKey,
      },
    });
    if (response.command !== 'ok') {
      throw response.data;
    }
  }

  public async stop(): Promise<void> {
    await this.client.sendReceive<ICOMMAND_RegisterReceiver_args>({
      to: this.config.dynaNodeChannelServiceAddress,
      command: COMMAND_UnregisterReceiver,
      args: {
        channel: this.config.channel,
        accessKey: this.config.accessKey,
      },
    });
    await this.client.stopConnections();
  }

}
