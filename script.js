// Datorteknik Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Check if it's an internal anchor link
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Add active state to navigation based on scroll position
    function updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }

    // Update navigation on scroll
    window.addEventListener('scroll', updateActiveNavigation);
    
    // Initial call to set active navigation
    updateActiveNavigation();

    // Add intersection observer for card animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = '0s';
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all cards and resource items
    const animatedElements = document.querySelectorAll('.card, .resource-item');
    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Add click handlers for buttons
    const ctaButton = document.querySelector('.cta-button');
    const courseButtons = document.querySelectorAll('.card .button');

    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            const coursesSection = document.getElementById('kurser');
            if (coursesSection) {
                coursesSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    courseButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Placeholder for course detail functionality
            console.log('Course button clicked:', this.textContent);
            
            // You could implement modal dialogs, navigation to course pages, etc.
            alert('Kursinformation kommer snart! (Course information coming soon!)');
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Handle keyboard navigation if needed
        if (e.key === 'Tab') {
            // Ensure focus is visible
            document.body.classList.add('keyboard-nav');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-nav');
    });

    // Performance optimization: Debounce scroll events
    let ticking = false;
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateActiveNavigation);
            ticking = true;
        }
    }

    window.addEventListener('scroll', function() {
        requestTick();
        ticking = false;
    });
});

// Add CSS for keyboard navigation
const style = document.createElement('style');
style.textContent = `
    body:not(.keyboard-nav) *:focus {
        outline: none;
    }
    
    .keyboard-nav *:focus {
        outline: 2px solid var(--color-accent) !important;
        outline-offset: 2px !important;
    }
    
    .nav-link.active {
        color: var(--color-accent) !important;
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease-out !important;
    }
`;
document.head.appendChild(style);