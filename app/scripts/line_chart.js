var LineChart = function() {};

LineChart.prototype.create = function(el, properties, data) {
    this.svg = d3.select(el).append('svg')
        .attr('class', 'd3')
        .attr('width', properties.width)
        .attr('height', properties.height);

    this.properties = properties;
    this.width = properties.width;
    this.height = properties.height;
    this.margin = {top: 20, right: 20, bottom: 40, left: 40};
    this.data = data.html;

    this._setup();
    this.update();

    return this;
}

LineChart.prototype._setAccessors = function() {
    this.x = function(d) { return d[this.properties.x]; }
    this.y = function(d) { return d[this.properties.y]; }
    this.category = function(d) { return d[this.properties.category]; }
    this.tooltip = function(d) { return d[this.properties.tooltip]; }
}

LineChart.prototype._scales = function() {
    // Scales
    var xScale = d3.time.scale().range([0, this.w()]);
    var yScale = d3.scale.linear().range([this.h(), 0]);
    var radiusScale = d3.scale.sqrt().range([0, 40])
    var colorScale = d3.scale.category10();

    this.xScale = xScale;
    this.yScale = yScale;
    this.colorScale = colorScale;
}

LineChart.prototype._setup  = function () {
    this._setAccessors();
    this._scales();
    this._setLabels();

    // Labels
    this.xAxis = d3.svg.axis().orient("bottom").scale(this.xScale).ticks(12, d3.format(",d"));
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

    // Tooltips
    var tooltip = function (d) {
        return '<strong>' + this.tooltip(d) + '</strong><br>' +
            this.categoryLabel + ": " + this.category(d) + "<br>" +
            this.xLabel + ": " + this.x(d) + "<br>" +
            this.yLabel + ": " + this.y(d) + "<br>"
    }

    var direction = function (d) {
        var upper = this.y(d) > (0.75 * this.yScale.domain()[1])
        var left = this.x(d) < (0.25 * this.xScale.domain()[1])
        var right = this.x(d) > (0.75 * this.xScale.domain()[1])

        // if(upper && left) {
        //     return 'se';
        // } else if (upper && right) {
        //     return 'sw';
        // } else if (upper) {
        //     return 's';
        // } else if (right) {
        //     return 'w';
        // } else if (left) {
        //     return 'e';
        // } else {
            return 'n';
        // }
    }

    // Tooltips
    this.tip = d3.tip().attr('class', 'tooltip').html(tooltip.bind(this));

    this.tip.direction(direction.bind(this));

    var svg = this.svg
        .call(this.tip)
        .append("g")
            .attr("transform", this.transformG());

    // Add the x-axis.
    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", this.transformX())
            .call(this.xAxis);

    // Add the y-axis.
    svg.append("g")
            .attr("class", "y axis")
            .call(this.yAxis);

    // Add an x-axis label.
    svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", this.w())
            .attr("y", this.h() - 6)
            .text(this.xLabel);

    // Add a y-axis label.
    svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text(this.yLabel);

    this.line = svg.append("g")
        .attr("class", "lines");
}

LineChart.prototype.update = function(properties, data) {
    this.properties = properties || this.properties;
    this.data = data || this.data;
    this._setLabels();
    this._setAccessors();
    this._setDomains();
    this._draw();
}

LineChart.prototype._setDomains = function () {
    this.xScale.domain(d3.extent(this.data, this.x.bind(this)));
    this.yScale.domain([0, d3.max(this.data, this.y.bind(this))]);

    this.svg.select('.x.axis').transition().call(this.xAxis);
    this.svg.select('.y.axis').transition().call(this.yAxis);
}

LineChart.prototype._setLabels = function() {
    function capitalise(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    this.xLabel = capitalise(this.properties.x);
    this.yLabel = capitalise(this.properties.y);
    this.categoryLabel = capitalise(this.properties.category);
}

LineChart.prototype.w = function() {
    return this.width - this.margin.left - this.margin.right;
}

LineChart.prototype.h = function() {
    return this.height - this.margin.top - this.margin.bottom;
}

LineChart.prototype.transformG = function(){
    return "translate(" + this.margin.left + "," + this.margin.top + ")";
}

LineChart.prototype.transformX = function(){
    return "translate(0," + this.h() + ")";
}

LineChart.prototype._draw = function() {

    // Defines fill color
    var fill = function(d) { return this.colorScale(this.category(d)); }

    var xVal = function(d) { return this.xScale(this.x(d))};
    var yVal = function(d) { return this.yScale(this.y(d))};
    var line = d3.svg.line()
        .x(xVal.bind(this))
        .y(yVal.bind(this));

    this.line.append("path")
        .datum(this.data)
        .attr("class", "line")
        .attr("d", line)
        // .on('mouseover', this.tip.show)
        // .on('mouseout', this.tip.hide)

    this.line.selectAll(".circle")
         .data(this.data)
         .enter()
         .append("svg:circle")
         .attr("class", "circle")
         .attr("cx", xVal.bind(this))
         .attr("cy", yVal.bind(this))
         .attr("r", 5)
         .on('mouseover', this.tip.show)
         .on('mouseout', this.tip.hide)

    // bubbles.enter().append("circle")
    //     .attr("class", "bubble")
    //     .style("fill", fill.bind(this))
    //     .call(position.bind(this))
    //     .on('mouseover', this.tip.show)
    //     .on('mouseout', this.tip.hide)
    //     .on('click', function (d) {
    //         window.location = d.url;
    //     });

        // .append("title")
        //   .text(this.category) // Titles

    // bubbles.transition()
    //     .call(position.bind(this))

    // bubbles.exit().remove();
}

LineChart.prototype.destroy = function(el) {
    // Any clean-up would go here
    // in this example there is nothing to do
};
