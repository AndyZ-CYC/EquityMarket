(function(){
  var margin = {top: 30, right: 20, bottom: 100, left: 50},
      margin2  = {top: 210, right: 20, bottom: 20, left: 50},
      width    = 764 - margin.left - margin.right,
      height   = 283 - margin.top - margin.bottom,
      height2  = 283 - margin2.top - margin2.bottom;

  var parseDate = d3.timeParse('%Y-%m-%d'), // previously d3.time.format('%d/%m/%Y').parse,
      bisectDate = d3.bisector(function(d) { return d.date; }).left,
      legendFormat = d3.timeFormat('%b %d, %Y'); // previously d3.time.format('%b %d, %Y');
      //"June 30, 2015"

  var x   = d3.scaleTime().range([0, width]),
      x2  = d3.scaleTime().range([0, width]),
      y   = d3.scaleLinear().range([height, 0]),
      y1  = d3.scaleLinear().range([height, 0]),
      y2  = d3.scaleLinear().range([height2, 0]),
      y3  = d3.scaleLinear().range([60, 0]);

  var xAxis = d3.axisBottom(x),//d3.svg.axis().scale(x).orient('bottom')
      xAxis2= d3.axisBottom(x2),//d3.svg.axis().scale(x2).orient('bottom'),
      yAxis = d3.axisLeft(y);//.svg.axis().scale(y).orient('left');
      
  var priceLine = d3.line()
    .curve(d3.curveMonotoneX) //d3.curveBasis
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

  var area2 = d3.area()
      .x(function(d) { return x2(d.date); })
      .y0(height2)
      .y1(function(d) { return y2(d.price); });

  //  previous: var area2 = d3.svg.area()
  //  .interpolate('monotone')
  //  .x(function(d) { return x2(d.date); })
  //  .y0(height2)
  //  .y1(function(d) { return y2(d.price); });

  // add elements
  var svg = d3.select("div#plot").append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60);
    
  svg.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height); 
    
  var make_y_axis = function () {
    return d3.svg.axis()
      .scale(y)
      .orient('left')
      .ticks(3);
  };  
  
  var focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var barsGroup = svg.append('g')
    .attr('class', 'volume')
    .attr('clip-path', 'url(#clip)')
    .attr('transform', 'translate(' + margin.left + ',' + (margin.top + 60 + 20) + ')');

  var context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + margin2.left + ',' + (margin2.top + 60) + ')');

  var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 10)');

  legend.append('text')
    .attr('class', 'chart__symbol')
    .text('S&P 500')//.text('NASDAQ: AAPL')

  var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(110, 0)');
  
  // begin data
  d3.csv('data/sp500.csv', type, function(err, data) {
    console.log(1);
    var brush = d3.svg.brush()
      .x(x2)
      .on('brush', brushed);
      
    var xRange = d3.extent(data.map(function(d) { return d.date; }));
    
    x.domain(xRange);
    y.domain(d3.extent(data.map(function(d) { return d.price; })));
    y3.domain(d3.extent(data.map(function(d) { return d.price; })));
    x2.domain(x.domain());
    y2.domain(y.domain());
    
    var min = d3.min(data.map(function(d) { return d.price; }));
    var max = d3.max(data.map(function(d) { return d.price; }));
    
    var range = legend.append('text')
      .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');
    
    focus.append('g')
        .attr('class', 'y chart__grid')
        .call(make_y_axis()
        .tickSize(-width, 0, 0)
        .tickFormat(''));
        
    var averageChart = focus.append('path')
        .datum(data)
        .attr('class', 'chart__line chart__average--focus line')
        .attr('d', avgLine);

    var priceChart = focus.append('path')
        .datum(data)
        .attr('class', 'chart__line chart__price--focus line')
        .attr('d', priceLine);

    focus.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0 ,' + height + ')')
        .call(xAxis);

    focus.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(12, 0)')
        .call(yAxis);
        
    var focusGraph = barsGroup.selectAll('rect')
        .data(data)
      .enter().append('rect')
        .attr('class', 'chart__bars')
        .attr('x', function(d, i) { return x(d.date); })
        .attr('y', function(d) { return 155 - y3(d.price); })
        .attr('width', 1)
        .attr('height', function(d) { return y3(d.price); });

    var helper = focus.append('g')
      .attr('class', 'chart__helper')
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

    var helperText = helper.append('text')

    var priceTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--price')
      .append('circle')
      .style('display', 'none')
      .attr('r', 2.5);
      
    var mouseArea = svg.append('g')
      .attr('class', 'chart__mouse')
      .append('rect')
      .attr('class', 'chart__overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .on('mouseover', function() {
        helper.style('display', null);
        priceTooltip.style('display', null);
        averageTooltip.style('display', null);
      })
      .on('mouseout', function() {
        helper.style('display', 'none');
        priceTooltip.style('display', 'none');
        averageTooltip.style('display', 'none');
      })
      .on('mousemove', mousemove);
    
  })
    
    
  // for test: add rect, add circle
      
  //svg.append("circle")
  //    .attr("x", "100")
  //    .attr("y", "200")
  //    .attr("r", 10)
  //    .attr("fill", "red");
  
  // don't use average, delete this part in above code
  function type(d) {
    return {
      date    : parseDate(d.date),
      price   : +d.close,
      //average : +d.Average,
      volume : +d.volume,
    }
  }
}());    