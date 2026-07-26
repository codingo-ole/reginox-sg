/**
 * BSS Commerce Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://bsscommerce.com/Bss-Commerce-License.txt
 *
 * @category   BSS
 * @package    Bss_HidePrice
 * @author     Extension Team
 * @copyright  Copyright (c) 2017-2021 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */
define([
    'jquery',
    'underscore',
    'jquery/jquery.parsequery'
], function ($, _) {
    'use strict';
    return function (widget) {

        $.widget('mage.SwatchRenderer', widget, {

            /**
             * Determine product id and related data
             *
             * @returns {{productId: *, isInProductView: bool}}
             * @private
             */
            _determineProductData: function () {
                // Check if product is in a list of products.
                var productId,
                    isInProductView = false;

                productId = this.element.parents('.product-item-details')
                    .find('.actions-primary [name=product]').val();

                if (!productId) {
                    // Check individual product.
                    productId = $('[name=product]').val();
                    isInProductView = productId > 0;
                }

                return {
                    productId: productId,
                    isInProductView: isInProductView
                };
            },

            /**
             * Event for swatch options
             *
             * @param {Object} $this
             * @param {Object} $widget
             * @private
             */
            _OnClick: function ($this, $widget) {
                $widget._super($this, $widget);

                if (this._checkChildProductHidePrice()) {
                    $widget._UpdateHidePrice($this);
                }
            },

            /**
             * Event for select
             *
             * @param {Object} $this
             * @param {Object} $widget
             * @private
             */
            _OnChange: function ($this, $widget) {
                $widget._super($this, $widget);

                if (this._checkChildProductHidePrice()) {
                    $widget._UpdateHidePrice($this);
                }

            },

            /**
             * Check configurable product has child product hide price ?
             */
            _checkChildProductHidePrice: function() {
                var childProductData = this.options.jsonConfig.hidePrice;
                return !!(!$.isEmptyObject(childProductData) && childProductData && childProductData.child && !$.isEmptyObject(childProductData.child));

            },

            _UpdateHidePrice: function (ele) {
                var $widget = this,
                    index = '',
                    currentEl = 'currentEl',
                    childProductData = this.options.jsonConfig.hidePrice,
                    $useHidePrice,
                    $showPrice,
                    $content,
                    $parentHidePrice,
                    $parentHidePriceContent;
                if ($('#hideprice').length) { //product page
                    if (ele.parents(".product-item-details").length > 0) {
                        ele.parents(".product-item-details").find(".super-attribute-select").each(function () {
                            var option_id = $(this).attr("option-selected");
                            if (typeof option_id === "undefined" && $(this).val() !== "") {
                                option_id = $(this).val();
                            }
                            if (option_id !== null && $(this).val() !== "") {
                                index += option_id + '_';
                            }
                        });
                        if (!childProductData.hasOwnProperty('parent_id')) {
                            return false;
                        }

                        var selector = childProductData['selector'];
                        var element = ele;
                        if (typeof element === "undefined") {
                            return false;
                        }
                        if (!childProductData['child'].hasOwnProperty(index)) {
                            $widget._ResetHidePriceProductList(element, selector);
                            return false;
                        }

                        $useHidePrice = childProductData['child'][index]['hide_price'];
                        $showPrice = childProductData['child'][index]['show_price'];
                        $content = childProductData['child'][index]['hide_price_content'];

                        if (!$useHidePrice) {
                            element.parents(".product-item-details").find('.action.tocart').show();
                            element.parents(".product-item-details").find(selector).show();
                            element.parents(".product-item-details").find('.action.tocart').show();
                            element.parents(".product-item-details").find(selector).show();
                            element.show();
                            element.html('');
                        } else {
                            element.parents(".product-item-details").find('.action.tocart').hide();
                            element.parents(".product-item-details").find(selector).hide();
                            element.parents(".product-item-details").find('.action.tocart').hide();
                            element.parents(".product-item-details").find(selector).hide();
                            if (!$showPrice) {
                                element.parents(".product-item-details").find('.price-box').hide();
                                element.parents(".product-item-details").find('.price-box').find('.price').html('')
                            } else {
                                element.parents(".product-item-details").find('.price-box').show();
                            }
                            if (element.parents('.product-item-details').find('.hide_price_text')) {
                                element.parents('.product-item-details').find('.hide_price_text').remove();
                            }
                            $($content).insertAfter(element.parents('.product-item-details').find('.price-box'));
                        }
                    } else {
                        ele.parents(".product-info-main").find(".super-attribute-select").each(function () {
                            $parentHidePrice = childProductData['hide_price_parent'];
                            $parentHidePriceContent = childProductData['hide_price_parent_content'];
                            var option_id = $(this).attr("option-selected");
                            if (typeof option_id === "undefined" && $(this).val() !== "") {
                                if ($parentHidePriceContent) {
                                    ele.parents(".product-info-main").find('#hideprice').css('display', 'none');
                                    ele.parents(".product-info-main").find('.hide_price_text').replaceWith($parentHidePriceContent);
                                }
                                option_id = $(this).val();
                            }
                            if (option_id !== null && $(this).val() !== "") {
                                index += option_id + '_';
                            }
                        });
                        if (typeof childProductData !== "undefined" && !$.isEmptyObject(childProductData) && childProductData.length !== 0) {
                            if (!childProductData['child'].hasOwnProperty(currentEl)) {
                                childProductData['child'][currentEl] = $('#hideprice').html();
                            }

                            if (!childProductData['child'].hasOwnProperty(index)) {
                                $widget._ResetHidePrice(ele.parents(".product-info-main"), childProductData['child'][currentEl],$parentHidePrice);
                                return false;
                            }
                            $useHidePrice = childProductData['child'][index]['hide_price'];
                            $showPrice = childProductData['child'][index]['show_price'];

                            $content = childProductData['child'][index]['hide_price_content'];
                            if (!$useHidePrice) {
                                if ($parentHidePriceContent){
                                    ele.parents(".product-info-main").find('#hideprice_price').css('display', 'block');
                                    ele.parents(".product-info-main").find('#hideprice').css('display', 'block');
                                    ele.parents(".product-info-main").find('.hide_price_text').hide();
                                }
                                ele.parents(".product-info-main").find('.price-box.price-final_price').css('display', 'block');
                                ele.parents(".product-info-main").find('#hideprice').html(childProductData['child'][currentEl]);
                                ele.parents(".product-info-main").find('#hideprice').find('.qty-changer').css('display', 'block');
                            } else {
                                if (!$showPrice) {
                                    ele.parents(".product-info-main").find('.price-box.price-final_price').css('display', 'none');
                                } else {
                                    ele.parents(".product-info-main").find('#hideprice_price').css('display', 'block');
                                    ele.parents(".product-info-main").find('.price-box.price-final_price').css('display', 'block');
                                }
                                if ($parentHidePrice) {
                                    ele.parents(".product-info-main").find('#hideprice').css('display', 'none');
                                    ele.parents(".product-info-main").find('.hide_price_text').replaceWith($content);
                                } else {
                                    ele.parents(".product-info-main").find('#hideprice #product-addtocart-button').replaceWith($content);
                                    ele.parents(".product-info-main").find('.hide_price_text').replaceWith($content);
                                }
                                ele.parents(".product-info-main").find('#hideprice').find('.qty-changer').css('display', 'none');
                            }
                        }
                    }

                } else { //category page
                    ele.parents(".product-item-details").find(".super-attribute-select").each(function () {
                        var option_id = $(this).attr("option-selected");
                        if (typeof option_id === "undefined" && $(this).val() !== "") {
                            option_id = $(this).val();
                        }
                        if (option_id !== null && $(this).val() !== "") {
                            index += option_id + '_';
                        }
                    });
                    if (!childProductData.hasOwnProperty('parent_id')) {
                        return false;
                    }

                    var selector = childProductData['selector'];
                    var element = ele.parents(".product-item-details").find('#hideprice_price' + childProductData['parent_id']);
                    if (typeof element === "undefined") {
                        return false;
                    }
                    if (!childProductData['child'].hasOwnProperty(index)) {
                        $widget._ResetHidePriceCategory(element, selector);
                        return false;
                    }

                    $useHidePrice = childProductData['child'][index]['hide_price'];
                    $showPrice = childProductData['child'][index]['show_price'];
                    $content = childProductData['child'][index]['hide_price_content'];

                    if (!$useHidePrice) {
                        element.parents(".product-item-details").find('.action.tocart').show();
                        element.parents(".product-item-details").find(selector).show();
                        element.parents(".product-item-details").find('.action.tocart').show();
                        element.parents(".product-item-details").find(selector).show();
                        element.show();
                    } else {
                        element.parents(".product-item-details").find('.action.tocart').hide();
                        element.parents(".product-item-details").find(selector).hide();
                        element.parents(".product-item-details").find('.action.tocart').hide();
                        element.parents(".product-item-details").find(selector).hide();
                        if (!$showPrice) {
                            element.hide();
                            element.find('.price').html('')
                        } else {
                            element.show();
                        }
                        if (element.parent().find('.hide_price_text')) {
                            element.parent().find('.hide_price_text').remove();
                        }
                        $($content).insertAfter(element);
                    }
                }
            },

            _ResetHidePrice: function (ele, currentEl,$parentHidePrice) {
                if ($parentHidePrice) {
                    ele.find('.price-box.price-final_price').css('display', 'none');
                } else {
                    ele.find('.price-box.price-final_price').css('display', 'block');
                }
                ele.find('#hideprice').html(currentEl);
                ele.find('#hideprice').find('.qty-changer').css('display', 'block');
            },

            _ResetHidePriceProductList: function (elm, selector) {
                elm.parents(".product-item-details").find('.action.tocart').show();
                elm.parents(".product-item-details").find(selector).show();
                elm.parents(".product-item-details").find('.action.tocart').show();
                elm.parents(".product-item-details").find(selector).show();
                elm.prev().html('');
            },

            _ResetHidePriceCategory: function (elm, selector) {
                elm.show();
                elm.parent().find('.action.tocart').show();
                elm.parent().find(selector).show();
                elm.parents(".product-item-details").find('.action.tocart').show();
                elm.parents(".product-item-details").find(selector).show();
                elm.prev().html('');
            },


            /**
             * Get product with minimum price from selected options.
             *
             * @param {Array} allowedProducts
             * @returns {String}
             * @private
             */
            _getAllowedProductWithMinPrice: function (allowedProducts) {
                var childProductData = this.options.jsonConfig.hidePrice;
                if (!$.isEmptyObject(childProductData) && childProductData && childProductData.child && !$.isEmptyObject(childProductData.child)) {
                    if (childProductData['hide_price_parent'] === true) {
                        _.each(childProductData.child, function (child) {
                            if (child['show_price'] === true) {
                                allowedProducts = $.grep(allowedProducts, function (value) {
                                    return value != child['entity'];
                                });
                            }
                        });
                    }
                }
                return this._super(allowedProducts);
            }
        });

        return $.mage.SwatchRenderer;
    }
});
