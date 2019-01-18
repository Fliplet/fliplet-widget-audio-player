const trackFilePickerAudioPlayerEvents = (playerElement) => {
  const playButton = playerElement.find('.play-pause-btn');
  const audioUrl = Fliplet.Media.authenticate(playerElement.data('audio-url'));
  playButton.on('click', () => {
    if (playerElement.hasClass('playing')) {
      trackAnalyticsEvent('pause_stream', audioUrl);
    } else {
      trackAnalyticsEvent('play_stream', audioUrl);
    }
  })
}

const trackAnalyticsEvent = (action, label) => {
  Fliplet.Analytics.trackEvent({
    category: 'audio',
    action,
    label
  });
}

Fliplet().then(() => {
  Fliplet.Widget.instance('fliplet-audio-player',
    async (widgetInstanceData) => {
      if (widgetInstanceData.audioType === 'url') {
        if (widgetInstanceData.embedlyData) {
          if (!widgetInstanceData.embedlyData.thumbnailBase64) {
            Fliplet.Media.Audio.Player.init();
            trackFilePickerAudioPlayerEvents($(`[data-fliplet-audio-player-id=${widgetInstanceData.id}] .audio`));
          }
          else {
            if (widgetInstanceData.embedlyData.thumbnailBase64) {
              const audioHolder = $(`[data-fliplet-audio-player-id=${widgetInstanceData.id}] .audio-holder`);
              const startButton = $(`[data-fliplet-audio-player-id=${widgetInstanceData.id}] .fl-audio-thumb-holder, [data-fliplet-audio-player-id=${widgetInstanceData.id}] .audio-placeholder`);
              startButton
                .on('click', () => {
                  if (Fliplet.Navigator.isOnline()) {
                    trackAnalyticsEvent('load_stream_online', widgetInstanceData.embedlyData.url);

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
                          trackAnalyticsEvent('play_stream', widgetInstanceData.embedlyData.url);
                        });
                      };

                      if (player.supports('event', playerjs.EVENTS.PAUSE)) {
                        player.on(playerjs.EVENTS.PAUSE, () => {
                          trackAnalyticsEvent('pause_stream', widgetInstanceData.embedlyData.url);
                        });
                      };
                    });
                  } else {
                    trackAnalyticsEvent('load_stream_offline', widgetInstanceData.embedlyData.url);

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
          trackFilePickerAudioPlayerEvents($(`[data-fliplet-audio-player-id=${widgetInstanceData.id}] .audio`));
        }
      }
    });
});
