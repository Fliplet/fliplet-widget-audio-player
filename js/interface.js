(async () => {
  await Fliplet();
  $('.spinner-holder').removeClass('animated');
  const button = $('.add-audio');
  const widgetInstanceId = Fliplet.Widget.getDefaultId();
  const widgetInstanceData = Fliplet.Widget.getData(widgetInstanceId) || {};
  const media = $.extend(widgetInstanceData.media, {
    selectedFiles: {},
    selectFiles: [], // To use the restore on File Picker
    selectMultiple: false,
    type: 'audio'
  });

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

  /// private methods
  const browseClickHandler = async e => {
    e.preventDefault();
    if (!providerInstance) {
      $('.spinner-holder').addClass('animated');
      providerInstance = Fliplet.Widget.open('com.fliplet.file-picker', {
        data: config,
        onEvent: function (e, data) {
          switch (e) {
            case 'widget-rendered':
              $('.spinner-holder').removeClass('animated');
              break;
            case 'widget-set-info':
              Fliplet.Widget.toggleSaveButton(!!data.length);
              var msg = data.length
                ? 'Audio file selected'
                : 'no selected audio file';
              Fliplet.Widget.info(msg);
              break;
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

  const save = async () => {
    const data = {};

    if (data.url && !data.url.match(/^[A-z]+:/i)) {
      data.url = 'http://' + data.url;
    }
    
    if (media.toRemove) {
      data.media = {};
    } else {
      data.media = _.isEmpty(media.selectedFiles) ? media : media.selectedFiles;
    }
    data.media.path = null;
    await Fliplet.Widget.save(data);
    Fliplet.Widget.complete();
  };

  button.click(browseClickHandler);

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
    save();
  });

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
})();
