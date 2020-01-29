import {
  DynaNodeClient,
} from "dyna-node/dist/commonJs/node";

import {
  COMMAND_Post,
  ICOMMAND_Post_args,
  ICOMMAND_Post_data,
} from "./DynaNodeChannelsService";
import {validateChannelName} from "./validateChannelName";

export interface IDynaNodeChannelBroadcasterConfig {
  dynaNodeChannelServiceAddress: string;
  channel: string;
  accessToken: string;
}

export class DynaNodeChannelBroadcaster {
  private client: DynaNodeClient;

  constructor(private readonly config: IDynaNodeChannelBroadcasterConfig) {
    this.client = new DynaNodeClient({
      prefixAddress: `channelBroadcaster[${config.channel}]`,
      onMessage: message => console.warn('DynaNodeChannelBroadcaster, 202001201930, received an unexpected message that probably is an error', message),
    });
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
    const validationError = validateChannelName(this.config.channel);
    if (validationError) {
      throw {
        code: 202001280912,
        message: `DynaNodeChannelBroadcaster: Invalid channel name [${this.config.channel}]: ${validationError}`,
      };
    }

    const responseMessage = await this.client.sendReceive<ICOMMAND_Post_args, ICOMMAND_Post_data>({
      to: this.config.dynaNodeChannelServiceAddress,
      command: COMMAND_Post,
      args: {
        channel: this.config.channel,
        accessToken: this.config.accessToken,
        respond: true,
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
