define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    return {
        cache: new Map(),
        xhrRequest: null,
        selectors: {
            imageContainer: '.product-image-container',
            postDataElement: '.action[data-post]'
        },

        /**
         * @param {String | jQuery} container
         * @param {object} data
         *
         * @private
         */
        reloadLabels: function (container, data) {
            var self = this,
                postData;

            if (!data.labels) {
                return;
            }

            if (typeof container !== 'string') {
                var label = data.labels instanceof Object ? Object.values(data.labels)[0] : data.labels;

                container.find('.amasty-label-container').remove();
                label = container.last().after(label);
                label.trigger('contentUpdated');

                return;
            }

            $(container).each(function (index, item) {
                postData = JSON.parse($(item).find(self.selectors.postDataElement).attr('data-post'));

                $(item).find(self.selectors.imageContainer)
                    .after(data.labels[postData.data.product])
                    .trigger('contentUpdated');
            });
        },

        /**
         * @param {string} url
         * @param {object} params
         * @param {function} callback
         *
         * @private
         */
        doAjax: function (url, params, callback) {
            if (this.xhrRequest !== null) {
                this.xhrRequest.abort();
            }

            this.xhrRequest = $.ajax({
                url: url,
                data: params,
                method: 'GET',
                cache: true,
                dataType: 'json',
                showLoader: false,
                success: function (data) {
                    var cacheKey = this.generateCacheKey(params);

                    this.cache.set(cacheKey, data);
                    callback(data);
                }.bind(this)
            });
        },

        /**
         * @param {object} params
         *
         * @private
         */
        generateCacheKey: function (params) {
            var processedEntry;

            return Object.entries(params).reduce(function (carry, entry) {
                processedEntry = typeof entry[1] === 'object' ? entry[1].join('-') : entry[1];

                return carry + '_' + entry[0] + '_' + processedEntry;
            }, '');
        },

        /**
         * @param {String | jQuery} container
         * @param {number | Array} productId
         * @param {string} reloadUrl
         * @param {boolean} inProductList
         */
        reload: function (container, productId, reloadUrl, inProductList) {
            var imageBlock = $(container).find('.amasty-label-for-' + productId),
                params = {
                    product_ids: _.isArray(productId) ? productId.join(',') : productId,
                    in_product_list: inProductList
                },
                cacheKey = this.generateCacheKey(params);

            if (this.cache.has(cacheKey)) {
                this.reloadLabels(container, this.cache.get(cacheKey));
            } else {
                this.doAjax(reloadUrl, params, this.reloadLabels.bind(this, container));
            }

            imageBlock.show();
        }
    };
});
