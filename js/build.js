Fliplet().then(() => {
  Fliplet.Widget.instance('fliplet-audio-player', () => {
    Fliplet.Media.Audio.Player.init();
  });
});
