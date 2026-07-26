/* eslint-disable no-extra-parens */
/**
 *  Amasty From To Filter
 */

define([
    'jquery',
    'underscore',
    'amShopbyFilterAbstract',
    'amShopbyHelpers',
    'Magento_Ui/js/modal/modal',
    'jquery-ui-modules/slider',
    'mage/tooltip',
    'mage/validation',
    'mage/translate',
    'Amasty_Shopby/js/jquery.ui.touch-punch.min',
    'Amasty_ShopbyBase/js/chosen/chosen.jquery',
    'amShopbyFiltersSync'
], function ($, _, amShopbyFilterAbstract, helpers) {
    'use strict';

    $.widget('mage.amShopbyFilterFromTo', amShopbyFilterAbstract, {
        selectors: {
            dataFromTo: '[data-amshopby-fromto="{mode}"]',
            range: '.range'
        },
        classes: {
            range: 'range'
        },
        from: null,
        to: null,
        value: null,
        timer: null,
        go: null,
        skip: false,

        /**
         * @private
         * @return {void}
         */
        _create: function () {
            var self = this,
                dataFromTo = this.selectors.dataFromTo,
                fromValue,
                toValue,
                newValue;

            this.setCurrency(this.options.curRate);

            this.value = this.element.find(dataFromTo.replace('{mode}', 'value'));
            this.from = this.element.find(dataFromTo.replace('{mode}', 'from'));
            this.to = this.element.find(dataFromTo.replace('{mode}', 'to'));
            this.go = this.element.find(dataFromTo.replace('{mode}', 'go'));

            fromValue = this._getInitialRange('from');
            toValue = this._getInitialRange('to');

            // eslint-disable-next-line operator-assignment
            this.options.min = this.options.min * this.options.curRate;
            // eslint-disable-next-line operator-assignment
            this.options.max = this.options.max * this.options.curRate;

            this.value.on('amshopby:sync_change', self.onSyncChange.bind(this));

            newValue = fromValue + '-' + toValue;

            this.value.trigger('amshopby:sync_change', [ [self.value.val() ? self.value.val() : newValue, true] ]);

            if (this.go.length > 0) {
                this.go.on('click', self.applyFilter.bind(this));
            }

            this.changeEvent(this.from, self.onChange.bind(this));
            this.changeEvent(this.to, self.onChange.bind(this));
            this.formValidate();
        },

        /**
         * @private
         * @param {String} value - 'from' or 'to'
         * @returns {String | Number}
         */
        _getInitialRange: function (value) {
            // eslint-disable-next-line no-nested-ternary
            return this.options[value] ? this.options[value] : (value === 'from' ? this.options.min : this.options.max);
        },

        /**
         * @public
         * @return {void}
         */
        formValidate: function () {
            var self = this,
                message = $.mage.__('Please enter a valid price range.'),
                parent;

            self.element.find('form').mage('validation', {
                errorPlacement: function (error, element) {
                    parent = element.parent();

                    if (parent.hasClass(self.classes.range)) {
                        parent.find(self.errorElement + '.' + self.errorClass).remove().end().append(error);
                    } else {
                        error.insertAfter(element);
                    }
                },
                messages: {
                    'am_shopby_filter_widget_attr_price_from': {
                        'greater-than-equals-to': message,
                        'validate-digits-range': message
                    },
                    'am_shopby_filter_widget_attr_price_to': {
                        'greater-than-equals-to': message,
                        'validate-digits-range': message
                    }
                }
            });
        },

        /**
         * @public
         * @param {Object} event
         * @return {void}
         */
        onChange: function (event) {
            var to = this.to.val() ? this.to.val() : this.options.max,
                from = this.from.val() ? this.from.val() : this.options.min,
                hideDigitsAfterDot = this.options.hideDigitsAfterDot,
                fromToInterval = this.checkFromTo(parseFloat(from).amToFixed(2, hideDigitsAfterDot), parseFloat(to).amToFixed(2, hideDigitsAfterDot)),
                oldVal = this.value.val(),
                oldValValues = oldVal.split('-'),
                newVal = fromToInterval.from.amToFixed(2, hideDigitsAfterDot) + '-' + fromToInterval.to.amToFixed(2, hideDigitsAfterDot),
                changed = !((fromToInterval.from === Number(oldValValues[0]))
                    && (fromToInterval.to === Number(oldValValues[1])));

            this.value.val(newVal);

            if (changed) {
                newVal = fromToInterval.from.amToFixed(2, hideDigitsAfterDot) + '-' + fromToInterval.to.amToFixed(2, hideDigitsAfterDot);

                this.value.val(newVal);
                this.value.trigger('change');
                this.value.trigger('sync');

                if (this.go.length === 0) {
                    this.renderShowButton(event, this.element[0]);
                    this.applyFilter();
                }
            }

            $(this.value).trigger('amshopby:price_from_to', {
                defaults: {
                    from: parseFloat(this.options.min),
                    to: parseFloat(this.options.max)
                },
                current: {
                    from: parseFloat(from),
                    to: parseFloat(to)
                },
            });
        },

        /**
         * @public
         * @param {Object} event
         * @return {void}
         */
        applyFilter: function (event) {
            var valueFrom = this.processPrice(true, this.from.val()),
                valueTo = this.processPrice(true, this.to.val()),
                fromToInterval = this.checkFromTo(valueFrom, valueTo),
                linkHref = this.options.url
                    .replace('amshopby_slider_from', fromToInterval.from.amToFixed(2, this.options.hideDigitsAfterDot))
                    .replace('amshopby_slider_to', fromToInterval.to.amToFixed(2, this.options.hideDigitsAfterDot));

            linkHref = this.getUrlWithDelta(
                linkHref,
                valueFrom,
                this.from.val(),
                valueTo,
                this.to.val(),
                this.options.deltaFrom,
                this.options.deltaTo
            );

            if (!this.isBaseCurrency()) {
                this.setDeltaParams(this.getDeltaParams(this.from.val(), valueFrom, this.to.val(), valueTo, false));
            }

            this.apply(linkHref);

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
        },

        /**
         * @public
         * @param {Object} event
         * @param {Array} values
         * @return {void}
         */
        onSyncChange: function (event, values) {
            var abstractWidgetOptions = $.mage.amShopbyFilterAbstract.prototype.options,
                value = values[0].split('-'),
                hideDigitsAfterDot = this.options.hideDigitsAfterDot,
                max = Number(this.options.max).amToFixed(2, hideDigitsAfterDot),
                min = Number(this.options.min).amToFixed(2, hideDigitsAfterDot),
                to = max,
                from = min,
                i;

            if (!this.isBaseCurrency() && _.isUndefined($.mage.amShopbyAjax)) {
                abstractWidgetOptions.deltaFrom = Number(this.options.deltaFrom);
                abstractWidgetOptions.deltaTo = Number(this.options.deltaTo);
            }

            for (i = 0; i < value.length; i++) {
                value[i] = this.processPrice(
                    false,
                    value[i],
                    abstractWidgetOptions[i === 0 ? 'deltaFrom' : 'deltaTo']
                ).amToFixed(2, hideDigitsAfterDot);
            }

            if (value.length === 2 && (value[0] || value[1])) {
                from = value[0] === '' ? 0 : parseFloat(value[0]).amToFixed(2, hideDigitsAfterDot);
                to = (value[1] === 0 || value[1] === '') ? this.options.max : parseFloat(value[1]).amToFixed(2, hideDigitsAfterDot);

                if (this.isDropDown()) {
                    to = Math.ceil(to);
                }
            }

            this.element.find(this.selectors.dataFromTo.replace('{mode}', 'from')).val(from);
            this.element.find(this.selectors.dataFromTo.replace('{mode}', 'to')).val(to);
        },

        /**
         * @public
         * @param {Number | String} from
         * @param {Number | String} to
         * @return {Object}
         */
        checkFromTo: function (from, to) {
            var interval = {},
                fromOld;

            // eslint-disable-next-line no-param-reassign
            from = parseFloat(from);
            // eslint-disable-next-line no-param-reassign
            to = parseFloat(to);

            interval.from = from < this.options.min ? this.options.min : from;
            interval.from = interval.from > this.options.max ? this.options.min : interval.from;
            interval.to = to > this.options.max ? this.options.max : to;
            interval.to = interval.to < this.options.min ? this.options.max : interval.to;

            if (parseFloat(interval.from) > parseFloat(interval.to)) {
                fromOld = interval.from;

                interval.from = interval.to;
                interval.to = fromOld;
            }

            interval.from = Number(interval.from);
            interval.to = Number(interval.to);

            return interval;
        },

        /**
         * trigger keyup on input with delay
         *
         * @param {Object} input
         * @param {Function} callback
         * @returns {void}
         */
        changeEvent: function (input, callback) {
            input.on('keyup input', function (event) {
                if (this.timer !== null) {
                    clearTimeout(this.timer);
                }

                if (this.go.length === 0) {
                    this.timer = setTimeout(callback(event), 1000);
                } else {
                    callback(event);
                }
            }.bind(this));
        },

        /**
         * @public
         * @return {Boolean}
         */
        isSlider: function () {
            return (typeof this.options.isSlider !== 'undefined' && this.options.isSlider);
        },

        /**
         * @public
         * @return {Boolean}
         */
        isDropDown: function () {
            return (typeof this.options.isDropdown !== 'undefined' && this.options.isDropdown);
        }
    });

    return $.mage.amShopbyFilterFromTo;
});
