/**
 *  Amasty Swatches Filter select
 */

define([
    'jquery'
], function ($) {
    'use strict';

    $.widget('mage.amShopbySwatchesChoose', {
        options: {
            listSwatches: {},
            swatchWidgetName: 'mageSwatchRenderer',
            newSwatchWidgetName: 'mage-SwatchRenderer'
        },
        selectors: {
            swatchOption: '[data-role^="swatch-option"]'
        },
        observerConfig: {
            attributes: true,
            childList: false,
            subtree: true
        },
        observer: null,

        /**
         * @inheritDoc
         */
        _create: function () {
            var self = this;

            if (!self.options.listSwatches.length) {
                return;
            }

            self.initObserver();

            self.element.find(self.selectors.swatchOption).each(function (index, element) {
                self.observer.observe(element, self.observerConfig);
            });
        },

        /**
         * @public
         * @return {void}
         */
        initObserver: function () {
            this.observer = new MutationObserver(this.observerCallback.bind(this));
        },

        /**
         * Waiting for the mageSwatchRenderer module to load
         *
         * @public
         * @param {array} mutationsList
         * @return {void}
         */
        observerCallback: function (mutationsList) {
            var self = this,
                swatchWidget;

            mutationsList.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-rendered') {
                    swatchWidget = self.getSwatchWidget(mutation);

                    $(self.options.listSwatches).each( function (id, attribute) {
                        if (!swatchWidget || !swatchWidget._EmulateSelected) {
                            return;
                        }

                        swatchWidget._EmulateSelected(attribute);
                    });
                }
            });
        },

        /**
         * @param {string} mutation
         * @returns {*|jQuery}
         */
        getSwatchWidget: function (mutation) {
            return $(mutation.target).data(this.options.swatchWidgetName)
                || $(mutation.target).data(this.options.newSwatchWidgetName);
        }
    });

    return $.mage.amShopbySwatchesChoose;
});
