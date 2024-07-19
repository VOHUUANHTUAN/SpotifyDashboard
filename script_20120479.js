// Define the dimensions of the SVG container for the bar chart
const barMargin = { top: 20, right: 30, bottom: 50, left: 60 },
    barWidth = 1200 - barMargin.left - barMargin.right,
    barHeight = 400 - barMargin.top - barMargin.bottom;

const svg1 = d3.select("#chart1")
    .attr("width", barWidth + barMargin.left + barMargin.right)
    .attr("height", barHeight + barMargin.top + barMargin.bottom)
    .append("g")
    .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

// Define the dimensions of the SVG container for the streams bar chart
const streamsBarMargin = { top: 20, right: 30, bottom: 50, left: 60 },
    streamsBarWidth = 1200 - streamsBarMargin.left - streamsBarMargin.right,
    streamsBarHeight = 400 - streamsBarMargin.top - streamsBarMargin.bottom;

const svg2 = d3.select("#chart2")
    .attr("width", streamsBarWidth + streamsBarMargin.left + streamsBarMargin.right)
    .attr("height", streamsBarHeight + streamsBarMargin.top + streamsBarMargin.bottom)
    .append("g")
    .attr("transform", `translate(${streamsBarMargin.left},${streamsBarMargin.top})`);


// Load the CSV file and process data for the bar chart
d3.csv("spotify-2023.csv").then(data => {
    // Calculate song counts by number of artists (NOA)
    const NOACounts = d3.rollup(data, v => v.length, d => d.artist_count);
    const NOACountsArray = Array.from(NOACounts, ([artist_count, count]) => ({ artist_count, count }));

    // Group number of artists > 3 into a single category with a range of years
    const groupedNOACounts = NOACountsArray.map(d => ({
        artist_count: d.artist_count > 3 ? "4+" : d.artist_count,
        count: d.count
    }));

    // Aggregate counts for grouped years
    const aggregatedNOACounts = d3.rollup(groupedNOACounts,
        v => d3.sum(v, d => d.count),
        d => d.artist_count
    );

    // Convert aggregated data back to array for visualization
    let aggregatedNOACountsArray = Array.from(aggregatedNOACounts, ([artist_count, count]) => ({ artist_count, count }));

    // Sort data by artist_count (ascending) initially
    aggregatedNOACountsArray.sort((a, b) => d3.ascending(a.artist_count, b.artist_count));

    // Set up the x scale for the bar chart
    const x = d3.scaleBand()
        .domain(aggregatedNOACountsArray.map(d => d.artist_count.toString())) // Convert to string for proper labeling
        .range([0, barWidth])
        .padding(0.2);

    // Set up the y scale for the bar chart
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedNOACountsArray, d => d.count)])
        .nice()
        .range([barHeight, 0]);

    // Tooltip
    const tooltip1 = d3.select("body")
        .append("div")
        .attr("class", "tooltip2")
        .style("opacity", 0);

    // Draw the bars with hover effects and tooltip
    svg1.selectAll(".bar")
        .data(aggregatedNOACountsArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.artist_count.toString()))
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
                .html(`Number of artists: ${d.artist_count}<br>Count: ${d.count}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "steelblue")
                .attr("opacity", 1);
            tooltip1.style("opacity", 0);
        });

    // Add the x-axis
    svg1.append("g")
        .attr("class", "x-axis") // Add a class for selection
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(x));

    // Add the y-axis
    const yTicks = [...Array(1 + Math.ceil(d3.max(aggregatedNOACountsArray, d => d.count) / 100)).keys()].map(d => d * 100);
    svg1.append("g")
        .call(d3.axisLeft(y).tickValues(yTicks))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -barHeight / 2)
        .attr("y", -35)
        .text("Number of Tracks");




    // Calculate total streams by bpm
    const BPMStreams = d3.rollup(data, v => d3.sum(v, d => +d.streams), d => d.bpm);
    const BPMStreamsArray = Array.from(BPMStreams, ([bpm, streams]) => ({ bpm, streams }));

    // Group bpm: 0-50, 50-100, 100-150, 150-200, 200-250, ...
    const groupedBPMStreams = BPMStreamsArray.map(d => ({
        bpm: `${Math.floor(d.bpm / 50) * 50} - ${Math.floor(d.bpm / 50) * 50 + 50}`,
        average_bpm: Math.floor(d.bpm / 50) * 50 + 25,
        streams: d.streams
    }));
    console.log(groupedBPMStreams);

    // Aggregate streams for grouped bpm
    const aggregatedBPMStreams = d3.rollup(groupedBPMStreams,
        v => d3.sum(v, d => d.streams),
        d => d.bpm
    );
    console.log(aggregatedBPMStreams);

    // Convert aggregated data back to array for visualization
    let aggregatedBPMStreamsArray = Array.from(aggregatedBPMStreams, ([bpm, streams]) => ({ bpm, streams }));

    // Sort data by BPM (ascending) initially
    aggregatedBPMStreamsArray.sort((a, b) => d3.ascending(
        parseInt(a.bpm.split("-")[0]), parseInt(b.bpm.split("-")[0])
    ));
    console.log(aggregatedBPMStreamsArray);

    // Set up the x scale for the streams bar chart
    const xStream = d3.scaleBand()
        .domain(aggregatedBPMStreamsArray.map(d => d.bpm.toString())) // Convert to string for proper labeling
        .range([0, streamsBarWidth])
        .padding(0.2);

    // Set up the y scale for the streams bar chart
    const yStream = d3.scaleLinear()
        .domain([0, d3.max(aggregatedBPMStreamsArray, d => d.streams)])
        .nice()
        .range([streamsBarHeight, 0]);

    // Format numbers with commas
    const formatNumber = d3.format(",");

    // Tooltip
    const tooltip2 = d3.select("body")
        .append("div")
        .attr("class", "tooltip2")
        .style("opacity", 0);

    // Draw the streams bars with hover effects and tooltip
    svg2.selectAll(".stream-bar")
        .data(aggregatedBPMStreamsArray)
        .enter().append("rect")
        .attr("class", "stream-bar")
        .attr("x", d => xStream(d.bpm.toString()))
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
                .html(`BPM: ${d.bpm}<br>Total Streams: ${formatNumber(d.streams)}`)
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
    svg2.append("g")
        .attr("class", "x-stream-axis") // Add a class for selection
        .attr("transform", `translate(0,${streamsBarHeight})`)
        .call(d3.axisBottom(xStream));

    // Add the y-axis for the streams chart
    const yStreamTicks = [...Array(1 + Math.ceil(d3.max(aggregatedBPMStreamsArray, d => d.streams)/20000000000)).keys()]
        .map(d => d * 20000000000);
    svg2.append("g")
        .call(d3.axisLeft(yStream).tickValues(yStreamTicks).tickFormat(d => d3.format(",.2s")(d).replace('G', ' tỷ')))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -streamsBarHeight / 2)
        .attr("y", -35)
        .attr("fill", "black")
        .text("Total Streams");

});
