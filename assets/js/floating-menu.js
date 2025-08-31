// Floating Menu JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const floatingMenuToggle = document.getElementById('floating-menu-toggle');
    const floatingHeader = document.querySelector('.floating-header');
    const floatingMenuBackdrop = document.getElementById('floating-menu-backdrop');
    const body = document.body;
    
    if (!floatingMenuToggle || !floatingHeader) return;
    
    let isMenuOpen = false;
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            floatingHeader.classList.add('mobile-visible');
            floatingMenuBackdrop.classList.add('active');
            body.style.overflow = 'hidden';
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
    
    // Add scroll behavior for floating menu
    let lastScrollTop = 0;
    let scrollTimeout;
    
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
});
