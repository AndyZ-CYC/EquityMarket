const width = 1000
const height = 500
const margin = {top: 50, right: 30, bottom: 30, left: 80}

const svg = d3.select('div#plot')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])

console.log(svg);

d3.json('data/sp500.json').then(data => {
    console.log(data);
    //const xScale = drawAxisX(data.data)
    //const yScale = drawAxisY(data.data)

    //drawCandlestick(data.data, xScale, yScale)
    //drawFocusLayout(data.data, xScale, yScale)
    //drawTitle(data.name)
});