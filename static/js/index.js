'use strict';

const iT = {
  hide: () => {
    const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
    const inlineToolbar = padOuter.find('#inline_toolbar');
    $(inlineToolbar).fadeOut('fast');
  },
  show: () => {
    const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
    const inlineToolbar = padOuter.find('#inline_toolbar');
    $(inlineToolbar).fadeIn('fast')
  },
};

exports.documentReady = () => {
  $('#editbar .menu_left').css('opacity', '0')
}

exports.aceSelectionChanged = (hook, context) => {
  const selStart = context.rep.selStart;
  const selEnd = context.rep.selEnd;
  if ((selStart[0] !== selEnd[0]) || (selStart[1] !== selEnd[1])) {
    iT.show();
  } else {
    iT.hide(); // hide if nothing is selected
  }
};

exports.postAceInit = (hookName, context) => {
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  const padInner = padOuter.contents('iframe').contents().find('body');
  padOuter.on('mouseup', (e) => {
    iT.hide();
  });
  padInner.on('mouseup', (e) => {
    const toolbar = padOuter.find('#inline_toolbar');
    const left = e.pageX + padOuter.find('iframe').offset().left;
    toolbar.css({
      position: 'absolute',
      left,
      top: e.pageY,
    });
  });
};

/**
 * 根据配置生成inlineToolbar的按钮
 * 其中一些按钮是系统自带的，有些是插件中的
 * 根据配置的数组深度进行分隔符的插入
 */
exports.postToolbarInit = (hook, context) => {
  const toolbarConfigs = clientVars.ep_inline_toolbar_pro || [];
  const dividerTemplate = '<div style="width: 1px; height: 17px; margin: 0 4px; background: #f5f5f5" />';

  toolbarConfigs.forEach((children, idx) => {
    const isArray = Array.isArray(children);
    const isLast = idx + 1 === toolbarConfigs.length;

    if (isArray) {
      children.forEach(key => {
        const menuLeftDom = $(`#editbar .menu_left [data-key='${key}']`);
        $('#inline_toolbar_menu_items').append(menuLeftDom);
      })

      if (isLast) return;
      
      $('#inline_toolbar_menu_items').append(dividerTemplate)
    }
  })


  /**
   * @description inline_toolbar style
   */
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  $('#inline_toolbar').css({
    'background-color': 'white',
    'border-radius': '6px',
    'border': '1px solid #f5f5f5',
    'padding': '3px 5px'
  });
  $('#inline_toolbar li').css({
    'margin': '0 3px',
  });
  $('#inline_toolbar').detach().appendTo(padOuter[0]);

  $('#editbar .menu_left').css('opacity', '1')
};
