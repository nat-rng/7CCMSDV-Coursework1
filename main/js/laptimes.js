function getQueryParam (parameter) {
  var query = window.location.search.substring(1)
  var queryParams = query.split('&')
  for (var i = 0; i < queryParams.length; i++) {
    var pair = queryParams[i].split('=')
    if (pair[0] == parameter) {
      return pair[1]
    }
  }
  return null
}

document.addEventListener('DOMContentLoaded', function () {
  var circuitId = getQueryParam('circuitId')
  var raceId = getQueryParam('raceId')

  document.getElementById('back-button').addEventListener('click', function () {
    window.location.href =
      'racedetails.html?circuitId=' + encodeURIComponent(circuitId)
  })

  const weatherBackground = {
    Clear: 'linear-gradient(to bottom, #fff, #00BFFF)',
    Clouds: 'linear-gradient(to bottom, #fff, #bcced6)',
    Rain: 'linear-gradient(to bottom, #fff, #6c92b8)',
    Haze: 'linear-gradient(to bottom, #fff, #fce2b3)',
    Thunderstorm: 'linear-gradient(to bottom, #fff, #2a4866)',
    Mist: 'linear-gradient(to bottom, #fff, #b5e5ff)',
    Fog: 'linear-gradient(to bottom, #fff, #a8bbff)',
    Drizzle: 'linear-gradient(to bottom, #fff, #96cbff)',
    Smoke: 'linear-gradient(to bottom, #fff, #818296)'
  }

  const weatherIcons = {
    Clear: 'wi wi-day-sunny',
    Clouds: 'wi wi-cloudy',
    Rain: 'wi wi-rain',
    Snow: 'wi wi-snow',
    Thunderstorm: 'wi wi-thunderstorm',
    Mist: 'wi wi-day-fog',
    Fog: 'wi wi-fog',
    Drizzle: 'wi wi-sprinkle',
    Haze: 'wi wi-day-haze',
    Smoke: 'wi wi-smoke'
  }

  d3.csv('../data/racedata_main.csv', function (error, data) {
    if (error) {
      console.error(error)
      return
    }
    var filteredData = data.filter(function (d) {
      return d.raceId === raceId.toString()
    })
    var url = filteredData[0].url
    document.getElementById('bottom-right-link').href = url
    document.getElementById('bottom-right-text').textContent = '[1] Wikipedia: '
    document.getElementById('bottom-right-link').textContent = url

    const lap = filteredData[0].Laps
    const scheduleLap = filteredData[0]['Scheduled Laps']

    const middleContainer = document.getElementById('middle-text-title')
    middleContainer.textContent = `${lap}/${scheduleLap} Laps Contested: Race Completion Breakdown`

    var weatherBefore = filteredData[0].weather_before
    var weatherMain = filteredData[0].weather_main
    var weatherDuring = filteredData[0].weather_during

    d3.select('.race-title').text(
      filteredData[0].year + ' ' + filteredData[0].grandprix + ' Race Details'
    )
    d3.select('#preRaceWeatherTitle').text(
      'Pre-Race Weather (' + weatherBefore + ')'
    )
    d3.select('#startRaceWeatherTitle').text(
      'Race-Start Weather (' + weatherMain + ')'
    )
    d3.select('#duringRaceWeatherTitle').text(
      'During-Race Weather (' + weatherDuring + ')'
    )
    d3.select('#preRaceWeather').style(
      'background-image',
      weatherBackground[weatherBefore]
    )
    d3.select('#startRaceWeather').style(
      'background-image',
      weatherBackground[weatherMain]
    )
    d3.select('#duringRaceWeather').style(
      'background-image',
      weatherBackground[weatherDuring]
    )
    d3.select('#weather-before').attr('class', weatherIcons[weatherBefore])
    d3.select('#weather-start').attr('class', weatherIcons[weatherMain])
    d3.select('#weather-during').attr('class', weatherIcons[weatherDuring])
  })

  d3.csv('../data/laptime_data.csv', function (error, rawData) {
    if (error) throw error

    var data = rawData.map(function (d) {
      return {
        raceId: +d.raceId,
        driverId: +d.driverId,
        milliseconds: +d.milliseconds,
        time: d.time,
        lap: +d.lap,
        year: +d.year,
        driver: d.driver
      }
    })

    var filteredData = data.filter(function (d) {
      return d.raceId === parseInt(raceId)
    })
    createLineChart(filteredData)
  })

  function createLineChart (data) {
    function renderChart () {
      var container = d3.select('#lap_times').node()
      var containerWidth = container.getBoundingClientRect().width
      var containerHeight = container.getBoundingClientRect().height

      var margin = { top: 60, right: 30, bottom: 45, left: 77 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom

      d3.select('#lap_times svg').remove()

      var x = d3.scaleLinear().range([0, width])
      var y = d3.scaleLinear().range([height, 0])

      var xAxis = d3.axisBottom(x)
      var yAxis = d3.axisLeft(y)

      var line = d3
        .line()
        .x(function (d) {
          return x(d.lap)
        })
        .y(function (d) {
          return y(d.milliseconds)
        })

      var svg_line = d3
        .select('#lap_times')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      x.domain(
        d3.extent(data, function (d) {
          return d.lap
        })
      )

      var yMaxValue = d3.max(data, function (d) {
        return d.milliseconds
      })

      var yMinValue =
        yMaxValue > 500000
          ? 0
          : d3.min(data, function (d) {
              return d.milliseconds
            }) - 10000

      y.domain([yMinValue, yMaxValue])

      d3.select('.section-content').text(data[0].driver + "'s Lap Time")

      svg_line.append('path').datum(data).attr('class', 'line').attr('d', line)

      svg_line
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis)

      svg_line.append('g').attr('class', 'y axis').call(yAxis)

      svg_line
        .append('text')
        .attr(
          'transform',
          'translate(' + width / 2 + ' ,' + (height + margin.top - 22) + ')'
        )
        .style('text-anchor', 'middle')
        .text('Lap')

      svg_line
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - height / 2)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Time (milliseconds)')

      function make_y_gridlines () {
        return d3.axisLeft(y).ticks(5)
      }

      svg_line
        .append('g')
        .attr('class', 'grid')
        .call(make_y_gridlines().tickSize(-width).tickFormat(''))

      var area = d3
        .area()
        .x(function (d) {
          return x(d.lap)
        })
        .y0(height)
        .y1(function (d) {
          return y(d.milliseconds)
        })

      svg_line
        .append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('d', area)
        .style('fill', 'orange')
        .style('opacity', 0.4)

      var tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

      svg_line
        .select('.area')
        .on('mouseover', function (d, i) {
          tooltip.transition().duration(200).style('opacity', 0.9)

          var totalTime = d3.sum(data, function (d) {
            return d.milliseconds
          })
          var hours = Math.floor(totalTime / (60 * 60 * 1000))
          var minutes = Math.floor((totalTime % (60 * 60 * 1000)) / (60 * 1000))
          var seconds = Math.floor((totalTime % (60 * 1000)) / 1000)
          var milliseconds = totalTime % 1000

          var formattedTime =
            hours + ':' + minutes + ':' + seconds + '.' + milliseconds

          tooltip
            .html('Total Time: ' + formattedTime)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY - 28 + 'px')
        })
        .on('mouseout', function (d) {
          tooltip.transition().duration(500).style('opacity', 0)
        })

      let markers = svg_line
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function (d) {
          return x(d.lap)
        })
        .attr('cy', function (d) {
          return y(d.milliseconds)
        })
        .attr('r', 5)
        .style('fill', '#ff8000')
        .style('opacity', 0.7)

      markers
        .on('mouseover', function (d) {
          d3.select(this).attr('opacity', 0.5).style('fill', '#ff0000')
          tooltip.transition().duration(200).style('opacity', 0.9)
          tooltip
            .html('Lap: ' + d.lap + '<br/>' + 'Lap time: ' + d.time)
            .style('left', d3.event.pageX + 10 + 'px')
            .style('top', d3.event.pageY - 28 + 'px')
            .style('transform', 'translate(-50%, -50%)')
        })
        .on('mouseout', function (d) {
          d3.select(this)
            .attr('r', 5)
            .style('fill', '#ff8000')
            .style('opacity', 0.7)
          tooltip.transition().duration(500).style('opacity', 0)
        })
    }
    renderChart()
    window.addEventListener('resize', renderChart)
  }
})
