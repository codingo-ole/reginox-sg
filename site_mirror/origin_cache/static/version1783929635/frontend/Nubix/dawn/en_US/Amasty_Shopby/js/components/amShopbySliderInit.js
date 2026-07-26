define([
    'jquery',
    'amShopbyFilterSlider'
], function ($) {
    'use strict';

    $.widget('mage.amShopbySliderInit', {
        options: {
            priceSliderOptions: {},
            filterCode: null
        },

        /**
         * @returns {void}
         */
        _create: function () {
            const selector = `[data-amshopby-filter="${this.options.filterCode}"] .amshopby-slider-container`;

            $(selector).amShopbyFilterSlider(this.options.priceSliderOptions);
        }
    });

    return $.mage.amShopbySliderInit;
});
