import "jest";

const RECEIVERS_COUNT = 50;
jasmine.DEFAULT_TIMEOUT_INTERVAL = RECEIVERS_COUNT * 1000;

import {
  DynaNodeServer,
  createRam,
} from "dyna-node/dist/commonJs/node";

import {
  DynaNodeChannelsService,
  DynaNodeChannelBroadcaster,
  DynaNodeChannelReceiver,
} from "../../src";

describe('DynaNodeFeederService', () => {
  let server: DynaNodeServer;
  let channelsService: DynaNodeChannelsService;
  let broadcaster: DynaNodeChannelBroadcaster;

  beforeAll(async (done) => {
    server = new DynaNodeServer({
      addresses: {
        internal: 'n/localhost/33044',
        external: 'n/localhost/33044',
      },
      connectionIds: {
        'feeder-service': {
          encryptionKey: 'encryptionKey',
          accessKey: 'accessKey',
        },
      },
    });
    await server.start();

    channelsService = new DynaNodeChannelsService({
      disk: createRam(),
      serviceRegistration: {
        encryptionKey: 'encryptionKey',
        accessKey: 'accessKey',
        serverDynaNodeAddress: 'n/localhost/33044',
        serviceConnectionId: 'feeder-service',
      },
      onChannelRegister: async (channel, accessToken) => accessToken === '####at-registration',
      onChannelUnregister: async (channel, accessToken) => accessToken === '####at-registration',
      onChannelPost: async (channel, accessToken) => accessToken === '####at-post',
      onMessageQueueError: e => console.error(e),
      onServiceRegistrationFail: e => console.error(e),
    });
    await channelsService.start();

    broadcaster = new DynaNodeChannelBroadcaster({
      dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
      channel: 'systemUpdates',
      accessToken: '####at-post',
    });

    done();
  });

  afterAll(async (done) => {
    await broadcaster.stop();
    await channelsService.stop();
    await server.stop();
    done();
  });

  it(`broadcasts one message to many receivers`, async (done) => {
    let receives = 0;
    const checkAndExit = () => {
      receives++;
      if (receives === RECEIVERS_COUNT) done();
    };

    await Promise.all(
      Array(RECEIVERS_COUNT).fill(null).map((v, index) => {
        const receiver = new DynaNodeChannelReceiver({
          dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
          channel: 'systemUpdates',
          accessToken: '####at-registration',
          onMessage: message => {
            expect(message.headers.test).toBe(0);
            expect(message.args.test).toBe(1);
            expect(message.data.test).toBe(2);
            expect(message.command).toBe('test');
            receiver.stop().catch(fail).then(checkAndExit);
          }
        });
        return Promise.resolve()
          .then(() => receiver.start())
          .then(() => new Promise(r => setTimeout(r, 100 * index)))
          .catch(error => fail({message: 'Receiver cannot start', error: error.data.replyMessage}));
      })
    );

    broadcaster.send({
      headers: {test: 0},
      args: {test: 1},
      command: 'test',
      data: {test: 2}
    })
      .catch(error => fail({message: 'Broadcaster cannot send', error: error.data.replyMessage}));
  });

});
