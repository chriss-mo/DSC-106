console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// currentLink.classList.add('current');

// currentLink?.classList.add('current');

let pages = [
  { url: '', title: 'Home' },
  { url: '../projects/', title: 'Projects' },
  { url: '../cv/', title: 'CV' },
  { url: '../contact/', title: 'Contact' },
  { url: 'https://github.com/chriss-mo', target:'_blank', title: 'Github Profile' },
  // add the rest of your pages here
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  
  url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // if (a.host === location.host && a.pathname === location.pathname) {
  //   a.classList.add('current');
  // }
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  nav.append(a);
}

