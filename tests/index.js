describe('WHEN start component', function () {
  this.timeout(100000);
  describe('Interface', function () {

    it('should show the button in its initial state', function (done) {
      interfaceBrowser
        .evaluate(function (selector) {
          return document.querySelector(selector).textContent.trim()
        }, '.add-audio')
        .then(function (buttonText) {
          expect(buttonText).to.equal('Browse your media library');
          done();
        });
    });

    it('should show the button in its initial state', function (done) {
      interfaceBrowser
        .evaluate(function (selector) {
          return document.querySelector(selector).classList.contains('hidden')
        }, '.info-holder')
        .then(function (containsHidden) {
          expect(containsHidden).to.equal(true);
          done();
        });
    });

    it('when clicked on the add-audio button, the fliplet-file-picker should appear', function (done) {
      interfaceBrowser.click('.add-audio')
        .wait('[data-package="com.fliplet.file-picker"]')
        .evaluate(() => !!document.querySelector('[data-package="com.fliplet.file-picker"]'))
        .end()
        .then(filePickerExists=>{ 
          expect(filePickerExists).to.equal(true);
          done();
        });

      expect(interfaceBrowser)
    });
  });
  describe('Build', function () {
    it('should a placeholder for audio player', function (done) {
      buildBrowser
        .evaluate(function (selector) {
          return document.querySelector(selector).textContent
        }, '.placeholder')
        .then(function (placeHolderText) {
          expect(placeHolderText).to.equal('No audio file added');
          done();
        });
    });

  });
});
