define([
    'jquery',
    'underscore',
    'Magento_Ui/js/modal/modal'
], function ($, _) {
    'use strict';

    $.widget('mage.amShowLabel', {
        options: {},
        textElement: null,
        image: null,
        imageWidth: null,
        imageHeight: null,
        parent: null,
        imageLabel: ['.amasty-label-container', '.amasty-label-image', '.amlabel-text'],
        fotoramaStage: '[data-fotorama-stage="fotorama__stage"]',
        galleryPlaceholder: '[data-gallery-role="gallery-placeholder"]',
        positionWrapper: 'amlabel-position-wrapper',
        mainContainer: '[data-gallery-role="amasty-main-container"]',
        slickSlider: {
            selectors: {
                slider: '.slick-slider',
                slide: '.slick-slide'
            },
            classes: {
                cloned: 'slick-cloned',
                initialized: 'slick-initialized'
            }
        },

        /**
         * @inheritDoc
         * @private
         */
        _create: function () {
            var items,
                priceContainer,
                newParent,
                me;

            this.parentResizeListener = new ResizeObserver(function () {
                this.setLabelStyle();
                this._refreshSLickSlider();
            }.bind(this));

            this.element = $(this.element);

            if (this.element.attr('amlabel-js-observed')) {
                return;
            }

            this.element.attr('amlabel-js-observed', 1);

            /* code for moving product label */
            if (this.options.move === 1) {
                items = this.element.closest('.page-wrapper').find(this.getPriceSelector());

                if (items.length) { // find any element with product 'id'
                    items = this._filterItems(items);

                    priceContainer = items.first();
                    newParent = this.getNewParent(priceContainer);

                    // eslint-disable-next-line max-depth
                    if (newParent && newParent.length) {
                        priceContainer.attr('label-observered-' + this.options.label, '1');
                        newParent.append(this.element);
                    } else {
                        this.element.hide();

                        return;
                    }
                } else {
                    this.element.hide();

                    return;
                }
            }

            this.image = this.element.find('.amasty-label-image');
            this.textElement = this.element.find('.amlabel-text');
            this.parent = this.element.parent();

            if (!this.image.length) {
                this.setStyleIfNotExist(
                    this.element,
                    {
                        'width': '100px',
                        'height': '50px'
                    }
                );
            }

            if (!this.image.length && this.options.position.includes('center')) {
                this.textElement.addClass('-am-centered');
            }

            /* move label to container from settings*/
            if (this.options.path && this.options.path !== '') {
                newParent = this.parent.find(this.options.path);

                if (newParent.length) {
                    this.parent = newParent;
                    newParent.append(this.element);
                }
            }

            /* required for child position absolute */
            if (!(this.parent.css('position') === 'absolute' || this.parent.css('position') === 'relative')) {
                this.parent.css('position', 'relative');
            }

            if (this.parent.prop('tagName') === 'A' && !this.parent.closest('.block.widget').hasClass('list')) {
                this.parent.css('display', 'block');
            }

            /* fix issue with hover on product grid */
            if (!this.element.closest('.sidebar').length) {
                this.element.closest('.product-item-info').css('zIndex', '996');
            }

            /* get default image size */
            if (!this.imageLoaded(this.image)) {
                me = this;

                this.image.on('load', function () {
                    me.element.fadeIn();
                    me.imageWidth = this.naturalWidth;
                    me.imageHeight = this.naturalHeight;
                    me.setLabelStyle();
                });
            } else {
                this.element.fadeIn();

                if (this.image[0]) {
                    this.imageWidth = this.image[0].naturalWidth;
                    this.imageHeight = this.image[0].naturalHeight;
                }
            }

            this.setLabelPosition();
            this.updateStyles();

            /* observe zoom load event for moving label*/
            this.productPageZoomEvent();
            this.createResizeEvent();
            this.createFotoramaEvent();
            this.createRedirectEvent();
            this._refreshSLickSlider();
        },

        /**
         * @returns {void}
         */
        _refreshSLickSlider: function () {
            var slider = this.element.closest(this.slickSlider.selectors.slider);

            if (slider.length && slider.hasClass(this.slickSlider.classes.initialized)) {
                slider.slick('refresh');
            }
        },

        /**
         * Skip labels from slick slider cloned nodes,
         * Skip labels that already exist in the product container,
         * Skip labels from bundle packs
         *
         * @param {Array} items
         * @return {Array}
         */
        _filterItems: function (items) {
            return items.filter(function (index, element) {
                return !$(element).closest(this.slickSlider.selectors.slide).hasClass(this.slickSlider.classes.cloned)
                    && !$(element).closest('.amrelated-pack-item').length
                    && !$(element).closest('.product-item-info')
                        .find('.amasty-label-container-' + this.options.label + '-' + this.options.product + '-cat')
                        .length;
            }.bind(this));
        },

        /**
         * @return {void}
         */
        createRedirectEvent: function () {
            this.element.on('click', function (e) {
                this.openLink(e);
            }.bind(this));
        },

        /**
         * @param {event} event
         * @return {void}
         */
        openLink: function (event) {
            var redirectUrl = this.options['redirect_url'];

            if (redirectUrl && !this.isEmpty(redirectUrl)) {
                event.preventDefault();
                window.open(redirectUrl, '_blank');
            }
        },

        /**
         * @return {void}
         */
        createResizeEvent: function () {
            $(window).on('resize', _.debounce(function () {
                this.reloadParentSize();
            }.bind(this), 300));

            $(window).on('orientationchange', function () {
                this.reloadParentSize();
            }.bind(this));
        },

        /**
         * @return {void}
         */
        createFotoramaEvent: function () {
            $(this.galleryPlaceholder).on('fotorama:load', this.updatePositionInFotorama.bind(this));
        },

        /**
         * @return {void}
         */
        updatePositionInFotorama: function () {
            var self = this,
                newParent = this.parent.find(this.options.path),
                elementToMove = null;

            if (this
                && this.options.path
                && this.options.mode === 'prod'
            ) {
                if (newParent.length && newParent !== this.parent) {
                    this.parent.css('position', '');
                    this.parent = newParent;

                    elementToMove = this.element.parent().hasClass(this.positionWrapper)
                        ? this.element.parent()
                        : this.element;
                    newParent.append(elementToMove);
                    newParent.css({ 'position': 'relative' });

                    self.setLabelsEventOnFotorama();
                }
            }
        },

        setLabelsEventOnFotorama: function () {
            var self = this,
                fotoramaStage = $(this.fotoramaStage),
                mousedownOnFotoramaStage = $._data(fotoramaStage[0], 'events').mousedown,
                pointerdownOnFotoramaStage = $._data(fotoramaStage[0], 'events').pointerdown;

            if (!fotoramaStage[0].eventsUpdated) {
                fotoramaStage.on('mousedown pointerdown', function (e) {
                    if (e.which === 1 && $(e.target).is(self.imageLabel.join(','))) {
                        $(this).trigger('focusout');
                        self.openLink(e);
                        e.stopImmediatePropagation();
                    }
                });

                // eslint-disable-next-line max-depth
                if (fotoramaStage.length && mousedownOnFotoramaStage) {
                    mousedownOnFotoramaStage.unshift(mousedownOnFotoramaStage.pop());
                }

                if (fotoramaStage.length && pointerdownOnFotoramaStage) {
                    pointerdownOnFotoramaStage.unshift(pointerdownOnFotoramaStage.pop());
                }

                fotoramaStage[0].eventsUpdated = true;
            }
        },

        /**
         * @param {Object} img
         * @return {boolean}
         */
        imageLoaded: function (img) {
            return !(!img.complete
                || typeof img.naturalWidth !== 'undefined' && img.naturalWidth === 0);
        },

        /**
         * @return {void}
         */
        productPageZoomEvent: function () {
            var amastyGallery = $(this.mainContainerSelector);

            if (this.options.mode === 'prod') {
                if (amastyGallery.length) {
                    this.parent = amastyGallery;
                    amastyGallery.append(this.element.parent());
                    amastyGallery.css('position', 'relative');
                }
            }
        },

        /**
         * @return {void}
         */
        updateStyles: function () {
            this.setLabelStyle();
            this.setLabelPosition();
        },

        /**
         * @param {Object} element
         * @param {Object} styles
         * @return {void}
         */
        setStyleIfNotExist: function (element, styles) {
            // eslint-disable-next-line guard-for-in, vars-on-top
            for (var style in styles) {
                // eslint-disable-next-line
                var current = element.attr('style');

                if (!current ||
                    current.indexOf('; ' + style) === -1 && current.indexOf(';' + style) === -1
                ) {
                    // eslint-disable-next-line no-undef
                    element.css(style, styles[style]);
                }
            }
        },

        /**
         * @return {void}
         */
        setLabelStyle: function () {
            var parentWidth,
                tmpWidth,
                tmpHeight,
                lineCount,
                redirectUrl = this.options['redirect_url'],
                display = this.options.alignment === 1 ? 'inline-block' : 'block';

            /* for text element */
            this.setStyleIfNotExist(
                this.textElement,
                {
                    'padding': '0 3px',
                    'position': 'absolute',
                    'box-sizing': 'border-box',
                    'white-space': 'nowrap',
                    'width': '100%'
                }
            );

            if (this.image.length) {
                /* for image */
                this.image.css({ 'width': '100%' });

                /* get block size depend settings */
                if (this.options.size > 0) {
                    parentWidth = Math.round(this.parent.css('width').replace(/[^\d.]/g, ''));

                    if (!parentWidth) {
                        this.parentResizeListener.observe(this.parent[0]);

                        return;
                    }

                    // eslint-disable-next-line max-depth
                    if (parentWidth) {
                        this.parentResizeListener.disconnect();
                        // eslint-disable-next-line no-mixed-operators
                        this.imageWidth = Math.round(parentWidth * this.options.size / 100);
                    }
                } else {
                    this.imageWidth += 'px';
                }

                this.setStyleIfNotExist(this.element, { 'width': this.imageWidth });
                this.imageHeight = this.image.height();

                /* if container doesn't load(height = 0 ) set proportional height */
                if (!this.imageHeight && this.image[0] && this.image[0].naturalWidth !== 0) {
                    tmpWidth = this.image[0].naturalWidth;
                    tmpHeight = this.image[0].naturalHeight;

                    this.imageHeight = Math.round(this.imageWidth * (tmpHeight / tmpWidth));
                }

                lineCount = this.textElement.html().split('<br>').length;
                lineCount = lineCount >= 1 ? lineCount : 1;
                this.textElement.css('lineHeight', Math.round(this.imageHeight / lineCount) + 'px');

                /* for whole block */
                if (this.imageHeight) {
                    this.setStyleIfNotExist(this.element, {
                        'height': this.imageHeight + 'px'
                    });
                }

                this._fitLabelText();
            }

            this.image
                .attr('width', this.image.width() + 'px')
                .attr('height', this.image.height() + 'px');

            this.element.parent().css({
                'line-height': 'normal',
                'position': 'absolute'
            });

            // dont reload display for configurable child label. visibility child label processed in reload.js
            if (!this.element.hasClass('amlabel-swatch')) {
                this.setStyleIfNotExist(
                    this.element,
                    {
                        'position': 'relative',
                        'display': display
                    }
                );
            }

            if (redirectUrl && !this.isEmpty(redirectUrl)) {
                this.element.addClass('-link');
            }

            this.reloadParentSize();
        },

        /**
         * @return {void}
         */
        _fitLabelText: function () {
            if (this.options.size) {
                var flag = 1;

                this.textElement.css({ 'width': 'auto' });
                this.textElement.parent().css('display', 'block');

                while (this.textElement.width() > 0.9 * this.textElement.parent().width() && flag++ < 15) {
                    this.textElement.css({ 'fontSize': 100 - flag * 5 + '%' });
                }

                this.textElement.parent().css('display', 'none');
                this.textElement.css({ 'width': '100%' });
            }
        },

        /**
         * @param {*} html
         * @return {Boolean}
         */
        isEmpty: function (html) {
            return html === null || html.match(/^ *$/) !== null;
        },

        setPosition: function (position) {
            this.options.position = position;
            this.setLabelPosition();
            this.reloadParentSize();
        },

        /**
         * @return {void}
         */
        setStyle: function () {
            this.setLabelStyle();
        },

        /**
         * @return {void}
         */
        reloadParentSize: function () {
            var parent = this.element.parent(),
                height = null,
                width = 5;

            parent.css({
                'position': 'relative',
                'display': 'inline-block',
                'width': 'auto',
                'height': 'auto'
            });

            height = parent.height();

            if (this.options.alignment === 1) {
                parent.children().each(function (index, element) {
                    width += $(element).width() + parseInt($(element).css('margin-left'), 10)
                        + parseInt($(element).css('margin-right'), 10);
                });
            } else {
                width = parent.width();
            }

            parent.css({
                'position': 'absolute',
                'display': 'block',
                'height': height ? height + 'px' : '',
                'width': width ? width + 'px' : ''
            });
        },

        /**
         * @return {string}
         */
        getWidgetLabelCode: function () {
            var label = '';

            if (this.element.parents('.widget-product-grid, .widget').length) {
                label = 'widget';
            }

            return label;
        },

        /**
         * @return {*|void}
         */
        setLabelPosition: function () {
            var parent,
                labelOrderMatch,
                className = 'amlabel-position-' + this.options.position
                    + '-' + this.options.product + '-' + this.options.mode + this.getWidgetLabelCode(),
                wrapper = this.parent.find('.' + className);

            if (wrapper.length) {
                labelOrderMatch = false;

                $.each(wrapper.find('.amasty-label-container'), function (index, prevLabel) {
                    var nextLabel = $(prevLabel).next(),
                        currentOrder = parseInt(this.options.order, 10),
                        prevOrder = null,
                        nextOrder = null;

                    if ($(prevLabel).length && $(prevLabel).data('mageAmShowLabel')) {
                        prevOrder = parseInt($(prevLabel).data('mageAmShowLabel').options.order, 10);
                    }

                    if (nextLabel.length && $(nextLabel).data('mageAmShowLabel')) {
                        nextOrder = parseInt(nextLabel.data('mageAmShowLabel').options.order, 10);
                    }

                    if (currentOrder >= prevOrder && (!nextOrder || currentOrder <= nextOrder)) {
                        labelOrderMatch = true;

                        $(prevLabel).after(this.element);

                        return false;
                    }
                }.bind(this));

                if (!labelOrderMatch) {
                    wrapper.prepend(this.element);
                }
            } else {
                parent = this.element.parent();
                if (parent.hasClass(this.positionWrapper)) {
                    parent.parent().html(this.element);
                }

                this.element.wrap('<div class="' + className + ' ' + this.positionWrapper + '"></div>');
                wrapper = this.element.parent();
            }

            if (this.options.alignment === 1) {
                wrapper.children(':not(:first-child)').each(function (index, element) {
                    this.setStyleIfNotExist(
                        $(element),
                        {
                            'marginLeft': this.options.margin + 'px'
                        }
                    );
                }.bind(this));
            } else {
                wrapper.children(':not(:first-child)').each(function (index, element) {
                    this.setStyleIfNotExist(
                        $(element),
                        {
                            'marginTop': this.options.margin + 'px'
                        }
                    );
                }.bind(this));
            }

            // clear styles before changing
            wrapper.css({
                'top': '',
                'left': '',
                'right': '',
                'bottom': '',
                'margin-top': '',
                'margin-bottom': '',
                'margin-left': '',
                'margin-right': ''
            });

            switch (this.options.position) {
                case 'top-left':
                    wrapper.css({
                        'top': 0,
                        'left': 0
                    });
                    break;
                case 'top-center':
                    wrapper.css({
                        'top': 0,
                        'left': 0,
                        'right': 0,
                        'margin-left': 'auto',
                        'margin-right': 'auto'
                    });
                    break;
                case 'top-right':
                    wrapper.css({
                        'top': 0,
                        'right': 0,
                        'text-align': 'right'
                    });
                    break;

                case 'middle-left':
                    wrapper.css({
                        'left': 0,
                        'top': 0,
                        'bottom': 0,
                        'margin-top': 'auto',
                        'margin-bottom': 'auto'
                    });
                    break;
                case 'middle-center':
                    wrapper.css({
                        'top': 0,
                        'bottom': 0,
                        'margin-top': 'auto',
                        'margin-bottom': 'auto',
                        'left': 0,
                        'right': 0,
                        'margin-left': 'auto',
                        'margin-right': 'auto'
                    });
                    break;
                case 'middle-right':
                    wrapper.css({
                        'top': 0,
                        'bottom': 0,
                        'margin-top': 'auto',
                        'margin-bottom': 'auto',
                        'right': 0,
                        'text-align': 'right'
                    });
                    break;

                case 'bottom-left':
                    wrapper.css({
                        'bottom': 0,
                        'left': 0
                    });
                    break;
                case 'bottom-center':
                    wrapper.css({
                        'bottom': 0,
                        'left': 0,
                        'right': 0,
                        'margin-left': 'auto',
                        'margin-right': 'auto'
                    });
                    break;
                case 'bottom-right':
                    wrapper.css({
                        'bottom': 0,
                        'right': 0,
                        'text-align': 'right'
                    });
                    break;
            }
        },

        /**
         * @param {jQuery} item
         * @return {jQuery | null}
         */
        getNewParent: function (item) {
            var imageContainer = null,
                productContainer = item.closest('.item.product');

            if (!productContainer.length) {
                productContainer = item.closest('.product-item');
            }

            if (productContainer && productContainer.length) {
                imageContainer = productContainer.find(this.options.path).first();
            }

            return imageContainer;
        },

        /**
         * @return {string}
         */
        getPriceSelector: function () {
            var notLabelObservered = ':not([label-observered-' + this.options.label + '])';

            return '[data-product-id="' + this.options.product + '"]' + notLabelObservered + ', ' +
                '[id="product-price-' + this.options.product + '"]' + notLabelObservered + ', ' +
                '[name="product"][value="' + this.options.product + '"]' + notLabelObservered;
        }
    });

    return $.mage.amShowLabel;
});
