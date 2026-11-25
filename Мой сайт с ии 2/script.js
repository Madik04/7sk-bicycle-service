// Плавная анимация появления элементов при скролле
(function(){
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
      }
    });
  }, {threshold: 0.12});

  document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));

  // Бургер (показ навигации на мобиле)
  function toggleMobileMenu(burgerId){
    const btn = document.getElementById(burgerId);
    if(!btn) return;
    btn.addEventListener('click', () => {
      document.querySelector('.nav').classList.toggle('open');
      btn.classList.toggle('open');
    });
  }
  toggleMobileMenu('burger');
  toggleMobileMenu('burger2');

  // Спрятать меню при клике по ссылке (мобилка)
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', ()=> {
      document.querySelector('.nav').classList.remove('open');
      document.querySelectorAll('.burger').forEach(b=>b.classList.remove('open'));
    });
  });
})();
