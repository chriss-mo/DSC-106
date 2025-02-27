let commits = [];
let data = [];
// let commits = d3.groups(data, (d) => d.commit);

async function loadData() {
    try {
        data = await d3.csv('loc.csv', (row) => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            date: new Date(row.date + 'T00:00' + row.timezone),
            datetime: new Date(row.datetime),
        }));
        processCommits();
        displayStats();
        createScatterplot();
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/chriss-mo/DSC-106/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
            value: lines,
            enumerable: false,
            configurable: false,
            writable: false,
        });
  
        return ret;
      });
  }

// step 1

function displayStats() {
    processCommits();
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    let avgLineLength = d3.mean(data, (d) => +d.length).toFixed(2);
    dl.append('dt').text('Average Line Length');
    dl.append('dd').text(avgLineLength);

    let maxDepth = d3.max(data, (d) => +d.depth);
    dl.append('dt').text('Max Depth');
    dl.append('dd').text(maxDepth);

    let mostCommonHour = d3.rollup(
        commits,
        (v) => v.length,
        (d) => Math.floor(d.hourFrac) // Group by rounded-down hour
    );
    let peakHour = [...mostCommonHour.entries()].reduce((a, b) => (a[1] > b[1] ? a : b))[0];

    dl.append('dt').text('Peak Work Hour');
    dl.append('dd').text(`${peakHour}:00`);
}

// step 2

let xScale, yScale;

function createScatterplot(){
    const width = 1000;
    const height = 600;
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const dots = svg.append('g').attr('class', 'dots');
    
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt() // Change only this line
        .domain([minLines, maxLines])
        .range([2, 30]);

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots.selectAll('circle').data(sortedCommits).join('circle');

    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 5)
        .attr('fill', 'steelblue')
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
          })
          .on('mouseleave', () => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipContent({});
            updateTooltipVisibility(false);
          });

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
        
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
    brushSelector()
}

// step 3

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    time.textContent = commit.time || 'No time available';
    author.textContent = commit.author || 'No author available';
    lines.textContent = commit.totalLines || 'No lines available';
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

// step 5
function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush());

    // Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
}

let brushSelection = null;

function isCommitSelected(commit) {
  if (!brushSelection) {
    return false;
  }
  // TODO: return true if commit is within brushSelection
  // and false if not
  const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
  const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
  const x = xScale(commit.date); 
  const y = yScale(commit.hourFrac); 
  return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
}

function updateSelection() {
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}

function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : [];

    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }

    return breakdown;
}

function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
    // console.log(event);
}

document.addEventListener('DOMContentLoaded', loadData);

