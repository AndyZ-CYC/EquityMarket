const width = 750
const height = 500
const margin = {top: 50, right: 30, bottom: 30, left: 80}

// initialize svg
const svg = d3.select('div#plot').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])

// declare function that calculates the candlestick width
const getCandlestickWidth = (dataLength) => (width-margin.left-margin.right)/dataLength-3;

// Draw title of the plot
function drawTitle() {
    const title = svg.append('text')
        .text("Interactive Candlestick plot of S&P 500")
        .attr('x', margin.left)
        .attr('y', margin.top/2)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'hanging')
}

// Draw X-axis
function drawAxisX(data) {
    const dates = d3.map(data, v => v[[0]][0])

    const scale = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, width-margin.left-margin.right])

    const axis = d3.axisBottom(scale)
        .ticks(10)
        .tickFormat(v => {
            return dates[v].substring(5);
        })

    svg.append('g')
        .attr('transform', 'translate('+margin.left+','+(height-margin.bottom)+')')
        .call(axis)

    return scale
}

function drawAxisY(data) {
    // Find max and min prices, use them as reference of candlesticks
    const highPrices = d3.map(data, v => v[[0]][3])
    const lowPrices = d3.map(data, v => v[[0]][4])
    const pricePending = Math.round(d3.max(highPrices) / 100)

    // Draw Y-axis
    const scale = d3.scaleLinear()
        .domain([d3.min(lowPrices)-pricePending, d3.max(highPrices)+pricePending])
        .range([0, height-margin.top-margin.bottom])
    const axis = d3.axisLeft(scale).ticks(10)

    svg.append('g')
        .attr('transform', 'translate('+(margin.left-5)+', '+margin.top+')')
        .call(axis)
        .call(g => g.select('.domain').remove())
        .call(g => {
            g.selectAll('.tick line')
                .clone()
                .attr('stroke-opacity', 0.1)
                .attr('stroke-dasharray', 5)
                .attr('x2', width-margin.left-margin.right)
        })

    return scale;
}

function drawCandlestick(data, xScale, yScale) {
    // Handle stroke/border color
    const handleStrokeColor = (v, i) => {
        if (v[[0]][2] > v[[0]][1]) {
            return 'green'
        }

        return 'red'
    }

    // Calculate candlestick width
    const candlestickWidth = getCandlestickWidth(data.length)+1.5;
    const g = svg.append('g')
        .attr('transform', 'translate('+margin.left+', '+margin.top+')')

    const candlestick = g.selectAll('g')
        .data(data)
        .enter()
        .append('g')

    candlestick.append('line')
        .attr('x1', (v, i) => {
            return xScale(i)+candlestickWidth/2
        })
        .attr('y1', (v, i) => {
            return height - yScale(v[[0]][3]) - margin.top - margin.bottom
        })
        .attr('x2', (v, i) => {
            return xScale(i)+candlestickWidth/2
        })
        .attr('y2', (v, i) => {
            return height - yScale(v[[0]][4]) - margin.top - margin.bottom
        })
        .attr('stroke', handleStrokeColor)
        .attr('stroke-width', 1)

    // Draw candlestick filled rect
    candlestick.append('rect')
        .attr('width', candlestickWidth)
        .attr('height', (v, i) => {
            return Math.abs(yScale(v[[0]][1]) - yScale(v[[0]][2]))
        })
        .attr('x', (v, i) => {
            return xScale(i)
        })
        .attr('y', (v, i) => {
            return height - yScale(d3.max([v[[0]][1], v[[0]][2]])) - margin.top - margin.bottom
        })
        .attr('rx', 1)
        .attr('stroke', handleStrokeColor)
        .attr('fill', (v, i) => {
            if (v[[0]][2] > v[[0]][1]) {
                return 'green'
            }
            return 'white'
        })
}

function drawFocusLayout(data, xScale, yScale) {
    // Calculate candlestick width
    const candlestickWidth = getCandlestickWidth(data.length)

    // Handle Mouseover event
    const handleMouseOver = function (e) {
        d3.select('#focusLineX').attr('display', '')
        d3.select('#focusLineY').attr('display', '')
    }

    // Handle Mousemove event
    const handleMouseMove = function (e) {
        const [mx, my] = d3.pointer(e)
        const i = d3.bisectCenter(data.map((v, i) => i), xScale.invert(mx-margin.left));
        const px = xScale(i) + margin.left + candlestickWidth/2
        const py = height - yScale(data[i][2]) - margin.bottom

        d3.select('#focusLineX').attr('x1', px).attr('x2', px)
        d3.select('#focusLineY').attr('y1', py).attr('y2', py)

        text.text(formatText(data[i]))
    }

    // Handle Mouseout event
    const handleMouseOut = function (e) {v[[0]]
        d3.select('#focusLineX').attr('display', 'none')
        d3.select('#focusLineY').attr('display', 'none')

        text.text(formatText(data[data.length-1]))
    }

    const formatText = (v) => {
        return `${v[[0]][0].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
            Open: ${v[[0]][1]} |
            Close: ${v[[0]][2]} |
            High: ${v[[0]][3]} |
            Low: ${v[[0]][4]}`
    }

    // Display data info
    const text = svg.append('text')
        .attr('x', width-margin.right)
        .attr('y', margin.top/2)
        .attr('font-size', '0.85em')
        .attr('fill', '#666')
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'hanging')
        .text(formatText(data[data.length-1]))

    // Draw indicator line
    svg.append('line')
        .attr('id', 'focusLineX')
        .attr('x1', margin.left)
        .attr('y1', margin.top)
        .attr('x2', margin.left)
        .attr('y2', height-margin.bottom)
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5)
        .attr('display', 'none')

    svg.append('line')
        .attr('id', 'focusLineY')
        .attr('x1', margin.left)
        .attr('y1', margin.top)
        .attr('x2', width-margin.right)
        .attr('y2', margin.top)
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5)
        .attr('display', 'none')

    // Draw mouse event rectangular area
    svg.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width-margin.left-margin.right)
        .attr('height', height-margin.top-margin.bottom)
        .attr('opacity', 0)
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
}


d3.json('https://raw.githubusercontent.com/AndyZ-CYC/EquityMarket/main/data/sp500.json').then(data => {
    const xScale = drawAxisX(data.data)
    const yScale = drawAxisY(data.data)

    drawCandlestick(data.data, xScale, yScale)
    drawFocusLayout(data.data, xScale, yScale)
    drawTitle()
});