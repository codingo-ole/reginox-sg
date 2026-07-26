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
 * @copyright  Copyright (c) 2018-2019 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */
define([
    'jquery'
], function ($) {
    "use strict";
    return function (config, element) {
        var selector = config.selector,
            outofStockSelector = '.stock.unavailable',
            check = true;
        if (config.showPrice) {
            $(element).parents('.product-info-main').find('.price-box.price-final_price').hide();
        }
        if ($(element).attr('id')) {
            var related = "#" + $(element).attr('id').replace("hide_price_text_","related-checkbox");
            $(element).parent().find(related).remove();
        }
        if (selector != "") {
            hidePrice(selector, $(element), 0);
        } else {
            hidePrice('.action.tocart', $(element), 0);
        }
        function hidePrice(sel, el, count)
        {
            if (el.parent().find(sel).length > 0 || el.parent().find(outofStockSelector).length > 0) {
                if (el.parent().find(sel).length > 0) {
                    el.parent().find(sel).parent().append(element);
                    el.parent().find(sel).remove();
                    check = false;
                } else {
                    el.parent().find(outofStockSelector).parent().append(element);
                    check = false;
                }

            } else {
                count++;
                if (count < 3 && check) {
                    el = el.parent();
                    hidePrice(sel, el, count);
                }
            }
        }
    }
});
