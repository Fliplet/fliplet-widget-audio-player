Fliplet().then(() => {
  $('.spinner-holder').removeClass('animated');
  const EMBEDLY_KEY = '81633801114e4d9f88027be15efb8169';
  const LANDSCAPE_ASPECT_RATIO = 1.555;
  const button = $('.add-audio');
  const audioUrlInput = $('#audio_url');
  const audioTypeSelector = $("input[name='audio-type']");
  const audioByFilePicker = $('.audio-by-file-picker');
  const audioByUrl = $('.audio-by-url');
  const widgetInstanceId = Fliplet.Widget.getDefaultId();
  const widgetInstanceData = Fliplet.Widget.getData(widgetInstanceId) || {};
  const media = $.extend(widgetInstanceData.media, {
    selectedFiles: {},
    selectFiles: [], // To use the restore on File Picker
    selectMultiple: false,
    type: 'audio'
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
    }
  };

  const save = async (notifyComplete) => {
    const data = {};
    if (embedlyData.url) {
      data.embedlyData = embedlyData;
      await Fliplet.Widget.save(data);
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
    // save the audio type
    data.audioType = audioTypeSelector.filter(function filter() {
      return $(this).prop('checked');
    }).val();

    await Fliplet.Widget.save(data);

    if (notifyComplete) {
      Fliplet.Widget.complete();
    } else {
      Fliplet.Studio.emit('reload-widget-instance', widgetInstanceId);
    }
  };

  button.click(browseClickHandler);

  audioTypeSelector.on('change', function audioTypeChangeHandler() {
    if ($(this).val() === 'file-picker') {
      audioByFilePicker.addClass('show');
      audioByUrl.removeClass('show');
    } else {
      audioByFilePicker.removeClass('show');
      audioByUrl.addClass('show');
    }
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
  const toDataUrl = (url, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', `${Fliplet.Env.get('apiUrl')}v1/communicate/proxy/${url}`);
    xhr.setRequestHeader('auth-token', Fliplet.User.getAuthToken());
    xhr.send();
  };

  const oembed = (url) => {
    const params = {
      url,
      key: EMBEDLY_KEY,
      autoplay: true
    };
    return $.getJSON(`https://api.embedly.com/1/oembed?${$.param(params)}`);
  };

  const audioInputHandler = _.throttle(function handler() {
    const url = this.value;

    removeFinalStates();
    $('.audio-states .initial').addClass('hidden');
    $('.audio-states .loading').addClass('show');

    if ($(this).val().length === 0) {
      $('.audio-states .initial').removeClass('hidden');
      $('.audio-states .loading').removeClass('show');
      embedlyData = {};
      save(false);
      Fliplet.Widget.info('No selected audio file');
    } else {
      Fliplet.Widget.toggleSaveButton(false);

      $('.helper-holder .warning').removeClass('show');
      oembed(url)
        .then((response) => {
          if (response.type !== 'rich') {
            changeStates(false);
            return;
          }

          const bootstrapHtml = '<div class="embed-responsive embed-responsive-{{orientation}}">{{html}}</div>';
          embedlyData.orientation = (response.width / response.height > LANDSCAPE_ASPECT_RATIO) ? '16by9' : '4by3';
          embedlyData.type = response.type;
          embedlyData.url = url;
          embedlyData.audioHtml = bootstrapHtml
            .replace('{{html}}', response.html)
            .replace('{{orientation}}', embedlyData.orientation)
            .replace('//cdn', 'https://cdn');

          if (response.type === 'link') {
            $('.helper-holder .warning').addClass('show');
          }

          changeStates(true);
          toDataUrl(response.thumbnail_url, (base64Img) => {
            embedlyData.thumbnailBase64 = base64Img;
            Fliplet.Widget.toggleSaveButton(true);
            button.text('Browse your media library');
            $('.audio .info-holder').addClass('hidden');
            save(false);
            Fliplet.Widget.info('Audio file selected');
          });
        })
        .catch(() => {
          changeStates(false);
          Fliplet.Widget.toggleSaveButton(true);
        });
    }
  }, 1000);

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
});
