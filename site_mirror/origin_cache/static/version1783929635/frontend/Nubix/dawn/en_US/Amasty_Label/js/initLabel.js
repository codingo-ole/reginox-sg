/**
 * Initialize Module depends on the area
 * @return widget
 */

define([
    'jquery',
    'Amasty_Label/vendor/tooltipster/js/tooltipster.min',
    'Amasty_Label/js/label',
    'matchMedia',
    'domReady!'
// eslint-disable-next-line no-unused-vars
], function ($, tooltipster) {
    'use strict';

    $.widget('mage.amInitLabel', {
        options: {
            mode: null,
            isAdminArea: null,
            config: null,
            productId: null,
            selector: null
        },
        classes: {
            amSearchSection: 'amsearch-products-section'
        },
        tooltipVendorClass: 'tooltip',
        mediaBreakpoint: 'all and (max-width: 768px)',

        /**
         * @inheritDoc
         */
        _create: function () {
            var self = this,
                element = self.element.closest('.product-item, .item');

            // remove label duplication
            if (this.element.parent().hasClass(this.classes.amSearchSection)
                && this.element.parent().find(this.options.selector).length > 1) {
                return;
            }

            this.renderTooltip();

            // observe only on category pages and without swatches
            if (self.options.mode === 'prod'
                || self.options.isAdminArea
                || self.element.hasClass('amlabel-swatch')
                || self.isIE()
            ) {
                self.execLabel();
            } else if (self.options.mode === 'cat' && element.length && !self.element.hasClass('amlabel-swatch')) {
                self._handleIntersect(element);
            } else {
                self.execLabel();
            }
        },

        /**
         * Exec Amasty Label widget
         * @public
         * @returns {void}
         */
        execLabel: function () {
            this.element.amShowLabel(this.options.config);
        },

        /**
         * @public
         * @returns {Boolean}
         */
        isIE: function () {
            var ua = window.navigator.userAgent;

            return ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1;
        },

        /**
         * @public
         * @returns {void}
         */
        renderTooltip: function () {
            var tooltipOptions = this.options.config.tooltip,
                tooltipContent = decodeURIComponent(tooltipOptions.content);

            if (this._isHiddenOnMobile()) {
                return;
            }

            if (+tooltipOptions.status > 1 && tooltipContent && !this._isEmpty(tooltipContent)) {
                this.element.addClass(this.tooltipVendorClass).tooltipster({
                    theme: 'tooltipster-shadow',
                    interactive: true,
                    content: $('<span>', {
                        html: tooltipContent
                    }),
                    styles: {
                        backgroundColor: tooltipOptions.backgroundColor,
                        textColor: tooltipOptions.color
                    }
                });
            }
        },

        /**
         * @param {String} html
         * @private
         * @returns {Boolean}
         */
        _isEmpty: function (html) {
            return html === null || html.match(/^ *$/) !== null;
        },

        /**
         * @private
         * @returns {Boolean}
         */
        _isHiddenOnMobile: function () {
            return matchMedia(this.mediaBreakpoint).matches && +this.options.config.tooltip.status === 3;
        },

        /**
         * Use IntersectionObserver to lazy loading Amasty Label widget
         *
         * @param {Object} element
         * @protected
         * @returns {function}
         */
        _handleIntersect: function (element) {
            var self = this,
                observer;

            observer = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    self.execLabel();
                    observer.disconnect();
                }
            });

            observer.observe(element[0]);
        }
    });

    return $.mage.amInitLabel;
});
