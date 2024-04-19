let attentionTheivesString = ''

let stopwords = new Set("i,me,my,myself,we,us,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,whose,this,that,these,those,am,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,will,would,should,can,could,ought,i'm,you're,he's,she's,it's,we're,they're,i've,you've,we've,they've,i'd,you'd,he'd,she'd,we'd,they'd,i'll,you'll,he'll,she'll,we'll,they'll,isn't,aren't,wasn't,weren't,hasn't,haven't,hadn't,doesn't,don't,didn't,won't,wouldn't,shan't,shouldn't,can't,cannot,couldn't,mustn't,let's,that's,who's,what's,here's,there's,when's,where's,why's,how's,a,an,the,and,but,if,or,because,as,until,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,upon,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,say,says,said,shall".split(","))

// let ThiefAndType = []

let ExternalValue = 0
let InternalValue = 0
let UnsureValue = 0



async function ActivateD3Charts() {
    const response = await fetch(appURL);
    const initialdata = await response.json();

    let ThiefAndType = {}; // This will store the word, type, and count

    initialdata.forEach(dataItem => {

        //These two for loops clean up the data so that we are left with an array of objects that has the
        //Unique word, the designation of Type (External v Internal) and the count of how many times that unique combo has been referenced. 
        const type = dataItem["Internal or External?"];
        const cleanedWords = dataItem["Attention Thief"]
            .split(/[\s.,]+/) // Include comma in the splitting regex if not desired in words
            .map(w => w
                .replace(/^[“‘"\-—()\[\]{}]+|[;:.!?()\[\]{},"'’”\-—]+$/g, "")
                .replace(/['’]s$/g, "")
                .substring(0, 30)
                .toLowerCase()
            )
            .filter(w => w && !stopwords.has(w));

        cleanedWords.forEach(word => {
            let key = `${word}:${type}`; // Unique key for each word and type combination
            if (ThiefAndType[key]) {
                ThiefAndType[key].count++;
            } else {
                ThiefAndType[key] = {
                    word: word,
                    type: type,
                    count: 1
                };
            }
        });

        // Super simple count for the histogram. 
        if (type == "Internal") {
            InternalValue++
        } else if (type == "External") {
            ExternalValue++
        } else {
            UnsureValue++
        }
    });

    // Convert the object to an array for any other usage
    let ThiefAndTypeArray = Object.values(ThiefAndType);
    console.log(ThiefAndTypeArray);

    // where we pass the array into the wordcloud. 
    WordCloud(ThiefAndTypeArray, {
        width: 800, // Example width
        height: 600, // Example height
        maxWords: 100 // Limit the number of words
    });

    // Getting Max Value for adaptive sizing of Bar Chart
    let MaxCurrentValue = Math.max(InternalValue, ExternalValue, UnsureValue)
    console.log("Max Value is: " + MaxCurrentValue)


    // The data Object for the Histogram add more Value if needed. 
    var data1 = [
        { group: "External", value: ExternalValue, color: "#FFCE6F" },
        { group: "Internal", value: InternalValue, color: "#D3992C" },
        { group: "Unsure", value: UnsureValue, color: "#FCB42B" }
    ];


    // set the dimensions and margins of the graph CHANGE CANVAS SIZE HERE
    var margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 900 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to div holder that I designated in the HTML
    var svg = d3.select("#d3BarChartHolder")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // X axis 
    var x = d3.scaleBand()
        .range([0, width])
        .domain(data1.map(function (d) { return d.group; }))
        .padding(0.2);


    // Y axis (Adaptive randge based on values)
    var y = d3.scaleLinear()
        .domain([0, MaxCurrentValue + 5])
        .range([height, 0]);


    // A function that create / update the plot for a given variable:
    function update(data) {
        var u = svg.selectAll("rect")
            .data(data);

    // This is where the rects are added and the animation takes place. 
        u.enter()
            .append("rect")  // Create the new rect elements for new data
            .attr("x", d => x(d.group))
            .attr("y", height)  // Start at the bottom of the chart
            .attr("width", x.bandwidth())
            .attr("height", 0)  // Start with a height of 0
            .attr("fill", d => d.color)
            .merge(u)  // Merge with existing rects
            .transition()  // Start a transition to animate
            .duration(1000)
            .attr("y", d => y(d.value))  // Move y to the top of the bar
            .attr("height", d => height - y(d.value));  // Height grows up from the bottom
    }

    // This is where we style the Axis of the histogram.
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "16px");

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "16px");

    // Initialize the plot with the first dataset
    update(data1)
}





function WordCloud(data, {
    width = 640,
    height = 400,
    fontFamily = "sans-serif",
    padding = 10,
    rotate = 0
} = {}) {

    // Define colors for each type
    var colorScale = d3.scaleOrdinal()
        .domain(['Internal', 'External', 'Unsure'])
        .range(['#D3992C', '#FFCE6F', '#FCB42B']);  // Adjust the colors if needed

    // Sets up the SVG container
    const svg = d3.select("#d3WordCloudHolder").append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("font-family", fontFamily)
        .attr("text-anchor", "middle")
        .style("max-width", "100%")
        .style("height", "auto");

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Takes the data from our Array of objects and pushes it into the word cloud. 
    const cloud = d3.layout.cloud()
        .size([width, height])
        .words(data.map(d => ({
            text: d.word,
            size: Math.sqrt(d.count) * 15,  // Calculate size based on count
            type: d.type
        })))
        .padding(padding)
        .rotate(rotate)
        .font(fontFamily)
        .fontSize(d => d.size) // Use the size directly from the transformed data
        .on("end", words => {
            const textElements = g.selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", d => `${d.size}px`)
                .style("fill", d => colorScale(d.type))  // Set color based on type
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .text(d => d.text)
                .style("opacity", 0);

            textElements.transition()
                .duration(d => d.size * 100)
                .style("opacity", 1)
                .attr("transform", d => `translate(${d.x}, ${d.y})`);
        });

    // The legend at the bottom of the word cloud. 
    svg.append("circle").attr("cx",30).attr("cy",height - 20).attr("r", 7).style("fill", "#D3992C")
    svg.append("circle").attr("cx",30).attr("cy",height - 40).attr("r", 7).style("fill", "#FFCE6F")
    svg.append("circle").attr("cx",30).attr("cy",height - 60).attr("r", 7).style("fill", "#FCB42B")
    svg.append("text").attr("x", 60).attr("y", height - 20).text("Internal Distraction").style("font-size", "15px").attr("alignment-baseline","middle").attr("text-anchor", "start")
    svg.append("text").attr("x", 60).attr("y", height - 40).text("External Distraction").style("font-size", "15px").attr("alignment-baseline","middle").attr("text-anchor", "start")
    svg.append("text").attr("x", 60).attr("y", height - 60).text("Unsure").style("font-size", "15px").attr("alignment-baseline","middle").attr("text-anchor", "start")

    cloud.start();
}

