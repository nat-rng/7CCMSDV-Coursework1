var margin = { top: 20, right: 50, bottom: 60, left: 120 }
;(width = 1200 - margin.left - margin.right),
  (height = 250 - margin.top - margin.bottom)

var svg_bar = d3
  .select('#median_racetime_bar')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

d3.csv('../data/racedata_main.csv', function (raw_data) {
  var rainingCategories = ['Rain', 'Thunderstorm', 'Drizzle']

  var data = d3
    .nest()
    .key(function (d) {
      return rainingCategories.includes(d.weather_main)
        ? 'Raining'
        : 'Not Raining'
    })
    .rollup(function (v) {
      return d3.median(v, function (d) {
        return +d.milliseconds
      })
    })
    .entries(raw_data)

  var x = d3.scaleLinear().domain([0, 6000]).range([0, width])
  var xAxis = d3.axisBottom(x).tickSize(-height).tickFormat('')

  svg_bar
    .append('g')
    .attr('class', 'grid')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
    .selectAll('line')
    .style('stroke', '#ccc')
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end')

  svg_bar
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end')

  var y = d3
    .scaleBand()
    .range([0, height])
    .domain(
      data.map(function (d) {
        return d.key
      })
    )
    .padding(0.1)
  svg_bar
    .append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('font-size', '14px')

  var colorScale = d3
    .scaleOrdinal()
    .domain(
      data.map(function (d) {
        return d.key
      })
    )
    .range(['#8CB9FE', '#405A81'])

  // hover functionality adjusted from https://jsfiddle.net/matehu/w7h81xz2/38/
  svg_bar
    .selectAll('myRect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', x(0))
    .attr('y', function (d) {
      return y(d.key)
    })
    .attr('width', function (d) {
      return x(d.value / 1000)
    })
    .attr('height', y.bandwidth())
    .attr('fill', function (d) {
      return colorScale(d.key)
    })
    .on('mouseenter', function (actual, i) {
      svg_bar.selectAll('.bar-label').attr('opacity', 0)

      d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', 0.6)
        .style('cursor', 'context-menu')

      svg_bar
        .append('line')
        .attr('class', 'limit')
        .attr('x1', x(actual.value / 1000))
        .attr('y1', 0)
        .attr('x2', x(actual.value / 1000))
        .attr('y2', height)
        .attr('stroke', 'red')
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '4')

      svg_bar
        .selectAll('.divergence')
        .data(data.filter((d, index) => index !== i))
        .enter()
        .append('text')
        .attr('class', 'divergence')
        .attr('x', function (d) {
          return x(d.value / 1000) / 2
        })
        .attr('y', function (d) {
          return y(d.key) + y.bandwidth() / 2 + 5
        })
        .style('fill', function (d) {
          return d.value / 1000 > 5700 ? 'white' : '#2d2d2e'
        })
        .attr('text-anchor', 'start')
        .text(d => {
          const divergence = (
            ((d.value - actual.value) / actual.value) *
            100
          ).toFixed(2)
          let text = ''
          if (divergence > 0) text += '+'
          text += `${divergence}%`
          return text
        })
    })
    .on('mouseleave', function () {
      svg_bar.selectAll('.bar-label').attr('opacity', 1)

      d3.select(this).transition().duration(300).attr('opacity', 1)

      svg_bar.selectAll('.divergence').remove()
      svg_bar.selectAll('.limit').remove()
    })

  svg_bar
    .selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', function (d) {
      return x(d.value / 1000) / 2
    })
    .attr('y', function (d) {
      return y(d.key) + y.bandwidth() / 2
    })
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .style('fill', function (d) {
      return d.value / 1000 > 5700 ? 'white' : '#2d2d2e'
    })
    .style('font-size', '14px')
    .text(function (d) {
      return d.value / 1000
    })

  const labelOffset = 15
  svg_bar
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', width)
    .attr('y', height + labelOffset + margin.bottom / 2)
    .attr('text-anchor', 'end')
    .text('(in 1000ms)')
})
