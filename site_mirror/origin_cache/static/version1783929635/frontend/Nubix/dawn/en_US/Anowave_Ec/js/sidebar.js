/**
 * Magento 2 Google Analytics 4 (GA4) GTM
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Anowave license that is
 * available through the world-wide-web at this URL:
 * https://www.anowave.com/license-agreement/
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category 	Anowave
 * @package 	Anowave_Ec
 * @copyright 	Copyright (c) 2026 Anowave (https://www.anowave.com/)
 * @license  	https://www.anowave.com/license-agreement/
 */

define(['jquery'], function ($) 
{
    'use strict';
    
    return function (widget) 
    {
    	return $.widget('mage.sidebar', $.mage.sidebar, 
		{
    		_removeItemAfter:function (elem, response) 
        	{
        		if (response.hasOwnProperty('dataLayer') && 'undefined' !== typeof dataLayer)
        		{
        			AEC.Cookie.remove(response.dataLayer).push(dataLayer);
        		}
        		
        		return this._super(elem);
            },
            _updateItemQtyAfter: function (elem, response) 
            {
            	if (response.hasOwnProperty('dataLayer') && 'undefined' !== typeof dataLayer)
        		{
            		AEC.Cookie.update(response.dataLayer).push(dataLayer);
        		}
            	
            	return this._super(elem);
            }
        });
    }
});