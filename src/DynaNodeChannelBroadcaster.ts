import {
  DynaNodeClient,
} from "dyna-node/dist/commonJs/node";

import {
  COMMAND_Post,
  ICOMMAND_Post_args,
  ICOMMAND_Post_data,
} from "./DynaNodeChannelsService";

export interface IDynaNodeChannelBroadcasterConfig {
  dynaNodeChannelServiceAddress: string;
  channel: string;
  accessToken: string;
}

export class DynaNodeChannelBroadcaster {
  private client = new DynaNodeClient();

  constructor(private readonly config: IDynaNodeChannelBroadcasterConfig) {
  }

  public stop(): Promise<void> {
    return this.client.stopConnections();
  }

  public async send<TArgs = void, TData = void>(
    {
      headers,
      args,
      command,
      data,
      binaryData,
    }: {
      headers?: any,
      args?: TArgs,
      command: string,
      data?: TData,
      binaryData?: Buffer,
    }
  ): Promise<void> {
    const responseMessage = await this.client.sendReceive<ICOMMAND_Post_args, ICOMMAND_Post_data>({
      to: this.config.dynaNodeChannelServiceAddress,
      command: COMMAND_Post,
      args: {
        channel: this.config.channel,
        accessToken: this.config.accessToken,
      },
      binaryData,
      data: {
        command,
        headers,
        args,
        data,
      },
    });
    if (responseMessage.command !== 'ok') {
      throw responseMessage.data;
    }
  }
}
