/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
define([
    'jquery',
    'mage/smart-keyboard-handler',
    'mage/mage',
    'mage/ie-class-fixer',
    'domReady!',
    'jquery-ui-modules/spinner',
    'jquery/ui-modules/widgets/selectmenu',
    'nbxOwlCarousel',
    'nbxMark'
], function ($, keyboardHandler) {
    'use strict';

    (function ($) {
        $.fn.inlineStyle = function (prop) {
            var styles = this.attr("style"),
                    value;
            styles && styles.split(";").forEach(function (e) {
                var style = e.split(":");
                if ($.trim(style[0]) === prop) {
                    value = style[1];
                }
            });
            return value;
        };
    }(jQuery));

    /*$('.cart-summary').mage('sticky', {
        container: '#maincontent'
    });*/

    $('.panel.header > .header.links').clone().appendTo('#store\\.links');
    $('#store\\.links li a').each(function () {
        var id = $(this).attr('id');

        if (id !== undefined) {
            $(this).attr('id', id + '_mobile');
        }
    });

    keyboardHandler.apply();

    contentHelpers();
    mainNav();
    faqList();
    strainerToReplaceOptionsBlock();
    interactiveImgUploader();
    productToolbarNoPages();
    themeSpinners();
    themeDropdowns();
    stickyHeader();
    checkoutAgreement();
    scrollToTop();
    headerShowSearchBlock();
    plainSlideshow();
    photoAlbumSlideAndSlideshow();
    instagramCarousel();
    glossBlock();
    outrunSlideshow();
    shawlSlideshow();
    threeNutsCarousel();
    assortimentCarousel();
    fixBgMargin();
    dawnTrain();
    blockFilter();
    interactivePictureSlideshow();

    $(window).resize(function() {
        fixBgMargin();
    });

    function plainSlideshow() {
        var plainSlideshows = $('.plain-slideshow > div').addClass('owl-carousel');
        $('[data-content-type="row"]', plainSlideshows).each(function() {
            $(' > div > [data-content-type]', $(this)).wrapAll('<div class="content-wrapper -js"><div class="inner -js"></div></div>');
        })
        $('> style',plainSlideshows).appendTo($('body'));

        plainSlideshows.owlCarousel({
            slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: false, nav: true
        });
    }

    function photoAlbumSlideAndSlideshow() {
        $('[data-content-type="row"].photo-album-slide [data-content-type="column"], [data-content-type="block"].photo-album-slideshow [data-content-type="column"]').each(function() {
            if($('> [data-content-type="image"]', $(this)).length === 1) {
                $(this).addClass('has-one-image');
            } else if($('> [data-content-type="image"]', $(this)).length === 2) {
                $(this).addClass('has-two-image');
            } else if($('> [data-content-type="image"]', $(this)).length === 3) {
                $(this).addClass('has-three-image');
            }
        });

        var photoAlbumSlides = $('[data-content-type="row"].photo-album-slide');
        var photoAlbumSlideshows = $('[data-content-type="block"].photo-album-slideshow > div').addClass('owl-carousel');
        $('> style',photoAlbumSlideshows).appendTo($('body'));

        if($(window).width() < 769) {
            photoAlbumSlideshows.each(function() {
                $(this).append($('[data-content-type="image"]', $(this)));
                $('[data-content-type="row"]', $(this)).remove();
            });

            photoAlbumSlides.each(function() {
                $('[data-content-type="column"]:nth-of-type(1)', $(this)).append($('[data-content-type="image"]', $(this)));
                $('[data-content-type="column"]:not(:nth-of-type(1))', $(this)).remove();
            });
            $('[data-content-type="column"]',photoAlbumSlides)
                    .addClass('owl-carousel')
                    .owlCarousel({
                        slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: true, nav: false
                    });
        }

        photoAlbumSlideshows.owlCarousel({
            slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: false, nav: true,
            responsive:{
                0: {
                    dots:true,
                    nav:false
                },
                769: {

                }

            }
        });
    }

    function instagramCarousel() {
        var instagramCarousel = $('[data-content-type="row"].instagram-carousel [data-content-type="column"]').addClass('owl-carousel');

        $.ajax({
            url: '/nbxtheme/instagram/images',
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                $('figure', instagramCarousel).remove();

                $.each(data, function (index, item) {
                    if (item.media_type === 'IMAGE')
                        instagramCarousel.append(
                                $('<figure class="img-cont -js"></figure>').append(
                                        $('<a>', {
                                            href: item.link,
                                            target: '_blank'
                                        }).append($('<img>', {src: item.src}))
                                )
                        );
                })
            },
            complete: function() {
                instagramCarousel.owlCarousel({
                    slideBy: 1, items: 4, margin: 15, stagePadding: 15, dots: false, nav: true,
                    responsive: {
                        0:{
                            items:1,
                            margin:0,
                            stagePadding:0,
                            dots:true,
                            nav:false
                        },
                        769: {
                            items:2
                        },
                        1024: {
                            items:3
                        },
                        1200: {
                        }
                    }
                });
            }
        });
    }

    function glossBlock() {
        $('[data-content-type="row"].gloss').each(function() {
            $(' > div > [data-content-type]', $(this))
                    .wrapAll('<div class="content-wrapper -js"><div class="inner -js"></div></div>');
            $('[data-content-type="text"].stressed-bubble', $(this)).wrapInner('<div class="-js"></div>');
        });
        blockClickAsLink($('.stressed-bubble > div'));
    }

    function outrunSlideshow() {
        var outrunSlideshow = $('.outrun-slideshow > div').addClass('owl-carousel');
        var changeCurrent = function(e) {
            $('.current', $(e.target)).text(e.item.index + 1);

            $('.owl-dots-cont', $(e.target)).attr('class', 'owl-dots-cont -js');
            var slideContent = $(e.target).find('.owl-item').eq(e.item.index).find('> div');
            $('.owl-dots-cont', $(e.target)).addClass(slideContent.attr('class'));
        }

        $('> style',outrunSlideshow).appendTo($('body'));

        outrunSlideshow.owlCarousel({
            slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: true, nav: false,
            onInitialized: function(e) {
                $('.owl-dots', $(e.target))
                        .wrap('<div class="owl-dots-cont -js"></div>')
                        .before('<div class="current">1</div>');

                changeCurrent(e);
            },
        });

        outrunSlideshow.on('changed.owl.carousel', function(e) {
            changeCurrent(e);
        });

    }

    function shawlSlideshow() {
        var shawlSecondCol = $('.shawl [data-content-type="column"]:nth-of-type(2)');

        $('<div class="shawl-slideshow owl-carousel -js"></div>')
                .append($(' >:not([data-content-type="image"])', shawlSecondCol).first().prevAll())
                .prependTo(shawlSecondCol)
                .owlCarousel({
                    slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: true, nav: false
                });
    }

    function threeNutsCarousel() {
        var threeNutsFirstCol = $('.three-nuts [data-content-type="column"]:nth-of-type(1)');

        $('<div class="three-nuts-carousel owl-carousel -js"></div>')
                .append($(' >:not([data-content-type="image"])', threeNutsFirstCol).first().prevAll())
                .prependTo(threeNutsFirstCol)
                .owlCarousel({
                    slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: false, nav: false,

                });

        // $('ul > li', threeNutsFirstCol ).each(function(i, e) {
        //     $(this).attr('data-slide-index', i );
        // });

        $('[data-content-type="text"].swatch-list ul', threeNutsFirstCol )
                .addClass('owl-carousel three-nuts-swatch-carousel')
                .owlCarousel({
                    slideBy: 1, items: 3, margin: 18, stagePadding: 0, dots: false, nav: true,
                })
                .on('click', 'li', function(e) {
                    $('.three-nuts-carousel').trigger('to.owl.carousel', [$(this).data('slide-index'), 300]);
                });
    }

    function assortimentCarousel() {
        var assortimentCarousel = $('.assortiment [data-content-type="column-line"]').addClass('owl-carousel');

        $('[data-content-type="column"]', assortimentCarousel).click(function(e) {
            window.location.href = $('[data-element="link"]', $(this)).attr('href');
        });

        $('> style',assortimentCarousel).appendTo($('body'));

        assortimentCarousel.owlCarousel({
            slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: false, nav: true,
            responsive: {
                769: {
                    items:2,
                    stagePadding:74,
                    margin: 15
                },
                1200: {
                    items:3,
                    margin: 15,
                    stagePadding:74
                },
                1366: {
                    items:3,
                    margin: 15,
                    stagePadding:148
                }
            }
        });
    }

    $(document).on('amscroll_refresh', function() {
        themeDropdowns();
        productToolbarNoPages();
        blockFilter();
    });

    $('.go-back-action a').click(function(e) {
        e.preventDefault();
        history.back();
    });


    function stickyHeader() {
        var pageHeader = $('.page-header');
        $(window).scroll(function () {
            if ($(window).scrollTop() > 0) {
                pageHeader.addClass('sticky');
            } else {
                pageHeader.removeClass('sticky');
            }
        });
        $(window).resize(function () {
            $(window).scroll();
        })
    }

    function contentHelpers() {
        $('.social-links a').wrapInner('<span></span>')
                .filter($('a:contains("twitter")').addClass('twitter'))
                .filter($('a:contains("facebook")').addClass('facebook'))
                .filter($('a:contains("instagram")').addClass('instagram'))
                .filter($('a:contains("youtube")').addClass('youtube'))
                .filter($('a:contains("linkedin")').addClass('linkedin'))
                .filter($('a:contains("pinterest")').addClass('pinterest'));


        //adds "align-right" class to rows with text-align:right
        $('[data-content-type="row"] > div').each(function() {
            if($(this).css('text-align') === 'right') {
                $(this).parent().addClass('align-right');
            }
        })

        //adds main image class
        $('[data-content-type="column"]:first-of-type > [data-content-type="image"]').each(function() {
            if($(this).prev().length === 0 && $(this).next().length === 0) {
                $(this).addClass('main-image').wrapInner('<div></div>');
            }
        })

        //move above-all block before breadcrumbs to top
        $('.top-container').prepend($('.above-all'));

        //if block - move class from row like "block-class-" to block
        $('[data-content-type="block"]').each(function() {
            var that = this;
            var classesDonar = $('[data-content-type="row"][class*="block-class-"]', $(this)).first();

            if(classesDonar.length > 0) {
                var blockClassStr = classesDonar.attr('class');

                $.each(blockClassStr.split(/\s+/), function (index, item) {
                    if (item.indexOf("block-class-") === 0) {
                        $(that).addClass(item.substr("block-class-".length));
                        classesDonar.removeClass(item);
                    }
                });
            }
        });

        //swatch-list list text/image wrapper
        $('[data-content-type="text"].swatch-list ul').each(function() {
            $('li', $(this)).each(function(i) {
                $(this).attr('data-slide-index', i );
                $(this).wrapInner('<div class="text"></div>').find('img').prependTo($(this)).wrap('<div class="image"><div></div></div>');
            })
        });

        //move style to strong tag from wrapper span
        $('[data-content-type="text"] h2 strong').each(function() {
            $(this).attr('style', $(this).parents('span').attr('style'));
        })

        //the-crown title br to span
        $('[data-content-type="text"].the-crown h2').each(function() {
            $(this).contents()
                    .filter(function() {
                        return this.nodeType === 3;
                    })
                    .wrap( "<span class='-js'></span>" )
                    .end()
                    .filter( "br" )
                    .remove();
        });

        //move search to editor content
        $('[data-content-type="row"].not-found > div').append($('.not-found-search'));
    }

    function themeSpinners() {
        $('.cart-qty-spinner input').spinner(
                {
                    stop: function(e,ui){
                        $('#qty').val($(e.target).val()).change();
                    },
                    min: 1
                }
        );

        let miniCart = $('[data-block=\'minicart\']');
        miniCart.on('contentUpdated', function() {
            $('.minicart-wrapper .cart-item-qty').spinner({
                min: 1,
                stop: function(e, ui) {
                    $(e.target).change();
                    $('#update-cart-item-' + $(e.target).data('cart-item')).click();
                    miniCart.trigger('contentLoading');
                }
            });
        });

        $('#shopping-cart-table .input-text.qty').spinner({
            min: 1,
            step: 1, //step is null by default?
            // change:
            stop: function(e,ui){
                $('.cart.main.actions .action.update').click();
            },
        });
    }

    function productToolbarNoPages() {
        $('.products.wrapper  ~ .toolbar-products:not(:has(.pages))').addClass('js-no-pages');
    }

    function themeDropdowns() {
        $('#sorter, #limiter').selectmenu({
            change: function( event, ui ) {
                $(event.target).change();
            }
        });
    }
    function filtersMoreLess() {
        var showQty = 4;
        var filterOptionsContents = $('.filter-options-content');

        filterOptionsContents.show();
        $('.block.filter .items:not(.items-children):not(.am-filter-items-category_ids)').each(function() {
            if($('.item', $(this)).length <= showQty)
                return;

            var itemsHeight = 0;
            var marginBottom = parseInt($('.item', $(this)).first().css('marginBottom'));

            $('.item', $(this)).slice(0, showQty).each(function() {
                itemsHeight += $(this).outerHeight();
            });
            itemsHeight = itemsHeight + marginBottom * showQty + 25;
            $(this).css('height', itemsHeight + 'px').attr('data-height', itemsHeight).css('overflow', 'hidden');

            $('<button class="more more-less"><span>Meer tonen</span></button><button class="more-less less"><span>Less tonen</span></button>')
                    .insertAfter($(this))
                    .click(function(e) {
                        e.preventDefault();
                        $(this).closest('.filter-options-content').toggleClass('full');
                    });
        });
        // filterOptionsContents.hide();
    }

    function checkoutAgreement() {
        $(document).on('click', '.checkout-agreement input[type="checkbox"]', function(e) {
            e.stopPropagation();

            if($(this).is(':checked')) {
                $(this).parent().addClass('active');
            } else {
                $(this).parent().removeClass('active');
            }
        });
    }
    function scrollToTop() {
        $('.call-us-bar .to-top').click(function(e) {
            e.preventDefault();
            $("html, body").animate({ scrollTop: 0 }, 200);
        })
    }

    function headerShowSearchBlock() {
        // $('.header.content .block-search .block-content').hide().css('left', 'unset');
        // $('.header.content .block-search .block-content').css('left', 'unset').css('width', 0);

        var headerSearchBlkContent = $('.header.content .block-search .block-content');

        $('<div class="search-toggle"></div>')
                .click(function(e) {
                    e.preventDefault();

                    /*$('.header.content .block-search .block-content').fadeToggle(100, function() {
                        $(this).parent().toggleClass('active');
                        if($(this).is(':visible')) {
                            $(this).find('#search').focus();
                        }
                    });*/

                    console.log('rt');
                    headerSearchBlkContent.parent().toggleClass('active');
                    if(headerSearchBlkContent.is(':visible')) {
                        headerSearchBlkContent.find('#search').focus();
                    }
                })
                .appendTo('.header.content .block-search');

        /* Causes show all results button to fail
        $(document).on('click', function(e) {
            if($(e.target).closest(headerSearchBlkContent).length !== 0 ||
                    $(e.target).closest('.header.content .search-toggle').length !== 0)
                return false;
            headerSearchBlkContent.parent().removeClass('active');
            // $('.header.content .block-search .block-content').hide();
        });
        */
    }

    function fixBgMargin() {
        bgMarginFixer($('.certificates-download [data-content-type="column-line"]'), 1109, 81.57552083);
        bgMarginFixer($('.acquaintance [data-content-type="column-line"]'), 1109, 93.42447917);
        bgMarginFixer($('.product-main-media-cont > div'), 1369, 93.42447917, 0);
    }

    function bgMarginFixer(targetElement, targetWidth, backgroundWidth, padding = 20) {
        var curWidth = $(window).width();
        var containerWidth = 1536;
        // var backgroundWidth = 81.57552083;
        // var targetWidth = 1109;
        // var padding = 20;
        var diff =  (curWidth - targetWidth) / 2;
        // var targetElement = $('.certificates-download [data-content-type="column-line"]');

        if($(window).width() >= containerWidth) {
            curWidth = containerWidth;
            diff = (curWidth - targetWidth) / 2;
        } else if($(window).width() <= targetWidth + 2*padding) {
            diff = padding;
        }
        var padR = (100 - backgroundWidth) / 100 * curWidth - diff;
        if(padR < 0) padR = 0;

        targetElement.css('padding-right', padR + 'px');
    }

    function faqList() {
        var faqList = $('.faq-list');

        $('[data-content-type="text"]', faqList)
                .wrapInner('<div></div>')
                .hide();

        $('h2[data-content-type="heading"]', faqList)
                .on('mouseenter', function() {
                    $(this).addClass('active').next().addClass('active');
                })
                .on('mouseleave', function() {
                    $(this).removeClass('active').next().removeClass('active');
                })
                .on('touchstart', function() {
                    $(this).toggleClass('active').next().toggleClass('active');
                })
                .wrapInner('<span class="inner-text"></span>')
                .append('<span class="toggle"></span>');

        $('h2[data-content-type="heading"] + [data-content-type="text"]', faqList)
                .on('mouseenter', function() {
                    $(this).addClass('active').prev().addClass('active');
                })
                .on('mouseleave', function() {
                    $(this).removeClass('active').prev().removeClass('active');
                })

        //search box begin
        $('> div', faqList).prepend('<div class="faq-search"><input type="text" class="input-text" /><button class="button clear"></button></div>');

        var faqSearch = $('.faq-search');
        var notFoundClass = 'not-match';
        var titleAndContent = $('h2[data-content-type="heading"], h2[data-content-type="heading"] + [data-content-type="text"]', faqList );

        $('.input-text', faqSearch).on('input', function() {
            var inputStr = $(this).val();

            titleAndContent
                    .removeClass(notFoundClass)
                    .filter('h2').removeClass('active').next().hide();

            titleAndContent.unmark();

            if (inputStr.length > 2) {
                $(this).parent().addClass('filled');

                titleAndContent
                        .mark(inputStr, {element: 'span', className: 'highlight', separateWordSearch: false})
                        .filter(function() {
                            var reg = new RegExp(inputStr, "i");
                            return !reg.test($(this).text());
                        })
                        .addClass(notFoundClass)
                        .removeClass('active')
                ;

                titleAndContent
                        .filter('[data-content-type="text"]:not(.'+notFoundClass+')')
                        .addClass('active')
                        .prev()
                        .removeClass(notFoundClass)
                        .addClass('active');

                titleAndContent
                        .filter('h2:not(.'+notFoundClass+')').addClass('active').next().addClass('active').removeClass(notFoundClass);
            }
        });

        $('.button.clear', faqSearch).click(function(e) {
            e.preventDefault();
            $('.input-text', faqSearch).val('').focus().trigger('input');
            faqSearch.removeClass('filled');
        })
        //search box end
    }

    function strainerToReplaceOptionsBlock() {
        var strainerRplOptions = $('.strainer-to-replace-options');

        $('[data-content-type="row"] > div', strainerRplOptions).each(function() {
            $('> [data-content-type="text"]', $(this)).first().wrap($('<div class="content-header -js"></div>'));
            $('.content-header', $(this)).append('<span class="toggle"></span>');

            $('> *:not(.content-header)', $(this)).wrapAll('<div class="content-wrp -js"></div>');

            var headerTag = $('.content-header h2', $(this));
            var toolTipTxt = headerTag.nextAll().text();
            headerTag.nextAll().remove();
            $('.content-header h2', $(this)).append('<span class="tooltip"><span>' + toolTipTxt + '</span></span>');
        });

        $('.content-wrp', strainerRplOptions).hide();
        $('.content-header', strainerRplOptions).click(function() {
            var that = this;
            $('+ .content-wrp', $(this)).slideToggle(300, function() {
                $(that).toggleClass('active');
            });
        })
    }

    function interactiveImgUploader() {
        $('.label-for-input-file').click(function(e) {
            e.preventDefault();
            $('+ .input-file', $(this)).click();
        });

        $('.input-file.has-preview').on('change', function () {
            var dataTransfer = new DataTransfer();
            var inputFile = $(this);
            var formUploaderPreview = $('.form-upload-preview', $(this).parents('form.formbuilder.form'));

            if (formUploaderPreview) {
                for(var i = 0; i < this.files.length; i++){
                    var fileBlock = $('<div/>', {class: 'file-block'}),
                            fileName = $('<span/>', {class: 'name', text: this.files.item(i).name}),
                            src = URL.createObjectURL(this.files[i]);

                    $(fileBlock)
                            .append('<div class="image"><img src="' + src + '" alt="" /></div>')
                            .append(fileName)
                            .append('<span class="file-delete"></span>');

                    formUploaderPreview.append(fileBlock);
                }

                for (let file of this.files) {
                    dataTransfer.items.add(file);
                }

                this.files = dataTransfer.files;

                $('span.file-delete', formUploaderPreview).click(function(){
                    let name = $(this).closest('.file-block').find('.name').text();

                    $('.file-block:contains('+name+')', formUploaderPreview).remove();

                    for(let i = 0; i < dataTransfer.items.length; i++){
                        if(name === dataTransfer.items[i].getAsFile().name){
                            dataTransfer.items.remove(i);
                            continue;
                        }
                    }
                    inputFile[0].files = dataTransfer.files;
                });
            }
        });
    }

    function mainNav() {
        var mainNav = $('.main-nav');

        var mblNavTop = function() {
            if($(window).width() < 1025) {
                $('.main-nav').css('top', $('.panel.wrapper').outerHeight() + 'px');
            }
        };

        $('li > a', mainNav).wrapInner('<span></span>');
        $('.main-nav__list > li', mainNav).hover(function() {
            $(this).addClass('over');
        }, function() {
            $(this).removeClass('over');
        });

        $('.main-nav-toggle').click(function(){
            if($(this).hasClass('active')) {
                mainNav.removeClass('active');
                $(this).removeClass('active');
            } else {
                mainNav.addClass('active');
                $(this).addClass('active');
                mblNavTop();
            }
        });

        $('.menu-dropdown', mainNav).hide();

        $('<span class="dropdown-toggle"></span>')
                .appendTo($('.parent > a', mainNav))
                .click(function(e) {
                    e.preventDefault();
                    var parent = $(this).closest('.parent');

                    $('.menu-dropdown', parent).slideToggle(200 ,function() {
                        parent.toggleClass('active');
                    });
                });

        $(window).resize(function() {
            mblNavTop();
        })
    }

    function dawnTrain() {
        $(window).scroll(function() {
            $('.std > div').each(function() {
                var windowHeight = $(window).innerHeight();
                var elementTop = $(this).offset().top - $(window).scrollTop();
                var elementVisible = 200;

                if (elementTop < windowHeight - elementVisible) {
                    $(this).addClass("get-in");
                    $('[data-content-type="row"]', $(this)).addClass('get-in');
                } else {
                    $(this).removeClass("get-in");
                    $('[data-content-type="row"]', $(this)).removeClass('get-in');
                }
            })
        });

        $("html, body").scroll();
    }

    function blockFilter() {
        var filterBlockTitle = $('.filter.block .block-title');
        filterBlockTitle.click(function() {
            $('.filter-content', $(this).parent()).slideToggle(200, function() {
                $(this).parent().toggleClass('closed');
            })
        });
        if($(window).width() < 769 ) {
            filterBlockTitle.click();
        }
    }

    function blockClickAsLink(blocks) {
        blocks.each(function() {
            if($('a',$(this)).length > 0) {
                $(this).click(function() {
                    window.open($('a',$(this)).attr('href'), "_blank");
                }).css('cursor', 'pointer')
            }
        });
    }

    function interactivePictureSlideshow() {
        let intrPicSlideshow = $('.interactive-picture-slideshow');
        $('style',intrPicSlideshow).appendTo($('body'));

        //group by slide
        let interactivePictureClass= 'interactive-picture';
        var interactivePictureBlock = $("<div>", {"class": interactivePictureClass});
        $('.slide-divider', intrPicSlideshow).each(function() {
            $($(this).prevAll().not('.'+interactivePictureClass).get().reverse()).wrapAll(interactivePictureBlock);
        });
        $('.'+interactivePictureClass, intrPicSlideshow).last().nextAll().wrapAll(interactivePictureBlock);
        $('.slide-divider', intrPicSlideshow).remove();

        //create interactive picture
        $('.'+interactivePictureClass, intrPicSlideshow).each(function() {
            let intrPic = $(this);
            let intrPicFigure = $('[data-content-type="row"]:nth-of-type(1) figure', intrPic);
            $('<div class="points"></div>').appendTo(intrPicFigure.parent());
            $('[data-content-type="row"]:not(:nth-of-type(1))', intrPic).each(function () {
                // let x = parseFloat($('[data-content-type="column"]:nth-child(1)', $(this)).text());
                // let y = parseFloat($('[data-content-type="column"]:nth-child(2)', $(this)).text());

                let x = 0;
                let y = 0;

                let coordinates = $('[data-content-type="column"]:nth-child(3)', $(this)).text().split(';');
                if(coordinates.length > 1) {
                    x = coordinates[0];
                    y = coordinates[1];
                }

                $('<div class="point" style="left:' + x + '%; top:' + y + '%' + ' "><span></span></div>').click(
                        function (e) {
                            e.stopPropagation();

                            let curIntrPic = $(this).parents('.'+interactivePictureClass);
                            if ($(this).hasClass('active')) {
                                $(this).removeClass('active');
                                $('[data-content-type="row"]', curIntrPic).removeClass('active');
                            } else {
                                $('[data-content-type="row"]', curIntrPic).removeClass('active');
                                let pointBlock = $('[data-content-type="row"]:nth-of-type(' + ($(this).index() + 2) + ')', curIntrPic);
                                pointBlock.addClass('active');

                                if (x > 70) {
                                    pointBlock.css('right', 100 - x + '%').addClass('right-aligned');
                                } else {
                                    pointBlock.css('left', x + '%');
                                }
                                if (y > 70) {
                                    pointBlock.css('bottom', 100 - y + '%').addClass('bottom-aligned');
                                } else {
                                    pointBlock.css('top', y + '%');
                                }
                                // pointBlock.css('margin-top', -pointBlock.outerHeight() - 40 + 'px');
                                $('.point', curIntrPic).removeClass('active');
                                $(this).addClass('active');
                            }
                        }
                ).appendTo($('.points', intrPic));
                $('<button class="action close"><span>Close</span></button>').appendTo($(this)).click(function () {
                    let curIntrPic = $(this).parents('.'+interactivePictureClass);
                    $('[data-content-type="row"]', curIntrPic).removeClass('active');
                    $('.point', curIntrPic).removeClass('active');
                });
            });
        });

        //create slideshow
        $('> div', intrPicSlideshow).addClass('owl-carousel')
                .owlCarousel({
                    slideBy: 1, items: 1, margin: 0, stagePadding: 0, dots: false, nav: true
                });
    }


});
