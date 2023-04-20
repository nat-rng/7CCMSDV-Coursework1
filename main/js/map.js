// code from https://d3-graph-gallery.com/graph/backgroundmap_basic.html
var svg_map = d3.select('svg'),
  width = +svg_map.attr('width'),
  height = +svg_map.attr('height')

var projection = d3
  .geoLarrivee()
  .scale(width / 2 / Math.PI)
  .translate([width / 2, height / 2])
  .center([0, 27])

d3.csv('../data/racedata_main.csv', function (data) {
  const column = data.map(function (d) {
    return d.country
  })
  const uniqueCountries = d3
    .map(
      d3
        .nest()
        .key(function (d) {
          return d
        })
        .object(column)
    )
    .keys()
  var gp_countries = uniqueCountries

  const weatherByCircuit = d3
    .nest()
    .key(function (d) {
      return d.circuitId
    })
    .key(function (d) {
      return d.weather_main
    })
    .rollup(function (v) {
      return v.length
    })
    .entries(data)

  const weatherByCircuitResults = weatherByCircuit.map(function (d) {
    const weatherCounts = d.values.map(function (v) {
      return v.value
    })
    const maxCount = d3.max(weatherCounts)
    const topWeathers = d.values
      .filter(function (v) {
        return v.value === maxCount
      })
      .map(function (v) {
        return v.key
      })
      .sort()

    var mostFrequentWeather = topWeathers.sort()[0]
    if (topWeathers.length > 1) {
      randIndex = Math.floor(Math.random() * topWeathers.length)
      mostFrequentWeather = topWeathers.sort()[randIndex]
    }

    const weatherIcons = {
      Clear: 'wi wi-day-sunny',
      Clouds: 'wi wi-cloudy',
      Rain: 'wi wi-rain',
      Snow: 'wi wi-snow',
      Thunderstorm: 'wi wi-thunderstorm',
      Mist: 'wi wi-fog',
      Fog: 'wi wi-fog',
      Drizzle: 'wi wi-sprinkle',
      Haze: 'wi wi-day-haze'
    }

    const icon = weatherIcons[mostFrequentWeather]

    return {
      circuitId: d.key,
      mostFrequentWeather: mostFrequentWeather,
      icon: icon
    }
  })

  function handleClick (d) {
    var existingLabelGroup = svg_map.select('.circuit-label-group')

    var addNewLabel = true

    if (!existingLabelGroup.empty()) {
      if (existingLabelGroup.attr('data-id') === d.id) {
        existingLabelGroup.remove()
        addNewLabel = false
      } else {
        existingLabelGroup.remove()
      }
    }

    if (addNewLabel) {
      var svg_size = document.getElementById('racetrack_map')
      var svgRect = svg_size.getBoundingClientRect()

      var offsetX = 50
      var offsetY = -20

      if (d.x + offsetX + rectWidth > svgRect.right) {
        offsetX = -(offsetX + rectWidth)
      }

      if (d.y + offsetY - rectHeight < svgRect.top) {
        offsetY = -offsetY
      }

      var labelGroup = svg_map
        .append('g')
        .attr('class', 'circuit-label-group')
        .attr('data-id', d.id)

      var rectWidth = 150
      var rectHeight = 30
      var rectX = d.x + offsetX - rectWidth / 2 + 25
      var rectY = d.y + offsetY - rectHeight - 27
      var textX = rectX + rectWidth / 2
      var textY = rectY + rectHeight / 2
      var lineX = d.x
      var lineY = d.y
      if (d.x < textX) {
        lineX = rectX
        lineY = rectY + rectHeight / 2
      } else {
        lineX = rectX + rectWidth
        lineY = rectY + rectHeight / 2
      }
      labelGroup
        .append('line')
        .attr('x1', d.x + 3.5)
        .attr('y1', d.y)
        .attr('x2', lineX + 3.5)
        .attr('y2', lineY)
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')

      var textWidth = labelGroup
        .append('text')
        .attr('font-size', '20px')
        .attr('text-anchor', 'start')
        .attr('fill', 'black')
        .text(d.properties.name)
        .style('opacity', 0)
        .node()
        .getBBox().width
      var rectWidth = textWidth + 60
      var rectHeight = 30
      labelGroup
        .append('rect')
        .attr('x', d.x - rectWidth / 2 - 5)
        .attr('y', d.y + offsetY - rectHeight - 34)
        .attr('width', rectWidth)
        .attr('height', rectHeight + 15)
        .attr('fill', '#e0e6f1')

      const leftPolylinePoints = [
        `${d.x - rectWidth / 2 - 5},${d.y + offsetY - rectHeight - 34}`,
        `${d.x - rectWidth / 2 - 5},${d.y + offsetY - 19}`
      ]

      const rightPolylinePoints = [
        `${d.x + rectWidth / 2 - 5},${d.y + offsetY - rectHeight - 34}`,
        `${d.x + rectWidth / 2 - 5},${d.y + offsetY - 19}`
      ]

      labelGroup
        .append('polyline')
        .attr('points', leftPolylinePoints.join(' '))
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')

      labelGroup
        .append('polyline')
        .attr('points', rightPolylinePoints.join(' '))
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')

      labelGroup
        .append('a')
        .attr('xlink:href', `racedetails.html?circuitId=${d.properties.id}`)
        .append('text')
        .attr('x', textX - 105)
        .attr('y', textY + 7)
        .attr('id', d.properties.id)
        .attr('font-size', '20px')
        .attr('font-family', 'sans-serif')
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .text(d.properties.name)

      const circuitId = d.properties.id
      const circuitData = weatherByCircuitResults.find(function (data) {
        return data.circuitId === circuitId
      })
      if (circuitData) {
        const iconClasses = circuitData.icon.split(' ')

        const iconObject = labelGroup
          .append('foreignObject')
          .attr('x', d.x + rectWidth / 2 - 53)
          .attr('y', d.y + offsetY - 62)
          .attr('width', 50)
          .attr('height', 50)

        const container = document.createElement('div')
        container.style.padding = '5px'
        iconObject.node().appendChild(container)

        const iconElement = document.createElement('i')
        iconClasses.forEach(iconClass => iconElement.classList.add(iconClass))
        iconElement.style.fontSize = '32px'
        container.appendChild(iconElement)
      }
    }
  }

  d3.json(
    '../data/world.geojson',
    function (data1) {
      d3.json('../data/f1_locations.geojson', function (data2) {
        var features = data1.features.concat(data2.features)
        svg_map
          .append('g')
          .selectAll('path')
          .data(
            features.filter(function (d) {
              return (
                d.geometry.type === 'Polygon' ||
                d.geometry.type === 'MultiPolygon'
              )
            })
          )
          .enter()
          .append('path')
          .attr('fill', function (d) {
            if (gp_countries.includes(d.properties.name)) {
              return '#FFC700'
            } else {
              return '#405A81'
            }
          })
          .attr('d', d3.geoPath().projection(projection))
          .style('stroke', '#fff')

        svg_map
          .selectAll('rect')
          .data(
            features.filter(function (d) {
              return d.geometry.type === 'Point'
            })
          )
          .enter()
          .append('rect')
          .attr('width', 7)
          .attr('height', 7)
          .attr('x', function (d) {
            d.x = projection(d.geometry.coordinates)[0] - 3.5
            return d.x
          })
          .attr('y', function (d) {
            d.y = projection(d.geometry.coordinates)[1] - 3.5
            return d.y
          })
          .attr('class', 'circuit_point')
          .on('mouseover', function (d) {
            d3.select(this)
              .attr('width', 10)
              .attr('height', 10)
              .attr('x', d.x - 2)
              .attr('y', d.y - 2)
          })
          .on('mouseout', function (d) {
            d3.select(this)
              .attr('width', 7)
              .attr('height', 7)
              .attr('x', d.x)
              .attr('y', d.y)
          })
          .on('click', function (d) {
            handleClick(d, features)
          })
      })
    }
  )
})
