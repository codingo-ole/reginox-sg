/**
 * Price filter Slider
 */

define([
    'jquery',
    'amShopbyFilterAbstract',
    'amshopby_color',
    'amShopbyHelpers',
    'jquery-ui-modules/slider',
    'mage/tooltip',
    'amShopbyFiltersSync'
], function ($, amShopbyFilterAbstract, colorHelper, helpers) {
    'use strict';

    $.widget('mage.amShopbyFilterSlider', amShopbyFilterAbstract, {
        options: {
            gradients: {}
        },
        selectors: {
            value: '[data-amshopby-slider-id="value"]',
            range: '.ui-slider-range',
            slider: '[data-amshopby-slider-id="slider"]',
            display: '[data-amshopby-slider-id="display"]',
            container: '[data-am-js="slider-container"]',
            tooltip: '[data-amshopby-js="slider-tooltip"]',
            corner: '[data-amshopby-js="slider-corner"]',
            handle: '.ui-slider-handle',
            topNav: '.amasty-catalog-topnav'
        },
        classes: {
            tooltip: 'amshopby-slider-tooltip',
            corner: 'amshopby-slider-corner',
            styleDefault: '-default',
            loaded: '-loaded'
        },
        attributes: {
            tooltip: 'slider-tooltip',
            corner: 'slider-corner'
        },
        slider: null,
        value: null,
        display: null,

        /**
         * @inheritDoc
         */
        _create: function () {
            helpers.jqueryWidgetCompatibility(
                'jquery/ui-modules/widgets/slider',
                'slider',
                function () {
                    this._initializeWidget();
                }.bind(this)
            );

            $.mage.amShopbyFilterAbstract.prototype.setCollectFilters(this.options.collectFilters);
        },

        /**
         * @private
         * @returns {void}
         */
        _initializeWidget: function () {
            var hideDigitsAfterDot = this.options.hideDigitsAfterDot,
                fromLabel = Number(this._getInitialFromTo('from')).amToFixed(2, hideDigitsAfterDot),
                toLabel = Number(this._getInitialFromTo('to')).amToFixed(2, hideDigitsAfterDot);

            this.setCurrency(this.options.curRate);
            this._initNodes();
            this._initColors();

            if (this.options.to) {
                this.value.val(fromLabel + '-' + toLabel);
            } else {
                this.value.trigger('change');
                this.value.trigger('sync');
            }

            fromLabel = this.processPrice(false, fromLabel, this.options.deltaFrom).amToFixed(2, hideDigitsAfterDot);
            toLabel = this.processPrice(false, toLabel, this.options.deltaTo).amToFixed(2, hideDigitsAfterDot);

            this._initSlider(fromLabel, toLabel);
            this._renderLabel(fromLabel, toLabel);
            this._setTooltipValue(this.slider, fromLabel, toLabel);
            this.value.on('amshopby:sync_change', this._onSyncChange.bind(this));

            if (this.options.hideDisplay) {
                this.display.hide();
            }
        },

        /**
         * @private
         * @param {String} value - 'from' or 'to'
         * @returns {String | Number}
         */ // eslint-disable-next-line consistent-return
        _getInitialFromTo: function (value) {
            // eslint-disable-next-line default-case
            switch (value) {
                case 'from':
                    return this.options.from && this.options.from >= this.options.min
                        ? this.options.from
                        : this.options.min;
                case 'to':
                    return this.options.to && this.options.to <= this.options.max
                        ? this.options.to
                        : this.options.max;
            }
        },

        /**
         * @private
         * @returns {void}
         */
        _initNodes: function () {
            this.value = this.element.find(this.selectors.value);
            this.slider = this.element.find(this.selectors.slider);
            this.display = this.element.find(this.selectors.display);
        },

        /**
         * @private
         * @returns {void}
         */
        _initColors: function () {
            var colors = this.options.colors,
                mainColor = colors.main,
                gradients = this.options.gradients;

            gradients.vertical = colorHelper.getGradient(mainColor, 'vertical');
            gradients.horizontal = colorHelper.getGradient(mainColor, 'horizontal');

            colors.shadow = colorHelper.getShadow(mainColor);
            colors.hover = colorHelper.getHover(mainColor);
        },

        /**
         * @private
         * @param {Number} fromLabel
         * @param {Number} toLabel
         * @returns {void}
         */
        _initSlider: function (fromLabel, toLabel) {
            this.slider.slider({
                step: (this.options.step ? this.options.step : 1) * +this.options.curRate,
                range: true,
                min: this.options.min * +this.options.curRate,
                max: this.options.max * +this.options.curRate,
                values: [+fromLabel, +toLabel],
                slide: this._onSlide.bind(this),
                change: this._onChange.bind(this)
            });

            this.handles = this.element.find(this.selectors.handle);
            this.range = this.element.find(this.selectors.range);

            if (this._isNotDefaultSlider()) {
                this._renderTooltips();
            }

            switch (this.options.style) {
                case '-volumetric':
                    this._initVolumetric();
                    break;
                case '-improved':
                    this._initImproved();
                    break;
                case '-light':
                    this._initLight();
                    break;
                case '-dark':
                    this._initDark();
                    break;
                default:
                    this._initDefault();
                    break;
            }

            this._initHandles();
            this.slider.addClass(this.classes.loaded);
        },

        /**
         * @private
         * @returns {void}
         */
        _initVolumetric: function () {
            $(this.tooltips).css({
                'background': this.options.gradients.horizontal
            });

            $(this.tooltipCorners).css({
                'background': this.options.gradients.horizontal,
                'border-color': this.options.colors.main
            });

            $(this.handles).css({
                'background': this.options.gradients.vertical,
                'box-shadow': this.options.colors.shadow
            });

            $(this.range).css({
                'background': this.options.gradients.horizontal
            });
        },

        /**
         * @private
         * @returns {void}
         */
        _initImproved: function () {
            $(this.tooltips).css({
                'background': this.options.colors.main,
                'border-color': this.options.colors.main
            });

            $(this.tooltipCorners).css({
                'background': this.options.colors.main,
                'border-color': this.options.colors.main
            });

            $(this.handles).css({
                'background': this.options.colors.main
            });

            $(this.range).css({
                'background': this.options.colors.main
            });
        },

        /**
         * @private
         * @returns {void}
         */
        _initDark: function () {
            $(this.tooltips).css({
                'background': this.options.colors.main,
                'border-color': this.options.colors.main
            });

            $(this.tooltipCorners).css({
                'background': this.options.colors.main,
                'border-color': this.options.colors.main
            });

            $(this.handles).css({
                'background': this.options.colors.main,
                'box-shadow': this.options.colors.shadow
            });

            $(this.range).css({
                'background': this.options.colors.main
            });
        },

        /**
         * @private
         * @returns {void}
         */
        _initLight: function () {
            $(this.tooltips).css({
                'color': this.options.colors.main
            });

            $(this.range).css({
                'background': this.options.colors.main
            });
        },

        /**
         * @private
         * @returns {void}
         */
        _initDefault: function () {
            $(this.handles).css({
                'background': this.options.colors.main
            });
        },

        /**
         * @private
         * @returns {void}
         */
        _initHandles: function () {
            var self = this,
                handles = self.handles,
                sliderStyle = self.options.style,
                mainColor = handles.css('background-color');

            if (sliderStyle === '-light') {
                mainColor = handles.css('border-color');
            }

            if (sliderStyle === '-volumetric') {
                mainColor = handles.css('background-image');
            }

            handles.on('mouseover', function () {
                if (self.options.style === '-light') {
                    $(this).css({
                        'border-color': self.options.colors.hover
                    });
                } else {
                    $(this).css({
                        'background': self.options.colors.hover
                    });
                }
            });

            handles.on('mouseout', function () {
                if (self.options.style === '-light') {
                    $(this).css({
                        'border-color': mainColor
                    });
                } else {
                    $(this).css({
                        'background': mainColor
                    });
                }
            });
        },

        /**
         * @private
         * @returns {Boolean}
         */
        _isNotDefaultSlider: function () {
            return this.options.style !== this.classes.styleDefault;
        },

        /**
         * @private
         * @param {Object} event
         * @param {Object} ui
         * @returns {Boolean}
         */
        _onChange: function (event, ui) {
            var rate;

            if (this.slider.skipOnChange !== true) {
                rate = $(ui.handle).closest(this.selectors.container).data('rate');

                this._setValue(
                    Number(ui.values[0]).amToFixed(2, this.options.hideDigitsAfterDot),
                    Number(ui.values[1]).amToFixed(2, this.options.hideDigitsAfterDot),
                    true,
                    rate
                );
            }

            return true;
        },

        /**
         * @private
         * @param {Object} event
         * @param {Object} ui
         * @returns {Boolean}
         */
        _onSlide: function (event, ui) {
            var valueFrom = this._parseValue(ui.values[0]),
                valueTo = this._parseValue(ui.values[1]);

            this._setValue(valueFrom, valueTo, false);
            this._renderLabel(valueFrom, valueTo);

            this._setTooltipValue(event.target, valueFrom, valueTo);

            return true;
        },

        /**
         * @private
         * @param {Object} event
         * @param {Array} values
         * @returns {void}
         */
        _onSyncChange: function (event, values) {
            var value = values[0].split('-'),
                valueFrom,
                valueTo;

            if (value.length === 2) {
                valueFrom = this._parseValue(value[0]);
                valueTo = this._parseValue(value[1]);

                this.slider.skipOnChange = true;

                this.slider.slider('values', [valueFrom, valueTo]);
                this._setValueWithoutChange(valueFrom, valueTo);
                this._setTooltipValue(this.slider, valueFrom, valueTo);
                this.slider.skipOnChange = false;
            }
        },

        /**
         * @private
         * @param {Number} from
         * @param {Number} to
         * @param {Boolean} apply
         * @returns {void}
         */
        _setValue: function (from, to, apply) {
            var valueFrom = this._parseValue(this.processPrice(true, from)),
                valueTo = this._parseValue(this.processPrice(true, to)),
                newValue,
                changedValue,
                linkHref;

            newValue = valueFrom + '-' + valueTo;
            changedValue = this.value.val() !== newValue;

            this.value.val(newValue);

            if (!this.isBaseCurrency()) {
                this.setDeltaParams(this.getDeltaParams(from, valueFrom, to, valueTo, false));
            }

            if (changedValue) {
                this.value.trigger('change');
                this.value.trigger('sync');
            }

            if (apply !== false) {
                newValue = valueFrom + '-' + valueTo;
                linkHref = this.options.url
                    .replace('amshopby_slider_from', valueFrom)
                    .replace('amshopby_slider_to', valueTo);

                linkHref = this.getUrlWithDelta(
                    linkHref,
                    valueFrom,
                    from,
                    valueTo,
                    to,
                    this.options.deltaFrom,
                    this.options.deltaTo
                );

                this.value.val(newValue);
                $.mage.amShopbyFilterAbstract.prototype.renderShowButton(0, this.element[0]);
                $.mage.amShopbyFilterAbstract.prototype.apply(linkHref);
            }

            $(this.value).trigger('amshopby:price_slider', {
                defaults: {
                    from: parseFloat(this.options.min),
                    to: parseFloat(this.options.max)
                },
                current: {
                    from: parseFloat(valueFrom),
                    to: parseFloat(valueTo)
                }
            });
        },

        /**
         * @private
         * @param {Number} from
         * @param {Number} to
         * @returns {void}
         */
        _setValueWithoutChange: function (from, to) {
            this.value.val(this._parseValue(from) + '-' + this._parseValue(to));
        },

        /**
         * @private
         * @param {String} from
         * @param {String} to
         * @returns {String}
         */
        _getLabel: function (from, to) {
            return this.options.template.replace('{from}', from.toString()).replace('{to}', to.toString());
        },

        /**
         * @private
         * @param {Number} from
         * @param {Number} to
         * @returns {void}
         */
        _renderLabel: function (from, to) {
            var valueFrom = this._parseValue(from),
                valueTo = this._parseValue(to);

            this.display.html(this._getLabel(valueFrom, valueTo));
        },

        /**
         * @private
         * @returns {Object}
         */
        _getTooltip: function () {
            return $('<span>', {
                'class': this.classes.tooltip,
                'data-amshopby-js': this.attributes.tooltip
            });
        },

        /**
         * @private
         * @returns {Object}
         */
        _getCorner: function () {
            return $('<span>', {
                'class': this.classes.corner,
                'data-amshopby-js': this.attributes.corner
            });
        },

        /**
         * @private
         * @returns {void}
         */
        _renderTooltips: function () {
            this.handles.prepend(this._getTooltip());
            this.handles.prepend(this._getCorner());
            this.tooltips = this.handles.find(this.selectors.tooltip);
            this.tooltipCorners = this.handles.find(this.selectors.corner);
        },

        /**
         * @private
         * @param {Object} element
         * @param {String} from
         * @param {String} to
         * @returns {void}
         */
        _setTooltipValue: function (element, from, to) {
            var handle = this.selectors.handle,
                tooltip = this.selectors.tooltip,
                currencySymbol = this.options.currencySymbol,
                currencyPosition = parseInt(this.options.currencyPosition),
                valueFrom = this._parseValue(from),
                valueTo = this._parseValue(to),
                firstElement = $(element).find(handle + ':first-of-type ' + tooltip),
                lastElement = $(element).find(handle + ':last-of-type ' + tooltip);

            if (!this._isNotDefaultSlider()) {
                return;
            }

            if (currencyPosition) {
                firstElement.html(valueFrom + currencySymbol);
                lastElement.html(valueTo + currencySymbol);
            } else {
                firstElement.html(currencySymbol + valueFrom);
                lastElement.html(currencySymbol + valueTo);
            }

            this._setTooltipOffset(firstElement, 'left');
            this._setTooltipOffset(lastElement, 'right');
        },

        /**
         * @private
         * @param {Object} tooltip - jQuery Element
         * @param {String} side - 'right' or 'left'
         * @returns {void}
         */
        _setTooltipOffset: function (tooltip, side) {
            var width = tooltip.width() / 2,
                sliderWidth = tooltip.closest(this.selectors.slider)[0].clientWidth,
                parent = tooltip.parent(),
                parentOffset = parent[0].offsetLeft,
                volumetricStyleOffset = this.options.style === '-volumetric' ? 3 : 0,
                offset,
                isFixed;

            offset = side === 'right' ? sliderWidth - parentOffset : parentOffset;

            offset += volumetricStyleOffset;

            isFixed = offset < width || width < 0;

            if (tooltip.closest(this.selectors.topNav) && width < 0) {
                parent.on('hover.amShopby', function () {
                    this._setTooltipOffset(tooltip, side);
                    parent.off('hover.amShopby');
                }.bind(this));
            }

            tooltip.css(side, isFixed ? -(offset > 3 ? offset : 3 + volumetricStyleOffset) : 'unset');
        },

        /**
         * @private
         * @param {String | Number} value
         * @returns {String}
         */
        _parseValue: function (value) {
            return parseFloat(value).amToFixed(2, this.options.hideDigitsAfterDot);
        },

        /**
         * @private
         * @param {String} value
         * @returns {String}
         */
        _replacePriceDelimiter: function (value) {
            return value.replace('.', ',');
        }
    });

    return $.mage.amShopbyFilterSlider;
});
