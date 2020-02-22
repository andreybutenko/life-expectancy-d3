const config = {
  displayPlot: {
    height: 800,
    width: 1000,
    margin: 200,

    title: 'Fertility vs Life Expectancy (1980)',
    xSource: 'fertility',
    xDisplay: 'Fertility',
    ySource: 'life_expectancy',
    yDisplay: 'Life Expectancy',
    rFunction: d => Math.max(Math.sqrt(d.population) / 2000, 4),
    label: {
      source: 'country',
      thresholdValue: 100000000,
      thresholdSource: 'population',
      offsetX: 20,
      offsetY: 5
    }
  },
  tooltipPlot: {
    height: 350,
    width: 350,
    margin: 80,

    xSource: 'year',
    xDisplay: 'Year',
    ySource: 'population',
    yDisplay: 'Population',
  }
}

let svg, scatterGroup, tooltipLayer, tooltipBackground, tooltipSvg, tooltipGroup;
let data;
let firstRender = true;

function setupDisplaySvg() {
  svg = d3.select('.display')
    .append('svg')
    .attr('width', config.displayPlot.width + 2 * config.displayPlot.margin)
    .attr('height', config.displayPlot.height + 2 * config.displayPlot.margin);

  scatterGroup = svg.append('g')
    .attr('transform', `translate(${config.displayPlot.margin}, ${config.displayPlot.margin})`);

  svg.append('text')
    .attr('x', config.displayPlot.margin / 2)
    .attr('y', (config.displayPlot.height + 2 * config.displayPlot.margin) / 2)
    .attr('transform-origin', `${config.displayPlot.margin / 2} ${(config.displayPlot.height + 2 * config.displayPlot.margin) / 2}`)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text(config.displayPlot.yDisplay);

  svg.append('text')
    .attr('x', (config.displayPlot.width + 2 * config.displayPlot.margin) / 2)
    .attr('y', config.displayPlot.height + 1.5 * config.displayPlot.margin)
    .attr('text-anchor', 'middle')
    .text(config.displayPlot.xDisplay);

  svg.append('text')
    .attr('x', (config.displayPlot.width + 2 * config.displayPlot.margin) / 2)
    .attr('y', 0.5 * config.displayPlot.margin)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.5em')
    .text(config.displayPlot.title);
}

function addTooltipLayer() {
  tooltipLayer = scatterGroup.append('g')
    .style('display', 'none');

  tooltipBackground = tooltipLayer.append('rect')
    .attr('width', config.tooltipPlot.width + 2 * config.tooltipPlot.margin)
    .attr('height', config.tooltipPlot.height + 2 * config.tooltipPlot.margin)
    .attr('fill', '#ecf0f1')
    .attr('stroke', '#000000')
    .attr('stroke-width', 1)
    .attr('rx', 15)
    .attr('ry', 15)

  tooltipSvg = tooltipLayer.append('svg')
    .attr('width', config.tooltipPlot.width + 2 * config.tooltipPlot.margin)
    .attr('height', config.tooltipPlot.height + 2 * config.tooltipPlot.margin);

    tooltipSvg.append('text')
    .attr('x', config.tooltipPlot.margin / 2)
    .attr('y', (config.tooltipPlot.height + 2 * config.tooltipPlot.margin) / 2)
    .attr('transform-origin', `${config.tooltipPlot.margin / 2} ${(config.tooltipPlot.height + 2 * config.tooltipPlot.margin) / 2}`)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text(config.tooltipPlot.yDisplay);

    tooltipSvg.append('text')
    .attr('x', (config.tooltipPlot.width + 2 * config.tooltipPlot.margin) / 2)
    .attr('y', config.tooltipPlot.height + 1.5 * config.tooltipPlot.margin)
    .attr('text-anchor', 'middle')
    .text(config.tooltipPlot.xDisplay);

  tooltipGroup = tooltipSvg.append('g')
    .attr('transform', `translate(${config.tooltipPlot.margin}, ${config.tooltipPlot.margin})`);
}

function drawLegend() {
  legendGroup = svg.append('g')
    .attr('transform', `translate(${1.2 * config.displayPlot.margin + config.displayPlot.width}, ${config.displayPlot.margin})`);

  legendGroup.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text('Legend');
}

function getData() {
  d3.csv('gapminder.csv', newData => {
    data = newData;
    redraw();
  });
}

function redraw() {
  draw(scatterGroup, 'displayPlot', data);
}

function draw(group, configName, data, line) {
  const displayData = (configName == 'displayPlot' ? data.filter(d => d.year == 1980) : data)
    .filter(
      d => d[config[configName].xSource] != 'NA' && d[config[configName].ySource] != 'NA'
    );

  // Draw x axis
  const x = d3
    .scaleLinear()
    .domain(d3.extent(displayData, d => +d[config[configName].xSource]))
    .range([0, config[configName].width]);
    
  if(group.select('g.x-axis').empty()) {
    group.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${config[configName].height})`)
      .call(d3.axisBottom().scale(x));
  }
  else {
    group.select('g.x-axis')
      .call(d3.axisBottom().scale(x));
  }
  
  // Draw y axis
  const y = d3.scaleLinear()
    .domain(d3.extent(displayData, d => +d[config[configName].ySource]))
    .range([config[configName].height, 0]);

  if(group.select('g.y-axis').empty()) {
    group.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  }
  else {
    group.select('g.y-axis')
      .call(d3.axisLeft(y));
  }
  

  if(!line) {
    group.selectAll('.point')
      .data(displayData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('r',
        !config[configName].rFunction ?
          4 :
          d => config[configName].rFunction(d))
      .on('mouseover', () => tooltipLayer.style('display', null))
      .on('mouseout', () => tooltipLayer.style('display', 'none'))
      .on('mousemove', d => {
        const tooltipWidth = config.tooltipPlot.width + 2 * config.tooltipPlot.margin;
        const tooltipHeight = config.tooltipPlot.height + 2 * config.tooltipPlot.margin;

        let xPosition = x(d[config[configName].xSource]) + 20;
        let yPosition = y(d[config[configName].ySource]) - tooltipHeight / 2;

        if(xPosition + tooltipWidth > config.displayPlot.width) {
          xPosition = x(d[config[configName].xSource]) - tooltipWidth - 20;
        } 
        if(yPosition + tooltipHeight / 2 > config.displayPlot.height - 100) {
          yPosition = y(d[config[configName].ySource]) - tooltipHeight - 20;
        }
        
        tooltipLayer.attr('transform', `translate(${xPosition}, ${yPosition})`).raise();
        draw(tooltipGroup, 'tooltipPlot', data.filter(d2 => d2.country == d.country), true);
      })
      .attr('cx', d => x(d[config[configName].xSource]))
      .attr('cy', d => y(d[config[configName].ySource]));
  }
  else {
    group.selectAll('path').remove();
    group.append('path')
      .datum(displayData)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('d', d3.line()
        .x(function(d) { return x(d[config[configName].xSource]) })
        .y(function(d) { return y(d[config[configName].ySource]) })
      )
  }
  
  if(!!config[configName].label) {
    const labelData = displayData.filter(d => d[config[configName].label.thresholdSource] > config[configName].label.thresholdValue);

    group.selectAll('.label')
      .data(labelData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => x(d[config[configName].xSource]) + config[configName].label.offsetX)
      .attr('y', d => y(d[config[configName].ySource]) + config[configName].label.offsetY)
      .text(d => d[config[configName].label.source]);
  }

  firstRender = false;
}

window.addEventListener('load', () => {
  setupDisplaySvg();
  // drawLegend();
  addTooltipLayer();
  getData();
}, false);