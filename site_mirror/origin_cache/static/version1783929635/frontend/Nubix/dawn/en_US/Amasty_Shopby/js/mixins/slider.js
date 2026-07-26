define([ 'jquery' ], function ($) {
    'use strict'; // eslint-disable-line

    var mixin = {
        /**
         * OVERRIDE
         *
         * @inheritDoc
         */
        _calculateNewMax: function () {
            var max = this.options.max,
                min = this._valueMin(),
                step = this.options.step,
                aboveMin = ( max - min ) / step * step;

            max = aboveMin + min;

            if ( max > this.options.max ) {
                // If max is not divisible by step, rounding off may increase its value
                max -= step;
            }

            this.max = parseFloat(max.toFixed( this._precision()));
        }
    };

    return function (target) {
        $.widget('ui.slider', target, mixin);

        return $.ui.slider;
    };
});
