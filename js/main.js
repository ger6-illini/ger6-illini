/**
 * This script is the engine that powers a narrative visualization
 * that tries to answer the question: How the US compares to other
 * rich countries in the world along the years in terms of life span
 * and health spend. It was developed as the final assignment of
 * the CS416 – Data Visualization course from the University of
 * Illinois at Urbana-Champaign I took in summer 2022.
 * 
 * @author Gilberto E Ramirez <ger6@illinois.edu>
 * @version 0.1
 */

// SVG definitions
const margin = {top: 20, right: 100, bottom: 100, left: 100};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
let svg;
let g;

// variable holding the loaded data
let data;

// D3 scale definitions
let xScale;
let yScale;

// parameters of narrative visualization
let slideCurrent = -1; // current slide number
const slideQuantity = 4; // number of slides
const lastYear = [1979, 2009, 2020, 2022]; // last year for each slide
const slideMessageTitle = ["The Happy 70s", "80s, 90s and 2000s: The Gap Widens", "The COVID Impact", "Become a Researcher"];
const slideMessageContent = ["During the 1970s the US was similar to the rest of the richest countries in the world in terms of life expectancy and health expenditure.<br><br>Each <span style='color:gray'>gray</span> line in the chart to the right represents one of the top 19 richest countries in the world based on its GDP Per Capita in 2021. Feel free to mouse over a gray line to <span style='color:green'>discover its associated country name!</span> Also, if you are unfamiliar with the term PPP (Purchasing Power Parity) go <a href='https://en.wikipedia.org/wiki/Purchasing_power_parity'>here</a> to learn about it.",
"After 1980, the gap between the United States and the rest of the countries grew larger and larger. One main reason for this gap is a rapid and continuous increase in the American health care costs due to a combination of several factors:<ul><li>Greed, e.g., pharmaceutical companies putting profits above patients and insurance executives being paid millions to deny coverage,<li>Healthcare administration expenses way higher than other countries, and<li>Overprovision of technologically sophisticated medical services even when they might not be needed.</ul>These high medical costs drove a large share of the americans to be uninsured (10 percent), and underinsured. For those having enough insurance coverage it seems life expectancy is not getting better due to a lack of consistency in routine care being enforced by the healthcare system. All this is well captured in <a href='https://www.harvardmagazine.com/2020/05/feature-forum-costliest-health-care'>this</a> article by David Cutler.",
"COVID-19 brought a serious impact in life expectancy and health expenditure. All countries were affected and the US was not the exception. As of July 2022, number of deaths by COVID in the US has surpassed the one million mark. In addition, the number of excess deaths, i.e., deaths that might be associated to COVID-19 but not counted as such, is also over one million according to the CDC (see <a href='https://www.cdc.gov/nchs/nvss/vsrr/covid19/excess_deaths.htm'>this link </a>).",
"Time to play with the data to discover your own insights. Select a country from the dropdown box below and compare annual data for that country against the US. Are there any countries that seemed to reduce the health care costs between one year and the next one? Can you figure out why? Do you see a significant change in life expectancy in specific years and the reasons for it? As you might have heard in <a href='https://en.wikipedia.org/wiki/The_X-Files'>The X-Files</a> TV series: The truth is out there.<br><br>Please note you can mouse over the dots representing data points to get info on it such as year, life expectancy in years, and health expenditure in PPP dollars."];
const annotations = [
{
  note: {
    label: "The US is no different from the rest of the richest countries.",
    title: "The 'normal' years"
  },
  x: 28.0375 + margin.left,
  y: 396.8000000000002 + margin.top,
  dy: -137,
  dx: 142,
  subject: {
    radius: 50,
    radiusPadding: 0
  }
},
{
  note: {
    label: "A gap between the US and the rest of the richest countries gets wider and wider.",
    title: "The 'abysm' years"
  },
  x: 322.60575 + margin.left,
  y: 170 + margin.top,
  dy: -40,
  dx: 142,
  subject: {
    radius: 60,
    radiusPadding: 0
  }
},
{
  note: {
    label: "385,676 deaths in 2020 and 463,210 deaths in 2021.",
    title: "COVID-19 hits!"
  },
  //can use x, y directly instead of data
  x: 542.77585 + margin.left,
  y: 198.4000000000001 + margin.top,
  dy: 137,
  dx: -162,
  subject: {
    radius: 50,
    radiusPadding: 0
  }
}];
let selectedCountry = ""; // selected country in last slide

let mapCountryToLocation;

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

/** When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function dropdownClick() {
  document.getElementById("dropdown").classList.toggle("show");
}

/** This function only works when current slide is last one
 *  (interactive slide) making visible line and label 
 *  for the country selected in the dropdown box */
function renderLinePointsAndLabels() {
  // remove all dots marking data points
  d3.selectAll("circle")
      .remove();

  // make invisible highlighted lines and labels (if any)
  d3.select(".line_active")
      .attr("class", "line_invisible");
  d3.select(".line-label_active")
      .attr("class", "line-label_inactive");
  
  // highlight line and label selected thru dropdown box
  d3.select("#" + mapCountryToLocation[selectedCountry])
    .select("path")
      .attr("class", "line_active");
  d3.select("#" + mapCountryToLocation[selectedCountry])
    .select("text")
      .attr("class", "line-label_active");

  // add dots to mark datapoints
  const groupedDataToShow = d3.group(data, d => d.Country);

  // add dots to US line
  let ggg = d3.select("#USA").append("g")
      .attr("class", "dots_reference");
  groupedDataToShow.get("United States").forEach(d => {
      ggg.append("circle")
        .attr("cx", xScale(d["Health Expenditure"]))
        .attr("cy", yScale(d["Life Expectancy"]))
        .attr("r", "4px")
        .on("mouseover", function(event) {
          tooltip.transition()
              .duration(200)
              .style("opacity", .7);
          tooltip.html("<b>Year " + d["Year"] + "</b><br/>" + d3.format('.0f')(d["Life Expectancy"]) + " yrs | " + d3.format('$,.0f')(d["Health Expenditure"]) + "<br/>")
              .style("left", (event.pageX) + "px")
              .style("top", (event.pageY - 28) + "px")
              .classed("US", true);
          })					
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
  })

  // add dots to line from selected country
  const tooltip = d3.select(".tooltip");
  ggg = d3.select("#" + mapCountryToLocation[selectedCountry]).append("g")
    .attr("class", "dots_active");
  groupedDataToShow.get(selectedCountry).forEach(d => {
    ggg.append("circle")
      .attr("cx", xScale(d["Health Expenditure"]))
      .attr("cy", yScale(d["Life Expectancy"]))
      .attr("r", "4px")
      .on("mouseover", function(event) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .7);
        tooltip.html("<b>Year " + d["Year"] + "</b><br/>" + d3.format('.0f')(d["Life Expectancy"]) + " yrs | " + d3.format('$,.0f')(d["Health Expenditure"]) + "<br/>")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px")
            .classed("US", false);
        })					
      .on("mouseout", function(d) {
          tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      });
  })
}

/**
 *  Change slide to the one indicated as a parameter
 *  @param {number} slideNumber - Slide number visualization needs to jump to
*/
function slideChange(slideNumber) {
  if (slideNumber === slideCurrent) { return; }

  // Update rendering of pagination widget
  d3.select("#slide-" + slideCurrent).classed("active", false);
  slideCurrent = slideNumber;
  d3.select("#slide-" + slideCurrent).classed("active", true);
  d3.select("#previousButton").classed("disabled", slideCurrent === 1)
  d3.select("#nextButton").classed("disabled", slideCurrent === slideQuantity)

  // Update slide title and message
  d3.select(".slide-message-title")
    .html(slideMessageTitle[slideCurrent - 1]);
  d3.select(".slide-message-content")
    .html(slideMessageContent[slideCurrent - 1]);

  // Just keep the data that needs to
  // be shown within the current slide
  const dataToShow = data.filter(d => (d.Year <= lastYear[slideCurrent - 1]));

  // Group data
  const groupedDataToShow = d3.group(dataToShow, d => d.Country);

  // Clean country selection since we are moving from slide
  selectedCountry = "";
  d3.select(".dropbtn").html("Select a country");

  // If last slide make visible dropdown box with list of countries
  d3.select(".dropdown")
    .classed("hide", slideCurrent === slideQuantity ? false : true);

  // Set up line generators
  const line = d3.line()
      .defined(d => d['Life Expectancy'] >= 70)
      .x(d => xScale(d['Health Expenditure']))
      .y(d => yScale(d['Life Expectancy']));

  // Remove plot before starting
  g.selectAll('*').remove();
  
  // Add year range label
  g.append("text")
      .attr("class", "plot-area-label")
      .attr("x", width)
      .attr("y", -10 + height)
      .text("1970 to " + lastYear[slideCurrent - 1]);

  Array.from(groupedDataToShow, ([key, values]) => {
    // key is Country Name and values is an array of all values
    // corresponding to the Country Name including Year,
    // Life Expectancy, and Health Expenditure 
    
    // Add one SVG group per country containing
    // corresponding line and labels
    const gg = g.append("g")
        .attr("id", values[0].LOCATION);
    
    if (key == "United States") {
      // Highlight United States line and label and
      // leave them always visible (opacity = 1)
      gg.append("path")
        .data([values])
        .attr("class", "line_reference")
        .attr("d", line);
      gg.append("text")
        // Country label
        .data([values])
        .attr("class", "line-country-label_reference")
        .attr("x", d => 5 + xScale(d[d.length - 1]["Health Expenditure"]))
        .attr("y", d => 15 + yScale(d[d.length - 1]["Life Expectancy"]))
        .text(key);
      values.forEach(d => {
        if (((d["Year"] % 5) === 0) || d["Year"] === 2019) {
          // Year labels (every five years starting with 1970)
          gg.append("text")
            .attr("class", "line-year-label_reference")
            .attr("x", (d["Year"] == 2020 ? 20 : 5) + xScale(d["Health Expenditure"]))
            .attr("y", -10 + yScale(d["Life Expectancy"]))
            .text(d["Year"]);
        }
      });
    } else if (slideCurrent < slideQuantity) {
      // For slides other than last one
      // rest of countries line and label will
      // show inactive unless mouseover triggers
      // transition to active
      gg.append("path")
        .data([values])
        .attr("class", "line_inactive")
        .attr("d", line);
      gg.append("text")
        .data([values])
        .attr("class", "line-label_inactive")
        .attr("x", d => 5 + xScale(d[d.length - 1]["Health Expenditure"]))
        .attr("y", d => 10 + yScale(d[d.length - 1]["Life Expectancy"]))
        .text(key);
      gg.on('mouseover', function(d) {
        d3.select(this).select("path")
          .attr("class", "line_active");
        d3.select(this).select("text")
          .attr("class", "line-label_active");
      });
      gg.on('mouseout', function(d) {
        d3.select(this).select("path")
          .attr("class", "line_inactive");
        d3.select(this).select("text")
          .attr("class", "line-label_inactive");
      });
    }
    else {
      // For last slide hide all lines and labels
      // Lines and labels will only be on thru dropbox selections
      gg.append("path")
        .data([values])
        .attr("class", "line_invisible")
        .attr("d", line);
      gg.append("text")
        .data([values])
        .attr("class", "line-label_inactive")
        .attr("x", d => 5 + xScale(d[d.length - 1]["Health Expenditure"]))
        .attr("y", d => 10 + yScale(d[d.length - 1]["Life Expectancy"]))
        .text(key);
    }
  });
  
  // Remove old annotations
  d3.selectAll(".annotation-group").remove();
  
  // Add annotations corresponding to current slide
  // (except last slide that has no annotations)
  if (slideCurrent < slideQuantity) {
    const makeAnnotations = d3.annotation()
      .notePadding(15)
      .type(d3.annotationCalloutCircle)
      .annotations([annotations[slideCurrent - 1]])
    svg.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
  }
}

/** Function to be loaded with the page */
async function init() {
  // Create the SVG
  svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // Create plot group inside SVG
  g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Create axis group inside SVG
  gAxis = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Add scales
  xScale = d3.scaleLinear()
    .domain([0, 12000])
    .range([0, width]);

  yScale = d3.scaleLinear()
    .domain([70, 85])
    .range([height, 0]);

  // Add x-axis
  gAxis.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => d3.format('$,.0f')(d)));

  // Add y-axis
  gAxis.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(yScale));
  
  // Add x-axis label
  gAxis.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .text("Health Expenditure Per Capita (PPP US Dollars)");

  // Add y-axis label
  gAxis.append("text")
    .attr("class", "axis-label")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .text("Life Expectancy (Years)");
  
  // Load the data into an object indexed by Country and sorted by Country by Year
  data = await d3.csv('/ger6-illini/data/stats-oecd.csv');
  data.forEach(d => {
    d["Year"] = +d["Year"];
    d["Health Expenditure"] = +d["Health Expenditure"];
    d["Life Expectancy"] = +d["Life Expectancy"];
  });

  // Get list of unique countries to be used
  // to populate dropdown box for slide 4
  const countries = data.map(d => d.Country);
  // using spread operator to convert Set to Array
  const uniqueCountries = [...new Set(countries)];
  // Remove last element (United States) from list
  uniqueCountries.pop();

  // Create a map from country name to unique three character code location
  // Unique three character code will be used to ID SVG groups with line and label later
  mapCountryToLocation = data.reduce((acc, cur) => ({...acc, [cur.Country]: cur.LOCATION}), {});

  // Populate dropdown box with list of unique countries
  uniqueCountries.forEach(d => {
    d3.select(".dropdown-content").append("a")
      .attr("href", "#")
      .on('click', function(d) {
        selectedCountry = this.innerText;
        // Change text of dropdown button to country name
        d3.select(".dropbtn").html(selectedCountry);
        // Make dropdown invisible
        d3.select(".dropdown-content").classed("show", false);
        // Invoke function to show line and label
        // corresponding to the country selected
        renderLinePointsAndLabels();
      })
      .html(d);
  });
  
  // Create a tooltip
  // (only will be used in interactive slide which is the last one)
  d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", "0");

  // Initially update with slide 1
  slideChange(1);
}

/** Close the dropdown if the user clicks outside of it */
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}