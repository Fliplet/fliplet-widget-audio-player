Fliplet().then(() => {
  Fliplet.Widget.instance('fliplet-audio-player', function (data) {
    Fliplet.Media.Audio.Player.init();
  });
})