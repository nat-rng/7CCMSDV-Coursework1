// Code adapted from http://www.adeveloperdiary.com/d3-js/create-a-simple-donut-chart-using-d3-js/ to work with d3.js v4

d3.csv('../data/racedata_main.csv', function (data) {
  var dataset = d3
    .nest()
    .key(function (d) {
      return d.weather_main
    })
    .rollup(function (v) {
      return v.length
    })
    .object(data)

  var dataset = Object.entries(dataset)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

  var pie = d3
    .pie()
    .value(function (d) {
      return d.value
    })
    .padAngle(0.03)

  var w = 350,
    h = 350,
    padding = 40

  var outerRadius = w / 2
  var innerRadius = 110

  var color = d3
    .scaleOrdinal()
    .domain(dataset)
    .range([
      '#bcced6',
      '#00BFFF',
      '#6c92b8',
      '#fce2b3',
      '#2a4866',
      '#b5e5ff',
      '#a8bbff',
      '#96cbff'
    ])

  var arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius)

  var svg_pie = d3
    .select('#pie_chart')
    .append('svg')
    .attr('width', w + padding * 2)
    .attr('height', h + padding * 2)
    .append('g')
    .attr(
      'transform',
      'translate(' + (w / 2 + padding) + ',' + (h / 2 + padding) + ')'
    )

  var pie_path = svg_pie
    .selectAll('path')
    .data(pie(d3.entries(dataset)))
    .enter()
    .append('path')
    .attr('class', 'pie_path')
    .attr('d', arc)
    .attr('fill', function (d) {
      return color(d.data.key)
    })
    .style('-webkit-filter', 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.7))')
    .style('filter', 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.7))')

  pie_path
    .transition()
    .duration(1000)
    .attrTween('d', function (d) {
      var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
      return function (t) {
        return arc(interpolate(t))
      }
    })

  var restOfTheData = function () {
    svg_pie
      .selectAll('.label')
      .data(pie(d3.entries(dataset)))
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('transform', function (d) {
        return 'translate(' + arc.centroid(d) + ')'
      })
      .attr('dy', '.4em')
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d.data.value
      })
      .style('fill', '#fff')
      .style('font-size', '12px')
      .style('text-shadow', '1px 1px 0 #000')

    var legendRectSize = 15
    var legendSpacing = 5
    var legendHeight = legendRectSize + legendSpacing

    var legend = svg_pie
      .selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('id', 'pie_legend')
      .attr('transform', function (_, i) {
        return 'translate(-50,' + (i * legendHeight - 75) + ')'
      })

    legend
      .append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('rx', 20)
      .attr('ry', 20)
      .style('fill', color)
      .style('stroke', color)

    legend
      .on('mouseover', function (d) {
        d3.selectAll('.pie_path')
          .style('cursor', 'default')
          .style('opacity', 0.1)
          .filter(function (p) {
            return p.data.key == d
          })
          .style('opacity', 1)
        d3.selectAll('.label')
          .style('opacity', 0.1)
          .filter(function (p) {
            return p.data.key == d
          })
          .style('opacity', 1)
          .style('font-size', '20px')
      })
      .on('mouseout', function (d) {
        d3.select(this).style('cursor', 'default').transition().duration(200)

        d3.selectAll('.pie_path').style('opacity', 1)

        d3.selectAll('.label').style('opacity', 1).style('font-size', '12px')
      })

    legend
      .append('text')
      .attr('x', 30)
      .attr('y', 11)
      .text(function (d) {
        return d
      })
      .style('fill', '#405A81')
      .style('font-size', '14px')
  }

  setTimeout(restOfTheData, 1000)
})
