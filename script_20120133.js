// Define the dimensions of the SVG container for the bar chart
const barMargin = { top: 20, right: 30, bottom: 50, left: 60 },
    barWidth = 1200 - barMargin.left - barMargin.right,
    barHeight = 400 - barMargin.top - barMargin.bottom;

const barSvg = d3.select("#bar-chart")
    .attr("width", barWidth + barMargin.left + barMargin.right)
    .attr("height", barHeight + barMargin.top + barMargin.bottom)
    .append("g")
    .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

// Define the dimensions of the SVG container for the streams bar chart
const streamsBarMargin = { top: 20, right: 30, bottom: 50, left: 60 },
    streamsBarWidth = 1200 - streamsBarMargin.left - streamsBarMargin.right,
    streamsBarHeight = 400 - streamsBarMargin.top - streamsBarMargin.bottom;

const streamsBarSvg = d3.select("#streams-bar-chart")
    .attr("width", streamsBarWidth + streamsBarMargin.left + streamsBarMargin.right)
    .attr("height", streamsBarHeight + streamsBarMargin.top + streamsBarMargin.bottom)
    .append("g")
    .attr("transform", `translate(${streamsBarMargin.left},${streamsBarMargin.top})`);

// Load the CSV file and process data for the bar chart
d3.csv("spotify-2023.csv").then(data => {
    // Filter data to only include entries where the mode is "Major"
    const filteredData = data.filter(d => d.mode === "Major");

    // Calculate song counts by month
    const monthCounts = d3.rollup(filteredData, v => v.length, d => d.released_month);
    const monthCountsArray = Array.from(monthCounts, ([released_month, count]) => ({ released_month, count }));

    // Group months with count < 20 into a single category with a range of months
    const groupedMonthCounts = monthCountsArray.map(d => ({
        released_month: d.count < 20 ? `${d3.min(monthCountsArray.filter(y => y.count < 20), d => d.released_month)} - ${d3.max(monthCountsArray.filter(y => y.count < 20), d => d.released_month)}` : d.released_month,
        count: d.count
    }));

    // Aggregate counts for grouped months
    const aggregatedMonthCounts = d3.rollup(groupedMonthCounts,
        v => d3.sum(v, d => d.count),
        d => d.released_month
    );

    // Convert aggregated data back to array for visualization
    let aggregatedMonthCountsArray = Array.from(aggregatedMonthCounts, ([released_month, count]) => ({ released_month, count }));

    // Sort data by released_month (ascending) initially
    aggregatedMonthCountsArray.sort((a, b) => d3.ascending(a.released_month, b.released_month));

    // Set up the x scale for the bar chart
    const x = d3.scaleBand()
        .domain(aggregatedMonthCountsArray.map(d => d.released_month.toString())) // Convert to string for proper labeling
        .range([0, barWidth])
        .padding(0.2);

    // Set up the y scale for the bar chart
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedMonthCountsArray, d => d.count)])
        .nice()
        .range([barHeight, 0]);

    // Draw the bars with hover effects and tooltip
    barSvg.selectAll(".bar")
        .data(aggregatedMonthCountsArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.released_month.toString()))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => barHeight - y(d.count))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "orange")
                .attr("opacity", 0.7);
            tooltip2.style("opacity", 1)
                .html(`Month: ${d.released_month}<br>Count: ${d.count}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "steelblue")
                .attr("opacity", 1);
            tooltip2.style("opacity", 0);
        });

    // Add the x-axis
    barSvg.append("g")
        .attr("class", "x-axis") // Add a class for selection
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add the y-axis
    const yTicks = [0, 50, 100, 150, 200, 250, 300, 350, d3.max(aggregatedMonthCountsArray, d => d.count)];
    barSvg.append("g")
        .call(d3.axisLeft(y).tickValues(yTicks))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -barHeight / 2)
        .attr("y", -35)
        .attr("fill", "black")
        .text("Number of Songs");

    // Function to sort data by count (descending)
    function sortByCount() {
        aggregatedMonthCountsArray.sort((a, b) => d3.descending(a.count, b.count));

        x.domain(aggregatedMonthCountsArray.map(d => d.released_month.toString()));

        barSvg.selectAll(".bar")
            .transition()
            .duration(500)
            .attr("x", d => x(d.released_month.toString()));

        barSvg.select(".x-axis")
            .transition()
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }

    // Function to sort data by released_month (ascending)
    function sortByMonth() {
        // If grouped months are present, sort them in ascending order of the starting month
        if (aggregatedMonthCountsArray.some(d => d.released_month.includes("-"))) {
            aggregatedMonthCountsArray.sort((a, b) => {
                if (a.released_month.includes("-") && b.released_month.includes("-")) {
                    const aMonths = a.released_month.split(" - ").map(Number);
                    const bMonths = b.released_month.split(" - ").map(Number);
                    return d3.ascending( parseInt(aMonths[0]),  parseInt(bMonths[0]));
                } else if (a.released_month.includes("-")) {
                    return -1;
                } else if (b.released_month.includes("-")) {
                    return 1;
                } else {
                    return d3.ascending( parseInt(a.released_month),  parseInt(b.released_month));
                }
            });
        } else {
            aggregatedMonthCountsArray.sort((a, b) => d3.ascending(parseInt(a.released_month),  parseInt(b.released_month)));
        }

        x.domain(aggregatedMonthCountsArray.map(d => d.released_month.toString()));

        barSvg.selectAll(".bar")
            .transition()
            .duration(500)
            .attr("x", d => x(d.released_month.toString()));

        barSvg.select(".x-axis")
            .transition()
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }

    // Add buttons for sorting by count and by month
    d3.select("#sort-by-count")
        .on("click", sortByCount);

    d3.select("#sort-by-month")
        .on("click", sortByMonth);

    // Tooltip
    const tooltip2 = d3.select("body")
        .append("div")
        .attr("class", "tooltip2")
        .style("opacity", 0);

//-----------------------------------------------------
// Calculate total streams by month
// Filter data to only include entries where the mode is "Major"
const filteredData1 = data.filter(d => d.mode === "Major");

// Calculate song counts by month
const monthStreams = d3.rollup(filteredData1, v => d3.sum(v, d => +d.streams), d => d.released_month);
const monthStreamsArray = Array.from(monthStreams, ([released_month, streams]) => ({ released_month, streams }));

// Group months with total streams < 7,000,000,000 into a single category
const groupedMonthStreams = monthStreamsArray.map(d => ({
    released_month: d.streams < 7000000000 ? `${d3.min(monthStreamsArray.filter(y => y.streams < 7000000000), d => d.released_month)} - ${d3.max(monthStreamsArray.filter(y => y.streams < 7000000000), d => d.released_month)}` : d.released_month,
    streams: d.streams
}));

// Aggregate streams for grouped months
const aggregatedMonthStreams = d3.rollup(groupedMonthStreams,
    v => d3.sum(v, d => d.streams),
    d => d.released_month
);

// Convert aggregated data back to array for visualization
let aggregatedMonthStreamsArray = Array.from(aggregatedMonthStreams, ([released_month, streams]) => ({ released_month, streams }));

// Sort data by released_month (ascending) initially
aggregatedMonthStreamsArray.sort((a, b) => d3.ascending(a.released_month, b.released_month));

// Set up the x scale for the streams bar chart
const xStream = d3.scaleBand()
    .domain(aggregatedMonthStreamsArray.map(d => d.released_month.toString())) // Convert to string for proper labeling
    .range([0, streamsBarWidth])
    .padding(0.2);

// Set up the y scale for the streams bar chart
const yStream = d3.scaleLinear()
    .domain([0, d3.max(aggregatedMonthStreamsArray, d => d.streams)])
    .nice()
    .range([streamsBarHeight, 0]);

// Format numbers with commas
const formatNumber = d3.format(",");

// Draw the streams bars with hover effects and tooltip
streamsBarSvg.selectAll(".stream-bar")
    .data(aggregatedMonthStreamsArray)
    .enter().append("rect")
    .attr("class", "stream-bar")
    .attr("x", d => xStream(d.released_month.toString()))
    .attr("y", d => yStream(d.streams))
    .attr("width", xStream.bandwidth())
    .attr("height", d => streamsBarHeight - yStream(d.streams))
    .attr("fill", "lightblue")
    .on("mouseover", function (event, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "orange")
            .attr("opacity", 0.7);
        tooltip2.style("opacity", 1)
            .html(`Month: ${d.released_month}<br>Streams: ${formatNumber(d.streams)}`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "lightblue")
            .attr("opacity", 1);
        tooltip2.style("opacity", 0);
    });

// Add the x-axis for the streams chart
streamsBarSvg.append("g")
    .attr("class", "x-stream-axis") // Add a class for selection
    .attr("transform", `translate(0,${streamsBarHeight})`)
    .call(d3.axisBottom(xStream))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

// Add the y-axis for the streams chart
const yStreamTicks = [0,10000000000, 20000000000, 30000000000, 40000000000, 50000000000, 60000000000, 70000000000, 80000000000, 90000000000, 100000000000, 110000000000, d3.max(aggregatedMonthStreamsArray, d => d.streams)];
streamsBarSvg.append("g")
    .call(d3.axisLeft(yStream).tickValues(yStreamTicks).tickFormat(d => d3.format(",.2s")(d).replace('G', ' tỷ')))
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -streamsBarHeight / 2)
    .attr("y", -35)
    .attr("fill", "black")
    .text("Total Streams");
// Function to sort data by streams (descending)
function sortByStreams() {
    aggregatedMonthStreamsArray.sort((a, b) => d3.descending(a.streams, b.streams));

    xStream.domain(aggregatedMonthStreamsArray.map(d => d.released_month.toString()));

    streamsBarSvg.selectAll(".stream-bar")
        .transition()
        .duration(500)
        .attr("x", d => xStream(d.released_month.toString()));

    streamsBarSvg.select(".x-stream-axis")
        .transition()
        .call(d3.axisBottom(xStream))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
}

// Function to sort data by released_month (ascending)
function sortByMonth2() {
    // If grouped months are present, sort them in ascending order of the starting month
    if (aggregatedMonthStreamsArray.some(d => d.released_month.includes("-"))) {
        aggregatedMonthStreamsArray.sort((a, b) => {
            if (a.released_month.includes("-") && b.released_month.includes("-")) {
                const aMonths = a.released_month.split(" - ").map(Number);
                const bMonths = b.released_month.split(" - ").map(Number);
                return d3.ascending( parseInt(aMonths[0]),  parseInt(bMonths[0]));
            } else if (a.released_month.includes("-")) {
                return -1;
            } else if (b.released_month.includes("-")) {
                return 1;
            } else {
                return d3.ascending(parseInt(a.released_month),  parseInt(b.released_month));
            }
        });
    } else {
        aggregatedMonthStreamsArray.sort((a, b) => d3.ascending(parseInt(a.released_month),  parseInt(b.released_month)));
    }

    xStream.domain(aggregatedMonthStreamsArray.map(d => d.released_month.toString()));

    streamsBarSvg.selectAll(".stream-bar")
        .transition()
        .duration(500)
        .attr("x", d => xStream(d.released_month.toString()));

    streamsBarSvg.select(".x-stream-axis")
        .transition()
        .call(d3.axisBottom(xStream))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
}

// Add buttons for sorting by stream and by month
d3.select("#sort-by-stream")
    .on("click", sortByStreams);

d3.select("#sort-by-month-2")
    .on("click", sortByMonth2);

 


});