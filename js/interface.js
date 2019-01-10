Fliplet().then(() => {
  $('.spinner-holder').removeClass('animated');
  const APPROVED_EXTENSIONS = ['mp3'];
  const EMBEDLY_KEY = '81633801114e4d9f88027be15efb8169';
  const button = $('.add-audio');
  const audioUrlInput = $('#audio_url');
  const audioTypeSelector = $("input[name='audio-type']");
  const audioByFilePicker = $('.audio-by-file-picker');
  const audioByUrl = $('.audio-by-url');
  const refreshButton = $('[data-refresh]');
  const widgetInstanceId = Fliplet.Widget.getDefaultId();
  const widgetInstanceData = Fliplet.Widget.getData(widgetInstanceId) || {};
  const media = $.extend(widgetInstanceData.media, {
    selectedFiles: {},
    selectFiles: [], // To use the restore on File Picker
    selectMultiple: false,
    type: 'audio',
    fileExtension: APPROVED_EXTENSIONS
  });
  let embedlyData = {};
  let providerInstance;
  const config = media;

  if (media && media.id) {
    config.selectFiles.push({
      appId: media.appId ? media.appId : undefined,
      organizationId: media.organizationId ? media.organizationId : undefined,
      mediaFolderId: media.mediaFolderId ? media.mediaFolderId : undefined,
      parentId: media.parentId ? media.parentId : undefined,
      contentType: media.contentType ? media.contentType : undefined,
      id: media.id ? media.id : undefined
    });
  }

  // private methods
  const browseClickHandler = async (event) => {
    event.preventDefault();
    if (!providerInstance) {
      $('.spinner-holder').addClass('animated');
      providerInstance = Fliplet.Widget.open('com.fliplet.file-picker', {
        data: config,
        onEvent(e, data) {
          switch (e) {
            case 'widget-rendered':
              $('.spinner-holder').removeClass('animated');
              break;
            case 'widget-set-info': {
              const msg = data.length
                ? 'Audio file selected'
                : 'no selected audio file';
              Fliplet.Widget.toggleSaveButton(!!data.length);
              audioUrlInput.val('');
              Fliplet.Widget.info(msg);
              break;
            }
            default:
              break;
          }
        }
      });

      const providerData = await providerInstance;

      Fliplet.Studio.emit('widget-save-label-update', {
        text: 'Save & Close'
      });
      Fliplet.Widget.info('');
      Fliplet.Widget.toggleCancelButton(true);
      Fliplet.Widget.toggleSaveButton(true);
      media.selectedFiles = providerData.data.length === 1 ? providerData.data[0] : providerData.data;
      providerInstance = null;
      $('.audio .add-audio').text('Replace audio');
      $('.audio .info-holder').removeClass('hidden');
      $('.audio .file-title span').text(media.selectedFiles.name);
      Fliplet.Widget.autosize();
      await save(false);
    }
  };

  const isApprovedFile = (fileName) => {
    const extension = fileName.split('.').pop();
    return _.includes(APPROVED_EXTENSIONS, extension);
  }

  const save = async (notifyComplete) => {
    const data = {};
    if (embedlyData.url) {
      data.embedlyData = embedlyData;
    } else {
      if (data.url && !data.url.match(/^[A-z]+:/i)) {
        data.url = `http://${data.url}`;
      }

      if (media.toRemove) {
        data.media = {};
      } else {
        data.media = _.isEmpty(media.selectedFiles) ? media : media.selectedFiles;
      }

      data.media.path = null;
    }

    if (embedlyData.url && !embedlyData.thumbnailBase64 && isApprovedFile(embedlyData.url)) {
      /**
       * this means that embedly did not find a thumbnail for a url which ends with an APPROVED_EXTENSION
       */
      data.embedlyData.thumbnailBase64 = null;
      data.embedlyData.audioHtml = null;
      /**
       * set the name to be the url,
       * since we don't really have a good and robustway to find out what the actual file name is,
       * and embedly does not provide it
       */
      data.embedlyData.name = data.embedlyData.url;
    }
    else {
      data.audioType = audioTypeSelector.filter(function filter() {
        return $(this).prop('checked');
      }).val();
    }

    await Fliplet.Widget.save(data);
    widgetInstanceData.embedlyData = data.embedlyData;
    
    if (notifyComplete) {
      Fliplet.Widget.complete();
    } else {
      Fliplet.Studio.emit('reload-widget-instance', widgetInstanceId);
    }
  };


  const toggleWarnings = (hasLinkWarning) => {
    if (hasLinkWarning) {
      $('.helper-holder .embedly-warning').addClass('show');
      $('.helper-holder .online-warning').removeClass('show');
    } else {
      $('.helper-holder .embedly-warning').removeClass('show');
      $('.helper-holder .online-warning').addClass('show');
    }
  }
  const removeFinalStates = () => {
    if ($('.audio-states .fail').hasClass('show')) {
      $('.audio-states .fail').removeClass('show');
      $('.helper-holder .error').removeClass('show');
    } else if ($('.audio-states .success').hasClass('show')) {
      $('.audio-states .success').removeClass('show');
    }
  };
  const changeStates = (success) => {
    if (success) {
      $('.audio-states .loading').removeClass('show');
      $('.audio-states .success').addClass('show');
    } else {
      $('.audio-states .loading').removeClass('show');
      $('.audio-states .fail').addClass('show');
      $('.helper-holder .error').addClass('show');
    }
  };

  // http://stackoverflow.com/a/20285053/1978835
  const toDataUrl = (url) => {
    return new Promise((r) => {

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = () => {
        const reader = new FileReader();
        reader.onloadend = () => {
          r(reader.result);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', `${Fliplet.Env.get('apiUrl')}v1/communicate/proxy/${url}`);
      xhr.setRequestHeader('auth-token', Fliplet.User.getAuthToken());
      xhr.send();
    })
  };

  const oembed = (url) => {
    const params = {
      url,
      key: EMBEDLY_KEY,
      autoplay: true,
      height: 200
    };
    return $.getJSON(`https://api.embedly.com/1/oembed?${$.param(params)}`);
  };

  const audioInputHandler = _.throttle(function handler() {
    const url = this.value;

    removeFinalStates();
    $('.audio-states .initial').addClass('hidden');
    $('.audio-states .loading').addClass('show');
    refreshButton.addClass('hidden');

    if ($(this).val().length === 0) {
      $('.audio-states .initial').removeClass('hidden');
      $('.audio-states .loading').removeClass('show');
      embedlyData = {};
      save(false);
      Fliplet.Widget.info('No selected audio file');
    } else {
      Fliplet.Widget.toggleSaveButton(false);
      toggleWarnings(false);
      oembed(url)
        .then(async (response) => {
          if (response.type !== 'rich' && response.type !== 'link') {
            changeStates(false);
            return;
          }
          refreshButton.removeClass('hidden');

          const bootstrapHtml = '<div class="embedly-holder">{{html}}</div>';
          embedlyData.type = response.type;
          embedlyData.url = url;
          embedlyData.audioHtml = bootstrapHtml
            .replace('{{html}}', response.html)
            .replace('//cdn', 'https://cdn');

          if (response.type === 'link') {
            toggleWarnings(true);
          }

          changeStates(true);

          if (response.thumbnail_url) {
            embedlyData.thumbnailBase64 = await toDataUrl(response.thumbnail_url);
          }
          else{
            embedlyData.thumbnailBase64 = null;
          }

          save(false);
          Fliplet.Widget.toggleSaveButton(true);
          Fliplet.Widget.info('Audio file selected');
        })
        .catch(() => {
          changeStates(false);
          Fliplet.Widget.toggleSaveButton(true);
        });
    }
  }, 1000);

  toggleWarnings(widgetInstanceData.embedlyData && widgetInstanceData.embedlyData.type === 'link');

  if (widgetInstanceData.embedlyData && widgetInstanceData.embedlyData.url) {
    refreshButton.removeClass('hidden');
  }

  audioUrlInput.on('input', audioInputHandler);

  Fliplet.Widget.onCancelRequest(() => {
    if (providerInstance) {
      providerInstance.close();
      providerInstance = null;
      Fliplet.Studio.emit('widget-save-label-update', {
        text: 'Save & Close'
      });
      Fliplet.Widget.toggleCancelButton(true);
      Fliplet.Widget.toggleSaveButton(true);
      Fliplet.Widget.info('');
    }
  });

  button.click(browseClickHandler);

  $('#try-stream-single').on('click', function () {
    audioUrlInput.val('https://open.spotify.com/track/2YarjDYjBJuH63dUIh9OWv?si=PlS4yiAWT9afuC2UyVKCeA').trigger('input');
  });

  refreshButton.on('click', function (e) {
    e.preventDefault();
    audioUrlInput.trigger('input');
  });

  audioTypeSelector.on('change', async function audioTypeChangeHandler() {
    if ($(this).val() === 'file-picker') {
      audioByFilePicker.addClass('show');
      audioByUrl.removeClass('show');
      widgetInstanceData.audioType = 'file-picker';

    } else {
      audioByFilePicker.removeClass('show');
      audioByUrl.addClass('show');
      widgetInstanceData.audioType = 'url';
    }


    await Fliplet.Widget.save(widgetInstanceData);

    Fliplet.Studio.emit('reload-widget-instance', widgetInstanceId);
  });

  if (!widgetInstanceData.audioType || widgetInstanceData.audioType === 'file-picker') {
    audioTypeSelector.first().attr('checked', true).trigger('change');
  } else if (widgetInstanceData.audioType === 'url') {
    audioTypeSelector.last().attr('checked', true).trigger('change');
  }

  $('.audio-remove').on('click', () => {
    media.selectFiles = [];
    media.toRemove = true;
    $('.audio .add-audio').text('Browse your media library');
    $('.audio .info-holder').addClass('hidden');
    $('.audio .file-title span').text('');
    Fliplet.Widget.autosize();
  });

  Fliplet.Widget.onSaveRequest(() => {
    if (providerInstance) {
      return providerInstance.forwardSaveRequest();
    }

    save(true);
  });
});
