// Floating Menu JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const floatingMenuToggle = document.getElementById('floating-menu-toggle');
    const floatingHeader = document.querySelector('.floating-header');
    const floatingMenuBackdrop = document.getElementById('floating-menu-backdrop');
    const body = document.body;

    if (!floatingMenuToggle || !floatingHeader) return;
    floatingMenuToggle.setAttribute('aria-expanded', 'false');

    let isMenuOpen = false;

    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;

        floatingMenuToggle.setAttribute('aria-expanded', String(isMenuOpen));
        floatingMenuToggle.classList.toggle('menu-open', isMenuOpen);
        floatingHeader.classList.toggle('mobile-visible', isMenuOpen);
        if (floatingMenuBackdrop) {
            floatingMenuBackdrop.classList.toggle('active', isMenuOpen);
        }
        body.style.overflow = isMenuOpen ? 'hidden' : '';
    }

    function closeMenu() {
        if (isMenuOpen) toggleMobileMenu();
    }

    floatingMenuToggle.addEventListener('click', toggleMobileMenu);

    if (floatingMenuBackdrop) {
        floatingMenuBackdrop.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isMenuOpen) closeMenu();
    });

    // Close menu after tapping a link (mobile)
    floatingHeader.querySelectorAll('#menu a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768 && isMenuOpen) {
                setTimeout(closeMenu, 150);
            }
        });
    });

    // Reset state when crossing the desktop breakpoint
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && isMenuOpen) closeMenu();
    });

    // Smooth scroll for anchor links, offset by the floating header on desktop
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#top') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = window.innerWidth > 768 ? 110 : 20;
                window.scrollTo({
                    top: target.offsetTop - offset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Keep dynamically injected Disqus elements below the menu
    function monitorDisqusConflicts() {
        const disqusThread = document.getElementById('disqus_thread');
        if (!disqusThread) return;

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                Array.from(mutation.addedNodes || []).forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    if (node.style && parseInt(node.style.zIndex) > 9000) {
                        node.style.zIndex = '1';
                    }
                    const highZ = node.querySelectorAll ? node.querySelectorAll('[style*="z-index"]') : [];
                    highZ.forEach(function (el) {
                        if (parseInt(el.style.zIndex) > 9000) el.style.zIndex = '1';
                    });
                });
            });
        });

        observer.observe(disqusThread, { childList: true, subtree: true });
    }

    setTimeout(monitorDisqusConflicts, 1000);
});
