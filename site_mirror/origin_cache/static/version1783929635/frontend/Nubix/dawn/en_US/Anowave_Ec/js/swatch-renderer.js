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
    	$.widget('mage.SwatchRenderer', widget, 
    	{
    		_UpdatePrice: function()
    		{
    			this._super();
    			
    			var context = this;
    			
    			if ('undefined' !== typeof AEC)
    			{
	    			(function(callback)
	    			{
	    				if ('undefined' !== typeof AEC && 'undefined' !== typeof AEC.Const && 'undefined' !== typeof dataLayer)
	    				{
		    				if (AEC.Const.COOKIE_DIRECTIVE)
		    				{
		    					AEC.CookieConsent.queue(callback).process();
		    				}
		    				else 
		    				{
		    					callback.apply(window,[]);
		    				}
	    				}
	    			})
	    			(
	    				(function(context)
	    				{
	    					if (context && 'undefined' !== typeof context.getProduct() && 'undefined' !== typeof AEC.CONFIGURABLE_SIMPLES)
	    					{
		    					var simple = {}, key = context.getProduct().toString();
		    					
		    					if (AEC.CONFIGURABLE_SIMPLES.hasOwnProperty(key))
		    					{
		    						simple = AEC.CONFIGURABLE_SIMPLES[key];
		    					}
		    					
		    					return function()
		    					{
		    						let list = 'Configurable swatch', item = 
	            						{
	            							item_id: 			AEC.simples ? simple.id : simple.parent,
	            							item_name:  		AEC.simples ? simple.name : simple.parent_name,
	            							item_list_name: 	list,
	            							item_list_id: 		list,
	            							price: 				Number(simple.price),
	            							quantity:			1
	            						};
	        						
	        						if (simple.hasOwnProperty('configurations'))
	        						{
	        							item['configurations'] = simple.configurations;
	        						}

									if (simple.hasOwnProperty('configurations'))
									{
										let variant = [];

										simple.configurations.forEach(configuration => 
										{
											variant.push(configuration.variant);
										});

										if (!AEC.simples)
										{
											item['item_variant'] = variant.join(',');
										}
									}
	        						
	        						dataLayer.push(
	        						{
	        							event:'view_item',
	        							ecommerce:
	        							{
	        								currency: AEC.currencyCode,
	        								value: item.price,
	    									items:
											[
												item
											]
	        							}
	        						});
		    						
		    						/**
	        						 * Update data-simple attribute
	        						 */
		    						$('[data-event="add_to_cart"]').data('simple-id', simple.id).attr('data-simple-id', simple.id);
		    						
		    						/**
	        						 * Facebook Pixel tracking
	        						 */
		    						if ("function" === typeof fbq)
		    		        		{
		    							fbq("track", "CustomizeProduct", { eventID: AEC.UUID.generate({ event: 'CustomizeProduct'}) });
		    		        		}
		    					}
		    				}
	    					else 
	    					{
	    						return function()
	    						{
	    							dataLayer.push({ 'event':'resetsSwatchSelection' });
	    						}
	    					}
	    					
	    				})(this)
	    			);
    			}
    		}
        });
    	
    	return $.mage.SwatchRenderer;
    }
});