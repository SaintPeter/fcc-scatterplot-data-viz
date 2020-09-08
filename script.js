
// Data URL
//url = 'cyclist-data.json'
url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json"

// Fetch Data
fetch(url)
  .then(response => {
    response.json().then(data => {
        processData(data);
      }
    );
    
  })
  .catch(err => {
    console.warn("Fetch Failed: ",err)
  })

// SVG Auto Resize
// Taken from: https://benclinkinbeard.com/d3tips/make-any-chart-responsive-with-one-function/
function responsivefy(svg) {
  const container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style('width'), 10),
    height = parseInt(svg.style('height'), 10),
    aspect = width / height;

  svg.attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMid')
    .call(resize);

  d3.select(window).on(
    'resize.' + container.attr('id'),
    resize
  );

  function resize() {
    const w = parseInt(container.style('width'));
    svg.attr('width', w);
    svg.attr('height', Math.round(w / aspect));
  }
}

function processData(dataset) {
  let data = dataset.map(item => {
    let [ minutes, seconds ] = item.Time.split(':');

    // Transform the data into a usable dataset
    return {
      date: new Date(parseInt(item.Year),0,1),
      time: new Date(2000, 0, 1, 0, minutes, seconds),
      timeString: item.Time,
      year: parseInt(item.Year),
      doping: item.Doping,
      nationality: item.Nationality,
      name: item.Name,
      place: item.Place
    }    
  });

  let margin = {
    left: 75,
    right: 50,
    top: 100,
    bottom: 50
  }

  let w = parseInt(d3.select('svg').style('width')) - margin.left - margin.right;
  let h = parseInt(d3.select('svg').style('height')) - margin.top - margin.bottom;

  let tooltip = d3.select(".container")
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")

  // Init SVG
  let svg = d3.select('body').select('svg');
  svg.call(responsivefy);
 
  // X Scale and Axis
  // We add one year +/- to the max and min years respectively
  // to give us some margin in the display and to show the
  // extents of the data
  let xScale = d3.scaleLinear()
    .domain([
      d3.min(data, d => {
        return d.year - 1
      } ),
      d3.max(data, d => {
        return d.year + 1
      } )
    ])
    .range([ 0 , w  ])

  let xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format("d"));

  // X-Axis
  svg.append("g")
    .attr('id', 'x-axis')
    .attr("transform", `translate(${margin.left}, ${h + margin.top })`)
    .call(xAxis)
  
  // Y Scales and Axis
  // We add some margin, in seconds, to the min and max values
  // on order to move the tick marks out a bit
  let yScale = d3.scaleTime()
    .domain([
        d3.min(data, d => {
          return new Date(2000, 0, 1, 0, d.time.getUTCMinutes(), d.time.getUTCSeconds() - 15)
        }),
        d3.max(data, d => {
          return new Date(2000, 0, 1, 0, d.time.getUTCMinutes(), d.time.getUTCSeconds() + 5)
        })]
    )
    .range([ 0, h ])

  let yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.timeFormat('%M:%S'));

  // Y-Axis
  svg.append("g")
    .attr('id', 'y-axis')
    .attr("transform", `translate(${ margin.left },${ margin.top })`)
    .call(yAxis)

  // Primary Data Display
  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.year) + margin.left)
    .attr('cy', d => yScale(d.time) + margin.top)
    .attr('r', 5)
    .attr('class', d => d.doping === "" ? 'dot' : 'dot doping')
    .attr('data-xvalue', d => d.date)
    .attr('data-yvalue', d => d.time)
    .on('mouseover', function (e, d) {
        let ttText = `${d.name}: ${d.nationality}<br>Year: ${d.date.getFullYear()}, Time: ${d.timeString}`;
        if(d.doping) {
          ttText += "<br><br>" + d.doping;
        }

        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9)
        tooltip
          .html(ttText)
          .style("left", e.clientX + 10 + "px")
          .style("top", e.clientY - 10 + "px")
          .attr('data-year', d.date )
      })
      .on('mouseout', function () {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
      })
  
  // Chart Title
  svg.append('text')
    .text("Doping in Professional Bicycle Racing")
    .attr('class','title')
    .attr('x', w/2 + margin.left)
    .attr('y', margin.top / 2)
    .attr('id', 'title')

  // Chart Subtitle
  svg.append('text')
    .text("35 Fastest times up Alpe d'Hurez")
    .attr('class', 'subtitle')
    .attr('x', w/2 + 20)
    .attr('y', margin.top - 20)
    .attr('id', 'subtitle')

  // Legend
  let legendData = [{
    color: "cornflowerblue",
    text: "No Doping Allegations"
  }, {
    color: "orange",
    text: "Riders with Doping Allegations"
  }]

  // Legend group
  let legend = svg.append('g')
    .attr('class', 'legend')
    .attr('id', 'legend')

  // Add Color Boxes to legend
  legend.selectAll('rect')
    .data(legendData)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * 25)
    .attr('width', 20)
    .attr('height', 20)
    .style('fill', d => d.color)

  // Add text to legend
  legend.selectAll('text')
    .data(legendData)
    .enter()
    .append('text')
    .attr('class', 'legendText')
    .text(d => d.text)
    .attr('x', 25)
    .attr('y', (d, i) => i * 25)
    .attr('dy', "1em") // Offset for text height

  // Move the legend against the right side of the chart and centered vertically
  let legendX = w - legend.node().getBBox().width + margin.left
  let legendY = ((h - legend.node().getBBox().height) / 2) + margin.top
  legend.attr('transform', `translate(${ legendX },${ legendY })`)
}


