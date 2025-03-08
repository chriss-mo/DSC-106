let commits = [];
let data = [];
let selectedCommits = [];
let filteredCommits = [];

let commitProgress = 100;
let timeScale;
let commitMaxTime;

let ITEM_HEIGHT = 125; // Adjust height to fit the narrative
let VISIBLE_COUNT = 30; // Feel free to change as well
let totalHeight;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
const itemsContainer = d3.select('#items-container');
const scrollContainerStats = d3.select('#scroll-container-stats');
const spacerStats = d3.select('#spacer-stats');
const itemsContainerStats = d3.select('#items-container-stats');

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

    timeScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([0, 100]);
}

function filterCommitsByTime() {
    filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
}

function updateTotalHeight() {
    totalHeight = (commits.length - 1) * ITEM_HEIGHT;
    spacer.style('height', `${totalHeight}px`);
}

function brushed(evt) {
    brushSelection = evt.selection;
    selectedCommits = !brushSelection
      ? []
      : filteredCommits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.datetime);
          let y = yScale(commit.hourFrac);
  
          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

function displayStats(commitsToDisplay) {
    // Clear previous stats
    d3.select('#stats').selectAll('*').remove();
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    const totalLOC = d3.sum(commitsToDisplay, (commit) => commit.lines.length);
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(totalLOC);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commitsToDisplay.length);
  
    // Add more stats as needed...
    const avgLineLength = d3.mean(commitsToDisplay.flatMap(commit => commit.lines), (d) => +d.length).toFixed(2);
    dl.append('dt').text('Average Line Length');
    dl.append('dd').text(avgLineLength);

    const maxDepth = d3.max(commitsToDisplay.flatMap(commit => commit.lines), (d) => +d.depth);
    dl.append('dt').text('Max Depth');
    dl.append('dd').text(maxDepth);

    const mostCommonHour = d3.rollup(
        commitsToDisplay,
        (v) => v.length,
        (d) => Math.floor(d.hourFrac) // Group by rounded-down hour
    );
    const peakHour = [...mostCommonHour.entries()].reduce((a, b) => (a[1] > b[1] ? a : b))[0];

    dl.append('dt').text('Peak Work Hour');
    dl.append('dd').text(`${peakHour}:00`);
}

function displayFiles(commitsToDisplay) {
    let lines = commitsToDisplay.flatMap((d) => d.lines);
    let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
        return { name, lines };
    });

    // Sort files by number of lines in descending order
    files = d3.sort(files, (d) => -d.lines.length);

    d3.select('.files').selectAll('div').remove(); // Clear previous file details
    let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');

    filesContainer.append('dt').html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
    
    // Create an ordinal scale for colors
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

    filesContainer.append('dd')
        .selectAll('div')
        .data(d => d.lines)
        .enter()
        .append('div')
        .attr('class', 'line')
        .style('background', d => fileTypeColors(d.type)); // Apply color scale based on line type
}

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
    if (isVisible) {
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const pageWidth = window.innerWidth;
    const pageHeight = window.innerHeight;

    let left = event.clientX + 10;
    let top = event.clientY + 10;

    // Adjust position if tooltip goes beyond the right edge of the screen
    if (left + tooltipWidth > pageWidth) {
        left = event.clientX - tooltipWidth - 10;
    }

    // Adjust position if tooltip goes beyond the bottom edge of the screen
    if (top + tooltipHeight > pageHeight) {
        top = event.clientY - tooltipHeight - 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
}

function updateSelection() {
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
}

function updateLanguageBreakdown() {
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);

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
}

function updateScatterplot(filteredCommits){
    const width = 1000;
    const height = 600;

    d3.select('svg').remove(); // first clear the svg
    const svg = d3.select('#chart').append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');
    
    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
    dots.selectAll('circle').data(sortedCommits).join('circle');

    dots
        .selectAll('circle')
        .data(filteredCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget)
            .classed('selected', isCommitSelected(commit))
            .style('fill-opacity', 1);
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
          })
          .on('mouseleave', (event, commit) => {
            d3.select(event.currentTarget)
            .classed('selected', isCommitSelected(commit))
            .style('fill-opacity', 0.7);
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

function renderItems(startIndex) {
    // Clear things off
    itemsContainer.selectAll('div').remove();
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(startIndex, endIndex);
    
    // Update the scatterplot with the new commit slice
    updateScatterplot(newCommitSlice);
    
    // Re-bind the commit data to the container and represent each using a div
    itemsContainer.selectAll('div')
                  .data(newCommitSlice)
                  .enter()
                  .append('div')
                  .attr('class', 'item')
                  .html(d => `
                    <p>
                        On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
                        <a href="${d.url}" target="_blank">
                            ${d.index > 0 ? '' : 'this commit'}
                        </a>. I edited ${d.totalLines} lines across ${d3.rollups(d.lines, D => D.length, d => d.file).length} files. Then I looked over all I made, and I saw that it was good.
                    </p>
                  `)
                  .style('position', 'absolute')
                  .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

function renderStatsItems(startIndex) {
    // Clear things off
    itemsContainerStats.selectAll('div').remove();
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(startIndex, endIndex);
    
    // Update the stats with the new commit slice
    displayStats(newCommitSlice);
    displayFiles(newCommitSlice);
    
    // Re-bind the commit data to the container and represent each using a div
    itemsContainerStats.selectAll('div')
                       .data(newCommitSlice)
                       .enter()
                       .append('div')
                       .attr('class', 'item')
                       .html(d => `
                         <p>
                           On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
                           <a href="${d.url}" target="_blank">
                             ${d.index > 0 ? '' : 'this commit'}
                           </a>. I edited ${d.totalLines} lines across ${d3.rollups(d.lines, D => D.length, d => d.file).length} files. Then I looked over all I made, and I saw that it was good.
                         </p>
                       `)
                       .style('position', 'absolute')
                       .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
  renderItems(startIndex);
});

scrollContainerStats.on('scroll', () => {
    const scrollTop = scrollContainerStats.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderStatsItems(startIndex);
});

document.addEventListener('DOMContentLoaded', () => {
    const timeSlider = document.getElementById('commit-progress');
    const selectedTime = document.getElementById('commit-time');
    const anyTimeLabel = document.getElementById('any-time');

    async function loadData() {
        try {
            data = await d3.csv('loc.csv', (row) => ({
                ...row,
                line: Number(row.line),
                depth: Number(row.depth),
                length: Number(row.length),
                date: new Date(row.date + 'T00:00' + row.timezone),
                datetime: new Date(row.datetime),
                file: row.file, // Ensure the file property exists
                type: row.type // Ensure the type property exists
            }));
            processCommits();
            displayStats(commits);
            displayFiles(commits);
            updateScatterplot(commits);
            updateCommitTime();
            renderItems(0); // Call renderItems after data is loaded and processed
            renderStatsItems(0); // Call renderStatsItems after data is loaded and processed
            updateTotalHeight(); // Update total height after data is loaded
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    function updateCommitTime() {
        commitMaxTime = timeScale.invert(commitProgress);
        selectedTime.textContent = commitMaxTime.toLocaleString('en', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
        filterCommitsByTime();
        updateScatterplot(filteredCommits);
        displayStats(filteredCommits);
        displayFiles(filteredCommits);
        renderItems(0); // Add this line to update the scrollytelling element
    }

    // timeSlider.addEventListener('input', (event) => {
    //     commitProgress = event.target.value;
    //     updateCommitTime();
    // });

    let xScale, yScale;
    let brushSelection = null;

    loadData();
});