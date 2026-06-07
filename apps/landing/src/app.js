// Interactive scripts for xhalo-blog landing page

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar scroll effect
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
      header.style.backgroundColor = 'rgba(11, 15, 25, 0.85)';
    } else {
      header.style.boxShadow = 'none';
      header.style.backgroundColor = 'rgba(17, 24, 39, 0.7)';
    }
  });

  // 2. Node click interactions in the SVG architecture diagram
  const nodes = document.querySelectorAll('.node');
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const mainText = node.querySelector('text').textContent;
      
      // Temporary animation feedback
      const rect = node.querySelector('rect');
      if (rect) {
        const originalFilter = rect.style.filter;
        const originalTransform = rect.style.transform;
        
        rect.style.filter = 'brightness(1.5) saturate(1.2)';
        rect.style.transform = 'scale(1.05)';
        rect.style.transformOrigin = 'center';
        
        setTimeout(() => {
          rect.style.filter = originalFilter;
          rect.style.transform = originalTransform;
        }, 500);
      }
    });
  });

  console.log('xhalo-blog premium landing page initialized.');
});
