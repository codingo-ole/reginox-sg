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

define(['jquery', 'Anowave_Ec/js/convert'], function ($, convert) 
{
	'use strict';
	
	return function (widget) 
	{
		$.widget('mage.priceBox', widget, 
		{
			map: {},
			reloadPrice: function reDrawPrices() 
			{
				this._super();
				
				let options = {};

				if ('undefined' !== typeof AEC)
				{
					let price = null;
					
					if (AEC.tax)
					{
						if (this.cache.displayPrices && this.cache.displayPrices.hasOwnProperty('finalPrice'))
						{
							price = this.cache.displayPrices.finalPrice.amount;
						}
					}
					else 
					{
						if (this.cache.displayPrices && this.cache.displayPrices.hasOwnProperty('basePrice'))
						{
							price = this.cache.displayPrices.basePrice.amount;
						}
					}

					if (price)
					{
						/**
						 * Pick button
						 */
						let button = document.querySelector('[id=product-addtocart-button]');
						
						if (button)
						{
							button.dataset.price = convert.convertPrice(price, button.dataset.rate).toFixed(2);
						}
	
						/**
						 * Pick button in listings (categories)
						 */
						let wrapper = document.querySelector('[id=product-item-info_' + this.options.productId + ']');

						if (wrapper)
						{
							wrapper.querySelectorAll('button.tocart').forEach(button => 
							{
								button.dataset.price = convert.convertPrice(price, button.dataset.rate).toFixed(2);
							});
						}
					}
				}
				
				[...document.querySelectorAll('input[data-selector]:checked')].filter(element => { return 0 === element.dataset.selector.indexOf('options')}).forEach(element => 
				{
					let label = document.querySelector('label[for="' + element.id + '"]');
					
					if (label)	
					{
						let value = label.querySelector('span').innerText.trim();
						
						if (value)
						{
							let control = element.closest('.control');
							
							if (control)
							{
								let label = control.parentNode.querySelector('label[for=' + element.id + ']').querySelector('span').innerText.trim();
								
								let key = label.split('').map(char => char.charCodeAt(0)).reduce((a, b) => a + b, 0);
								
								if (!options.hasOwnProperty(key))
								{
									options[key] = [];
								}
							
								options[key].push(
								{ 
									label:label, 
									value:value 
								});
							}
						}
					}	
				});
				
				if (Object.keys(options).length)
				{
					let payload = 
					{
						event: 'customize',
						eventData: []
					}
					Object.entries(options).forEach(([key, value]) => 
					{
						payload.eventData.push(value);
					});
					
					dataLayer.push(payload);
				}
			}
		});
		
		return $.mage.priceBox;
	}
});