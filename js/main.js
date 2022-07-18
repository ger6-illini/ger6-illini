/**
 * This script is the engine that powers a narrative visualization
 * that tries to answer the question How US compares other rich
 * countries in the world along the years in terms of life span
 * and health spend. It was developed as the final assignment of
 * the CS416 – Data Visualization course from the University of
 * Illinois at Urbana-Champaign I took in summer 2022.
 * 
 * @author Gilberto E Ramirez <ger6@illinois.edu>
 * @version 0.1
 */

// SVG definitions
const margin = {top: 20, right: 20, bottom: 100, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
let svg;
let g;

// variable holding the loaded data
let groupedData;

// D3 scale definitions
let xScale;
let yScale;

// parameters of narrative visualization
let slideCurrent = -1; // current slide number
let slideQuantity = 4; // number of slides

/** Go to the previous slide if current slide is not the first one */
function slidePrevious() {
  if (slideCurrent > 1) {
    slideChange(slideCurrent - 1);
  }
}

/** Go to the next slide if current slide is not the last one */
function slideNext() {
  if (slideCurrent < slideQuantity) {
    slideChange(slideCurrent + 1);
  }
}

/**
 *  Change slide to the one indicated as a parameter
 * @param {number} slideNumber - Slide number visualization needs to jump to
*/
function slideChange(slideNumber) {
  if (slideNumber === slideCurrent) { return; }

  // update rendering of pagination widget
  d3.select("#slide-" + slideCurrent).classed("active", false);
  slideCurrent = slideNumber;
  d3.select("#slide-" + slideCurrent).classed("active", true);
  d3.select("#previousButton").classed("disabled", slideCurrent === 1)
  d3.select("#nextButton").classed("disabled", slideCurrent === slideQuantity)

  // set up line generators
  const line = d3.line()
      .x(d => xScale(d['Health Expenditure']))
      .y(d => yScale(d['Life Expectancy']));

  for (const [key, value] of Object.entries(groupedData)) {
    // key is Country Name and value is an array of all values
    // corresponding to the Country Name including Year,
    // Life Expectancy, and Health Expenditure 
    
    // Add one line per Country
    const country = key;
    console.log(country);
    svg.append('path')
        .data(value)
        .style("fill", "none")
        .style("stroke", "gray")
        .style("stroke-width", "2px")
        .attr("d", line);
  }      
}

/** Function to be loaded with the page */
async function init() {
  // Create the SVG and the plot area inside it
  svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Add scales
  xScale = d3.scaleLinear()
    .domain([0, 12000])
    .range([0, width]);

  yScale = d3.scaleLinear()
    .domain([70, 85])
    .range([height, 0]);

  // Add x-axis
  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0, ${height})`)
    .style("font-family", "Optima, Arial, Helvetica, sans-serif")
    .call(d3.axisBottom(xScale).tickFormat(d => d3.format('$,.0f')(d)));

  // Add y-axis
  g.append("g")
    .attr("class", "axis axis--y")
    .style("font-family", "Optima, Arial, Helvetica, sans-serif")
    .call(d3.axisLeft(yScale));
  
  // Add x-axis label
  g.append("text")
    .attr("class", "axis-label axis--x")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .style("font-family", "Optima, Arial, Helvetica, sans-serif")
    .text("Health Expenditure Per Capita (PPP US Dollars)");

  // Add y-axis label
  g.append("text")
    .attr("class", "axis-label axis--y")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .style("font-family", "Optima, Arial, Helvetica, sans-serif")
    .attr("transform", "rotate(-90)")
    .text("Life Expectancy (Years)");
  
  // Load the data into an object indexed by Country and sorted by Country by Year
  const data = await d3.csv('/ger6-illini/data/stats-oecd.csv');
  groupedData = d3.group(data, d => d.Country);
  console.log(groupedData);
  
  // Initially update with slide 1
  slideChange(1);
}
