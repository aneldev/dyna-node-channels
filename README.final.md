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
      onChannelRegister: async (channel, accessToken) => accessToken === '####at-registration',
      onChannelPost: async (channel, accessToken) => accessToken === '####at-post',
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
      accessToken: '####at-post',
    });
```

and send messages to the channel like this:

```
   broadcaster.send({
      command: 'football-game-score--update',
      data: { host: 2, visitor: 0 }
    })
```

And this is the receiver that will receive the messages

```
    const receiver = new DynaNodeChannelReceiver({
      dynaNodeChannelServiceAddress: 'feeder-service@n/localhost/33044',
      channel: 'footballGame',
      accessToken: '####at-registration',
      onMessage: message => {
        const {
            data: {         // here we have the data posted to the channel
                host,
                visitor,
            },
        } = message;
      }
    });
    receiver.start();
```

