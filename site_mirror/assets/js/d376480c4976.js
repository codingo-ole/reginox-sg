if ('undefined' !== typeof AEC && 'undefined' !== typeof AEC.EventDispatcher)
{	
	AEC.GA4 = (() => 
	{
		return {
			enabled: false,
			transformCategories: function(category)
			{
				if (null === category)
				{
					return {};
				}
				
				let map = {}, categories = category.toString().split('/');
				
				if (categories)
				{
					map['item_category'] = categories.shift();
					
					if (categories.length)
					{
						let index = 1;
						
						categories.forEach(category => 
						{
							map['item_category' + (++index)] = category;
						});
					}
				}
				
				return map;
			},
			augmentCategories: function(product) 
			{
				if (product.hasOwnProperty('category'))
				{
					AEC.Cookie.augment([product]);
				}
				
				return this.transformCategories(product.category);
			},
			augmentItem: function(product)
			{
				let map = {};
				
				map['google_business_vertical'] = 'retail';
				
				Object.entries(product).forEach(([key, value]) => 
				{
					if (-1 === ['id','name','price','category','currency','variant','brand'].indexOf(key))
					{
						map[key] = value;
					}
				});
				
				return map;
			}
			
		}
	})();
	
	/**
	 * Modify checkout step option payloasd
	 */
	AEC.EventDispatcher.on('ec.checkout.step.option.data', data => 
	{
		if (!AEC.GA4.enabled)
		{
			return true;
		}

		switch(parseInt(data.ecommerce.checkout_option.actionField.step))
		{
			case AEC.Const.CHECKOUT_STEP_SHIPPING:
				
				data['event'] = 'add_shipping_info';
				
				if (AEC.GA4.quote.hasOwnProperty('coupon'))
				{
					data.ecommerce['coupon'] = AEC.GA4.quote.coupon;
				}
				
				data.ecommerce['currency'] = AEC.GA4.currency;
				
				data.ecommerce['items'] = AEC.Checkout.getPayload().ecommerce.items;
				
				data.ecommerce['shipping_tier'] = data.ecommerce.checkout_option.actionField.option;

				(data => 
				{
					let value = 0;

					data.ecommerce['items'].forEach(item => 
					{
						value += Number(item.price) * Number(item.quantity);
					});

					data.ecommerce['value'] = value;
		
				})(data);

				
				
				
				delete data.ecommerce.checkout_option;
				
				break;
				
			case AEC.Const.CHECKOUT_STEP_PAYMENT:
				
				data['event'] = 'add_payment_info';
				
				if (AEC.GA4.quote.hasOwnProperty('coupon'))
				{
					data.ecommerce['coupon'] = AEC.GA4.quote.coupon;
				}

				data.ecommerce['currency'] = AEC.GA4.currency;
				
				data.ecommerce['items'] = AEC.Checkout.getPayload().ecommerce.items;
				
				data.ecommerce['payment_type'] = data.ecommerce.checkout_option.actionField.option;

				(data => 
				{
					let value = 0;

					data.ecommerce['items'].forEach(item => 
					{
						value += Number(item.price) * Number(item.quantity);
					});

					data.ecommerce['value'] = value;
		
				})(data);

				
				
				delete data.ecommerce.checkout_option;
				
				break;
		}
	});
}