(function(require){
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            directoryRegionUpdater: 'Magento_Directory/js/region-updater'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    waitSeconds: 0,
    map: {
        '*': {
            'ko': 'knockoutjs/knockout',
            'knockout': 'knockoutjs/knockout',
            'mageUtils': 'mage/utils/main',
            'rjsResolver': 'mage/requirejs/resolver',
            'jquery-ui-modules/core': 'jquery/ui-modules/core',
            'jquery-ui-modules/accordion': 'jquery/ui-modules/widgets/accordion',
            'jquery-ui-modules/autocomplete': 'jquery/ui-modules/widgets/autocomplete',
            'jquery-ui-modules/button': 'jquery/ui-modules/widgets/button',
            'jquery-ui-modules/datepicker': 'jquery/ui-modules/widgets/datepicker',
            'jquery-ui-modules/dialog': 'jquery/ui-modules/widgets/dialog',
            'jquery-ui-modules/draggable': 'jquery/ui-modules/widgets/draggable',
            'jquery-ui-modules/droppable': 'jquery/ui-modules/widgets/droppable',
            'jquery-ui-modules/effect-blind': 'jquery/ui-modules/effects/effect-blind',
            'jquery-ui-modules/effect-bounce': 'jquery/ui-modules/effects/effect-bounce',
            'jquery-ui-modules/effect-clip': 'jquery/ui-modules/effects/effect-clip',
            'jquery-ui-modules/effect-drop': 'jquery/ui-modules/effects/effect-drop',
            'jquery-ui-modules/effect-explode': 'jquery/ui-modules/effects/effect-explode',
            'jquery-ui-modules/effect-fade': 'jquery/ui-modules/effects/effect-fade',
            'jquery-ui-modules/effect-fold': 'jquery/ui-modules/effects/effect-fold',
            'jquery-ui-modules/effect-highlight': 'jquery/ui-modules/effects/effect-highlight',
            'jquery-ui-modules/effect-scale': 'jquery/ui-modules/effects/effect-scale',
            'jquery-ui-modules/effect-pulsate': 'jquery/ui-modules/effects/effect-pulsate',
            'jquery-ui-modules/effect-shake': 'jquery/ui-modules/effects/effect-shake',
            'jquery-ui-modules/effect-slide': 'jquery/ui-modules/effects/effect-slide',
            'jquery-ui-modules/effect-transfer': 'jquery/ui-modules/effects/effect-transfer',
            'jquery-ui-modules/effect': 'jquery/ui-modules/effect',
            'jquery-ui-modules/menu': 'jquery/ui-modules/widgets/menu',
            'jquery-ui-modules/mouse': 'jquery/ui-modules/widgets/mouse',
            'jquery-ui-modules/position': 'jquery/ui-modules/position',
            'jquery-ui-modules/progressbar': 'jquery/ui-modules/widgets/progressbar',
            'jquery-ui-modules/resizable': 'jquery/ui-modules/widgets/resizable',
            'jquery-ui-modules/selectable': 'jquery/ui-modules/widgets/selectable',
            'jquery-ui-modules/selectmenu': 'jquery/ui-modules/widgets/selectmenu',
            'jquery-ui-modules/slider': 'jquery/ui-modules/widgets/slider',
            'jquery-ui-modules/sortable': 'jquery/ui-modules/widgets/sortable',
            'jquery-ui-modules/spinner': 'jquery/ui-modules/widgets/spinner',
            'jquery-ui-modules/tabs': 'jquery/ui-modules/widgets/tabs',
            'jquery-ui-modules/tooltip': 'jquery/ui-modules/widgets/tooltip',
            'jquery-ui-modules/widget': 'jquery/ui-modules/widget',
            'jquery-ui-modules/timepicker': 'jquery/timepicker',
            'vimeo': 'vimeo/player',
            'vimeoWrapper': 'vimeo/vimeo-wrapper'
        }
    },
    shim: {
        'mage/adminhtml/backup': ['prototype'],
        'mage/captcha': ['prototype'],
        'mage/new-gallery': ['jquery'],
        'jquery/ui': ['jquery'],
        'matchMedia': {
            'exports': 'mediaCheck'
        },
        'magnifier/magnifier': ['jquery'],
        'vimeo/player': {
            'exports': 'Player'
        }
    },
    paths: {
        'jquery/validate': 'jquery/jquery.validate',
        'jquery/uppy-core': 'jquery/uppy/dist/uppy.min',
        'prototype': 'legacy-build.min',
        'jquery/jquery-storageapi': 'js-storage/storage-wrapper',
        'text': 'mage/requirejs/text',
        'domReady': 'requirejs/domReady',
        'spectrum': 'jquery/spectrum/spectrum',
        'tinycolor': 'jquery/spectrum/tinycolor',
        'jquery-ui-modules': 'jquery/ui-modules'
    },
    config: {
        text: {
            'headers': {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }
    }
};

require(['jquery'], function ($) {
    'use strict';

    $.noConflict();
});

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            'rowBuilder':             'Magento_Theme/js/row-builder',
            'toggleAdvanced':         'mage/toggle',
            'translateInline':        'mage/translate-inline',
            'sticky':                 'mage/sticky',
            'tabs':                   'mage/tabs',
            'collapsible':            'mage/collapsible',
            'dropdownDialog':         'mage/dropdown',
            'dropdown':               'mage/dropdowns',
            'accordion':              'mage/accordion',
            'loader':                 'mage/loader',
            'tooltip':                'mage/tooltip',
            'deletableItem':          'mage/deletable-item',
            'itemTable':              'mage/item-table',
            'fieldsetControls':       'mage/fieldset-controls',
            'fieldsetResetControl':   'mage/fieldset-controls',
            'redirectUrl':            'mage/redirect-url',
            'loaderAjax':             'mage/loader',
            'menu':                   'mage/menu',
            'popupWindow':            'mage/popup-window',
            'validation':             'mage/validation/validation',
            'breadcrumbs':            'Magento_Theme/js/view/breadcrumbs',
            'jquery/ui':              'jquery/compat',
            'cookieStatus':           'Magento_Theme/js/cookie-status'
        }
    },
    deps: [
        'mage/common',
        'mage/dataPost',
        'mage/bootstrap'
    ],
    config: {
        mixins: {
            'Magento_Theme/js/view/breadcrumbs': {
                'Magento_Theme/js/view/add-home-breadcrumb': true
            }
        }
    }
};

/* eslint-disable max-depth */
/**
 * Adds polyfills only for browser contexts which prevents bundlers from including them.
 */
if (typeof window !== 'undefined' && window.document) {
    /**
     * Polyfill localStorage and sessionStorage for browsers that do not support them.
     */
    try {
        if (!window.localStorage || !window.sessionStorage) {
            throw new Error();
        }

        localStorage.setItem('storage_test', 1);
        localStorage.removeItem('storage_test');
    } catch (e) {
        config.deps.push('mage/polyfill');
    }
}
/* eslint-enable max-depth */

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            escaper: 'Magento_Security/js/escaper'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            checkoutBalance:    'Magento_Customer/js/checkout-balance',
            address:            'Magento_Customer/js/address',
            changeEmailPassword: 'Magento_Customer/js/change-email-password',
            passwordStrengthIndicator: 'Magento_Customer/js/password-strength-indicator',
            zxcvbn: 'Magento_Customer/js/zxcvbn',
            addressValidation: 'Magento_Customer/js/addressValidation',
            showPassword: 'Magento_Customer/js/show-password',
            'Magento_Customer/address': 'Magento_Customer/js/address',
            'Magento_Customer/change-email-password': 'Magento_Customer/js/change-email-password',
            globalSessionLoader:    'Magento_Customer/js/customer-global-session-loader.js'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            quickSearch: 'Magento_Search/js/form-mini',
            'Magento_Search/form-mini': 'Magento_Search/js/form-mini'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            priceBox:             'Magento_Catalog/js/price-box',
            priceOptionDate:      'Magento_Catalog/js/price-option-date',
            priceOptionFile:      'Magento_Catalog/js/price-option-file',
            priceOptions:         'Magento_Catalog/js/price-options',
            priceUtils:           'Magento_Catalog/js/price-utils'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            compareList:            'Magento_Catalog/js/list',
            relatedProducts:        'Magento_Catalog/js/related-products',
            upsellProducts:         'Magento_Catalog/js/upsell-products',
            productListToolbarForm: 'Magento_Catalog/js/product/list/toolbar',
            catalogGallery:         'Magento_Catalog/js/gallery',
            catalogAddToCart:       'Magento_Catalog/js/catalog-add-to-cart'
        }
    },
    config: {
        mixins: {
            'Magento_Theme/js/view/breadcrumbs': {
                'Magento_Catalog/js/product/breadcrumbs': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            creditCardType: 'Magento_Payment/js/cc-type',
            'Magento_Payment/cc-type': 'Magento_Payment/js/cc-type'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            addToCart: 'Magento_Msrp/js/msrp'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            catalogSearch: 'Magento_CatalogSearch/form-mini'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            giftMessage:    'Magento_Sales/js/gift-message',
            ordersReturns:  'Magento_Sales/js/orders-returns',
            'Magento_Sales/gift-message':    'Magento_Sales/js/gift-message',
            'Magento_Sales/orders-returns':  'Magento_Sales/js/orders-returns'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            discountCode:           'Magento_Checkout/js/discount-codes',
            shoppingCart:           'Magento_Checkout/js/shopping-cart',
            regionUpdater:          'Magento_Checkout/js/region-updater',
            sidebar:                'Magento_Checkout/js/sidebar',
            checkoutLoader:         'Magento_Checkout/js/checkout-loader',
            checkoutData:           'Magento_Checkout/js/checkout-data',
            proceedToCheckout:      'Magento_Checkout/js/proceed-to-checkout',
            catalogAddToCart:       'Magento_Catalog/js/catalog-add-to-cart'
        }
    },
    shim: {
        'Magento_Checkout/js/model/totals' : {
            deps: ['Magento_Customer/js/customer-data']
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            configurable: 'Magento_ConfigurableProduct/js/configurable'
        }
    },
    config: {
        mixins: {
            'Magento_Catalog/js/catalog-add-to-cart': {
                'Magento_ConfigurableProduct/js/catalog-add-to-cart-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            requireCookie: 'Magento_Cookie/js/require-cookie',
            cookieNotices: 'Magento_Cookie/js/notices'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            downloadable: 'Magento_Downloadable/js/downloadable',
            'Magento_Downloadable/downloadable': 'Magento_Downloadable/js/downloadable'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            subscriptionStatusResolver: 'Magento_Newsletter/js/subscription-status-resolver',
            newsletterSignUp:  'Magento_Newsletter/js/newsletter-sign-up'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            bundleOption:   'Magento_Bundle/bundle',
            priceBundle:    'Magento_Bundle/js/price-bundle',
            slide:          'Magento_Bundle/js/slide',
            productSummary: 'Magento_Bundle/js/product-summary'
        }
    },
    config: {
        mixins: {
            'mage/validation': {
                'Magento_Bundle/js/validation': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            giftOptions:    'Magento_GiftMessage/js/gift-options',
            'Magento_GiftMessage/gift-options':    'Magento_GiftMessage/js/gift-options'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    deps: [],
    shim: {
        'chartjs/chartjs-adapter-moment': ['moment'],
        'chartjs/es6-shim.min': {},
        'hugerte/hugerte.min': {
            exports: 'hugerte',
            init: function () {
                'use strict';
                window.tinymce = window.hugerte;
                window.tinyMCE = window.hugerte;
                return window.hugerte;
            }
        }
    },
    paths: {
        'ui/template': 'Magento_Ui/templates'
    },
    map: {
        '*': {
            uiElement:      'Magento_Ui/js/lib/core/element/element',
            uiCollection:   'Magento_Ui/js/lib/core/collection',
            uiComponent:    'Magento_Ui/js/lib/core/collection',
            uiClass:        'Magento_Ui/js/lib/core/class',
            uiEvents:       'Magento_Ui/js/lib/core/events',
            uiRegistry:     'Magento_Ui/js/lib/registry/registry',
            consoleLogger:  'Magento_Ui/js/lib/logger/console-logger',
            uiLayout:       'Magento_Ui/js/core/renderer/layout',
            buttonAdapter:  'Magento_Ui/js/form/button-adapter',
            chartJs:        'chartjs/Chart.min',
            'chart.js':     'chartjs/Chart.min',
            tinymce:        'hugerte/hugerte.min',
            wysiwygAdapter: 'mage/adminhtml/wysiwyg/tiny_mce/tinymceAdapter'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    deps: [
        'Magento_Ui/js/core/app'
    ]
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            pageCache:  'Magento_PageCache/js/page-cache'
        }
    },
    deps: ['Magento_PageCache/js/form-key-provider']
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            groupedProduct: 'Magento_GroupedProduct/js/grouped-product'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            captcha: 'Magento_Captcha/js/captcha',
            'Magento_Captcha/captcha': 'Magento_Captcha/js/captcha'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            configurableVariationQty: 'Magento_InventoryConfigurableProductFrontendUi/js/configurable-variation-qty'
        }
    },
    config: {
        mixins: {
            'Magento_ConfigurableProduct/js/configurable': {
                'Magento_InventoryConfigurableProductFrontendUi/js/configurable': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            multiShipping: 'Magento_Multishipping/js/multi-shipping',
            orderOverview: 'Magento_Multishipping/js/overview',
            payment: 'Magento_Multishipping/js/payment',
            billingLoader: 'Magento_Checkout/js/checkout-loader',
            cartUpdate: 'Magento_Checkout/js/action/update-shopping-cart',
            multiShippingBalance: 'Magento_Multishipping/js/multi-shipping-balance'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            recentlyViewedProducts: 'Magento_Reports/js/recently-viewed'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/model/quote': {
                'Magento_InventoryInStorePickupFrontend/js/model/quote-ext': true
            },
            'Magento_Checkout/js/view/shipping-information': {
                'Magento_InventoryInStorePickupFrontend/js/view/shipping-information-ext': true
            },
            'Magento_Checkout/js/model/checkout-data-resolver': {
                'Magento_InventoryInStorePickupFrontend/js/model/checkout-data-resolver-ext': true
            },
            'Magento_Checkout/js/checkout-data': {
                'Magento_InventoryInStorePickupFrontend/js/checkout-data-ext': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    config: {
        mixins: {
            'Magento_Swatches/js/swatch-renderer': {
                'Magento_InventorySwatchesFrontendUi/js/swatch-renderer': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/action/select-payment-method': {
                'Magento_SalesRule/js/action/select-payment-method-mixin': true
            },
            'Magento_Checkout/js/model/shipping-save-processor': {
                'Magento_SalesRule/js/model/shipping-save-processor-mixin': true
            },
            'Magento_Checkout/js/action/place-order': {
                'Magento_SalesRule/js/model/place-order-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 */
var config = {
    map: {
        '*': {
            'cancelOrderModal': 'Magento_OrderCancellationUi/js/cancel-order-modal'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            'slick': 'Magento_PageBuilder/js/resource/slick/slick',
            'jarallax': 'Magento_PageBuilder/js/resource/jarallax/jarallax',
            'jarallaxVideo': 'Magento_PageBuilder/js/resource/jarallax/jarallax-video',
            'Magento_PageBuilder/js/resource/vimeo/player': 'vimeo/player',
            'Magento_PageBuilder/js/resource/vimeo/vimeo-wrapper': 'vimeo/vimeo-wrapper',
            'jarallax-wrapper': 'Magento_PageBuilder/js/resource/jarallax/jarallax-wrapper'
        }
    },
    shim: {
        'Magento_PageBuilder/js/resource/slick/slick': {
            deps: ['jquery']
        },
        'Magento_PageBuilder/js/resource/jarallax/jarallax-video': {
            deps: ['jarallax-wrapper', 'vimeoWrapper']
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    shim: {
        cardinaljs: {
            exports: 'Cardinal'
        },
        cardinaljsSandbox: {
            exports: 'Cardinal'
        }
    },
    paths: {
        cardinaljsSandbox: 'https://includestest.ccdc02.com/cardinalcruise/v1/songbird',
        cardinaljs: 'https://songbird.cardinalcommerce.com/edge/v1/songbird'
    }
};


require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            transparent: 'Magento_Payment/js/transparent',
            'Magento_Payment/transparent': 'Magento_Payment/js/transparent'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            orderReview: 'Magento_Paypal/js/order-review',
            'Magento_Paypal/order-review': 'Magento_Paypal/js/order-review',
            paypalCheckout: 'Magento_Paypal/js/paypal-checkout'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    config: {
        mixins: {
            'Magento_Customer/js/customer-data': {
                'Magento_Persistent/js/view/customer-data-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            loadPlayer: 'Magento_ProductVideo/js/load-player',
            fotoramaVideoEvents: 'Magento_ProductVideo/js/fotorama-add-video-events',
            'vimeoWrapper': 'vimeo/vimeo-wrapper'
        }
    },
    shim: {
        vimeoAPI: {},
        'Magento_ProductVideo/js/load-player': {
            deps: ['vimeoWrapper']
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/action/place-order': {
                'Magento_CheckoutAgreements/js/model/place-order-mixin': true
            },
            'Magento_Checkout/js/action/set-payment-information': {
                'Magento_CheckoutAgreements/js/model/set-payment-information-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

// eslint-disable-next-line no-unused-vars
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/model/place-order': {
                'Magento_ReCaptchaCheckout/js/model/place-order-mixin': true
            },
            'Magento_ReCaptchaWebapiUi/js/webapiReCaptchaRegistry': {
                'Magento_ReCaptchaCheckout/js/webapiReCaptchaRegistry-mixin': true
            }
        }
    }
};


require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

/*eslint strict: ["error", "global"]*/

'use strict';

var config = {
    config: {
        mixins: {
            'Magento_Ui/js/view/messages': {
                'Magento_ReCaptchaFrontendUi/js/ui-messages-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

// eslint-disable-next-line no-unused-vars
var config = {
    config: {
        mixins: {
            'Magento_Paypal/js/view/payment/method-renderer/payflowpro-method': {
                'Magento_ReCaptchaPaypal/js/payflowpro-method-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

// eslint-disable-next-line no-unused-vars
var config = {
    config: {
        mixins: {
            'jquery': {
                'Magento_ReCaptchaWebapiUi/js/jquery-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            scriptLoader: 'Magento_PaymentServicesPaypal/js/lib/script-loader-wrapper',
            paymentSdkLoader: 'Magento_PaymentServicesPaypal/js/lib/payment-sdk-loader',
        }
    },
    shim: {
        'Magento_PaymentServicesPaypal/js/lib/script-loader': {
            init: function () {
                'use strict';

                return {
                    load: window.paypalLoadScript,
                    loadCustom: window.paypalLoadCustomScript
                };
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2022 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 */

var config = {
    map: {
        '*': {
            'Magento_Vault/js/view/payment/vault': 'Magento_PaymentServicesPaypal/js/view/payment/vault'
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/model/payment-service': {
                'Magento_PaymentServicesPaypal/js/model/payment-service-mixin': true
            },
            'Magento_Checkout/js/model/step-navigator': {
                'Magento_PaymentServicesPaypal/js/model/step-navigator-mixin': true
            },
            'Magento_Checkout/js/view/form/element/email': {
                'Magento_PaymentServicesPaypal/js/view/form/element/email-mixin': true
            },
            'Magento_Checkout/js/view/shipping': {
                'Magento_PaymentServicesPaypal/js/view/shipping-mixin': true
            },
            'Magento_Checkout/js/view/shipping-information': {
                'Magento_PaymentServicesPaypal/js/view/shipping-information-mixin': true
            }
        }
    },
    paths: {
        fastlane: 'https://www.paypalobjects.com/connect-boba'
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            mageTranslationDictionary: 'Magento_Translation/js/mage-translation-dictionary'
        }
    },
    deps: [
        'mageTranslationDictionary'
    ]
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            editTrigger: 'mage/edit-trigger',
            addClass: 'Magento_Translation/js/add-class',
            'Magento_Translation/add-class': 'Magento_Translation/js/add-class'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/view/payment/list': {
                'Magento_PaypalCaptcha/js/view/payment/list-mixin': true
            },
            'Magento_Paypal/js/view/payment/method-renderer/payflowpro-method': {
                'Magento_PaypalCaptcha/js/view/payment/method-renderer/payflowpro-method-mixin': true
            },
            'Magento_Captcha/js/view/checkout/defaultCaptcha': {
                'Magento_PaypalCaptcha/js/view/checkout/defaultCaptcha-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            'taxToggle': 'Magento_Weee/js/tax-toggle',
            'Magento_Weee/tax-toggle': 'Magento_Weee/js/tax-toggle'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    map: {
        '*': {
            wishlist:       'Magento_Wishlist/js/wishlist',
            addToWishlist:  'Magento_Wishlist/js/add-to-wishlist',
            wishlistSearch: 'Magento_Wishlist/js/search'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    config: {
        mixins: {
            'Amasty_Conf/js/swatch-renderer': {
                'Amasty_Label/js/configurable/swatch-renderer': true
            },
            'Magento_Swatches/js/swatch-renderer': {
                'Amasty_Label/js/configurable/swatch-renderer': true
            },
            'Amasty_Conf/js/configurable': {
                'Amasty_Label/js/configurable/configurable': true
            },
            'Magento_ConfigurableProduct/js/configurable': {
                'Amasty_Label/js/configurable/configurable': true
            }
        }
    },

    map: {
        '*': {
            amInitLabelUi: 'Amasty_Label/js/uiWidget/amLoadUiLabel'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    map: {
        '*': {
            amSplide413: 'Amasty_LibSplideJs/4.1.3/js/splide/splide.min',
            splideStyleLoader: 'Amasty_LibSplideJs/js/splide-style-loader'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    map: {
        '*': {
            amShopbyTooltipInit: 'Amasty_ShopbyBase/js/components/am-tooltip-init'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    map: {
        '*': {
            amBrandsSearch: 'Amasty_ShopbyBrand/js/components/ambrands-search',
            amBrandsFilterInit: 'Amasty_ShopbyBrand/js/components/ambrands-filter-init',
            amBrandsFilter: 'Amasty_ShopbyBrand/js/brand-filter',
        }
    },
    config: {
        mixins: {
            'mage/menu': {
                'Amasty_ShopbyBrand/js/lib/mage/ambrands-menu-mixin': true
            }
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    map: {
        "*": {
            amfancybox: 'Amasty_Storelocator/vendor/fancybox/jquery.fancybox.min',
            amLocator: 'Amasty_Storelocator/js/main',
            chosen: 'Amasty_Storelocator/vendor/chosen/chosen.min'
        }
    },
    shim: {
        'Amasty_Storelocator/vendor/fancybox/jquery.fancybox.min': ['jquery'],
        'Amasty_Storelocator/vendor/chosen/chosen.min': [ 'jquery' ],
        'Amasty_Storelocator/js/main': [ 'jquery-ui-modules/slider' ]
    }
};

require.config(config);
})();
(function() {
var config = 
{
    config: 
    {
        mixins: 
        {
        	'Magento_Checkout/js/action/select-payment-method':
			{
				'Anowave_Ec/js/action/select-payment-method':true
			},
			'Magento_Checkout/js/action/select-shipping-method':
			{
				'Anowave_Ec/js/action/select-shipping-method':true
			},
			'Magento_Checkout/js/action/place-order': 
			{
			    'Anowave_Ec/js/action/place-order': true
			},
            'Magento_Checkout/js/model/step-navigator': 
            {
                'Anowave_Ec/js/step-navigator/plugin': true
            },
            'Magento_Checkout/js/view/shipping-information': 
			{
			    'Anowave_Ec/js/view/shipping-information': true
			},
            'Magento_Customer/js/action/check-email-availability':
			{
				'Anowave_Ec/js/action/check-email-availability':true
			},
			'Magento_Checkout/js/sidebar':
            {
            	'Anowave_Ec/js/sidebar': true
            },
            'Magento_Catalog/js/price-box':
            {
            	'Anowave_Ec/js/price-box': true
            },
            'Magento_SalesRule/js/view/payment/discount':
            {
            	'Anowave_Ec/js/discount': true
            },
            'Magento_ConfigurableProduct/js/configurable':
            {
            	'Anowave_Ec/js/configurable': true
            },
    		'Magento_Swatches/js/swatch-renderer':
    		{
    			'Anowave_Ec/js/swatch-renderer': true
    		},
    		'Magento_Wishlist/js/view/wishlist':
    		{
    			'Anowave_Ec/js/view/wishlist': true
    		},
			'Magento_Paypal/js/in-context/express-checkout-wrapper':
    		{
    			'Anowave_Ec/js/express': true
    		}
        }
    }
};
require.config(config);
})();
(function() {
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
var config = {
    config: {
        mixins: {
            "Magento_Catalog/js/product/addtocart-button" : {
                "Bss_HidePrice/js/product/addtocart-button": true
            },
            "Magento_Swatches/js/swatch-renderer" : {
                "Bss_HidePrice/js/swatch-renderer": true
            },
            "Magento_ConfigurableProduct/js/configurable" : {
                "Bss_HidePrice/js/configurable": true
            },
            "Magento_Bundle/js/price-bundle" : {
                "Bss_HidePrice/js/price-bundle" : true
            },
            "Magento_Bundle/js/product-summary" : {
                "Bss_HidePrice/js/product-summary": true
            },
        }
    },
    "map": {
        "*": {
            "Magento_Catalog/template/product/addtocart-button.html":
                "Bss_HidePrice/template/product/addtocart-button.html"
        }
    }
};

require.config(config);
})();
(function() {
/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the MIT License
 * It is available through the world-wide-web at this URL:
 * https://tldrlegal.com/license/mit-license
 * If you are unable to obtain it through the world-wide-web, please send an email
 * to support@buckaroo.nl so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this module to newer
 * versions in the future. If you wish to customize this module for your
 * needs please contact support@buckaroo.nl for more information.
 *
 * @copyright Copyright (c) Buckaroo B.V.
 * @license   https://tldrlegal.com/license/mit-license
 */
var config = {
    config: {
        mixins: {
            'Buckaroo_Magento2/js/action/place-order': {
                'Buckaroo_Magento2/js/action/amasty-place-order-mixin': true
            },
        },
    },
    map: {
        '*': {
            "BuckarooSDK": "//checkout.buckaroo.nl/api/buckaroosdk/script",
            // "BuckarooSDK": "//testcheckout.buckaroo.nl/api/buckaroosdk/script",
            "buckaroo/applepay/catalog-cart-view": "Buckaroo_Magento2/js/view/checkout/applepay/catalog-cart-view",
            "buckaroo/applepay/catalog-product-view": "Buckaroo_Magento2/js/view/checkout/applepay/catalog-product-view",
            "buckaroo/applepay/pay": "Buckaroo_Magento2/js/view/checkout/applepay/pay",
            "buckaroo/applepay/billing-handler": "Buckaroo_Magento2/js/view/checkout/applepay/handlers/billing-handler",
            "buckaroo/applepay/shipping-handler": "Buckaroo_Magento2/js/view/checkout/applepay/handlers/shipping-handler",
            "buckaroo/applepay/order-handler": "Buckaroo_Magento2/js/view/checkout/applepay/handlers/order-handler",
            "buckaroo/payconiq/pay": "Buckaroo_Magento2/js/view/checkout/payconiq/pay",
            "buckaroo/mrcash/pay": "Buckaroo_Magento2/js/view/checkout/mrcash/pay",
            "BuckarooClientSideEncryption": "//static.buckaroo.nl/script/ClientSideEncryption001.js",
            "BuckarooHostedFieldsSdkAlpha": "//hostedfields-externalapi.alpha.buckaroo.aws/v1/sdk",
            "BuckarooHostedFieldsSdk": "//hostedfields-externalapi.prod-pci.buckaroo.io/v1/sdk",
            "buckaroo/checkout/common": "Buckaroo_Magento2/js/view/checkout/common",
            "buckaroo/checkout/datepicker": "Buckaroo_Magento2/js/view/checkout/datepicker",
            "buckaroo/paypal-express/pay": "Buckaroo_Magento2/js/view/checkout/paypal-express/pay",
            "buckaroo/paypal-express/button": "Buckaroo_Magento2/js/view/checkout/paypal-express/button",
            "buckaroo/ideal-fast-checkout/pay": "Buckaroo_Magento2/js/view/checkout/ideal-fast-checkout/pay",
        }
    },
    shim: {
        'BuckarooSDK': {
            deps: ['jquery']
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    paths: {
        'ui/template/group/group': 'Flekto_Postcode/template/group/group'
    },
    config: {
        mixins: {
            'Magento_Ui/js/lib/validation/validator': {
                'Flekto_Postcode/js/validation/validator-mixin': true,
            },
        },
    },
};

require.config(config);
})();
(function() {
/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
 var config = {
 	map: {
 		'*': {
 			lofallOwlCarousel: 'Lof_All/lib/owl.carousel/owl.carousel.min',
 			lofallBootstrap: 'Lof_All/lib/bootstrap/js/bootstrap.min',
 			lofallColorbox: 'Lof_All/lib/colorbox/jquery.colorbox.min',
 			lofallFancybox: 'Lof_All/lib/fancybox/jquery.fancybox.pack',
 			lofallFancyboxMouseWheel: 'Lof_All/lib/fancybox/jquery.mousewheel-3.0.6.pack'
 		}
 	},
 	shim: {
        'Lof_All/lib/bootstrap/js/bootstrap.min': {
            'deps': ['jquery']
        },
        'Lof_All/lib/bootstrap/js/bootstrap': {
            'deps': ['jquery']
        },
        'Lof_All/lib/owl.carousel/owl.carousel': {
            'deps': ['jquery']
        },
        'Lof_All/lib/owl.carousel/owl.carousel.min': {
        	'deps': ['jquery']
        },
        'Lof_All/lib/fancybox/jquery.fancybox': {
            'deps': ['jquery']  
        },
        'Lof_All/lib/fancybox/jquery.fancybox.pack': {
            'deps': ['jquery']  
        },
        'Lof_All/lib/colorbox/jquery.colorbox': {
            'deps': ['jquery']  
        },
        'Lof_All/lib/colorbox/jquery.colorbox.min': {
            'deps': ['jquery']  
        }
    }
 };
require.config(config);
})();
(function() {
/*
 * Landofcoder
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Landofcoder.com license that is
 * available through the world-wide-web at this URL:
 * https://landofcoder.com/terms
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category   Landofcoder
 * @package    Lof_Formbuilder
 * @copyright  Copyright (c) 2021 Landofcoder (https://www.landofcoder.com/)
 * @license    https://landofcoder.com/terms
 */
 var config = {
 	map: {
 		'*': {
 			lofallOwlCarousel: 'Lof_All/lib/owl.carousel/owl.carousel.min',
 			lofallBootstrap: 'Lof_All/lib/bootstrap/js/bootstrap.min',
 			lofallColorbox: 'Lof_All/lib/colorbox/jquery.colorbox.min',
 			lofallFancybox: 'Lof_All/lib/fancybox/jquery.fancybox.pack',
 			lofallFancyboxMouseWheel: 'Lof_All/lib/fancybox/jquery.mousewheel-3.0.6.pack',
            lofDigitalSignatureApp: 'Lof_Formbuilder/js/signature_app'
 		}
 	},
    paths: {
		'lofFieldDigitalSignature'			: 'Lof_Formbuilder/lib/digital_signature/js/signature_pad.umd'
	},
 	shim: {
        'lofFieldDigitalSignature': {
			deps: ['jquery']
		},
        'Lof_All/lib/bootstrap/js/bootstrap.min': {
            'deps': ['jquery']
        },
        'Lof_All/lib/bootstrap/js/bootstrap': {
            'deps': ['jquery']
        },
        'Lof_All/lib/owl.carousel/owl.carousel': {
            'deps': ['jquery']
        },
        'Lof_All/lib/owl.carousel/owl.carousel.min': {
        	'deps': ['jquery']
        },
        'Lof_All/lib/fancybox/jquery.fancybox': {
            'deps': ['jquery']
        },
        'Lof_All/lib/fancybox/jquery.fancybox.pack': {
            'deps': ['jquery']
        },
        'Lof_All/lib/colorbox/jquery.colorbox': {
            'deps': ['jquery']
        },
        'Lof_All/lib/colorbox/jquery.colorbox.min': {
            'deps': ['jquery']
        }
    }
 };

require.config(config);
})();
(function() {
/**
 * @package Magedelight_Productpdf for Magento 2
 * @author MageDelight Team
 * @copyright Copyright (c) MageDelight (https://www.magedelight.com) owned by Krish TechnoLabs. All Rights reserved.
 */

var config = {
    map: {
        '*':{
            productPrintProgress: 'Magedelight_Productpdf/js/progress'
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Mageplaza
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the mageplaza.com license that is
 * available through the world-wide-web at this URL:
 * https://www.mageplaza.com/LICENSE.txt
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category    Mageplaza
 * @package     Mageplaza_Core
 * @copyright   Copyright (c) Mageplaza (https://www.mageplaza.com/)
 * @license     https://www.mageplaza.com/LICENSE.txt
 */

var config = {
    paths: {
        'jquery/file-uploader': 'Mageplaza_Core/lib/fileUploader/jquery.fileuploader',
        'mageplaza/core/jquery/popup': 'Mageplaza_Core/js/jquery.magnific-popup.min',
        'mageplaza/core/owl.carousel': 'Mageplaza_Core/js/owl.carousel.min',
        'mageplaza/core/bootstrap': 'Mageplaza_Core/js/bootstrap.min',
        mpIonRangeSlider: 'Mageplaza_Core/js/ion.rangeSlider.min',
        touchPunch: 'Mageplaza_Core/js/jquery.ui.touch-punch.min',
        mpDevbridgeAutocomplete: 'Mageplaza_Core/js/jquery.autocomplete.min'
    },
    shim: {
        "mageplaza/core/jquery/popup": ["jquery"],
        "mageplaza/core/owl.carousel": ["jquery"],
        "mageplaza/core/bootstrap": ["jquery"],
        mpIonRangeSlider: ["jquery"],
        mpDevbridgeAutocomplete: ["jquery"],
        touchPunch: ['jquery', 'jquery-ui-modules/core', 'jquery-ui-modules/mouse', 'jquery-ui-modules/widget']
    }
};

require.config(config);
})();
(function() {
/**
 * Mageplaza
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Mageplaza.com license that is
 * available through the world-wide-web at this URL:
 * https://www.mageplaza.com/LICENSE.txt
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category    Mageplaza
 * @package     Mageplaza_Blog
 * @copyright   Copyright (c) Mageplaza (https://www.mageplaza.com/)
 * @license     https://www.mageplaza.com/LICENSE.txt
 */

var config = {
    paths: {
        comment: 'Mageplaza_Blog/js/comment',
        categoryTree: 'Mageplaza_Blog/js/categorytree',
        owlCarousel: 'Mageplaza_Core/js/owl.carousel.min'
    }
};
require.config(config);
})();
(function() {
/**
 * Mageplaza
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Mageplaza.com license that is
 * available through the world-wide-web at this URL:
 * https://www.mageplaza.com/LICENSE.txt
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category  Mageplaza
 * @package   Mageplaza_Osc
 * @copyright Copyright (c) Mageplaza (https://www.mageplaza.com/)
 * @license   https://www.mageplaza.com/LICENSE.txt
 */

var config = {};
if (typeof window.oscRoute !== 'undefined' && window.location.href.indexOf(window.oscRoute) !== -1) {
    config = {
        paths: {
            socialPopupForm: 'Mageplaza_Osc/js/social-login-popup'
        },
        map: {
            '*': {
                'Magento_Checkout/js/model/shipping-rate-service': 'Mageplaza_Osc/js/model/shipping-rate-service',
                'Magento_Checkout/js/model/shipping-rates-validator': 'Mageplaza_Osc/js/model/shipping-rates-validator',
                'Magento_CheckoutAgreements/js/model/agreements-assigner': 'Mageplaza_Osc/js/model/agreements-assigner',
                'Magento_Paypal/js/in-context/express-checkout-smart-buttons': 'Mageplaza_Osc/js/in-context/express-checkout-smart-buttons',
                'Magento_SalesRule/js/action/select-payment-method-mixin': 'Mageplaza_Osc/js/action/select-payment-method-mixin'
            },
            'Mageplaza_Osc/js/model/shipping-rates-validator': {
                'Magento_Checkout/js/model/shipping-rates-validator': 'Magento_Checkout/js/model/shipping-rates-validator'
            },
            'Magento_Checkout/js/model/shipping-save-processor/default': {
                'Magento_Checkout/js/model/full-screen-loader': 'Mageplaza_Osc/js/model/osc-loader'
            },
            'Magento_Checkout/js/action/set-billing-address': {
                'Magento_Checkout/js/model/full-screen-loader': 'Mageplaza_Osc/js/model/osc-loader'
            },
            'Magento_SalesRule/js/action/set-coupon-code': {
                'Magento_Checkout/js/model/full-screen-loader': 'Mageplaza_Osc/js/model/osc-loader/discount'
            },
            'Magento_SalesRule/js/action/cancel-coupon': {
                'Magento_Checkout/js/model/full-screen-loader': 'Mageplaza_Osc/js/model/osc-loader/discount'
            },
            'Mageplaza_Osc/js/model/osc-loader': {
                'Magento_Checkout/js/model/full-screen-loader': 'Magento_Checkout/js/model/full-screen-loader'
            }
        },
        config: {
            mixins: {
                'PayPal_Braintree/js/view/payment/method-renderer/paypal': {
                    'Mageplaza_Osc/js/view/payment/method-renderer/braintree-paypal-mixins': true
                },
                'PayPal_Braintree/js/view/payment/adapter': {
                    'Mageplaza_Osc/js/view/payment/braintree-adapter-mixin': true
                },
                'Magento_Checkout/js/action/place-order': {
                    'Mageplaza_Osc/js/action/place-order-mixins': true
                },
                'Magento_Paypal/js/action/set-payment-method': {
                    'Mageplaza_Osc/js/model/paypal/set-payment-method-mixin': true
                },
                'Magento_InventoryInStorePickupFrontend/js/view/store-pickup': {
                    'Mageplaza_Osc/js/view/store-pickup-mixins': true
                },
                'Magento_Catalog/js/catalog-add-to-cart':{
                    'Mageplaza_Osc/js/catalog-add-to-cart-mixin':true
                }
            }
        }
    };

    if (window.isEnableAmazonPayCv2 === 1) {
        config.config.mixins['Mageplaza_Osc/js/view/shipping-address/address-renderer/default'] = {
            'Amazon_Pay/js/view/shipping-address/address-renderer/default': true
        };
    }

    if (window.location.href.indexOf('#') !== -1) {
        window.history.pushState("", document.title, window.location.pathname);
    }
}

require.config(config);
})();
(function() {
/**
 * Mageplaza
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Mageplaza.com license that is
 * available through the world-wide-web at this URL:
 * https://www.mageplaza.com/LICENSE.txt
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category    Mageplaza
 * @package     Mageplaza_Smtp
 * @copyright   Copyright (c) Mageplaza (https://www.mageplaza.com/)
 * @license     https://www.mageplaza.com/LICENSE.txt
 */
var config = {};
if (typeof window.AVADA_EM !== 'undefined') {
    config = {
        config: {
            mixins: {
                'Magento_Checkout/js/view/billing-address': {
                    'Mageplaza_Smtp/js/view/billing-address-mixins' : true
                },
                'Magento_Checkout/js/view/shipping': {
                    'Mageplaza_Smtp/js/view/shipping-mixins' : true
                }
            }
        }
    };
}

require.config(config);
})();
(function() {
var config = {
    config: {
        mixins: {
            'Magento_Search/js/form-mini': {
                'Mirasvit_SearchAutocomplete/js/form-mini': true
            },
        },
    },
};

require.config(config);
})();
(function() {
var config = {
    map: {
        '*': {
            'amshopby_color': 'Amasty_Shopby/js/utils/color'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    map: {
        '*': {
            amShopbyFilterAbstract: 'Amasty_Shopby/js/amShopby',
            amShopbyResponsive: 'Amasty_Shopby/js/amShopbyResponsive',
            amShopbyFilterItemDefault: 'Amasty_Shopby/js/components/amShopbyFilterItemDefault',
            amShopbyFilterDropdown: 'Amasty_Shopby/js/components/amShopbyFilterDropdown',
            amShopbyFilterFromTo: 'Amasty_Shopby/js/components/amShopbyFilterFromTo',
            amShopbyFilterHideMoreOptions: 'Amasty_Shopby/js/components/amShopbyFilterHideMoreOptions',
            amShopbyFilterAddTooltip: 'Amasty_Shopby/js/components/amShopbyFilterAddTooltip',
            amShopbyFilterCategoryDropdown: 'Amasty_Shopby/js/components/amShopbyFilterCategoryDropdown',
            amShopbyFilterCategory: 'Amasty_Shopby/js/components/amShopbyFilterCategory',
            amShopbyFilterContainer: 'Amasty_Shopby/js/components/amShopbyFilterContainer',
            amShopbyFilterSearch: 'Amasty_Shopby/js/components/amShopbyFilterSearch',
            amShopbyFilterMultiselect: 'Amasty_Shopby/js/components/amShopbyFilterMultiselect',
            amShopbyFilterSwatch: 'Amasty_Shopby/js/components/amShopbyFilterSwatch',
            amShopbyFilterSlider: 'Amasty_Shopby/js/components/amShopbyFilterSlider',
            amShopbyFilterFlyout: 'Amasty_Shopby/js/components/amShopbyFilterFlyout',
            amShopbySplideSlider: 'Amasty_Shopby/js/components/amShopbySplideSlider',
            amShopbySwatchTooltip: 'Amasty_Shopby/js/components/amShopbySwatchTooltip',
            amShopbyStickySidebar: 'Amasty_Shopby/js/components/amShopbyStickySidebar',
            amShopbyFilterCollapse: 'Amasty_Shopby/js/components/amShopbyFilterCollapse',
            amShopbySwatchesChoose: 'Amasty_Shopby/js/amShopbySwatchesChoose',
            amShopbyFiltersSync: 'Amasty_Shopby/js/amShopbyFiltersSync',
            amShopbyApplyFilters: 'Amasty_Shopby/js/amShopbyApplyFilters',
            amShopbyTopFilters: 'Amasty_Shopby/js/amShopbyTopFilters',
            amShopbyAjax: 'Amasty_Shopby/js/amShopbyAjax',
            amShopbyHelpers: 'Amasty_Shopby/js/utils/helpers'
        }
    },
    config: {
        mixins: {
            'jquery/ui-modules/widgets/slider': {
                'Amasty_Shopby/js/mixins/slider': true
            }
        }
    }
};

require.config(config);
})();
(function() {
/**
 * Mageplaza
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Mageplaza.com license that is
 * available through the world-wide-web at this URL:
 * https://www.mageplaza.com/LICENSE.txt
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category    Mageplaza
 * @package     Mageplaza_Blog
 * @copyright   Copyright (c) Mageplaza (https://www.mageplaza.com/)
 * @license     https://www.mageplaza.com/LICENSE.txt
 */

var config = {
    map: {
        '*':{
                customjs:'Nubix_Blog/js/customjs',
         }
        },
    shim:{
     'customjs':{
      deps: ['jquery']
      }
     }
};
require.config(config);
})();
(function() {
var config = {
    map: {
        '*': {
            'glightbox': 'Nubix_PBImagePopup/js/glightbox.min'
        }
    }
};

require.config(config);
})();
(function() {
var config = {
    paths: {
        "mute-migrate": "Nubix_Theme/js/mute-migrate"
    },
    shim: {
        'jquery/jquery-migrate': ['jquery', 'mute-migrate']
    }
}
require.config(config);
})();
(function() {
/**
 * Config to pull in all the relevant Braintree JS SDKs
 * @type {
 *  paths: {
 *      braintreePayPalInContextCheckout: string,
 *      braintreePayPalCheckout: string,
 *      braintreeVenmo: string,
 *      braintreeHostedFields: string,
 *      braintreeDataCollector: string,
 *      braintreeThreeDSecure: string,
 *      braintreeGooglePay: string,
 *      braintreeApplePay: string,
 *      braintreeAch: string,
 *      braintreeLpm: string,
 *      googlePayLibrary: string
 * },
 *  map: {
 *      "*": {
 *          braintree: string
 *      }
 *  }
 * }
 */
var config = {
    map: {
        '*': {
            braintree: 'https://js.braintreegateway.com/web/3.112.0/js/client.min.js'
        }
    },

    paths: {
        'braintreePayPalCheckout': 'https://js.braintreegateway.com/web/3.112.0/js/paypal-checkout.min',
        'braintreeHostedFields': 'https://js.braintreegateway.com/web/3.112.0/js/hosted-fields.min',
        'braintreeDataCollector': 'https://js.braintreegateway.com/web/3.112.0/js/data-collector.min',
        'braintreeThreeDSecure': 'https://js.braintreegateway.com/web/3.112.0/js/three-d-secure.min',
        'braintreeApplePay': 'https://js.braintreegateway.com/web/3.112.0/js/apple-pay.min',
        'braintreeGooglePay': 'https://js.braintreegateway.com/web/3.112.0/js/google-payment.min',
        'braintreeVenmo': 'https://js.braintreegateway.com/web/3.112.0/js/venmo.min',
        'braintreeAch': 'https://js.braintreegateway.com/web/3.112.0/js/us-bank-account.min',
        'braintreeLpm': 'https://js.braintreegateway.com/web/3.112.0/js/local-payment.min',
        'googlePayLibrary': 'https://pay.google.com/gp/p/js/pay',
        'braintreePayPalInContextCheckout': 'https://www.paypalobjects.com/api/checkout'
    }
};

require.config(config);
})();
(function() {
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/model/step-navigator': {
                'PayPal_Braintree/js/model/step-navigator-mixin': true
            },
            'Magento_Checkout/js/model/place-order': {
                'PayPal_Braintree/js/model/place-order-mixin': true
            },
            'Magento_ReCaptchaWebapiUi/js/webapiReCaptchaRegistry': {
                'PayPal_Braintree/js/reCaptcha/webapiReCaptchaRegistry-mixin': true
            },
            'Magento_CheckoutAgreements/js/view/checkout-agreements': {
                'PayPal_Braintree/js/checkoutAgreements/view/checkout-agreements-mixin': true
            }
        }
    },
    map: {
        '*': {
            braintreeCheckoutPayPalAdapter: 'PayPal_Braintree/js/view/payment/adapter'
        }
    }
};

require.config(config);
})();
(function() {
/* eslint-disable no-unused-vars */
var config = {
  map: {
    '*': {
      'snowdogMenu': 'Snowdog_Menu/js/snowdog-menu.babel'
    }
  }
};

require.config(config);
})();
(function() {
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

var config = {
    deps: [
        'Magento_Theme/js/theme'
    ]
};

require.config(config);
})();
(function() {
var config = {
    paths: {
            nbxOwlCarousel:'js/owl.carousel.min',
            nbxMark:'js/jquery.mark.min'
    },
    shim: {
        'nbxOwlCarousel':
                {
                    deps: ['jquery']
                },
        'nbxMark':
                {
                    deps: ['jquery']
                },
    },
};

require.config(config);
})();



})(require);