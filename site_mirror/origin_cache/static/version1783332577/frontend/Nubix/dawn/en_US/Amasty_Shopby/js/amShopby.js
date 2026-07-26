/* eslint-disable no-mixed-operators */
/**
 *  Amasty Filter Abstract
 */

define([
    'jquery',
    'underscore',
    'amShopbyHelpers',
    'Magento_Ui/js/modal/modal',
    'jquery-ui-modules/slider',
    'mage/tooltip',
    'mage/validation',
    'mage/translate',
    'Amasty_Shopby/js/jquery.ui.touch-punch.min',
    'Amasty_ShopbyBase/js/chosen/chosen.jquery',
    'amShopbyFiltersSync'
], function ($, _, helpers) {
    'use strict';

    $.widget('mage.amShopbyFilterAbstract', {
        filters: {},
        options: {
            isAjax: 0,
            collectFilters: 0,
            activeClass: '-active',
            clearUrl: null,
            delta: [],
            deltaFrom: 0,
            deltaTo: 0,
            curRate: '1',
            digitsAfterDot: 2
        },
        selectors: {
            fromToWidget: '[data-am-js="fromto-widget"]',
            filterForm: 'form[data-amshopby-filter]',
            filterFormAttr: 'form[data-amshopby-filter={attr}]',
            filterItems: '[class*="am-filter-items"]',
            sidebar: '.sidebar',
            topNav: '.catalog-topnav',
            filterOptionsContent: '.filter-options-content',
            filterOptionsItem: '.filter-options-item',
            ajaxOptionsSelectors: 'body.page-with-filter, body.catalogsearch-result-index, body.cms-index-index',
            filterRequestVar: '[data-amshopby-filter-request-var="cat"]',
            dFrom: 'df=',
            dTo: 'dt='
        },
        classes: {
            active: '-active',
            disabled: '-disabled',
            savedFilterValues: 'amshopby-saved-values',
            selected: 'amshopby-link-selected'
        },
        nodes: {
            ranges: $('[data-amshopby-js="price-ranges"]')
        },

        /**
         * @public
         * @return {Object}
         */
        getFilter: function () {
            return {
                'code': this.element.attr('amshopby-filter-code'),
                'value': this.element.attr('amshopby-filter-value')
            };
        },

        /**
         * @public
         * @param {String} link
         * @param {Boolean} [clearFilter]
         * @return {void}
         */
        apply: function (link, clearFilter) {
            var linkParam;

            try {
                if ($.mage.amShopbyAjax) {
                    $.mage.amShopbyAjax.prototype.response = null;
                }

                this.options.isAjax = $.mage.amShopbyAjax !== undefined;

                linkParam = clearFilter ? link : null;
                link = this.element?.parents('.price-ranges').length && link.includes('?')
                    ? link + '&price-ranges=1'
                    : link;

                if (!this.options.collectFilters && this.options.isAjax === true) {
                    this.prepareTriggerAjax(this.element, linkParam, clearFilter);
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (this.options.collectFilters === 1) {
                        this.prepareTriggerAjax(this.element, linkParam);
                    } else {
                        window.location = link;
                    }
                }
            } catch (e) {
                window.location = link;
            }
        },

        /**
         * @public
         * @param {String | null} element
         * @param {String | null} clearUrl
         * @param {Boolean | null} [clearFilter]
         * @param {Boolean} [isSorting]
         * @return {Array}
         */
        prepareTriggerAjax: function (element, clearUrl, clearFilter, isSorting) {
            let data = [],
                ajaxData;

            if (isSorting) {
                data.clearUrl = clearUrl;
            } else {
                data = this.prepareAjaxData(element, clearUrl, clearFilter, isSorting);
            }

            if (this.options.collectFilters) {
                ajaxData = _.clone(data);
                ajaxData.clearUrl = data.clearUrl;

                $.mage.amShopbyAjax.prototype.prevData = {
                    ajaxData: ajaxData,
                    clearFilter,
                    isSorting
                };

                if (!isSorting) {
                    data.isGetCounter = true;
                }
            }

            // eslint-disable-next-line no-param-reassign
            element = element || document;

            $(element).trigger('amshopby:submit_filters', {
                data: data,
                clearFilter: clearFilter,
                isSorting: isSorting
            });

            return data;
        },

        /**
         * @public
         * @param {String | null} element
         * @param {String | null} clearUrl
         * @param {Boolean | null} [clearFilter]
         * @param {Boolean} [isSorting]
         * @return {Array}
         */
        prepareAjaxData: function (element, clearUrl, clearFilter, isSorting) {
            var self = this,
                widgetInstance = $.mage.amShopbyFilterAbstract.prototype,
                selectors = this.selectors,
                forms = $(selectors.filterForm),
                attributeName,
                excludedFormSelector,
                existFields = [],
                savedFilters = [],
                $item,
                className,
                startPos,
                endPos,
                filterClass,
                isPriceType,
                serializeForms,
                isPriceExist,
                data;

            if (typeof this.element !== 'undefined' && clearFilter) {
                attributeName = this.selectors.filterFormAttr
                    .replace('{attr}', this.element
                        .closest(selectors.filterOptionsContent)
                        .find('form')
                        .data('amshopby-filter'));
                excludedFormSelector = (this.element.closest(selectors.sidebar).length === 0
                    ? selectors.topNav : selectors.sidebar) + ' ' + attributeName;

                forms = forms.not(excludedFormSelector);
            }

            forms.each(function (index, item) {
                $item = $(item);
                className = '';

                if ($item.closest(selectors.filterItems).length) {
                    className = $item.closest(selectors.filterItems)[0].className;
                } else if ($item.find(selectors.filterItems).length) {
                    className = $item.find(selectors.filterItems)[0].className;
                }

                startPos = className.indexOf('am-filter-items');
                endPos = className.indexOf(' ', startPos + 1) === -1 ? 100 : className.indexOf(' ', startPos + 1);
                filterClass = className.substring(startPos, endPos);
                isPriceType = $($item.closest(selectors.filterOptionsItem))
                    .find(selectors.fromToWidget).length;

                if (filterClass && existFields[filterClass] && !isPriceType) {
                    forms[index] = '';
                } else {
                    existFields[filterClass] = true;
                }

                if ($item.hasClass(self.classes.savedFilterValues)) {
                    savedFilters.push(forms[index]);
                    forms[index] = '';
                }
            });

            serializeForms = forms.serializeArray();
            isPriceExist = false;

            // eslint-disable-next-line consistent-return
            _.each(serializeForms, function (index, item) {
                if (item.name === 'amshopby[price][]') {
                    isPriceExist = true;

                    return false;
                }
            });

            if (!isPriceExist && savedFilters) {
                // eslint-disable-next-line no-shadow
                savedFilters.forEach(function (element) {
                    serializeForms.push($(element).serializeArray()[0]);
                });
            }

            data = this.normalizeData(serializeForms, isSorting, clearFilter);
            clearUrl = data.clearUrl ? data.clearUrl : clearUrl;

            if (widgetInstance.options.delta.length) {
                data = data.concat(widgetInstance.options.delta);
            }

            if ($(element).parents('.price-ranges').length) {
                data.push({name: 'price-ranges', value: 1});
            }

            data.clearUrl = clearUrl;

            return data;
        },

        /**
         * @public
         * @param {Array} data
         * @param {Boolean} [isSorting]
         * @param {Boolean} [clearFilter]
         * @return {Array}
         */
        normalizeData: function (data, isSorting, clearFilter) {
            var self = this,
                normalizedData = [],
                ajaxOptions = $(this.selectors.ajaxOptionsSelectors).amShopbyAjax('option'),
                clearUrl;

            _.each(data, function (item) {
                if (item && item.value.trim() !== '' && item.value !== '-1') {
                    // eslint-disable-next-line vars-on-top
                    var isNormalizeItem = _.find(normalizedData, function (normalizeItem) {
                        return normalizeItem.name === item.name && normalizeItem.value === item.value;
                    });

                    if (!isNormalizeItem) {
                        if (item.name === 'amshopby[price][]') {
                            item.value = self.normalizePrice(item.value);
                        }

                        normalizedData.push(item);

                        if (ajaxOptions.isCategorySingleSelect === 1
                            && item.name === 'amshopby[cat][]'
                            && +item.value !== +ajaxOptions.currentCategoryId
                            && !clearFilter
                            && !isSorting
                        ) {
                            clearUrl = $('*' + self.selectors.filterRequestVar + ' *[value="' + item.value + '"]')
                                .parent().find('a').attr('href');
                        }
                    }
                }
            });

            normalizedData = this.groupDataByName(normalizedData);

            if (clearUrl) {
                normalizedData.clearUrl = clearUrl;
            }

            return normalizedData;
        },

        /**
         * @public
         * @param {Array} formData
         * @return {Array}
         */
        groupDataByName: function (formData) {
            var hash = Object.create(null);

            return formData.reduce(function (result, currentValue) {
                if (!hash[currentValue.name]) {
                    hash[currentValue.name] = {};
                    hash[currentValue.name].name = currentValue.name;
                    result.push(hash[currentValue.name]);
                }

                if (hash[currentValue.name].value) {
                    hash[currentValue.name].value += ',' + currentValue.value;
                } else {
                    hash[currentValue.name].value = currentValue.value;
                }

                return result;
            }, []);
        },

        /**
         * @public
         * @return {Number}
         */
        getHideDigitsAfterDot: function () {
            var value = +$('[name="amshopby[price][]"]').first().attr('data-digits-after-dot');
            return Number.isNaN(value) ? 0 : value;
        },

        /**
         * @public
         * @param {Number} size
         * @return {String}
         */
        buildNumber: function (size) {
            var str = '1',
                i;

            for (i = 1; i <= size; i++) {
                str += '0';
            }

            return str;
        },

        /**
         * @public
         * @return {Boolean}
         */
        isPrice: function () {
            return typeof this.options.code != 'undefined' && this.options.code === 'price';
        },

        /**
         * @public
         * @param {Object} event
         * @param {Object} element
         * @return {void}
         */
        renderShowButton: function (event, element) {
            if ($.mage.amShopbyApplyFilters) {
                $.mage.amShopbyApplyFilters.prototype.renderShowButton(event, element);
            }
        },

        /**
         * @public
         * @param {Object} checkbox
         * @param {Object} parent
         * @return {void}
         */
        addListenerOnCheckbox: function (checkbox, parent) {
            checkbox.bind('click', {}, function (event) {
                event.stopPropagation();
                event.currentTarget.checked = !event.currentTarget.checked;
                parent.trigger('click');
            });
        },

        /**
         * @public
         * @param {Object} element - jQuery
         * @return {Boolean}
         */
        markAsSelected: function (element) {
            var self = this,
                $element = $(element);

            $element
                .closest('li')
                .find('a')
                .toggleClass(self.classes.selected, $element.prop('checked'));
        },

        /**
         * @public
         * @param {String} value
         * @return {String}
         */
        normalizePrice: function (value) {
            var result = value.split('-'),
                i;

            for (i = 0; i < result.length; i++) {
                if (typeof result[i] == 'undefined') {
                    result[i] = 0;
                }

                result[i] = this.processPrice(true, result[i]).amToFixed(2, this.getHideDigitsAfterDot());
            }

            return result.join('-').replace(/[ \r\n]/g, '');
        },

        /**
         * @public
         * @returns {Boolean}
         */
        isBaseCurrency: function () {
            return Number(this.options.curRate) === 1;
        },

        /**
         * @public
         * @param {Boolean} toBasePrice
         * @param {String | Number} input
         * @param {String | Number} [delta]
         * @returns {Number}
         */
        processPrice: function (toBasePrice, input, delta) {
            var rate = Number(this.options.curRate),
                inputPrice = Number(input);

            // eslint-disable-next-line no-param-reassign
            delta = typeof delta !== 'undefined' ? Number(delta) : 0;

            // eslint-disable-next-line no-nested-ternary
            return this.isBaseCurrency()
                ? inputPrice
                // eslint-disable-next-line no-extra-parens
                : (toBasePrice ? (inputPrice / rate) : ((inputPrice * rate) + delta));
        },

        /**
         * @public
         * @param {String | Number} calculatedCurrency
         * @param {String | Number} baseCurrency
         * @returns {String}
         */
        calculateDelta: function (calculatedCurrency, baseCurrency) {
            return (
                Number(calculatedCurrency) - (Number(baseCurrency).toFixed(2) * Number(this.options.curRate))
            ).toFixed(3);
        },

        /**
         * @public
         * @param {String} link
         * @param {String | Number} valueFrom - base currency price
         * @param {String | Number} from - processed price
         * @param {String | Number} valueTo - base currency price
         * @param {String | Number} to - processed price
         * @param {String} deltaFrom
         * @param {String} deltaTo
         * @return {String}
         */
        getUrlWithDelta: function (link, valueFrom, from, valueTo, to, deltaFrom, deltaTo) {
            var dFrom = this.selectors.dFrom,
                dTo = this.selectors.dTo;

            if (this.isBaseCurrency()) {
                return link;
            }

            if (link.indexOf(dFrom) !== -1 || link.indexOf(dTo) !== -1) {
                // eslint-disable-next-line no-param-reassign
                link = link.replace(
                    dFrom + parseFloat(deltaFrom).amToFixed(2, this.getHideDigitsAfterDot()),
                    dFrom + this.calculateDelta(from, valueFrom)
                )
                    .replace(
                        dTo + parseFloat(deltaTo).amToFixed(2, this.getHideDigitsAfterDot()),
                        dTo + this.calculateDelta(to, valueTo)
                    );
            } else {
                // eslint-disable-next-line no-param-reassign
                link += this.getDeltaParams(from, valueFrom, to, valueTo, true);
            }

            return link;
        },

        /**
         * @public
         * @param {String | Number} from
         * @param {String | Number} valueFrom
         * @param {String | Number} to
         * @param {String | Number} valueTo
         * @param {Boolean} isUrl
         * @returns {String | Array}
         */
        getDeltaParams: function (from, valueFrom, to, valueTo, isUrl) {
            var deltaFrom = this.calculateDelta(from, valueFrom),
                deltaTo = this.calculateDelta(to, valueTo),
                params = '';

            $.mage.amShopbyFilterAbstract.prototype.options.deltaFrom = deltaFrom;
            $.mage.amShopbyFilterAbstract.prototype.options.deltaTo = deltaTo;

            if (isUrl) {
                if (deltaFrom % 1 !== 0) {
                    params += '&df=' + deltaFrom;
                }

                if (deltaTo % 1 !== 0) {
                    params += '&dt=' + deltaTo;
                }

                return params;
            }

            return [
                { name: 'amshopby[df][]', value: deltaFrom },
                { name: 'amshopby[dt][]', value: deltaTo }
            ];
        },

        /**
         * @public
         * @param {Array} delta
         * @returns {void}
         */
        setDeltaParams: function (delta) {
            $.mage.amShopbyFilterAbstract.prototype.options.delta = delta instanceof Array ? delta : [];
        },

        /**
         * @public
         * @param {String | Number} curRate
         * @returns {void}
         */
        setCurrency: function (curRate) {
            this.options.curRate = curRate;
        },

        /**
         * @public
         * @param {Number} collectFilters
         * @returns {void}
         */
        setCollectFilters: function(collectFilters) {
            this.options.collectFilters = collectFilters;
        }
    });

    return $.mage.amShopbyFilterAbstract;
});
