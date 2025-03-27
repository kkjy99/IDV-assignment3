/* Script */
// Load Data //
Promise.all([
    d3.csv("data/Resident_Population_PasirRis_2000.csv"),
    d3.csv("data/Resident_Population_PasirRis_2010.csv"),
    d3.csv("data/Resident_Population_PasirRis_2020.csv"),
    d3.csv("data/Resident_Population_Singapore_2000.csv"),
    d3.csv("data/Resident_Population_Singapore_2010.csv"),
    d3.csv("data/Resident_Population_Singapore_2020.csv")
]).then(([data0, data1, data2, dataSG0, dataSG1, dataSG2]) => {
    
    // Understand data structure
    console.log(data0[0])
    console.log(data1[0])
    console.log(data2[0])

    const medianAge_1 = {
        "0": "31.5",
        "1": "35.4",
        "2": "40.2"
    };

    const medianAge_2 = {
        "0": "33.9",
        "1": "37.3",
        "2" : "41.5"
    };

    const colname_map = {
        "Age Group": "age_group",
        "Total": "total",
        "Percent": "percent",
        "Male": "male",
        "Percent Male": "percent_male",
        "Female": "female",
        "Percent Female": "percent_female",
        "Percent Male (Negative)": "percent_male_negative"
    };

    // Function to rename object keys
    const renameKeys = obj =>
        // Rename the object key if it can be found in the colname_map array, else keep the object key
        Object.fromEntries(Object.entries(obj).map(([key, value]) => [colname_map[key] || key, value]));
    
    // Function to rename all objects in an array
    const renameAll = arr => 
        arr.map(renameKeys);

    const renamedData = [data0, data1, data2].map(renameAll);
    const renamedSGData = [dataSG0, dataSG1, dataSG2].map(renameAll);
    // const data2000 = renamedData[0]
    // const data2010 = renamedData[1]
    // const data2020 = renamedData[2]
    
    console.log(renamedData)

    /* Canvas for charts */
    const margin = { top: 40, right: 50, bottom: 40, left: 120 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create two separate SVGs
    function createSVG(containerId) {
        return d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    const svg1 = createSVG("#chart1");
    const svg2 = createSVG("#chart2");

    /* Scale for vertical axis */
    const yScale = d3.scaleBand()
        .domain(renamedData[0].map(d => d.age_group))
        .range([height, 0])
        .padding(0.1);

    /* Scale for horizontal axis */
    const xScale = d3.scaleLinear()
        .domain([-20, 20])
        .range([0, width]);

    const yAxis = d3.axisLeft(yScale);
    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => Math.abs(d) + "%");

    /* Title of Chart */
    svg1.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Population Pyramid (Pasir Ris, Singapore)");

    svg2.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Population Pyramid (Singapore)");

    /* Median age */
    function getAgeMidpoint(ageLabel) {
        if (ageLabel.startsWith("Under")) {
          // e.g. "Under 5 years"
          const age = parseInt(ageLabel.match(/\d+/)[0]);
          return age / 2; // midpoint from 0 to that age
        } else if (ageLabel.includes("to")) {
          // e.g. "20 to 24 years"
          const [start, end] = ageLabel.match(/\d+/g).map(Number);
          return (start + end) / 2;
        } else if (ageLabel.includes("and over")) {
          // e.g. "85 years and over"
          const age = parseInt(ageLabel.match(/\d+/)[0]);
          return age + 2.5; // assume ~5-year group, midpoint is ~87.5
        }
        return null;
    }

    function findClosestAgeGroup(medianAge, ageGroups) {
        const midpoints = ageGroups.map(label => {
          return {
            label,
            midpoint: getAgeMidpoint(label) // use the function from earlier
          };
        });
      
        // Find the closest one
        const closest = midpoints.reduce((prev, curr) =>
          Math.abs(curr.midpoint - medianAge) < Math.abs(prev.midpoint - medianAge)
            ? curr : prev
        );
      
        return closest.label;
    }

    /* Function to update chart */
    function updateChart(svg, year, dataset, chart_id, medianAges) {
        const data = dataset[year];
        console.log(data)

        /* Vertical axis */
        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll("text")  // Select all text elements in the axis
            .attr("font-family", "Cambria")  // Custom Font Family
            .attr("font-size", "12px");  // Adjust font size if needed

        /* Horizontal axis */
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")  // Select all text elements in the axis
            .attr("font-family", "Cambria")  // Custom Font Family
            .attr("font-size", "12px");  // Adjust font size if needed
        
        /* Legend */
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 100}, 0)`);

        legend.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "rgb(123, 154, 255)");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text("Male");

        legend.append("rect")
            .attr("y", 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "pink");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 32)
            .text("Female");

        // Tooltips
        const tooltip = d3.select("#tooltip");

        // Bind new data for male bars
        let maleBars = svg.selectAll(`.bar.male-${chart_id}`).data(data, d => d.age_group);

        // ENTER (new elements)
        maleBars.enter()
            .append("rect")
            .attr("class", `bar male-${chart_id}`)
            .attr("y", d => yScale(d.age_group))
            .attr("x", xScale(0)) // Start at 0 for transition effect
            .attr("width", 0) // Start with width 0
            .attr("height", yScale.bandwidth())
            .merge(maleBars) // MERGE (update existing elements)
            .transition()
            .duration(1000)
            .attr("x", d => xScale(parseFloat(d.percent_male_negative)))
            .attr("width", d => xScale(0) - xScale(parseFloat(d.percent_male_negative)))
            .attr("fill", "rgb(123, 154, 255)");

        // EXIT (remove old elements)
        maleBars.exit()
            .transition()
            .duration(1000)
            .attr("width", 0)
            .remove();

        svg.selectAll(`.bar.male-${chart_id}`)
            .on("mouseover", function (event, d) {
              tooltip
                .style("opacity", 1)
                .html(`<strong>${d.age_group}</strong><br/>Male: ${Math.abs(parseFloat(d.percent_male))}%`);
            })
            .on("mousemove", function (event) {
              tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
              tooltip.style("opacity", 0);
            });

        // Bind new data for female bars
        let femaleBars = svg.selectAll(`.bar.female-${chart_id}`).data(data, d => d.age_group);

        // ENTER (new elements)
        femaleBars.enter()
            .append("rect")
            .attr("class", `bar female-${chart_id}`)
            .attr("y", d => yScale(d.age_group))
            .attr("x", xScale(0)) // Start at 0 for transition effect
            .attr("width", 0) // Start with width 0
            .attr("height", yScale.bandwidth())
            .merge(femaleBars) // MERGE (update existing elements)
            .transition()
            .duration(1000)
            .attr("x", xScale(0))
            .attr("width", d => xScale(parseFloat(d.percent_female)) - xScale(0))
            .attr("fill", "pink");
        
        svg.selectAll(`.bar.female-${chart_id}`)
            .on("mouseover", function (event, d) {
              tooltip
                .style("opacity", 1)
                .html(`<strong>${d.age_group}</strong><br/>Female: ${parseFloat(d.percent_female)}%`);
            })
            .on("mousemove", function (event) {
              tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
              tooltip.style("opacity", 0);
            });

        // EXIT (remove old elements)
        femaleBars.exit()
            .transition()
            .duration(1000)
            .attr("width", 0)
            .remove();

        // Median age line
        const medianAge = medianAges[year];
        const ageGroup = findClosestAgeGroup(medianAge, data.map(d => d.age_group));
        const medianY = yScale(ageGroup) + yScale.bandwidth() / 2;

        svg.selectAll(`.median-line-${chart_id}`)
            .data([medianY])
            .join(
                enter => enter.append("line")
                .attr("class", `median-line-${chart_id}`)
                .attr("x1", 0).attr("x2", width)
                .attr("y1", medianY).attr("y2", medianY)
                .attr("stroke", "red")
                .attr("stroke-dasharray", "4 2")
                .attr("stroke-width", 2),
                update => update.transition().duration(800)
                .attr("y1", medianY)
                .attr("y2", medianY)
        );
        // Optional label
        svg.selectAll(`.median-label-${chart_id}`)
        .data([medianAge])
        .join(
        enter => enter.append("text")
            .attr("class", `median-label-${chart_id}`)
            .attr("x", width / 1)
            .attr("y", medianY - 6)
            .attr("text-anchor", "middle")
            .attr("fill", "red")
            .attr("font-size", "13px")
            .text(`Median Age: ${medianAge}`),
        update => update.transition().duration(800)
            .attr("y", medianY - 6)
            .text(`Median Age: ${medianAge}`)
        );
    }

    // Initial Render
    updateChart(svg1, "0", renamedData, "1", medianAge_1);
    updateChart(svg2, "0", renamedSGData, "2", medianAge_2);

    // Event Listener for Dropdown
    document.getElementById("yearSelect").addEventListener("change", function() {
        updateChart(svg1, this.value, renamedData, "1", medianAge_1);
        updateChart(svg2, this.value, renamedSGData, "2", medianAge_2);
    });
    
})
.catch(error => console.log("Error loading CSV:", error));


// Collapsible elements //
var collapse = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < collapse.length; i++) {
  collapse[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}