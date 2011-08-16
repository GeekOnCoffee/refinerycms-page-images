$(document).ready(function(){
  $('#custom_images_tab a').click(function(){
    if (!(picker = $('#page_image_picker')).data('size-applied')){
      wym_box = $('.page_part:first .wym_box');
      iframe = $('.page_part:first iframe');
      picker.css({
        height: wym_box.height()
        , width: wym_box.width()
      }).data('size-applied', true).corner('tr 5px').corner('bottom 5px').find('.wym_box').css({
        backgroundColor: 'white'
        , height: iframe.height() + $('.page_part:first .wym_area_top').height() - parseInt($('.wym_area_top .label_inline_with_link a').css('lineHeight'))
        , width: iframe.width() - 20
        , 'border-color': iframe.css('border-top-color')
        , 'border-style': iframe.css('border-top-style')
        , 'border-width': iframe.css('border-top-width')
        , padding: '0px 10px 0px 10px'
      });
    }
  });

  // Webkit browsers don't like the textarea being moved around the DOM,
  // they ignore the new contents. This is fixed below by adding a hidden
  // field that stays in place.
  $('#content #page_images li textarea:hidden').each(function(index) {
    var old_name = $(this).attr('name');
    $(this).attr('data-old-id', $(this).attr('id'));
    $(this).attr('name', 'ignore_me_' + index);
    $(this).attr('id', 'ignore_me_' + index);

    var hidden = $('<input>')
                  .addClass('caption')
                  .attr('type', 'hidden')
                  .attr('name', old_name)
                  .attr('id', $(this).attr('data-old-id'))
                  .val($(this).val());

    $(this).parents('li').first().append(hidden);
  });

  reset_functionality();
});

reset_functionality = function() {
  WYMeditor.onload_functions.push(function(){
    $('.wym_box').css({'width':null});
  });

  $("#page_images").sortable({
    'tolerance': 'pointer'
    , 'placeholder': 'placeholder'
    , 'cursor': 'drag'
    , 'items': 'li'
    , stop: reindex_images
  });

  $('#content #page_images li:not(.empty)').live('hover', function(e) {
    if (e.type == 'mouseenter' || e.type == 'mouseover') {
      if ((image_actions = $(this).find('.image_actions')).length == 0) {
        image_actions = $("<div class='image_actions'></div>");
        img_delete = $("<img src='/images/refinery/icons/delete.png' width='16' height='16' />");
        img_delete.appendTo(image_actions);
        img_delete.click(function() {
          $(this).parents('li').first().remove();
          reindex_images();
        });

        if ($(this).find('textarea.page_caption').length > 0) {
          img_caption = $("<img src='/images/refinery/icons/user_comment.png' width='16' height='16' class='caption' />");
          img_caption.appendTo(image_actions);
          img_caption.click(open_image_caption);
        } else {
          image_actions.addClass('no_captions');
        }

        image_actions.appendTo($(this));
      }

      image_actions.show();
    } else if (e.type == 'mouseleave' || e.type == 'mouseout') {
      $(this).find('.image_actions').hide();
    }
  });

  reindex_images();
}

image_added = function(image) {
  new_list_item = (current_list_item = $('li.empty')).clone();
  image_id = $(image).attr('id').replace('image_', '');
  current_list_item.find('input:hidden:first').val(image_id);

  $("<img />").attr({
    title: $(image).attr('title')
    , alt: $(image).attr('alt')
    , src: $(image).attr('data-grid') // use 'grid' size that is built into Refinery CMS (135x135#c).
  }).appendTo(current_list_item);

  current_list_item.attr('id', 'image_' + image_id).removeClass('empty');

  new_list_item.appendTo($('#page_images'));
  reset_functionality();
}

open_image_caption = function(e) {
  // move the textarea out of the list item, and then move the textarea back into it when we click done.
  (list_item = $(this).parents('li').first()).addClass('current_caption_list_item');
  textarea = list_item.find('.textarea_wrapper_for_wym > textarea');

  textarea.after($("<div class='form-actions'><div class='form-actions-left'><a class='button'>"+I18n.t('refinery.js.admin.page_images.done')+"</a></div></div>"));
  textarea.parent().dialog({
     title: I18n.t('refinery.js.admin.page_images.add_caption')
     , modal: true
     , resizable: false
     , autoOpen: true
     , width: 928
     , height: 530
   });

  $('.ui-dialog:visible .ui-dialog-titlebar-close, .ui-dialog:visible .form-actions a.button')
    .bind('click',
      $.proxy(function(e) {
        // first, update the editor because we're blocking event bubbling (third argument to bind set to false).
        $(this).data('wymeditor').update();
        $(this).removeClass('wymeditor')
               .removeClass('active_rotator_wymeditor');

        $this_parent = $(this).parent();
        $this_parent.appendTo('li.current_caption_list_item').dialog('close').data('dialog', null);
        $this_parent.find('.form-actions').remove();
        $this_parent.find('.wym_box').remove();
        $this_parent.css('height', 'auto');
        $this_parent.removeClass('ui-dialog-content').removeClass('ui-widget-content');

        $('li.current_caption_list_item').removeClass('current_caption_list_item');

        $('.ui-dialog, .ui-widget-overlay:visible').remove();

        $('#' + $(this).attr('data-old-id')).val($(this).val());
      }, textarea)
    , false);

  textarea.addClass('wymeditor active_rotator_wymeditor widest').wymeditor(wymeditor_boot_options);
}

reindex_images = function() {
  $('#page_images li textarea:hidden').each(function(i, input){
    // make the image's name consistent with its position.
    parts = $(input).attr('name').split('_');
    parts[2] = ('' + i);
    $(input).attr('name', parts.join('_'));

    // make the image's id consistent with its position.
    $(input).attr('id', $(input).attr('id').replace(/_\d/, '_' + i));
    $(input).attr('data-old-id', $(input).attr('data-old-id').replace(/_\d_/, '_'+i+'_').replace(/_\d/, '_' + i));
  });
  $('#page_images li').each(function(i, li){
    $('input:hidden', li).each(function() {
      // make the image's name consistent with its position.
      parts = $(this).attr('name').split(']');
      parts[1] = ('[' + i);
      $(this).attr('name', parts.join(']'));

      // make the image's id consistent with its position.
      $(this).attr('id', $(this).attr('id').replace(/_\d_/, '_'+i+'_').replace(/_\d/, '_'+i));
    });
  });
}