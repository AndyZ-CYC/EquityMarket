(function(){
  var margin = {top: 30, right: 20, bottom: 100, left: 50},
      margin2  = {top: 210, right: 20, bottom: 20, left: 50},
      width    = 764 - margin.left - margin.right,
      height   = 283 - margin.top - margin.bottom,
      height2  = 283 - margin2.top - margin2.bottom;

  var parseDate = d3.timeParse('%Y-%m-%d'),            // previously d3.time.format('%d/%m/%Y').parse,
      bisectDate = d3.bisector(function(d) { return d.date; }).left,
      legendFormat = d3.timeFormat('%b %d, %Y');       // previously d3.time.format('%b %d, %Y');
      //"June 30, 2015"

  var x   = d3.scaleTime().range([0, width]),
      x2  = d3.scaleTime().range([0, width]),
      y   = d3.scaleLinear().range([height, 0]),
      y1  = d3.scaleLinear().range([height, 0]),
      y2  = d3.scaleLinear().range([height2, 0]),
      y3  = d3.scaleLinear().range([60, 0]);

  var xAxis = d3.axisBottom(x),  //d3.svg.axis().scale(x).orient('bottom')
      xAxis2= d3.axisBottom(x2), //d3.svg.axis().scale(x2).orient('bottom'),
      yAxis = d3.axisLeft(y);    //d3.svg.axis().scale(y).orient('left');
      
  var priceLine = d3.line()
    .curve(d3.curveMonotoneX) //d3.curveBasis
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

  var area2 = d3.area()
      .curve(d3.curveMonotoneX)
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
    return d3.axisLeft(y).ticks(3);
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
    .text('S&P 500')

  var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(110, 0)');
    
  // write async function to get the data promise
  async function data(pathToCsv) {
        var dataset = await d3.csv(pathToCsv, function (d) {
            d.date = parseDate(d.date)
            d.price = +d.close
            d.volume = +d.volume
            return d
        })
        return dataset
    };
    
  data('https://raw.githubusercontent.com/AndyZ-CYC/EquityMarket/main/data/sp500.csv').then(function(data) {
    console.log(data.date);
    console.log(data[0]);
    
    // pre: 
    // x2  = d3.scaleTime().range([0, width]),
    
     //var brush = d3.svg.brush()
      // .x(x2)
      //.on('brush', brushed);
        
    var brush = d3.brushX()
        .extent([[0,0], [width,height]])
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
      })
      .on('mouseout', function() {
        helper.style('display', 'none');
        priceTooltip.style('display', 'none');
      })
      .on('mousemove', mousemove);
      
    context.append('path')
        .datum(data)
        .attr('class', 'chart__area area')
        .attr('d', area2);

    context.append('g')
        .attr('class', 'x axis chart__axis--context')
        .attr('y', 0)
        .attr('transform', 'translate(0,' + (height2 - 22) + ')')
        .call(xAxis2);

    context.append('g')
        .attr('class', 'x brush')
        .call(brush)
      .selectAll('rect')
        .attr('y', -6)
        .attr('height', height2 + 7);
    
    function mousemove() {
      // Before promise is ready, we can't use date 
      if(this.date === undefined) {return};
      
      var x0 = x.invert(d3.pointer(this)[0]);
      var i = bisectDate(data, x0, 1);
      console.log(i);
      var d0 = data[i - 1];
      var d1 = data[i];
      var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      helperText.text(legendFormat(new Date(d.date)) + ' - Price: ' + d.price);
      priceTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.price) + ')');
    }
        
    function brushed() {
      var ext = brush.extent();
      if (brush.selection === null) {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        y.domain([
          d3.min(data.map(function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : max; })),
          d3.max(data.map(function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : min; }))
        ]);
        range.text(legendFormat(new Date(ext[0])) + ' - ' + legendFormat(new Date(ext[1])))
        focusGraph.attr('x', function(d, i) { return x(d.date); });

        var days = Math.ceil((ext[1] - ext[0]) / (24 * 3600 * 1000))
        focusGraph.attr('width', (40 > days) ? (40 - days) * 5 / 6 : 5)
      }

      priceChart.attr('d', priceLine);
      focus.select('.x.axis').call(xAxis);
      focus.select('.y.axis').call(yAxis);
    }
    
    var dateRange = ['1w', '1m', '3m', '6m', '1y', '5y']
    for (var i = 0, l = dateRange.length; i < l; i ++) {
      var v = dateRange[i];
      rangeSelection
        .append('text')
        .attr('class', 'chart__range-selection')
        .text(v)
        .attr('transform', 'translate(' + (18 * i) + ', 0)')
        .on('click', function(d) { focusOnRange(this.textContent); });
    }
    
    function focusOnRange(range) {
      var today = new Date(data[data.length - 1].date)
      var ext = new Date(data[data.length - 1].date)

      if (range === '1m')
        ext.setMonth(ext.getMonth() - 1)

      if (range === '1w')
        ext.setDate(ext.getDate() - 7)

      if (range === '3m')
        ext.setMonth(ext.getMonth() - 3)

      if (range === '6m')
        ext.setMonth(ext.getMonth() - 6)

      if (range === '1y')
        ext.setFullYear(ext.getFullYear() - 1)

      if (range === '5y')
        ext.setFullYear(ext.getFullYear() - 5)

      brush.extent([ext, today])
      brushed()
      context.select('g.x.brush').call(brush.extent([ext, today]))
    }
  });
    
    
  // for test: add rect, add circle
}());    