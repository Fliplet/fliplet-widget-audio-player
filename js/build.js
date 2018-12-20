Fliplet().then(() => {
  Fliplet.Widget.instance('fliplet-audio-player',
    async (widgetInstanceData) => {
      if (widgetInstanceData.audioType === 'url') {
        if (widgetInstanceData.embedlyData && widgetInstanceData.embedlyData.thumbnailBase64) {
          const audioHolder = $('.audio-holder');
          const startButton = $('.fl-audio-thumb-holder, .audio-placeholder');
          startButton
            .on('click', () => {
              if (Fliplet.Navigator.isOnline()) {
                Fliplet.Analytics.trackEvent({
                  category: 'audio',
                  action: 'play_streaming_online',
                  title: widgetInstanceData.embedlyData.url
                });

                if (widgetInstanceData.embedlyData.type === 'link') {
                  Fliplet.Navigate.url(widgetInstanceData.embedlyData.url);
                  return;
                }
                audioHolder.html(widgetInstanceData.embedlyData.audioHtml);
              } else {
                Fliplet.Analytics.trackEvent({
                  category: 'audio',
                  action: 'play_streaming_offline',
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
      } else if (widgetInstanceData.audioType === 'file-picker') {
        if (widgetInstanceData.media && widgetInstanceData.media.url) {
          Fliplet.Media.Audio.Player.init();
        }
      }
    });
});
