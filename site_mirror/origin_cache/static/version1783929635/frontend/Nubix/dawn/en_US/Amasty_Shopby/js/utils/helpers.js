/**
 * ILN helpers
 */

define([
    'jquery'
], function ($) {
    'use strict';

    /**
     * Cut zeroes from value
     *
     * @param {Number} digits - signs after dot
     * @returns {String | Number}
     */
    // eslint-disable-next-line no-extend-native
    Number.prototype.amToFixed = function (digits, hideDigitsAfterDot) {
        var value = this.toFixed(digits);

        if (hideDigitsAfterDot && parseInt(value) == this) {
            value = parseInt(value)
        }

        return value;
    };

    return {
        /**
         * Compatibility with 2.4.4
         * Store jquery-ui-widget to $.ui if it not exist
         *
         * @public
         * @param {String} path - direct path to jquery widget file
         * @param {String} widget - widget name
         * @param {Function} callback
         * @returns {void}
         */
        jqueryWidgetCompatibility: function (path, widget, callback) {
            if ($.ui[widget]) {
                callback();

                return;
            }

            // eslint-disable-next-line global-require
            require([ path ], function (instance) {
                $.ui[widget] = instance;

                callback();
            });
        }
    };
});
