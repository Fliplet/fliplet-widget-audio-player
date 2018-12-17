/* eslint-disable func-names */
describe('WHEN start component', function () {
  this.timeout(100000);
  describe('Interface with Filepicker', function () {
    it('should show the button in its initial state', function (done) {
      interfaceBrowser
        .evaluate(function (selector) {
          return document.querySelector(selector).textContent.trim();
        }, '.add-audio')
        .then(function (buttonText) {
          expect(buttonText).to.equal('Browse your media library');
          done();
        });
    });

    it('should show the button in its initial state', function (done) {
      interfaceBrowser
        .evaluate(function (selector) {
          return document.querySelector(selector).classList.contains('hidden');
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
        .then((filePickerExists) => {
          expect(filePickerExists).to.equal(true);
          done();
        });
    });
  });

  describe('Interface with url input', function () {
    it('when a url is typed in the #audio_url input, the loading spinner should show', function (done) {
      interfaceBrowser.type('#audio_url', 'www.google.com')
        .evaluate(() => document.querySelector('.loading').classList.contains('show'))
        .then((isLoadingShown) => {
          expect(isLoadingShown).to.equal(true);
          done();
        });
    });
  });

  describe('Build', function () {
    it('should a placeholder for audio player', function (done) {
      buildBrowser
        .evaluate(function (selector) {
          return document.querySelector(selector).textContent;
        }, '.placeholder')
        .then(function (placeHolderText) {
          expect(placeHolderText).to.equal('No audio file added');
          done();
        });
    });
  });
});
