// Define the dimensions of the SVG container for the bar chart
const barMargin = { top: 20, right: 30, bottom: 50, left: 60 },
    barWidth = 600 - barMargin.left - barMargin.right,
    barHeight = 300 - barMargin.top - barMargin.bottom;

const barSvg = d3.select("#bar-chart")
    .attr("width", barWidth + barMargin.left + barMargin.right)
    .attr("height", barHeight + barMargin.top + barMargin.bottom)
    .append("g")
    .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

// Add title for the bar chart
barSvg.append("text")
    .attr("x", barWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold");

// Define the dimensions of the SVG container for the pie chart
const pieWidth = 300,
    pieHeight = 300,
    radius = Math.min(pieWidth, pieHeight) / 2;

const pieSvg = d3.select("#pie-chart")
    .append("g")
    .attr("transform", `translate(${pieWidth / 2},${pieHeight / 2})`);

// Define the dimensions of the SVG container for the line chart
const lineMargin = { top: 20, right: 30, bottom: 50, left: 60 },
    lineWidth = 600 - lineMargin.left - lineMargin.right,
    lineHeight = 300 - lineMargin.top - lineMargin.bottom;

const lineSvg = d3.select("#line-chart")
    .attr("width", lineWidth + lineMargin.left + lineMargin.right)
    .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
    .append("g")
    .attr("transform", `translate(${lineMargin.left},${lineMargin.top})`);

// Load the CSV file
d3.csv("spotify-2023.csv").then(data => {
    // Process the data for the bar chart
    const keyCounts = d3.rollup(data, v => v.length, d => d.key);
    const keyCountsArray = Array.from(keyCounts, ([key, count]) => ({ key, count }));

    // Set up the x scale for the bar chart
    const x = d3.scaleBand()
        .domain(keyCountsArray.map(d => d.key))
        .range([0, barWidth])
        .padding(0.1);

    // Set up the y scale for the bar chart
    const y = d3.scaleLinear()
        .domain([0, d3.max(keyCountsArray, d => d.count)])
        .nice()
        .range([barHeight, 0]);

    // Draw the bars for the bar chart
    barSvg.selectAll(".bar")
        .data(keyCountsArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => barHeight - y(d.count))
        .attr("fill", "#69b3a2");

    // Process the data for the pie chart
    const modeCounts = d3.rollup(data, v => v.length, d => d.mode);
    const modeCountsArray = Array.from(modeCounts, ([mode, count]) => ({ mode, count }));
    const totalModeCount = d3.sum(modeCountsArray, d => d.count);
    const modePercentages = modeCountsArray.map(d => ({
        mode: d.mode,
        percentage: (d.count / totalModeCount) * 100
    }));

    // Set up the color scale for the pie chart
    const color = d3.scaleOrdinal()
        .domain(modePercentages.map(d => d.mode))
        .range([
            "#00FF7F",
            "#698B69"
        ]);

    // Set up the pie and arc generators
    const pie = d3.pie()
        .value(d => d.percentage);
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Draw the pie chart
    const arcs = pieSvg.selectAll(".arc")
        .data(pie(modePercentages))
        .enter().append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.mode))
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 0.7);
            tooltip.style("opacity", 1)
                .html(` ${d.data.percentage.toFixed(2)}%`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 1);
            tooltip.style("opacity", 0);
        });

    // Add tooltip for pie chart
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px");

    // Process the data for the line chart
    const monthlyCounts = d3.rollup(data, v => v.length, d => d.released_month);
    const monthlyCountsArray = Array.from(monthlyCounts, ([month, count]) => ({ month, count }));

    // Sort months
    const monthOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    monthlyCountsArray.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

    // Set up the x scale for the line chart
    const lineX = d3.scalePoint()
        .domain(monthlyCountsArray.map(d => d.month))
        .range([0, lineWidth]);

    // Set up the y scale for the line chart
    const lineY = d3.scaleLinear()
        .domain([0, d3.max(monthlyCountsArray, d => d.count)])
        .nice()
        .range([lineHeight, 0]);

    // Define the line generator
    const line = d3.line()
        .x(d => lineX(d.month))
        .y(d => lineY(d.count));

    // Draw the line
    lineSvg.append("path")
        .datum(monthlyCountsArray)
        .attr("fill", "none")
        .attr("stroke", "#CC33CC")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add the x-axis for the line chart
    lineSvg.append("g")
        .attr("transform", `translate(0,${lineHeight})`)
        .call(d3.axisBottom(lineX))
        .append("text")
        .attr("class", "axis-label")
        .attr("x", lineWidth / 2)
        .attr("y", 25)
        .attr("fill", "black")
        .text("Month");

    // Add the y-axis for the line chart
    const yTicks = [0, 40, 80, 120, d3.max(monthlyCountsArray, d => d.count)];

    lineSvg.append("g")
        .call(d3.axisLeft(lineY).tickValues(yTicks))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -lineHeight / 2)
        .attr("y", -35)
        .attr("fill", "black")
        .text("Number of Songs");

    // Add tooltip for the line chart
    const lineTooltip = d3.select("body").append("div")
        .attr("class", "line-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px");

    // Add a rectangle to capture mouse events for the line chart
    lineSvg.append("rect")
        .attr("width", lineWidth)
        .attr("height", lineHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", function (event) {
            const [xPos] = d3.pointer(event);
            const month = lineX.domain().find(d => Math.abs(lineX(d) - xPos) < (lineX.bandwidth() / 2));
            const dataPoint = monthlyCountsArray.find(d => d.month === month);

            if (dataPoint) {
                lineTooltip.html(`Month: ${dataPoint.month}<br>Number of Songs: ${dataPoint.count}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 1);
            }
        })
        .on("mouseout", function () {
            lineTooltip.style("opacity", 0);
        });
});
