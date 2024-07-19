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
    // Calculate song counts by year
    const yearCounts = d3.rollup(data, v => v.length, d => d.released_year);
    const yearCountsArray = Array.from(yearCounts, ([released_year, count]) => ({ released_year, count }));

    // Group years with count < 36 into a single category with a range of years
    const groupedYearCounts = yearCountsArray.map(d => ({
        released_year: d.count < 36 ? `${d3.min(yearCountsArray.filter(y => y.count < 36), d => d.released_year)} - ${d3.max(yearCountsArray.filter(y => y.count < 36), d => d.released_year)}` : d.released_year,
        count: d.count
    }));

    // Aggregate counts for grouped years
    const aggregatedYearCounts = d3.rollup(groupedYearCounts,
        v => d3.sum(v, d => d.count),
        d => d.released_year
    );

    // Convert aggregated data back to array for visualization
    let aggregatedYearCountsArray = Array.from(aggregatedYearCounts, ([released_year, count]) => ({ released_year, count }));

    // Sort data by released_year (ascending) initially
    aggregatedYearCountsArray.sort((a, b) => d3.ascending(a.released_year, b.released_year));

    // Set up the x scale for the bar chart
    const x = d3.scaleBand()
        .domain(aggregatedYearCountsArray.map(d => d.released_year.toString())) // Convert to string for proper labeling
        .range([0, barWidth])
        .padding(0.2);

    // Set up the y scale for the bar chart
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedYearCountsArray, d => d.count)])
        .nice()
        .range([barHeight, 0]);

    // Draw the bars with hover effects and tooltip
    barSvg.selectAll(".bar")
        .data(aggregatedYearCountsArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.released_year.toString()))
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
                .html(`Year: ${d.released_year}<br>Count: ${d.count}`)
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
    const yTicks = [0, 50, 100, 150, 200, 250, 300, 350, d3.max(aggregatedYearCountsArray, d => d.count)];
    barSvg.append("g")
        .call(d3.axisLeft(y).tickValues(yTicks))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -barHeight / 2)
        .attr("y", -35)
        .attr("fill", "black")
        .text("Number of Tracks");

    



    
    // Function to sort data by count (descending)
    function sortByCount() {
        aggregatedYearCountsArray.sort((a, b) => d3.descending(a.count, b.count));

        x.domain(aggregatedYearCountsArray.map(d => d.released_year.toString()));

        barSvg.selectAll(".bar")
            .transition()
            .duration(500)
            .attr("x", d => x(d.released_year.toString()));

        barSvg.select(".x-axis")
            .transition()
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }

    // Function to sort data by released_year (ascending)
    function sortByYear() {
        // If grouped years are present, sort them in ascending order of the starting year
        if (aggregatedYearCountsArray.some(d => d.released_year.includes("-"))) {
            aggregatedYearCountsArray.sort((a, b) => {
                if (a.released_year.includes("-") && b.released_year.includes("-")) {
                    const aYears = a.released_year.split(" - ").map(Number);
                    const bYears = b.released_year.split(" - ").map(Number);
                    return d3.ascending(aYears[0], bYears[0]);
                } else if (a.released_year.includes("-")) {
                    return -1;
                } else if (b.released_year.includes("-")) {
                    return 1;
                } else {
                    return d3.ascending(a.released_year, b.released_year);
                }
            });
        } else {
            aggregatedYearCountsArray.sort((a, b) => d3.ascending(a.released_year, b.released_year));
        }

        x.domain(aggregatedYearCountsArray.map(d => d.released_year.toString()));

        barSvg.selectAll(".bar")
            .transition()
            .duration(500)
            .attr("x", d => x(d.released_year.toString()));

        barSvg.select(".x-axis")
            .transition()
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }

    // Add buttons for sorting by count and by year
    d3.select("#sort-by-count")
        .on("click", sortByCount);

    d3.select("#sort-by-year")
        .on("click", sortByYear);

    // Tooltip
    const tooltip2 = d3.select("body")
        .append("div")
        .attr("class", "tooltip2")
        .style("opacity", 0);





// Calculate total streams by year
const yearStreams = d3.rollup(data, v => d3.sum(v, d => +d.streams), d => d.released_year);
const yearStreamsArray = Array.from(yearStreams, ([released_year, streams]) => ({ released_year, streams }));

// Group years with total streams < 7,000,000,000 into a single category
const groupedYearStreams = yearStreamsArray.map(d => ({
    released_year: d.streams < 7000000000 ? `${d3.min(yearStreamsArray.filter(y => y.streams < 7000000000), d => d.released_year)} - ${d3.max(yearStreamsArray.filter(y => y.streams < 7000000000), d => d.released_year)}` : d.released_year,
    streams: d.streams
}));

// Aggregate streams for grouped years
const aggregatedYearStreams = d3.rollup(groupedYearStreams,
    v => d3.sum(v, d => d.streams),
    d => d.released_year
);

// Convert aggregated data back to array for visualization
let aggregatedYearStreamsArray = Array.from(aggregatedYearStreams, ([released_year, streams]) => ({ released_year, streams }));

// Sort data by released_year (ascending) initially
aggregatedYearStreamsArray.sort((a, b) => d3.ascending(a.released_year, b.released_year));

// Set up the x scale for the streams bar chart
const xStream = d3.scaleBand()
    .domain(aggregatedYearStreamsArray.map(d => d.released_year.toString())) // Convert to string for proper labeling
    .range([0, streamsBarWidth])
    .padding(0.2);

// Set up the y scale for the streams bar chart
const yStream = d3.scaleLinear()
    .domain([0, d3.max(aggregatedYearStreamsArray, d => d.streams)])
    .nice()
    .range([streamsBarHeight, 0]);

// Format numbers with commas
const formatNumber = d3.format(",");

// Draw the streams bars with hover effects and tooltip
streamsBarSvg.selectAll(".stream-bar")
    .data(aggregatedYearStreamsArray)
    .enter().append("rect")
    .attr("class", "stream-bar")
    .attr("x", d => xStream(d.released_year.toString()))
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
            .html(`Year: ${d.released_year}<br>Streams: ${formatNumber(d.streams)}`)
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
const yStreamTicks = [0,10000000000, 20000000000, 30000000000, 40000000000, 50000000000, 60000000000, 70000000000, 80000000000, 90000000000, 100000000000, 110000000000, d3.max(aggregatedYearStreamsArray, d => d.streams)];
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
    aggregatedYearStreamsArray.sort((a, b) => d3.descending(a.streams, b.streams));

    xStream.domain(aggregatedYearStreamsArray.map(d => d.released_year.toString()));

    streamsBarSvg.selectAll(".stream-bar")
        .transition()
        .duration(500)
        .attr("x", d => xStream(d.released_year.toString()));

    streamsBarSvg.select(".x-stream-axis")
        .transition()
        .call(d3.axisBottom(xStream))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
}

// Function to sort data by released_year (ascending)
function sortByYear2() {
    // If grouped years are present, sort them in ascending order of the starting year
    if (aggregatedYearStreamsArray.some(d => d.released_year.includes("-"))) {
        aggregatedYearStreamsArray.sort((a, b) => {
            if (a.released_year.includes("-") && b.released_year.includes("-")) {
                const aYears = a.released_year.split(" - ").map(Number);
                const bYears = b.released_year.split(" - ").map(Number);
                return d3.ascending(aYears[0], bYears[0]);
            } else if (a.released_year.includes("-")) {
                return -1;
            } else if (b.released_year.includes("-")) {
                return 1;
            } else {
                return d3.ascending(a.released_year, b.released_year);
            }
        });
    } else {
        aggregatedYearStreamsArray.sort((a, b) => d3.ascending(a.released_year, b.released_year));
    }

    xStream.domain(aggregatedYearStreamsArray.map(d => d.released_year.toString()));

    streamsBarSvg.selectAll(".stream-bar")
        .transition()
        .duration(500)
        .attr("x", d => xStream(d.released_year.toString()));

    streamsBarSvg.select(".x-stream-axis")
        .transition()
        .call(d3.axisBottom(xStream))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
}

// Add buttons for sorting by stream and by year
d3.select("#sort-by-stream")
    .on("click", sortByStreams);

d3.select("#sort-by-year-2")
    .on("click", sortByYear2);

 


});
