import "jest";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

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
      broadcasters: {
        systemUpdates: {
          accessKey: '####sender-systemUpdates-key',
          senderDynaNodeAddresses: [],
        },
      },
      receivers: {
        systemUpdates: {
          accessKey: '####receiver-access-key',
        },
      },
      onMessageQueueError: e => console.error(e),
      onServiceRegistrationFail: e => console.error(e),
    });
    await channelsService.start();

    broadcaster = new DynaNodeChannelBroadcaster({
      dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
      channel: 'systemUpdates',
      accessKey: '####sender-systemUpdates-key',
    });

    done();
  });

  afterAll(async (done) => {
    await broadcaster.stop();
    await channelsService.stop();
    await server.stop();
    done();
  });

  it('can not broadcast if the accessKey is wrong', async (done) => {
    const receiver = new DynaNodeChannelReceiver({
      dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
      channel: 'systemUpdates',
      accessKey: '####receiver-access-key',
      onMessage: message => {
        expect(message.headers.test).toBe(0);
        expect(message.args.test).toBe(1);
        expect(message.data.test).toBe(2);
        expect(message.command).toBe('test');

        expect(channelsService.stats.receivers.systemUpdates.length).toBe(1);
        receiver.stop()
          .then(() => expect(channelsService.stats.receivers.systemUpdates.length).toBe(0))
          .catch(fail)
          .then(done);
      }
    });

    expect(channelsService.stats.receivers.systemUpdates).toBe(undefined);

    await receiver.start()
      .catch(error => fail({message: 'Receiver cannot start', error: error.data.replyMessage}));

    expect(channelsService.stats.receivers.systemUpdates.length).toBe(1);

    broadcaster.send({
      headers: {test: 0},
      args: {test: 1},
      command: 'test',
      data: {test: 2}
    })
      .catch(error => fail({message: 'Broadcaster cannot send', error: error.data.replyMessage}))
      .then(() => done());
  });

});
