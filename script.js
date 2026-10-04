const nav=document.querySelector('#nav'), progress=document.querySelector('.progress i');
const revealEls=document.querySelectorAll('section:not(.hero) > *, .course, .principles article, .steps article, .review-grid blockquote, .growth-grid>div');
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});revealEls.forEach(e=>{e.classList.add('reveal');io.observe(e)});
window.addEventListener('scroll',()=>{let y=scrollY, max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(y/max*100)+'%';nav.classList.toggle('scrolled',y>40);document.documentElement.style.setProperty('--scroll',y)});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{let el=document.querySelector(a.getAttribute('href'));if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'})}}));
const menu=document.querySelector('.menu');menu.addEventListener('click',()=>{document.querySelector('.links').classList.toggle('open');menu.classList.toggle('active')});
// lightweight hero parallax, disabled for reduced-motion users
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){window.addEventListener('scroll',()=>{const art=document.querySelector('.hero-art'), copy=document.querySelector('.hero-copy');let y=Math.min(scrollY,700);if(art)art.style.transform=`translateY(${y*.12}px) scale(${1-y*.00015})`;if(copy)copy.style.transform=`translateY(${y*.18}px)`},{passive:true})}
