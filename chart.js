const HEIGHT = 600;
const WIDTH = 800;
const MARGIN = 100;
const LEGEND_SIZE = 85;

const TYPE_COLORS = {
  'Bug': '#4E79A7',
  'Dark': '#A0CBE8',
  'Electric': '#F28E2B',
  'Fairy': '#FFBE7D',
  'Fighting': '#59A14F',
  'Fire': '#8CD17D',
  'Ghost': '#B6992D',
  'Grass': '#499894',
  'Ground': '#86BCB6',
  'Ice': '#FABFD2',
  'Normal': '#E15759',
  'Poison': '#FF9D9A',
  'Psychic': '#79706E',
  'Steel': '#BAB0AC',
  'Water': '#D37295'
};

const TITLE = 'Pokemon Stats Total vs Special Defence'
const X_AXIS = 'Sp. Def';
const Y_AXIS = 'Total';
const COLOR_DIM = 'Type 1';

let svg, scatterGroup, tooltipLayer, tooltipBackground, tooltipTextName, tooltipTextType, tooltipTextType2;
let data;
let firstRender = true;

function setupSvg() {
  svg = d3.select('.display')
    .append('svg')
    .attr('width', WIDTH + 3 * MARGIN + LEGEND_SIZE)
    .attr('height', HEIGHT + 2 * MARGIN);

  scatterGroup = svg.append('g')
    .attr('transform', `translate(${MARGIN}, ${MARGIN})`);

  svg.append('text')
    .attr('x', MARGIN / 2)
    .attr('y', (HEIGHT + 2 * MARGIN) / 2)
    .attr('transform-origin', `${MARGIN / 2} ${(HEIGHT + 2 * MARGIN) / 2}`)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text(Y_AXIS);

  svg.append('text')
    .attr('x', (WIDTH + 2 * MARGIN) / 2)
    .attr('y', HEIGHT + 1.5 * MARGIN)
    .attr('text-anchor', 'middle')
    .text(X_AXIS);

  svg.append('text')
    .attr('x', (WIDTH + 2 * MARGIN) / 2)
    .attr('y', 0.5 * MARGIN)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.5em')
    .text(TITLE);
}

function addTooltipLayer() {
  tooltipLayer = scatterGroup.append('g')
    .style('display', 'none');

  tooltipBackground = tooltipLayer.append('rect')
    .attr('width', 200)
    .attr('height', 70)
    .attr('fill', '#ecf0f1')
    .attr('stroke', '#000000')
    .attr('stroke-width', 1)
    .attr('rx', 15)
    .attr('ry', 15)

  tooltipTextName = tooltipLayer.append('text')
    .attr('x', 8)
    .attr('y', 20);

  tooltipTextType = tooltipLayer.append('text')
    .attr('x', 8)
    .attr('y', 40);

  tooltipTextType2 = tooltipLayer.append('text')
    .attr('x', 8)
    .attr('y', 60);
}

function drawLegend() {
  const legendGroup = svg.append('g')
    .attr('transform', `translate(${1.2 * MARGIN + WIDTH}, ${MARGIN})`);

  legendGroup.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text('Legend');
  
  for(let i = 0; i < Object.keys(TYPE_COLORS).length; i++) {
    const type = Object.keys(TYPE_COLORS)[i];

    legendGroup.append('text')
      .attr('x', 20 + 5)
      .attr('y', (i + 1) * 25 + 5)
      .text(type);

    legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', i * 25 + 13)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', TYPE_COLORS[type])
  }
}

function getData() {
  d3.csv('pokemon.csv', newData => {
    data = newData;
    redraw();
  });
}

function redraw() {
  const pokemonGen = document.getElementById('pokemon-gen').value;
  const pokemonLegend = document.getElementById('pokemon-legend').value;
  const mappedData = data
    .map(d => pokemonGen === 'all' ? { ...d, show: true } : { ...d, show: d['Generation'] == pokemonGen })
    .map(d => pokemonLegend === 'all' ? d : { ...d, show: d.show && d['Legendary'] == pokemonLegend });
  
  draw(mappedData);
}

function draw(data) {
  const displayData = data.filter(d => d.show);

  // Draw x axis
  const x = d3
    .scaleLinear()
    .domain(d3.extent(displayData, d => +d[X_AXIS]))
    .range([0, WIDTH]);
  
  if(firstRender) {
    scatterGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${HEIGHT})`)
      .call(d3.axisBottom().scale(x));
  }
  else {
    d3.select('.x-axis')
      .transition(d3.transition().duration(1000))
      .call(d3.axisBottom().scale(x));
  }
  
  // Draw y axis
  const y = d3.scaleLinear()
    .domain(d3.extent(displayData, d => +d[Y_AXIS]))
    .range([HEIGHT, 0]);

  if(firstRender) {
    scatterGroup.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  }
  else {
    d3.select('.y-axis')
      .transition(d3.transition().duration(1000))
      .call(d3.axisLeft(y));
  }

  const selection = scatterGroup.selectAll('.point').data(data);

  selection.enter()
    .append('circle')
    .attr('class', 'point')
    .attr('r', 5)
    .style('fill', d => TYPE_COLORS[d[COLOR_DIM]])
    .on('mouseover', () => tooltipLayer.style('display', null))
    .on('mouseout', () => tooltipLayer.style('display', 'none'))
    .on('mousemove', d => {
      tooltipLayer.attr('transform', `translate(${x(d[X_AXIS]) + 20}, ${y(d[Y_AXIS]) + 20})`).raise()
      tooltipTextName.text(d['Name']);
      tooltipTextType.text(`Type 1: ${d['Type 1']}`);
      tooltipTextType2.text(`Type 2: ${d['Type 2']}`);
    })
    .merge(selection)
    .transition()
    .duration(1000)
    .attr('cx', d => x(d[X_AXIS]))
    .attr('cy', d => y(d[Y_AXIS]))
    .style('opacity', d => +d.show)

  firstRender = false;
}

window.addEventListener('load', () => {
  setupSvg();
  drawLegend();
  addTooltipLayer();
  getData();

  document.getElementById('pokemon-gen').addEventListener('change', redraw);
  document.getElementById('pokemon-legend').addEventListener('change', redraw);
}, false);