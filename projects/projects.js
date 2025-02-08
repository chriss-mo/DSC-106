// import { fetchJSON, renderProjects } from '../global.js';
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


// const projects = await fetchJSON('../lib/projects.json');
// const projectsContainer = document.querySelector('.projects');
// renderProjects(projects, projectsContainer, 'h2');

// let rolledData = d3.rollups(
//   projects,
//   (v) => v.length,
//   (d) => d.year,
// );

// let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
// let colors = d3.scaleOrdinal(d3.schemeTableau10);

// let data = rolledData.map(([year, count]) => {
//   return { value: count, label: year };
// });

// let sliceGenerator = d3.pie().value((d) => d.value);

// let arcData = sliceGenerator(data);
// let arcs = arcData.map((d) => arcGenerator(d));

// arcs.forEach((arc, idx) => {
//   d3.select('svg')
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(idx));
// })

// let legend = d3.select('.legend');
// data.forEach((d, idx) => {
//   legend.append('li')
//         .attr('style', `--color:${colors(idx)}`)
//         .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
// })


// function renderPieChart(projectsGiven) {
//     let newSVG = d3.select('svg'); 
//     newSVG.selectAll('path').remove();
//     let leg = d3.select('.legend');
//     leg.selectAll('li').remove();
//     let newRolledData = d3.rollups(
//       projectsGiven,
//       (v) => v.length,
//       (d) => d.year,
//     );
//     let newData = newRolledData.map(([year, count]) => {
//         return { value: count, label: year };
//     });
//     let newSliceGenerator = d3.pie().value((d) => d.value);
//     let newArcData = newSliceGenerator(newData);
//     let newArcs = newArcData.map((d) => arcGenerator(d));
//     newArcs.forEach((arc, idx) => {
//         d3.select('svg')
//           .append('path')
//           .attr('d', arc)
//           .attr('fill', colors(idx));
//     })
//     let legend = d3.select('.legend');
//     newData.forEach((d, idx) => {
//         legend.append('li')
//             .attr('style', `--color:${colors(idx)}`)
//             .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
//     })
//   }


// let query = '';

// let searchInput = document.querySelector('.searchBar');

// searchInput.addEventListener('change', (event) => {
//     query = event.target.value;
//     let filteredProjects = projects.filter((project) => {
//     let values = Object.values(project).join('\n').toLowerCase();
//     return values.includes(query.toLowerCase());
//     });
//     renderProjects(filteredProjects, projectsContainer, 'h2');
//     renderPieChart(filteredProjects);
// });

// // Selecting Pie Chart

// let selectedIndex = -1;

// let svg = d3.select('svg');
// svg.selectAll('path').remove();

// arcs.forEach((arc, i) => {
//   svg
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(i))
//     .on('click', () => {
//       selectedIndex = selectedIndex === i ? -1 : i;
//       svg
//         .selectAll('path')
//         .attr('class', (_, idx) => (
//           idx === selectedIndex ? 'selected' : ''
//         ));
//       legend
//         .selectAll('li')
//         .attr('class', (_, idx) => (
//           idx === selectedIndex ? 'selected' : ''
//         ));
//       if (selectedIndex === -1) {
//         renderProjects(projects, projectsContainer, 'h2');
//       } else {
//         let selectedYear = data[selectedIndex]?.label;
//         console.log(selectedYear);
//         let filteredProjects = projects.filter(p => p.year === selectedYear);
//         renderProjects(filteredProjects, projectsContainer, 'h2');
//       }
//     });
// });


import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

let filteredProjects = [...projects];

let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

let sliceGenerator = d3.pie().value((d) => d.value);
let selectedYear = null;
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

arcs.forEach((arc, idx) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(idx));
})

let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend.append('li')
        .attr('style', `--color:${colors(idx)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
})

renderProjects(filteredProjects, projectsContainer, 'h2'); // Render initial projects
createPieChart(filteredProjects); // Create initial pie chart

function createPieChart(projectsToChart) {
  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  let rolledData = d3.rollups(
      projectsToChart,
      (v) => v.length,
      (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  arcs.forEach((arc, idx) => {
      svg.append('path')
          .attr('d', arc)
          .attr('fill', colors(idx))
          .classed('selected', data[idx].label === selectedYear) // Highlight selected slice
          .on('click', () => handlePieChartClick(data[idx].label));
  });

  data.forEach((d, idx) => {
      legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .classed('selected', d.label === selectedYear) // Highlight selected legend item
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

function handlePieChartClick(year) {
  selectedYear = selectedYear === year ? null : year; // Toggle selection

  filterProjects(); // Call the filtering function

  createPieChart(filteredProjects);
}


let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  filterProjects(); // Call the filtering function

  createPieChart(filteredProjects);
});

function filterProjects() {
  filteredProjects = [...projects]; // Reset to all projects

  if (query) {
      filteredProjects = filteredProjects.filter((project) => {
          let values = Object.values(project).join('\n').toLowerCase();
          return values.includes(query.toLowerCase());
      });
  }

  if (selectedYear) {
      filteredProjects = filteredProjects.filter(p => p.year === selectedYear);
  }

  renderProjects(filteredProjects, projectsContainer, 'h2');
}

// function createPieChart(projectsToChart) { // Now takes the data to chart as a parameter
//   let svg = d3.select('svg');
//   svg.selectAll('path').remove(); // Clear previous paths
//   let legend = d3.select('.legend');
//   legend.selectAll('li').remove();

//   let rolledData = d3.rollups(
//       projectsToChart,
//       (v) => v.length,
//       (d) => d.year,
//   );

//   let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

//   let arcData = sliceGenerator(data);
//   let arcs = arcData.map((d) => arcGenerator(d));

//   arcs.forEach((arc, idx) => {
//       svg.append('path')
//           .attr('d', arc)
//           .attr('fill', colors(idx))  // Keep original colors
//           .classed('selected', data[idx].label === selectedYear)
//           .on('click', () => handlePieChartClick(data[idx].label));
//   });

//   data.forEach((d, idx) => {
//       legend.append('li')
//           .attr('style', `--color:${colors(idx)}`)
//           .classed('selected', d.label === selectedYear)
//           .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
//   });
// }


// function handlePieChartClick(year) {
//   selectedYear = selectedYear === year ? null : year;
//   filterProjects();
//   createPieChart(projects); // Pass the original 'projects' array here
// }

// let query = '';
// let searchInput = document.querySelector('.searchBar');

// searchInput.addEventListener('input', (event) => {
//   query = event.target.value;
//   filterProjects();
//   createPieChart(projects); // Pass the original 'projects' array here
// });

// function filterProjects() {
//   filteredProjects = [...projects]; // Reset to all projects

//   if (query) {
//       filteredProjects = filteredProjects.filter((project) => {
//           let values = Object.values(project).join('\n').toLowerCase();
//           return values.includes(query.toLowerCase());
//       });
//   }

//   if (selectedYear) {
//       filteredProjects = filteredProjects.filter(p => p.year === selectedYear);
//   }

//   renderProjects(filteredProjects, projectsContainer, 'h2');
// }