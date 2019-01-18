Fliplet().then(() => {
  Fliplet.Widget.instance('fliplet-audio-player',
    async (widgetInstanceData) => {
      if (widgetInstanceData.audioType === 'url') {
        if (widgetInstanceData.embedlyData) {
          if (!widgetInstanceData.embedlyData.thumbnailBase64) {
            Fliplet.Media.Audio.Player.init();
          }
          else {
            if (widgetInstanceData.embedlyData.thumbnailBase64) {
              const audioHolder = $(`[data-fliplet-audio-player-id=${widgetInstanceData.id}] .audio-holder`);
              const startButton = $(`[data-fliplet-audio-player-id=${widgetInstanceData.id}] .fl-audio-thumb-holder, [data-fliplet-audio-player-id=${widgetInstanceData.id}] .audio-placeholder`);
              startButton
                .on('click', () => {
                  if (Fliplet.Navigator.isOnline()) {
                    Fliplet.Analytics.trackEvent({
                      category: 'audio',
                      action: 'load_stream_online',
                      title: widgetInstanceData.embedlyData.url
                    });

                    if (widgetInstanceData.embedlyData.type === 'link') {
                      Fliplet.Navigate.url(widgetInstanceData.embedlyData.url);
                      return;
                    }
                    audioHolder.html(widgetInstanceData.embedlyData.audioHtml);
                    // initialize the player.
                    var player = new playerjs.Player(audioHolder.find('iframe.embedly-embed')[0]);
                    // Wait for the player to be ready.
                    player.on(playerjs.EVENTS.READY, () => {
                      if (player.supports('event', playerjs.EVENTS.PLAY)) {
                        player.on(playerjs.EVENTS.PLAY, () => {
                          Fliplet.Analytics.trackEvent({
                            category: 'audio',
                            action: 'play_stream',
                            title: widgetInstanceData.embedlyData.url
                          });
                        });
                      };

                      player.on(playerjs.EVENTS.PLAY, () => console.log('play'));
                      if (player.supports('event', playerjs.EVENTS.PAUSE)) {
                        player.on(playerjs.EVENTS.PAUSE, () => {
                          Fliplet.Analytics.trackEvent({
                            category: 'audio',
                            action: 'pause_stream',
                            title: widgetInstanceData.embedlyData.url
                          });
                        });
                      };
                    });
                  } else {
                    Fliplet.Analytics.trackEvent({
                      category: 'audio',
                      action: 'load_stream_offline',
                      title: widgetInstanceData.embedlyData.url
                    });

                    Fliplet.Navigate.popup({
                      popupTitle: 'Internet Unavailable',
                      popupMessage: `This audio requires Internet to play. 
                  Please try again when Internet is available.`
                    });
                  }
                });
            }
          }
        }
      } else if (widgetInstanceData.audioType === 'file-picker') {
        if (widgetInstanceData.media && widgetInstanceData.media.url) {
          Fliplet.Media.Audio.Player.init();
        }
      }
    });
});

