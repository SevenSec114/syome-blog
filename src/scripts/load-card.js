document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      const cards = document.querySelectorAll('.staggered-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('card-ready');
        }, index * 150);
      });
    }, 1000);
  });