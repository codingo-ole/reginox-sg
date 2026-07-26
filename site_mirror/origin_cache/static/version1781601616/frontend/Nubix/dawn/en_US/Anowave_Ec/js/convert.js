define([], function () 
{
    'use strict';

    return {
        convertPrice: function(price, rate)
        {
            if (rate > 0 && 1 !== rate)
            {
                price *= rate;
            }

            return price;
        }
    }
});