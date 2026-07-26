define([
    'glightbox',
    'domReady!'
], function (GLightbox) {
    'use strict';

    return function (config) {
        const triggerClass = config.triggerClass || '.nbx-popup-trigger';

        const allTriggers = document.querySelectorAll(triggerClass);
        if (allTriggers.length === 0) {
            return;
        }

        allTriggers.forEach((el, index) => {
            const uniqueClass = 'glightbox-single-' + index;
            el.classList.add(uniqueClass);

            GLightbox({
                selector: '.' + uniqueClass, // Unique selector = No gallery
                zoomable: false,
                draggable: false,
                touchNavigation: false,
                loop: false
            });
        });
    };
});
