function initial_draw() {    
	var beds_suitable = 11000
    var beds_unsuitable = 4000
	var surge_alternate_beds = 1000
	var surge_nonicu_beds = 1300
	var baseline_icu = 1500
	var baseline_nonicu = 9500
	var occupied_icu = 800
	var occupied_nonicu = 7300
	var surge_icu_beds = 1200
	var available_nonicu = (baseline_nonicu - occupied_nonicu) + (surge_alternate_beds + surge_nonicu_beds);
	var available_icu = (baseline_icu + surge_icu_beds) - occupied_icu;

    dataset = [
        {group:"All beds in the state (1)", "Total": (beds_suitable + beds_unsuitable), "ICU":0, "Non-ICU": 0, "Alternate":0},
        {group:"Beds Unsuitable for COVID (2)", "Total": beds_unsuitable, "ICU":0, "Non-ICU": 0, "Alternate":0},
        {group:"Baseline Licensed Beds (3)", "Total":0, "ICU":baseline_icu, "Non-ICU": baseline_nonicu, "Alternate":0},
        {group:"Surge Bed Goals (4)", "Total":0, "ICU":surge_icu_beds, "Non-ICU": surge_nonicu_beds, "Alternate":surge_alternate_beds},
        {group:"Occupied (COVID and Other) (5)", "Total":0, "ICU":occupied_icu, "Non-ICU": occupied_nonicu, "Alternate":0},
		{group:"Available for any new patients (6)", "Total":0, "ICU":available_icu, "Non-ICU": available_nonicu, "Alternate":0},
    ];
	
    var margin = {top: (parseInt(d3.select('body').style('height'), 10) / 20) + 10, right: (parseInt(d3.select('#viz').style('width'), 10) / 20), bottom: (parseInt(d3.select('#viz').style('height'), 10) / 6), left: (parseInt(d3.select('#viz').style('width'), 10) / 20)},
            width = parseInt(d3.select('#viz').style('width'), 10) - margin.left - margin.right,
            height = parseInt(d3.select('#viz').style('height'), 10) - margin.top - margin.bottom;
    var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1,.3);
    var y = d3.scale.linear()
            .rangeRound([height, 0]);
    var colorRange = d3.scale.category20();
	
    var color = d3.scale.ordinal()
            .range(colorRange.range());
			
    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
			
    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")

    var svg = d3.select("#viz").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
    var divTooltip = d3.select("body").append("div").attr("class", "toolTip");
    color.domain(d3.keys(dataset[0]).filter(function(key) { return key !== "group"; }));
	
    dataset.forEach(function(d) {
        var y0 = 0;
        d.values = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
        d.total = d.values[d.values.length - 1].y1;
    });
	
    x.domain(dataset.map(function(d) { return d.group; }));
    y.domain([0, d3.max(dataset, function(d) { return d.total; })]);
	
    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
	
    svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 9)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Number of Beds");

	var bar = svg.selectAll(".label")
            .data(dataset)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform", function(d) { return "translate(" + x(d.group) + ",0)"; });

    svg.selectAll(".x.axis .tick text")
            .call(wrap, x.rangeBand());
			
	dataset[1]['values'][0]['y0'] = beds_suitable;	
	dataset[1]['values'][0]['y1'] = beds_suitable + beds_unsuitable;	

	dataset[3]['values'][1]['y0'] = beds_suitable;	//Surge ICU
	dataset[3]['values'][1]['y1'] = beds_suitable + surge_icu_beds;	
	dataset[3]['values'][2]['y0'] = beds_suitable + surge_icu_beds;	//Surge Non-ICU
	dataset[3]['values'][2]['y1'] = beds_suitable + surge_icu_beds + surge_nonicu_beds;	
	dataset[3]['values'][3]['y0'] = beds_suitable + surge_icu_beds + surge_nonicu_beds;	//Surge Alternate
	dataset[3]['values'][3]['y1'] = beds_suitable + surge_icu_beds + surge_nonicu_beds + surge_alternate_beds;	

	dataset[4]['values'][1]['y0'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds) - (occupied_icu + occupied_nonicu);
	dataset[4]['values'][1]['y1'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds) - (occupied_nonicu);
	dataset[4]['values'][2]['y0'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds) - (occupied_nonicu);
	dataset[4]['values'][2]['y1'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds);	

	var bar_enter = bar.selectAll("rect")
    .data(function(d) { return d.values; })
    .enter();

	bar_enter.append("rect")
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.y1); })
	.attr("height", function(d) { return y(d.y0) - y(d.y1); })
    .style("fill", function(d) { return color(d.name); });

	bar_enter.append("text")
    .text(function(d) { return ((d.y1 - d.y0) == 0)? '': (d.y1 - d.y0); })
    .attr("y", function(d) { return y(d.y1) + (y(d.y0) - y(d.y1))/2; })
    .attr("x", x.rangeBand() / 3 + 6)
	.style("font-family", "Arial")
	.style("font-size", "12px")
    .style("fill", '#ffffff');
    
    bar
            .on("mousemove", function(d){
                divTooltip.style("left", d3.event.pageX + 10 + "px");
                divTooltip.style("top", d3.event.pageY - 25 + "px");
                divTooltip.style("display", "inline-block");
                var elements = document.querySelectorAll(':hover');
                l = elements.length
                l = l-1
                element = elements[l].__data__
                value = element.y1 - element.y0
                divTooltip.html((d.group)+"<br>"+element.name+"<br>"+value);
            });
    bar
            .on("mouseout", function(d){
                divTooltip.style("display", "none");
            });
			
	var legendDset = {
                'series': ['Alternate Medical Site (Target)','Non ICU','ICU'],
                'colors': ['#F2BB77','#EB7E25','#AEC7E8']                
                }

	var legend = svg.append("g")
     .attr("class", "legend")

    legend.selectAll('text')
      .data(legendDset["colors"])
      .enter()
      .append("rect")
      .attr("x", width-margin.right - 100)
      .attr("y", function(d, i){ return i * 20;})
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", function(d) {
        return d;
      })

    legend.selectAll('text')
      .data(legendDset["series"])
      .enter()
    .append("text")
    .style("font-family", "Arial")
	.style("font-size", 11)
    .attr("x", width-margin.right - 80)
    .attr("y", function(d, i){ return i *  20 + 9;})
    .text(function(d){return d});
		
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
}	
	
function redraw(){	
	 beds_suitable = parseInt(document.getElementById("total-baseline").value); 
     beds_unsuitable = parseInt(document.getElementById("total-unsuitable").value);
	 surge_alternate_beds = parseInt(document.getElementById("surge-alt").value);
	 surge_icu_beds = parseInt(document.getElementById("surge-icu").value);
	 surge_nonicu_beds = parseInt(document.getElementById("surge-nicu").value);
	 baseline_nonicu = parseInt(document.getElementById("baseline-nicu").value);
	 baseline_icu = parseInt(document.getElementById("baseline-icu").value);
	 occupied_icu = parseInt(document.getElementById("occupied-icu").value);
	 occupied_nonicu = parseInt(document.getElementById("occupied-nicu").value);
	 available_nonicu = (baseline_nonicu - occupied_nonicu) + (surge_alternate_beds + surge_nonicu_beds);
	 available_icu = (baseline_icu + surge_icu_beds) - occupied_icu;
	 d3.select("svg").remove();
 
dataset = [
        {group:"All beds in the state (1)", "Total": (beds_suitable + beds_unsuitable), "ICU":0, "Non-ICU": 0, "Alternate":0},
        {group:"Beds Unsuitable for COVID (2)", "Total": beds_unsuitable, "ICU":0, "Non-ICU": 0, "Alternate":0},
        {group:"Baseline Licensed Beds (3)", "Total":0, "ICU":baseline_icu, "Non-ICU": baseline_nonicu, "Alternate":0},
        {group:"Surge Bed Goals (4)", "Total":0, "ICU":surge_icu_beds, "Non-ICU": surge_nonicu_beds, "Alternate":surge_alternate_beds},
        {group:"Occupied (COVID and Other) (5)", "Total":0, "ICU":occupied_icu, "Non-ICU": occupied_nonicu, "Alternate":0},
		{group:"Available for any new patients (6)", "Total":0, "ICU":available_icu, "Non-ICU": available_nonicu, "Alternate":0},
    ];
	
    var margin = {top: (parseInt(d3.select('body').style('height'), 10) / 20) + 10, right: (parseInt(d3.select('#viz').style('width'), 10) / 20), bottom: (parseInt(d3.select('#viz').style('height'), 10) / 6), left: (parseInt(d3.select('#viz').style('width'), 10) / 20)},
            width = parseInt(d3.select('#viz').style('width'), 10) - margin.left - margin.right,
            height = parseInt(d3.select('#viz').style('height'), 10) - margin.top - margin.bottom;
    var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1,.3);
    var y = d3.scale.linear()
            .rangeRound([height, 0]);
    var colorRange = d3.scale.category20();
	
    var color = d3.scale.ordinal()
            .range(colorRange.range());
			
    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
			
    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")

    var svg = d3.select("#viz").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
    var divTooltip = d3.select("body").append("div").attr("class", "toolTip");
    color.domain(d3.keys(dataset[0]).filter(function(key) { return key !== "group"; }));
	
    dataset.forEach(function(d) {
        var y0 = 0;
        d.values = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
        d.total = d.values[d.values.length - 1].y1;
    });
	
    x.domain(dataset.map(function(d) { return d.group; }));
    y.domain([0, d3.max(dataset, function(d) { return d.total; })]);
	
    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
	
    svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 9)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Number of Beds");

	var bar = svg.selectAll(".label")
            .data(dataset)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform", function(d) { return "translate(" + x(d.group) + ",0)"; });

    svg.selectAll(".x.axis .tick text")
            .call(wrap, x.rangeBand());
			
	dataset[1]['values'][0]['y0'] = beds_suitable;	
	dataset[1]['values'][0]['y1'] = beds_suitable + beds_unsuitable;	

	dataset[3]['values'][1]['y0'] = beds_suitable;	//Surge ICU
	dataset[3]['values'][1]['y1'] = beds_suitable + surge_icu_beds;	
	dataset[3]['values'][2]['y0'] = beds_suitable + surge_icu_beds;	//Surge Non-ICU
	dataset[3]['values'][2]['y1'] = beds_suitable + surge_icu_beds + surge_nonicu_beds;	
	dataset[3]['values'][3]['y0'] = beds_suitable + surge_icu_beds + surge_nonicu_beds;	//Surge Alternate
	dataset[3]['values'][3]['y1'] = beds_suitable + surge_icu_beds + surge_nonicu_beds + surge_alternate_beds;	

	dataset[4]['values'][1]['y0'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds) - (occupied_icu + occupied_nonicu);
	dataset[4]['values'][1]['y1'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds) - (occupied_nonicu);
	dataset[4]['values'][2]['y0'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds) - (occupied_nonicu);
	dataset[4]['values'][2]['y1'] = (baseline_icu + baseline_nonicu + surge_alternate_beds + surge_icu_beds + surge_nonicu_beds);	

	var bar_enter = bar.selectAll("rect")
    .data(function(d) { return d.values; })
    .enter();

	bar_enter.append("rect")
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.y1); })
	.attr("height", function(d) { return y(d.y0) - y(d.y1); })
    .style("fill", function(d) { return color(d.name); });

	bar_enter.append("text")
    .text(function(d) { return ((d.y1 - d.y0) == 0)? '': (d.y1 - d.y0); })
    .attr("y", function(d) { return y(d.y1) + (y(d.y0) - y(d.y1))/2; })
    .attr("x", x.rangeBand() / 3 + 6)
	.style("font-family", "Arial")
	.style("font-size", "12px")
    .style("fill", '#ffffff');
    
    bar
            .on("mousemove", function(d){
                divTooltip.style("left", d3.event.pageX + 10 + "px");
                divTooltip.style("top", d3.event.pageY - 25 + "px");
                divTooltip.style("display", "inline-block");
                var elements = document.querySelectorAll(':hover');
                l = elements.length
                l = l-1
                element = elements[l].__data__
                value = element.y1 - element.y0
                divTooltip.html((d.group)+"<br>"+element.name+"<br>"+value);
            });
    bar
            .on("mouseout", function(d){
                divTooltip.style("display", "none");
            });
			
	var legendDset = {
                'series': ['Alternate Medical Site (Target)','Non ICU','ICU'],
                'colors': ['#F2BB77','#EB7E25','#AEC7E8']                
                }

	var legend = svg.append("g")
     .attr("class", "legend")

    legend.selectAll('text')
      .data(legendDset["colors"])
      .enter()
      .append("rect")
      .attr("x", width-margin.right - 100)
      .attr("y", function(d, i){ return i * 20;})
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", function(d) {
        return d;
      })

    legend.selectAll('text')
      .data(legendDset["series"])
      .enter()
    .append("text")
    .style("font-family", "Arial")
	.style("font-size", 11)
    .attr("x", width-margin.right - 80)
    .attr("y", function(d, i){ return i *  20 + 9;})
    .text(function(d){return d});
		
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, 
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
}

