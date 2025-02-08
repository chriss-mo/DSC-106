console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'cv/', title: 'CV' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/chriss-mo', target:'_blank', title: 'Github Profile' }
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

  if (p.target) {
    a.target = p.target;
  }

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	</label>`
);

const select = document.querySelector('label.color-scheme select');

if ('colorScheme' in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', savedScheme);
  select.value = savedScheme;
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value;
  select.value = event.target.value;
});

export async function fetchJSON(url) {
  try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      // console.log(response)
      const data = await response.json();
      return data; 
  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';
  project.forEach(pj => {
    const article = document.createElement('article');
    article.innerHTML = `
      <h3>${pj.title}</h3>
      <p><i>${pj.year}</i></p>
      <img src="${pj.image}" alt="${pj.title}">
      <p>${pj.description}</p>
  `;
    containerElement.appendChild(article);
  });
}

async function loadProjects() {
  const projectsContainer = document.querySelector('.projects');
  const projectsTitle = document.querySelector('.projects-title'); // Select the title element

  if (!projectsContainer) {
      console.error('Projects container not found!');
      return;
  }

  const projects = await fetchJSON('../lib/projects.json');
  
  if (projects && projects.length > 0) {
      renderProjects(projects, projectsContainer, 'h2');
      // Update the projects title dynamically with the count
      projectsTitle.textContent = `${projects.length} Projects`;
  } else {
      projectsContainer.innerHTML = '<p>No projects available.</p>';
      projectsTitle.textContent = '0 Projects'; // Show 0 if no projects exist
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

loadProjects();