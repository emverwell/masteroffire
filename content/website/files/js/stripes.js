/*
 * Created by Pixel-Mafia
 * www.pixel-mafia.com
*/
"use strict";
$(function () {
    vincent_setup_stripes();
    if (jQuery('.stripes_fullscreen_on').length > 0) {
        jQuery('html').addClass('vincent_stripes_fullscreen').addClass('vincent_transparent_header');
        if (jQuery('.stripes_fullscreen_on').length > 1) {
            jQuery('.stripes_fullscreen_on:not(:first)').remove();
        }
        jQuery('footer.vincent_footer').remove();
    }
});

jQuery(window).resize(function () {
    vincent_setup_stripes();
});

jQuery(window).on('load', function () {
    vincent_setup_stripes();
});

function vincent_setup_stripes() {
    if (jQuery('#wpadminbar').length > 0) {
        var setTop = jQuery('#wpadminbar').height();

        if (jQuery('.stripes_fullscreen_on').length > 0) {
            var setHeight = jQuery(window).height() - jQuery('#wpadminbar').height();
        } else {
            setHeight = jQuery(window).height() - jQuery('#wpadminbar').height() - jQuery('header').height();
        }
    } else {
        setTop = 0;

        if (jQuery('.stripes_fullscreen_on').length > 0) {
            setHeight = jQuery(window).height();
        } else {
            setHeight = jQuery(window).height() - jQuery('header').height();
        }
    }

    if (jQuery('.stripes_fullscreen_on').length > 0) {
        jQuery('.stripes_fullscreen_on').height(setHeight).css('top', setTop + 'px');
    } else {
        jQuery('.vincent_stripes').height(setHeight);
    }
    jQuery('.vincent_stripes').each(function () {
        var set_width = Math.floor(jQuery(this).width() / jQuery(this).find('.vincent_stripes_item').length);
        jQuery(this).find('.vincent_stripes_item').width(set_width).height(setHeight);
    });
}