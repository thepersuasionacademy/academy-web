// Theme toggle functionality
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  const htmlElement = document.documentElement;
  
  // Check for saved theme preference or use default (dark)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlElement.classList.remove('light', 'dark');
  htmlElement.classList.add(savedTheme);
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', function() {
    if (htmlElement.classList.contains('dark')) {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// Setup animations for all elements
function setupAnimations() {
  // Add animation styles to elements
  const animatedElements = [
    'logo', 'title', 'subtitle', 'cta', 'stats',
    'ecosystem-title', 'eco-1', 'eco-2', 'eco-3', 'eco-4',
    'mastery-title', 'path-1', 'path-2', 'path-3',
    'pricing-title'
  ];
  
  animatedElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      
      if (id === 'cta') {
        el.style.transform = 'scale(0.9)';
      } else {
        el.style.transform = 'translateY(20px)';
      }
    }
  });
  
  // Start animations with delays
  setTimeout(() => {
    animateElement('logo', 'translateY(0)');
  }, 100);
  
  setTimeout(() => {
    animateElement('title', 'translateY(0)');
  }, 300);
  
  setTimeout(() => {
    animateElement('subtitle', 'translateY(0)');
  }, 500);
  
  setTimeout(() => {
    animateElement('cta', 'scale(1)');
  }, 700);
  
  setTimeout(() => {
    animateElement('stats', 'translateY(0)');
  }, 900);
  
  // Animate first section title (ecosystem)
  setTimeout(() => {
    animateElement('ecosystem-title', 'translateY(0)');
  }, 1100);
  
  // Animate ecosystem cards
  setTimeout(() => {
    animateElement('eco-1', 'translateY(0)');
  }, 1300);
  
  setTimeout(() => {
    animateElement('eco-2', 'translateY(0)');
  }, 1500);
  
  setTimeout(() => {
    animateElement('eco-3', 'translateY(0)');
  }, 1700);
  
  setTimeout(() => {
    animateElement('eco-4', 'translateY(0)');
  }, 1900);
  
  // Animate second section title (mastery)
  setTimeout(() => {
    animateElement('mastery-title', 'translateY(0)');
  }, 2100);
  
  // Animate mastery path cards
  setTimeout(() => {
    animateElement('path-1', 'translateY(0)');
  }, 2300);
  
  setTimeout(() => {
    animateElement('path-2', 'translateY(0)');
  }, 2500);
  
  setTimeout(() => {
    animateElement('path-3', 'translateY(0)');
  }, 2700);
  
  // Animate pricing title
  setTimeout(() => {
    animateElement('pricing-title', 'translateY(0)');
  }, 2900);
}

// Helper function to animate an element
function animateElement(id, transform) {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = '1';
    el.style.transform = transform;
  }
}

// Setup pricing toggle functionality
function setupPricingToggle() {
  // No need to manually set up toggle functionality
  // Alpine.js handles this automatically with x-data and x-model
  console.log('Pricing toggle is handled by Alpine.js');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setupThemeToggle();
  
  // Components are loaded via fetch in homepage.html
  // Animations are set up after components are loaded with a delay
}); 