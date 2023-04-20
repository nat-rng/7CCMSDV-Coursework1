function getQueryVariable (variable) {
  var query = window.location.search.substring(1)
  var vars = query.split('&')
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')
    if (pair[0] == variable) {
      return pair[1]
    }
  }
  return false
}

var raceId = getQueryVariable('raceId')

function getContainerSizeBarL () {
  const container = document.getElementById('bar-l')
  const containerHeight = container.clientHeight
  const backgroundWidthBefore =
    document.getElementById('preRaceWeather').clientWidth
  const backgroundWidthStart =
    document.getElementById('startRaceWeather').clientWidth
  const containerWidth = backgroundWidthBefore + backgroundWidthStart + 70
  return { width: containerWidth, height: containerHeight }
}

// Code adapted from http://www.adeveloperdiary.com/d3-js/create-a-simple-donut-chart-using-d3-js/ to work with d3.js v4

d3.csv('../data/retire_reason.csv', function (error, data) {
  if (error) {
    console.error(error)
    return
  }
  // Filter the data by raceid
  processRaceRetireData(data)
})

function processRaceRetireData (data) {
  var race_retire = data.filter(function (d) {
    return d.raceId == raceId.toString()
  })

  var frequencyCounts = JSON.parse(
    race_retire[0].frequency_counts.replace(/'/g, '"')
  )
  var frequencyData = Object.entries(frequencyCounts).map(function (entry) {
    return { key: entry[0], value: entry[1] }
  })

  const sortedFrequeqncyData = frequencyData.sort((a, b) => {
    const regex = /^[a-zA-Z]/

    const aIsAlpha = regex.test(a.key)
    const bIsAlpha = regex.test(b.key)

    if ((aIsAlpha && bIsAlpha) || (!aIsAlpha && !bIsAlpha)) {
      return a.key.localeCompare(b.key)
    } else if (aIsAlpha && !bIsAlpha) {
      return 1
    } else {
      return -1
    }
  })

  createPieChart(race_retire)
  const containerSizeBarL = getContainerSizeBarL()
  createBarChart(
    sortedFrequeqncyData,
    containerSizeBarL.width,
    containerSizeBarL.height
  )
  window.addEventListener('resize', () => {
    const newSize = getContainerSizeBarL()
    d3.select('#bar-l').selectAll('svg').remove()
    createBarChart(sortedFrequeqncyData, newSize.width, newSize.height)
  })
}

function createPieChart (data) {
  var dataset = [
    { key: 'Retired', value: +data[0].retired },
    { key: 'Completed', value: +data[0].completed }
  ]

  var container = d3.select('#pie-r')
  var containerWidth = document.getElementById('duringRaceWeather').clientWidth
  var containerHeight = parseInt(container.style('height'))
  var padding = 120
  var w = containerWidth - padding * 2
  var h = containerHeight - padding * 2
  function createSvg (w, h, padding) {
    var pie = d3
      .pie()
      .value(function (d) {
        return d.value
      })
      .padAngle(0.03)
    var minDimension = Math.min(w, h)
    var outerRadius = minDimension / 2.2
    var innerRadius = 20 + minDimension * 0.6

    var color = d3
      .scaleOrdinal()
      .domain(['Retired', 'Completed'])
      .range(['#FFCC00', '#0080FF'])

    var arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius)

    var svg_pie = d3
      .select('#pie-r')
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
      .data(pie(dataset))
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
        .data(pie(dataset))
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
        .style('font-size', '14px')
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
          return 'translate(-50,' + (i * legendHeight - 20) + ')'
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

          d3.selectAll('.label').style('opacity', 1).style('font-size', '14px')
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
  }
  var svg_pie = createSvg(w, h, padding)
  window.addEventListener('resize', function () {
    containerWidth = parseInt(container.style('width'))
    containerHeight = parseInt(container.style('height'))
    w = containerWidth - padding * 2
    h = containerHeight - padding * 2

    d3.select('#pie-r').selectAll('svg').remove()
    svg_pie = createSvg(w, h, padding)
  })
}

function createBarChart (data, width_in, height_in) {
  var margin = { top: 20, right: 5, bottom: 60, left: 70 },
    width = width_in - margin.left - margin.right,
    height = height_in - margin.top - margin.bottom

  var svg_bar = d3
    .select('#bar-l')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  const maxValue = d3.max(data, d => d.value)
  var x = d3
    .scaleBand()
    .range([0, width])
    .domain(
      data.map(function (d) {
        return d.key
      })
    )
    .padding(0.1)

  var y = d3.scaleLinear().domain([0, maxValue]).range([height, 0])

  svg_bar
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '14px')

  svg_bar
    .append('g')
    .call(
      d3.axisLeft(y).tickFormat(function (d) {
        if (Math.floor(d) === d) {
          return d3.format('d')(d)
        } else {
          return ''
        }
      })
    )
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

  function make_y_gridlines () {
    return d3.axisLeft(y).ticks(5)
  }

  svg_bar
    .append('g')
    .attr('class', 'grid')
    .call(make_y_gridlines().tickSize(-width).tickFormat(''))

  svg_bar
    .selectAll('myRect')
    .data(data)
    .enter()
    .append('rect')
    .attr('y', function (d) {
      return y(d.value)
    })
    .attr('x', function (d) {
      return x(d.key)
    })
    .attr('height', function (d) {
      return height - y(d.value)
    })
    .attr('width', x.bandwidth())
    .attr('fill', function (d) {
      return colorScale(d.key)
    })
    .on('mouseenter', function (actual, i) {
      svg_bar.selectAll('.bar-label')

      d3.select(this).transition().duration(300).attr('opacity', 0.4)

      svg_bar
        .append('line')
        .attr('class', 'limit')
        .attr('y1', y(actual.value))
        .attr('x1', 0)
        .attr('y2', y(actual.value))
        .attr('x2', width)
        .attr('stroke', 'red')
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '4')
    })
    .on('mouseleave', function () {
      svg_bar.selectAll('.bar-label').attr('opacity', 1)

      d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .style('font-size', 14)
      svg_bar.selectAll('.limit').remove()
    })
}
