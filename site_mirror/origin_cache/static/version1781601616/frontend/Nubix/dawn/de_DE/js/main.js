function initSearchToggle(containerSelector = '.search-container') {
    const container = document.querySelector(containerSelector);

    if (!container) return;

    const btn = container.querySelector('.search-swticher');
    const input = container.querySelector('.search-input');

    if (!btn || !input) {
        console.warn(`Search components not found inside ${containerSelector}`);
        return;
    }

    const toggleSearch = (e) => {
        e.stopPropagation();
        const isActive = container.classList.toggle('active');

        if (isActive) {
            input.focus();
        }
    };

    const closeSearch = (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('active');
        }
    };

    btn.addEventListener('click', toggleSearch);
    document.addEventListener('click', closeSearch);
}

function syncCarousel() {
    const textSlider = new Swiper('.kitchen-studios-carousel .text-slider', {
        loop: true,
        speed: 600
    });

    const photoSlider = new Swiper('.kitchen-studios-carousel .photos-slider', {
        loop: false,
        speed: 600,
        slidesPerView: 6,
        spaceBetween: 30,
        centeredSlides: true,
        slideToClickedSlide: true,
        navigation: {
            nextEl: '.kitchen-studios-carousel .swiper-button-next',
            prevEl: '.kitchen-studios-carousel .swiper-button-prev',
        },
        on: {
            slideChange: function () {
                if (textSlider) {
                    textSlider.slideToLoop(this.realIndex);
                }
            }
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 30
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 30
            },
            1024: {
                slidesPerView: 4,
                spaceBetween: 30
            },
            1200: {
                slidesPerView: 6,
                spaceBetween: 30
            }
        },
    });
}

function commonSlideshow() {
    const photoSlider = new Swiper('.common-slideshow .photos-slider', {
        loop: true,
        speed: 600,
        slidesPerView: 1,
        centeredSlides: true,
        navigation: {
            nextEl: '.common-slideshow .swiper-button-next',
            prevEl: '.common-slideshow .swiper-button-prev',
        }
    });
}
function faqList() {
    const switchers = document.querySelectorAll('.faq-question');

    switchers.forEach(switcher => {
        switcher.addEventListener('click', function() {
            const parent = this.closest('.faq-item');
            const answer = parent.querySelector('.faq-answer');

            if (parent.classList.contains('is-active')) {
                answer.style.maxHeight = null;
                parent.classList.remove('is-active');
            } else {
                answer.style.maxHeight = answer.scrollHeight + "px";
                parent.classList.add('is-active');
            }
        });
    });
}

function mobileMenu() {
    const navSwitcher = document.querySelector('.mobile-nav-switcher');
    const navContainer = document.querySelector('.main-nav-search-container');
    const body = document.body;

    if (navSwitcher && navContainer) {
        navSwitcher.addEventListener('click', () => {
            navSwitcher.classList.toggle('is-active');
            navContainer.classList.toggle('is-open');

            if (navContainer.classList.contains('is-open')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        const navLinks = navContainer.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navSwitcher.classList.remove('is-active');
                navContainer.classList.remove('is-open');
                body.style.overflow = '';
            });
        });
    }
}
function languageSelect() {
    const langSwitcher = document.querySelector('.lang-switcher');
    const currentLang = document.querySelector('.current-lang');
    const currentTitle = currentLang.querySelector('.title');
    const currentFlagImg = currentLang.querySelector('.flag img');

    if (langSwitcher && currentLang) {
        currentLang.addEventListener('click', (e) => {
            e.stopPropagation();
            langSwitcher.classList.toggle('is-active');
        });

        const langItems = document.querySelectorAll('.lang-item');
        langItems.forEach(item => {
            item.addEventListener('click', function() {
                const newTitle = this.querySelector('.title').textContent;
                const newFlagSrc = this.querySelector('.flag img').getAttribute('src');

                currentTitle.textContent = newTitle;
                currentFlagImg.setAttribute('src', newFlagSrc);

                langSwitcher.classList.remove('is-active');

            });
        });

        document.addEventListener('click', (e) => {
            if (!langSwitcher.contains(e.target)) {
                langSwitcher.classList.remove('is-active');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSearchToggle();
    syncCarousel();
    commonSlideshow();
    faqList();
    mobileMenu();
    languageSelect();
});