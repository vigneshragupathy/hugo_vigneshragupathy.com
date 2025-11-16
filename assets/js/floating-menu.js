// Floating Menu JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const floatingMenuToggle = document.getElementById('floating-menu-toggle');
    const floatingHeader = document.querySelector('.floating-header');
    const floatingMenuBackdrop = document.getElementById('floating-menu-backdrop');
    const body = document.body;
    
    if (!floatingMenuToggle || !floatingHeader) return;
    floatingMenuToggle.setAttribute('aria-expanded', 'false');
    
    let isMenuOpen = false;
    
    // Force proper z-index on initialization
    if (floatingHeader) {
        floatingHeader.style.zIndex = '9999';
    }
    if (floatingMenuToggle) {
        floatingMenuToggle.style.zIndex = '10000';
    }
    if (floatingMenuBackdrop) {
        floatingMenuBackdrop.style.zIndex = '9998';
    }
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (floatingMenuToggle) {
            floatingMenuToggle.setAttribute('aria-expanded', String(isMenuOpen));
            floatingMenuToggle.classList.toggle('menu-open', isMenuOpen);
        }

        if (isMenuOpen) {
            floatingHeader.classList.add('mobile-visible');
            floatingMenuBackdrop.classList.add('active');
            body.style.overflow = 'hidden';
            // Ensure menu stays on top when opened
            floatingHeader.style.zIndex = '9999';
        } else {
            floatingHeader.classList.remove('mobile-visible');
            floatingMenuBackdrop.classList.remove('active');
            body.style.overflow = '';
        }
    }
    
    // Close menu when clicking backdrop
    function closeMenu() {
        if (isMenuOpen) {
            toggleMobileMenu();
        }
    }
    
    // Handle menu toggle click
    floatingMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Handle backdrop click
    floatingMenuBackdrop.addEventListener('click', closeMenu);
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
    
    // Close menu when clicking on menu links
    const menuLinks = floatingHeader.querySelectorAll('#menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && isMenuOpen) {
                setTimeout(closeMenu, 150); // Small delay for better UX
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isMenuOpen) {
            closeMenu();
        }
    });
    
    // Add scroll behavior for floating menu - DISABLED for sticky menu
    let lastScrollTop = 0;
    let scrollTimeout;
    
    // Commented out scroll hide/show behavior to make menu sticky
    /*
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (window.innerWidth > 768) {
                // Hide/show floating menu on scroll (desktop only)
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // Scrolling down
                    floatingHeader.style.transform = 'translateX(-50%) translateY(-100%)';
                    floatingHeader.style.opacity = '0';
                } else {
                    // Scrolling up
                    floatingHeader.style.transform = 'translateX(-50%) translateY(0)';
                    floatingHeader.style.opacity = '1';
                }
            }
            
            lastScrollTop = scrollTop;
        }, 10);
    });
    */
    
    // Smooth scroll behavior for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#top') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 120; // Account for floating header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Monitor for Disqus loading and prevent z-index conflicts
    function monitorDisqusConflicts() {
        const disqusThread = document.getElementById('disqus_thread');
        if (disqusThread) {
            // Create observer to watch for Disqus elements
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes) {
                        Array.from(mutation.addedNodes).forEach(function(node) {
                            if (node.nodeType === 1) {
                                // Fix any high z-index elements that might interfere
                                if (node.style && node.style.zIndex && parseInt(node.style.zIndex) > 9000) {
                                    node.style.zIndex = '1';
                                }
                                // Apply to child elements as well
                                const highZIndexElements = node.querySelectorAll ? node.querySelectorAll('[style*="z-index"]') : [];
                                highZIndexElements.forEach(function(el) {
                                    if (el.style.zIndex && parseInt(el.style.zIndex) > 9000) {
                                        el.style.zIndex = '1';
                                    }
                                });
                            }
                        });
                    }
                });
            });
            
            observer.observe(disqusThread, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // Initialize Disqus monitoring
    setTimeout(monitorDisqusConflicts, 1000);
    
    // Periodic check to ensure floating menu stays on top
    setInterval(function() {
        if (floatingHeader && floatingHeader.style.zIndex !== '9999') {
            floatingHeader.style.zIndex = '9999';
        }
        if (floatingMenuToggle && floatingMenuToggle.style.zIndex !== '10000') {
            floatingMenuToggle.style.zIndex = '10000';
        }
    }, 5000);
});
