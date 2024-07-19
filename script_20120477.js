d3.csv("spotify-2023.csv").then(function (data) {
    // Filter out rows with empty key values
    data = data.filter(d => d.key !== "");

    // Group data by key and count the number of songs
    const songCounts = d3.rollups(data, v => v.length, d => d.key);

    // Sort the song counts by count in descending order
    songCounts.sort((a, b) => b[1] - a[1]);

    // Dimensions
    const margin = { top: 10, right: 20, bottom: 110, left: 40 },
        width = 650 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scaleBand()
        .domain(songCounts.map(d => d[0]))
        .range([0, width])
        .padding(0.1);

    // Y Scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(songCounts, d => d[1])])
        .nice()
        .range([height, 0]);

    // X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Key");

    // Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "-5.1em")
        .style("text-anchor", "middle")
        .text("Number of Songs");

    // Tooltip
    const tooltip = d3.select("#tooltip");

    // Add bars
    svg.selectAll(".bar")
        .data(songCounts)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1);
            tooltip.html(`Key: ${d[0]}<br>Count: ${d[1]}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });
}).catch(function (error) {
    console.error('Error loading or parsing data:', error);
});

// Load data from CSV
d3.csv("spotify-2023.csv").then(function (data) {
    // Filter data for the year 2023
    data = data.filter(d => d.released_year === "2023");

    // Group data by artist(s)_name and calculate total streams
    const artistStreams = d3.rollups(data, v => d3.sum(v, d => +d.streams), d => d["artist(s)_name"]);

    // Sort by total streams in descending order
    artistStreams.sort((a, b) => b[1] - a[1]);

    // Get the top 10 artists
    const top10Artists = artistStreams.slice(0, 10);

    // Dimensions
    const margin = { top: 10, right: 20, bottom: 110, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#chart2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scaleBand()
        .domain(top10Artists.map(d => d[0]))
        .range([0, width])
        .padding(0.1);

    // Y Scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(top10Artists, d => d[1])])
        .nice()
        .range([height, 0]);

    // X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format("~s")))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("dy", "-5.1em")
        .style("text-anchor", "middle")
        .text("Number of Streams");

    // Tooltip
    const tooltip = d3.select("#tooltip");

    // Add bars
    svg.selectAll(".bar")
        .data(top10Artists)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1);
            tooltip.html(`Artist: ${d[0]}<br>Streams: ${d3.format(",")(d[1])}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });
}).catch(function (error) {
    console.error('Error loading or parsing data:', error);
});