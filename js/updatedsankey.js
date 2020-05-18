function sankeyDraw(flag) {
	console.log(flag)
	if(flag == 1) {
		d3.select("#svg").remove()
	}
	var data = []
	var labelClass = ""
	var labelSurge = ""
	var labelStatus = ""
	var labelType = ""
	var classControl = 0
	var surgeControl = 0
	var aControl = 0
	var sControl = 0
	var vControl = 0
	var suitable = parseInt(document.getElementById("total-baseline").value);
	var unsuitable = parseInt(document.getElementById("total-unsuitable").value);
	var occupiedicu = parseInt(document.getElementById("occupied-icu").value);
	var occupiednicu = parseInt(document.getElementById("occupied-nicu").value);
	var icusurge = parseInt(document.getElementById("surge-icu").value);
	var nicusurge = parseInt(document.getElementById("surge-nicu").value);
	var altsurge = parseInt(document.getElementById("surge-alt").value);
	var baselineicu = parseInt(document.getElementById("baseline-icu").value);
	var basleinenicu = parseInt(document.getElementById("baseline-nicu").value);
	var surge = icusurge + nicusurge + altsurge
	var available = (suitable + surge) - (occupiedicu + occupiednicu)
	var total = suitable + unsuitable
	var gapc = basleinenicu - occupiednicu

	for (var count = 0; count < total; count++){
		if (classControl < suitable)
			labelClass = "Suitable"
		else 
			labelClass = "Unsuitable"
			
		if (surgeControl < surge && labelClass == "Unsuitable") {
			labelSurge = "Surge"
			surgeControl++
		} else 
			labelSurge = ""
		
		if(sControl <  (occupiedicu + occupiednicu) && labelClass == "Suitable"){
			labelStatus = "Occupied"
			sControl++
		}  else if (sControl >= (occupiedicu + occupiednicu) && aControl < available && labelClass == "Suitable"){
			labelStatus = "Available"
			aControl++
		} else if (vControl < surge && labelClass == "Unsuitable") {
			labelStatus = "Available"
			vControl++
		} else
			labelStatus = ""
		
		data.push(
			{
				Class: labelClass, Surge: labelSurge, Type: "", Status: labelStatus
			}
		)
		classControl++
	}

	var surgeTotal = suitable + surge
	for (var count = suitable; count < surgeTotal; count++){
		if (count < (suitable + icusurge)){
			labelType = "ICU"
		} else if (count >= (suitable + icusurge) && count < (suitable + icusurge + nicusurge)) {
			labelType = "NON-ICU"
		} else if (count >= (suitable + icusurge + nicusurge) && count < (suitable + icusurge + nicusurge + altsurge)) {
			labelType = "Alternate"
		}
		data[count].Type = labelType
	}

	for (var count = 0; count < suitable; count++) {
	if (count < occupiedicu  && data[count].Status == "Occupied") {
			labelType = "ICU"
		} else if (count >= occupiedicu && count <= (occupiedicu + occupiednicu) && data[count].Status == "Occupied"){
			labelType = "NON-ICU"
		} else if (count > (occupiedicu + occupiednicu) && count < (occupiedicu + occupiednicu + gapc) && data[count].Status == "Available"){
			labelType = "NON-ICU"
		} else if (count >= (occupiedicu + occupiednicu + gapc) && count <= suitable && data[count].Status == "Available") {
			labelType = "ICU"
		}
		data[count].Type = labelType
	}

	var chart = d3.parsets()
		.dimensions(["Class", "Surge", "Type", "Status"]);    

	var vis = d3.select("#vis").append("svg")   
		.attr("id", "svg")
		.attr("width", chart.width())
		.attr("height", chart.height());

	var partition = d3.layout.partition()
		.sort(null)
		.size([chart.width(), chart.height() * 5 / 4])
		.children(function(d) { return d.children ? d3.values(d.children) : null; })
		.value(function(d) { return d.count; });

	d3.csv("data/sankey.csv", function(csv) {
	  csv = data;
	  vis.datum(csv).call(chart);
	  window.icicle = function() {
		var tension = chart.tension();
		  var dimensions = [];
		  vis.selectAll("g.dimension")
			 .each(function(d) { dimensions.push(d); });
		  dimensions.sort(function(a, b) { return a.y - b.y; });
		  var root = d3.parsets.tree({children: {}}, csv, dimensions.map(function(d) { return d.name; }), function() { return 1; }),
			  nodes = partition(root),
			  nodesByPath = {};
		  nodes.forEach(function(d) {
			var path = d.data.name,
				p = d;
			while ((p = p.parent) && p.data.name) {
			  path = p.data.name + "\0" + path;
			}
			if (path) nodesByPath[path] = d;
		  });
		  var data = [];
		  vis.on("mousedown.icicle", stopClick, true)
			.select(".ribbon").selectAll("path")
			  .each(function(d) {
				var node = nodesByPath[d.path],
					s = d.source,
					t = d.target;
				s.node.x0 = t.node.x0 = 0;
				s.x0 = t.x0 = node.x;
				s.dx0 = s.dx;
				t.dx0 = t.dx;
				s.dx = t.dx = node.dx;
				data.push(d);
			  });
		  iceTransition(vis.selectAll("path"))
			  .attr("d", function(d) {
				var s = d.source,
					t = d.target;
				return ribbonPath(s, t, tension);
			  })
			  .style("stroke-opacity", 1);
		  iceTransition(vis.selectAll("text.icicle")
			  .data(data)
			.enter().append("text")
			  .attr("class", "icicle")
			  .attr("text-anchor", "middle")
			  .attr("dy", ".3em")
			  .attr("transform", function(d) {
				return "translate(" + [d.source.x0 + d.source.dx / 2, d.source.dimension.y0 + d.target.dimension.y0 >> 1] + ")rotate(90)";
			  })
			  .text(function(d) { return d.source.dx > 15 ? d.node.name : null; })
			  .style("opacity", 1e-6))
			  .style("opacity", 1);
		  iceTransition(vis.selectAll("g.dimension rect, g.category")
			  .style("opacity", 1))
			  .style("opacity", 1e-6)
			  .each("end", function() { d3.select(this).attr("visibility", "hidden"); });
		  iceTransition(vis.selectAll("text.dimension"))
			  .attr("transform", "translate(0,-5)");
		  vis.selectAll("tspan.sort").style("visibility", "hidden");
	  };
	  d3.select("#icicle")
		  .on("change", icicle)
		  .each(icicle);
	});

	function ribbonPath(s, t, tension) {
	  var sx = s.node.x0 + s.x0,
		  tx = t.node.x0 + t.x0,
		  sy = s.dimension.y0,
		  ty = t.dimension.y0;
	  return (tension === 1 ? [
		  "M", [sx, sy],
		  "L", [tx, ty],
		  "h", t.dx,
		  "L", [sx + s.dx, sy],
		  "Z"]
	   : ["M", [sx, sy],
		  "C", [sx, m0 = tension * sy + (1 - tension) * ty], " ",
			   [tx, m1 = tension * ty + (1 - tension) * sy], " ", [tx, ty],
		  "h", t.dx,
		  "C", [tx + t.dx, m1], " ", [sx + s.dx, m0], " ", [sx + s.dx, sy],
		  "Z"]).join("");
	}

	function stopClick() { d3.event.stopPropagation(); }

	// Given a text function and width function, truncates the text if necessary to
	// fit within the given width.
	function truncateText(text, width) {
	  return function(d, i) {
		var t = this.textContent = text(d, i),
			w = width(d, i);
		if (this.getComputedTextLength() < w) return t;
		this.textContent = "…" + t;
		var lo = 0,
			hi = t.length + 1,
			x;
		while (lo < hi) {
		  var mid = lo + hi >> 1;
		  if ((x = this.getSubStringLength(0, mid)) < w) lo = mid + 1;
		  else hi = mid;
		}
		return lo > 1 ? t.substr(0, lo - 2) + "…" : "";
	  };
	}

	d3.select("#file").on("change", function() {
	  var file = this.files[0],
		  reader = new FileReader;
	  reader.onloadend = function() {
		var csv = d3.csv.parse(reader.result);
		vis.datum(csv).call(chart
			.value(csv[0].hasOwnProperty("Number") ? function(d) { return +d.Number; } : 1)
			.dimensions(function(d) { return d3.keys(d[0]).filter(function(d) { return d !== "Number"; }).sort(); }));
	  };
	  reader.readAsText(file);
	});
}

