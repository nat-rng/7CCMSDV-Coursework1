document.getElementById('back-button').addEventListener('click', function () {
  window.location.href = 'index.html'
})

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

var circuitId = getQueryVariable('circuitId')

var margin = { top: 100, right: 200, bottom: 60, left: 120 }
;(width = 1300 - margin.left - margin.right),
  (height = 900 - margin.top - margin.bottom)

const weatherColors = {
  Clear: '#00BFFF',
  Clouds: '#bcced6',
  Rain: '#6c92b8',
  Haze: '#fce2b3',
  Thunderstorm: '#2a4866',
  Mist: '#b5e5ff',
  Fog: '#a8bbff',
  Drizzle: '#96cbff'
}

var svg_bar = d3
  .select('#race_details')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

d3.csv('../data/racedata_main.csv', function (error, raw_data) {
  if (error) {
    console.error('Error reading the CSV file:', error)
    return
  }

  const filteredData = raw_data.filter(function (row) {
    return row.circuitId === circuitId
  })

  const sortedData = filteredData.sort(function (a, b) {
    return Date.parse(a.date) - Date.parse(b.date)
  })

  const data = sortedData.map(function (row) {
    return {
      circuit: row.circuit,
      weather_main: row.weather_main,
      milliseconds: row.milliseconds,
      grandprix: row.grandprix,
      year: row.year,
      date: row.date,
      raceId: row.raceId,
      scheduledLaps: row['Scheduled Laps'],
      laps: row.Laps
    }
  })
  const milliseconds = data.map(row => row.milliseconds)
  const sumMilliseconds = milliseconds.reduce(
    (acc, val) => parseInt(acc) + parseInt(val),
    0
  )
  const mean = sumMilliseconds / milliseconds.length

  const circuitName = data[0].circuit

  const maxMilliseconds = Math.max(...data.map(row => row.milliseconds))
  const domainMax = Math.ceil(maxMilliseconds / 1000)
  const roundedDomainMax = Math.ceil(domainMax / 500) * 500

  var x = d3.scaleLinear().domain([0, roundedDomainMax]).range([0, width])
  var xAxis = d3.axisBottom(x).tickSize(-height).tickFormat('')

  svg_bar
    .append('text')
    .attr('class', 'header')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .text('Race Times for ' + circuitName + ' (2005-2022)')

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
        return d.date
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
    .domain(Object.keys(weatherColors))
    .range(Object.values(weatherColors))

  var defs = svg_bar.append('defs')
  defs
    .append('pattern')
    .attr('id', 'stripe-pattern')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 20)
    .attr('height', 6)
    .attr('patternTransform', 'rotate(45)')
    .append('rect')
    .attr('width', 2)
    .attr('height', 6)
    .attr('transform', 'translate(0,0)')
    .attr('fill', '#000')
    .attr('opacity', '0.25')

  var stripeGroup = svg_bar.append('g').attr('class', 'stripe-group')

  stripeGroup
    .selectAll('.stripe-rect')
    .data(data.filter(d => d.laps !== d.scheduledLaps))
    .enter()
    .append('rect')
    .attr('class', 'stripe-rect')
    .attr('id', function (d) {
      return d.raceId
    })
    .attr('x', function (d) {
      return x(0)
    })
    .attr('y', function (d) {
      return y(d.date)
    })
    .attr('width', function (d) {
      return x(d.milliseconds / 1000)
    })
    .attr('height', y.bandwidth())
    .attr('fill', function (d) {
      return colorScale(d.weather_main)
    })
    .each(function (d) {
      if (d.laps !== d.scheduledLaps) {
        d3.select(this.parentNode)
          .append('rect')
          .attr('x', x(0))
          .attr('y', y(d.date))
          .attr('width', x(d.milliseconds / 1000))
          .attr('height', y.bandwidth())
          .attr('fill', 'url(#stripe-pattern)')
      }
    })

  svg_bar
    .selectAll('myRect')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('id', function (d) {
      return d.raceId
    })
    .attr('x', x(0))
    .attr('y', function (d) {
      return y(d.date)
    })
    .attr('width', function (d) {
      return x(d.milliseconds / 1000)
    })
    .attr('height', y.bandwidth())
    .attr('fill', function (d) {
      return colorScale(d.weather_main)
    })
    .attr('opacity', function (d) {
      return d.laps === d.scheduledLaps ? 1 : 0
    })
    .on('mouseenter', function (actual, i) {
      svg_bar.selectAll('.bar-label').attr('opacity', 0)

      d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', 0.6)
        .style('cursor', 'context-menu')
        .each(function (selected) {
          var selectedId = d3.select(this).attr('id')
          svg_bar
            .selectAll('.stripe-rect')
            .filter(function (d) {
              return d3.select(this).attr('id') === selectedId
            })
            .transition()
            .duration(300)
            .attr('opacity', 0)
        })

      svg_bar
        .append('line')
        .attr('class', 'limit')
        .attr('x1', x(actual.milliseconds / 1000))
        .attr('y1', 0)
        .attr('x2', x(actual.milliseconds / 1000))
        .attr('y2', height)
        .attr('stroke', 'red')
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '4')

      var filterDivergenceData = data.filter((d, index) => index !== i)
      svg_bar
        .selectAll('.divergence')
        .data(filterDivergenceData)
        .enter()
        .append('text')
        .attr('class', 'divergence')
        .attr('x', function (d) {
          return x(d.milliseconds / 1000) / 2
        })
        .attr('y', function (d) {
          return y(d.date) + y.bandwidth() / 2 + 5
        })
        .style('fill', function (d, i) {
          var ogIndex = data.findIndex(elem => elem === d)
          var barColor = d3
            .select(svg_bar.selectAll('.bar').nodes()[ogIndex])
            .style('fill')
          return checkColour(barColor) ? 'white' : '#2d2d2e'
        })
        .attr('text-anchor', 'start')
        .text(d => {
          const divergence = (
            ((d.milliseconds - actual.milliseconds) / actual.milliseconds) *
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

      d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', function (d) {
          return d.laps === d.scheduledLaps ? 1 : 0
        })
        .each(function (selected) {
          var selectedId = d3.select(this).attr('id')
          svg_bar
            .selectAll('.stripe-rect')
            .filter(function (d) {
              return d3.select(this).attr('id') === selectedId
            })
            .transition()
            .duration(300)
            .attr('opacity', 1)
        })
      svg_bar.selectAll('.divergence').remove()
      svg_bar.selectAll('.limit').remove()
    })
    .on('click', function (d) {
      window.location.href = `racedetailByYear.html?circuitId=${circuitId}&raceId=${d.raceId}`
    })

  svg_bar
    .append('line')
    .attr('x1', x(mean / 1000))
    .attr('x2', x(mean / 1000))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '4')
    .style('opacity', 0.3)

  svg_bar
    .append('text')
    .attr('x', x(mean / 1000))
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', 'black')
    .style('opacity', 0.3)
    .text('Average: ' + mean / 1000)

  function checkColour (color) {
    var r, g, b, brightness
    var match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)

    if (match) {
      r = parseInt(match[1], 10)
      g = parseInt(match[2], 10)
      b = parseInt(match[3], 10)
    } else {
      return false
    }

    brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness < 140
  }

  svg_bar
    .selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('y', function (d) {
      return y(d.date) + y.bandwidth() / 2
    })
    .attr('dy', '0.35em')
    .style('fill', function (d, i) {
      var barColor = d3
        .select(svg_bar.selectAll('.bar').nodes()[i])
        .style('fill')
      return checkColour(barColor) ? 'white' : '#2d2d2e'
    })
    .style('font-size', '14px')
    .text(function (d) {
      return d.milliseconds / 1000
    })
    .each(function (d) {
      var label = d3.select(this)
      var textWidth = label.node().getComputedTextLength()
      var xPosition = x(d.milliseconds / 1000)
      if (textWidth > xPosition) {
        label.attr('text-anchor', 'end').attr('x', xPosition + 30)
      } else {
        label.attr('text-anchor', 'middle').attr('x', xPosition / 2)
      }
    })

  const labelOffset = 15
  svg_bar
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', width)
    .attr('y', height + labelOffset + margin.bottom / 2)
    .attr('text-anchor', 'end')
    .text('(in 1000ms)')

  const uniqueWeatherConditions = [...new Set(data.map(d => d.weather_main))]
  const hasStripedBars = data.some(d => d.laps !== d.scheduledLaps)

  if (hasStripedBars) {
    defs
      .append('pattern')
      .attr('id', 'legend-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 6)
      .attr('height', 6)
      .attr('patternTransform', 'rotate(45)')
      .append('rect')
      .attr('width', 2)
      .attr('height', 6)
      .attr('transform', 'translate(0,0)')
      .attr('fill', '#000')
      .attr('opacity', '0.3')
    uniqueWeatherConditions.push('Race Incomplete')
    weatherColors['Race Incomplete'] = 'url(#legend-pattern)'
  }

  const legendSize = 15
  const legendSpacing = 4

  const containerPadding = 5

  const offsetX = -40
  var legend = svg_bar
    .append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + (width - 10 - offsetX) + ',' + 10 + ')')

  let maxTextWidth = 0

  uniqueWeatherConditions.forEach(function (weather, i) {
    var legendItem = legend
      .append('g')
      .attr(
        'transform',
        'translate(' +
          containerPadding +
          ',' +
          (containerPadding + i * (legendSize + legendSpacing)) +
          ')'
      )

    legendItem
      .append('rect')
      .attr('width', legendSize)
      .attr('height', legendSize)
      .style('fill', weatherColors[weather])

    const textElement = legendItem
      .append('text')
      .attr('x', legendSize + legendSpacing)
      .attr('y', legendSize / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'start')
      .style('font-size', '14px')
      .text(weather)

    const textBBox = textElement.node().getBBox()
    if (textBBox.width > maxTextWidth) {
      maxTextWidth = textBBox.width
    }
  })

  const containerWidth =
    legendSize + containerPadding * 2 + legendSpacing * 2 + maxTextWidth

  const containerHeight =
    uniqueWeatherConditions.length * (legendSize + legendSpacing) +
    containerPadding * 2

  legend
    .insert('rect', ':first-child')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .attr('fill', '#f0f0f0')
    .attr('rx', 5)
    .attr('ry', 5)
})
