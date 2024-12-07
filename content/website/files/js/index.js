"use strict";

var vincent_window = jQuery(window);
$(function(){


    /* Menu */

   	if (jQuery('.mobile_header').length > 0) {
        jQuery('.mobile_header').after('<div class="mobile_menu_wrapper"><ul class="mobile_menu"/></div>');
        jQuery('.mobile_menu').html(jQuery('.vincent_menu_cont').find('ul.vincent_menu').html());
        jQuery('.mobile_menu_wrapper').hide();
        jQuery('.mobile_header').on('click', '.btn_mobile_menu', function () {
            jQuery('.mobile_menu_wrapper').stop().slideToggle(300);
            jQuery('.vincent_header').toggleClass('opened');
        });
    }

    $('.mobile_menu').on('click', '.menu-item-has-children a', function(){
        jQuery(this).toggleClass('opened').next().slideToggle(300);
    });


	/* Swipebox */

    if (jQuery('a.swipebox-video').length) {
        jQuery('html').addClass('vincent_swipe_box');
        jQuery('.swipebox-video').swipebox({
      selector: '.swipebox-video',
            afterOpen: function () {
                vincent_setup_box();
            }
        });
    }
	if (jQuery('a.swipebox').length) {
        jQuery('html').addClass('vincent_swipe_box');
        jQuery('.swipebox').swipebox({
     	selector: '.swipebox',
            afterOpen: function () {
                vincent_setup_box();
            }
        });
    }
    function vincent_setup_box() {
	    var swipe_slider = jQuery('#swipebox-slider'),
	        swipe_title = jQuery('#swipebox-top-bar'),
	        swipe_bottom = jQuery('#swipebox-bottom-bar'),
	        setHeight = 0;
	    setHeight = jQuery(window).height() - swipe_title.height() - swipe_bottom.height();
    swipe_slider.height(setHeight).css('top', swipe_title.height());
	}

	jQuery(document).on("click", "#swipebox-container .slide.current img", function (e) {
    	jQuery('#swipebox-next').trigger('click');
   	 e.stopPropagation();
	});

	jQuery(document).on("click", "#swipebox-container", function (e) {
    	jQuery('#swipebox-close').trigger('click');
	});

	/* Contact Form */
	
  jQuery('.vincent_form input[type=submit]').on('click', function(){
    var this_contact = jQuery(this).parents('form');
    jQuery.post('mail.php', {
      send_mail: 'true',
      form_name: this_contact.find('input[name=name]').val(),
      form_email: this_contact.find('input[name=email]').val(),
      form_text: this_contact.find('textarea[name=message]').val(),
    }).done(function (data) {
      alert(data);
    });

    return false;
  });


  if (jQuery('.vincent_js_bg_image').length > 0) {
        jQuery('.vincent_js_bg_image').each(function () {
            jQuery(this).css('background-image', 'url(' + jQuery(this).attr('data-src') + ')');
        });
    }

  vincent_countdown();
  vincent_404_page_centered();
  // vincent_cs_page_centered();
  if (jQuery('.vincent_counts').length) {
   $('.vincent_counts').viewportChecker({
    callbackFunction: function(elem, action){
      $(".spincrement").spincrement({
      thousandSeparator: "",
      duration: 2000
      }); 
    },
  });  
}


    if (jQuery('.vincent_single_album_head').length > 0) {
        setup_vincent_single_album();
        jQuery('html').addClass('vincent_single_album');

        if (vincent_window.scrollTop() > 10) {
            jQuery('html').addClass('header_scrolled');
        }
        vincent_window.on('scroll', function () {
            if (vincent_window.scrollTop() > 10) {
                jQuery('html').addClass('header_scrolled');
            } else {
                jQuery('html').removeClass('header_scrolled');
            }
        });
        jQuery('a.vincent_album_down_arrow').on('click', function () {
            
             var vincent_album_featured_height = vincent_window.height();
           

            jQuery('html, body').stop().animate({scrollTop: vincent_album_featured_height + 'px'}, 600);
        });
    }

    


  
    /* Back To Top */

    jQuery('.vincent_back_to_top').attr('data-bottom', parseInt(jQuery('.vincent_back_to_top').css('bottom'), 10));
    if (vincent_window.scrollTop() > vincent_window.height()) {
        jQuery('.vincent_back_to_top').addClass('vincent_show_me');
    } else {
        jQuery('.vincent_back_to_top').removeClass('vincent_show_me');
        if (jQuery('.vincent_footer').length > 0) {
            var footer_offset = jQuery('.vincent_footer').offset().top,
                check_footer_state = vincent_window.scrollTop() + vincent_window.height(),
                vincent_footer_showed = 'no',
                vincent_b2t_fixer = 0;
                
            if ( check_footer_state >= footer_offset) {
                vincent_b2t_fixer = check_footer_state - footer_offset;
                vincent_footer_showed = 'yes';
            } else {
                vincent_footer_showed = 'no';
                vincent_b2t_fixer = 0;
            }
            jQuery('.vincent_back_to_top').css('bottom', parseInt(jQuery('.vincent_back_to_top').attr('data-bottom'), 10) + vincent_b2t_fixer + 'px');
        }
    }
    vincent_window.on('scroll', function(){
        if (vincent_window.scrollTop() > vincent_window.height()/2) {
            jQuery('.vincent_back_to_top').addClass('vincent_show_me');
        } else {
            jQuery('.vincent_back_to_top').removeClass('vincent_show_me');
        }
        if (jQuery('.vincent_footer').length > 0) {
            var footer_offset = jQuery('.vincent_footer').offset().top,
                check_footer_state = vincent_window.scrollTop() + vincent_window.height(),
                vincent_footer_showed = 'no',
                vincent_b2t_fixer = 0;
                
            if ( check_footer_state >= footer_offset) {
                vincent_b2t_fixer = check_footer_state - footer_offset;
                vincent_footer_showed = 'yes';
            } else {
                vincent_footer_showed = 'no';
                vincent_b2t_fixer = 0;
            }
            jQuery('.vincent_back_to_top').css('bottom', parseInt(jQuery('.vincent_back_to_top').attr('data-bottom'), 10) + vincent_b2t_fixer + 'px');
        }
    });
    jQuery('.vincent_back_to_top').on('click', function(){
        jQuery('html, body').stop().animate({scrollTop: 0}, 400, function(){
            jQuery('.vincent_back_to_top').removeClass('vincent_show_me');
        });
    });
});


jQuery(window).on('load', function(){
    if (jQuery('.vincent_preloader_wrapper').length > 0) {
        jQuery('.vincent_preloader_wrapper').addClass('remove_preloader');
        setTimeout("jQuery('.vincent_preloader_wrapper').remove()", 600);
    }
    
    if (jQuery('.vincent_slider1i_auto_height').length) {
    $('.vincent_slider1i_auto_height').owlCarousel({
        slideSpeed:200, 
        items:1,
        // autoplay: true,
        autoplayTimeout:2000,
        smartSpeed:200,
        autoplayHoverPause:true,
        autoHeight:true,
        nav: true,
        loop:true
    });
    }

    $('.container').on('click', '.vincent_menu_tabs a', function( event ){ 
        $('.container > div').fadeOut(400);
        $('.container > div').filter(this.hash).fadeIn(600);
        $('.vincent_menu_tabs a').removeClass('active');
        $(this).addClass('active');
        return false;
    });
    $('.vincent_menu_tabs .active').trigger( "click" );
   
});
jQuery(window).resize(function(){
    vincent_404_page_centered();
    if (jQuery('.vincent_blog_grid_ratio').length > 0) {
        jQuery('.vincent_blog_grid_ratio').each(function () {
            var setHeight = Math.floor(jQuery(this).width() * jQuery(this).attr('data-ratio'));
            jQuery(this).height(setHeight);
        });
    }
    
});



/* About slider */

	if (jQuery('.vincent_slider1i').length) {
	$('.vincent_slider1i').owlCarousel({
	    slideSpeed:200, 
	    items:1,
	    autoplay: true,
        navText: ["",""],
	    autoplayTimeout:2000,
	    smartSpeed:200,
	    autoplayHoverPause:true,
	    nav: true,
	    loop:true
	});
	}
    if (jQuery('.vincent_slider1i_anim').length) {
    $('.vincent_slider1i_anim').owlCarousel({
        slideSpeed:200, 
        items:1,
        // autoplay: true,
        navText: ["",""],
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        autoplayTimeout:4000,
        smartSpeed:200,
        autoplayHoverPause:true,
        nav: true,
        loop:true
    });
    }
    
/* Isopope */

	if (jQuery('.grid').length) {
	var $grid = $('.grid').imagesLoaded().progress( function() {
	        $grid.isotope({
	            itemSelector: '.grid-item',
	            layoutMode: 'fitRows'
	        });
	    }); 

	    // bind filter button click
	    $('.filters-button-group').on( 'click', 'button', function() {
	        var filterValue = $( this ).attr('data-filter');
	        // use filterFn if matches value
	      
	    $grid.isotope({ filter: filterValue });
	    });
	    // change is-checked class on buttons
	    $('.button-group').each( function( i, buttonGroup ) {
	        var $buttonGroup = $( buttonGroup );
	        $buttonGroup.on( 'click', 'button', function() {
	        $buttonGroup.find('.is-checked').removeClass('is-checked');
	        $( this ).addClass('is-checked');
	        });
	    })
	}
 


	if (jQuery('.grid1').length) {
	var $grid1 = $('.grid1').imagesLoaded().progress( function() {
	        $grid1.isotope({
	            itemSelector: '.grid-item'
	            
	        });
	    });     
	}

     // Iframes in Blog Listings
    var vincent_iframe = jQuery('.vincent_post_formats iframe'),
        vincent_iframe_width = jQuery(vincent_iframe).width();

    jQuery(vincent_iframe).height(vincent_iframe_width);


	function vincent_countdown() {
    jQuery('.vincent_countdown').each(function(){
        var pm_year = jQuery(this).attr('data-year'),
            pm_month = jQuery(this).attr('data-month'),
            pm_day = jQuery(this).attr('data-day'),
            austDay = new Date(pm_year, pm_month - 1, pm_day);

        jQuery(this).countdown({
            until: austDay,
            padZeroes: true
        });
    });
	}

    function vincent_404_page_centered(){
    var container_404_height = jQuery(window).height() - jQuery('header').height(),
        inner_container_404_height = jQuery('.vincent_404_content_inner').height();

    if (inner_container_404_height < container_404_height) {
        var white_space = container_404_height - inner_container_404_height;

        jQuery('.vincent_404_content_wrapper').css({'padding-top': white_space / 2, 'padding-bottom': white_space / 2});
    }
}


