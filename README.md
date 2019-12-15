# About

Create Channels and let the receivers to get stream data on real time.

# Example

The channels service

```
    const channelsService = new DynaNodeChannelsService({
      disk: createRam(),
      serviceRegistration: {
        encryptionKey: 'encryptionKey',
        accessKey: 'accessKey',
        serverDynaNodeAddress: 'n/localhost/33044',
        serviceConnectionId: 'feeder-service',
      },
      broadcasters: {
        footballGame: {
          accessKey: '####sender-footballGame-key',
          senderDynaNodeAddresses: [],  // empty to give access to all broadcaster simply using the access key
        },
      },
      receivers: {
        footballGame: {
          accessKey: '####receiver-access-key',
        },
      },
      onMessageQueueError: e => console.error(e),
      onServiceRegistrationFail: e => console.error(e),
    });
    await channelsService.start();

```

Create a broadcaster instance that will push messages to the channel

```
    broadcaster = new DynaNodeChannelBroadcaster({
      dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
      channel: 'footballGame',
      accessKey: '####sender-footballGame-key',
    });
```

and send messages to the channel like this:

```
   broadcaster.send({
      command: 'football-game-score--update',
      data: { host: 2, visitor: 0 }
    })
```

And this is the receiver that 

```
    const receiver = new DynaNodeChannelReceiver({
      dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
      channel: 'footballGame',
      accessKey: '####receiver-access-key',
      onMessage: message => {
        const {
            data: {         // here we have the data posted to the channel
                host,
                visitor,
            },
        } = message;
      }
    });

```

