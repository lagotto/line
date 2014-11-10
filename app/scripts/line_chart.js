var LineChart = function() {
    _.bindAll(this);
};

LineChart.prototype.create = function(el, properties, data) {
    this.svg = d3.select(el).append('svg')
        .attr('class', 'd3')
        .attr('width', properties.width)
        .attr('height', properties.height);

    this.properties = properties;
    this.width = properties.width;
    this.height = properties.height;
    this.margin = {top: 20, right: 20, bottom: 40, left: 40};

    this.data = data;

    this._setup();
    this._draw();

    return this;
}

LineChart.prototype._setSeries = function() {
    this.series = _.map(this.properties['lines'], function (l) {
        return this.data[l];
    }, this);
}

LineChart.prototype._setAccessors = function() {
    this.x = function(d) { return d[this.properties.x]; }
    this.y = function(d) { return d[this.properties.y]; }
    this.category = function(d) { return d[this.properties.category]; }
    this.tooltip = function(d) { return d[this.properties.tooltip]; }
}

LineChart.prototype._scales = function() {
    // Scales
    this.xScale = d3.time.scale().range([0, this.w()]);
    this.yScale = d3.scale.linear().range([this.h(), 0]);
    this.radiusScale = d3.scale.sqrt().range([0, 40])
    this.colorScale = d3.scale.category10();
}

LineChart.prototype._setup  = function () {
    this._setSeries();
    this._setAccessors();
    this._setLabels();
    this._scales();

    // Labels
    this.xAxis = d3.svg.axis().orient("bottom").scale(this.xScale).ticks(12, d3.format(",d"));
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

    this._setDomains();

    // Tooltips
    var tooltip = function (d) {
        return '<strong>' + this.tooltip(this.data) + '</strong><br>' +
            this.categoryLabel + ": " + this.category(this.data) + "<br>" +
            this.xLabel + ": " + this.x(d) + "<br>" +
            this.yLabel + ": " + this.y(d) + "<br>"
    }

    var direction = function (d) {
        var upper = this.y(d) > (0.75 * this.yScale.domain()[1])
        if(this.x(d) instanceof Date) {
            var left = (this.x(d).getTime() - this.xScale.domain()[0].getTime()) < (0.25 * (this.xScale.domain()[1].getTime()-this.xScale.domain()[0].getTime()))
            var right = (this.x(d).getTime() - this.xScale.domain()[0].getTime()) > (0.75 * (this.xScale.domain()[1].getTime()-this.xScale.domain()[0].getTime()))
        } else {
            var left = this.x(d) < (0.25 * this.xScale.domain()[1])
            var right = this.x(d) > (0.75 * this.xScale.domain()[1])
        }

        if(upper && left) {
            return 'se';
        } else if (upper && right) {
            return 'sw';
        } else if (upper) {
            return 's';
        } else if (right) {
            return 'w';
        } else if (left) {
            return 'e';
        } else {
            return 'n';
        }
    }

    // Tooltips
    this.tip = d3.tip().attr('class', 'tooltip').html(tooltip.bind(this));

    this.tip.direction(direction.bind(this));

    this.svg = this.svg
        .call(this.tip)
        .append("g")
            .attr("transform", this.transformG());

    // Add the x-axis.
    this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", this.transformX())
            .call(this.xAxis);

    // Add the y-axis.
    this.svg.append("g")
            .attr("class", "y axis")
            .call(this.yAxis);

    // Add an x-axis label.
    this.svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", this.w())
            .attr("y", this.h() - 6)
            .text(this.xLabel);

    // Add a y-axis label.
    this.svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text(this.yLabel);

    this.lines = this.svg.append("g")
        .attr("class", "lines");

    this.circles = this.svg.append("g")
        .attr("class", "circles");
}

LineChart.prototype.update = function(properties, data) {
    this.properties = properties || this.properties;
    this.data = data || this.data;
    this._setSeries();
    this._setLabels();
    this._setAccessors();
    this._setDomains();
    this._draw();
}

LineChart.prototype._setDomains = function () {
    this.xScale.domain(d3.extent(this.series[0], this.x.bind(this)));
    this.yScale.domain([
        0,
        d3.max(this.series, function(d) {
            return d3.max(d, this.y.bind(this))
        }.bind(this))
    ]);

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
    // Defines series class, e.g. line1
    var lineSeriesClass = function (d) {
        return 'line series' + this.series.indexOf(d);
    }.bind(this);
    var circleGroupSeriesClass = function (d) {
        return 'circleGroup series' + this.series.indexOf(d);
    }.bind(this);


    var xVal = function (d) { return this.xScale(this.x(d)) }.bind(this);
    var yVal = function (d) { return this.yScale(this.y(d)) }.bind(this);
    var tip = this.tip;
    var line = d3.svg.line()
        .x(xVal)
        .y(yVal);

    var lines = this.lines.selectAll('.line')
        .data(this.series)

    lines.enter()
        .append('path')
        .attr('class', lineSeriesClass)
        .attr('d', line)

    lines.transition()
        .attr('d', line)

    var circleGroup = function(data) {
        var group = d3.select(this)
            .selectAll('.circle')
            .data(data)

        group.enter()
            .append('circle')
                .attr('class', 'circle')
                .attr('cx', xVal)
                .attr('cy', yVal)
                .attr('r', 5)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

        group.transition()
            .attr("cx", xVal)
            .attr("cy", yVal)

    };

    var circles = this.circles.selectAll('.circleGroup')
        .data(this.series)

    circles
        .enter()
        .append('g')
        .attr('class', 'circleGroup')
        .attr('class', circleGroupSeriesClass)
        .each(circleGroup)

    circles.transition().each(circleGroup);
}

LineChart.prototype.destroy = function(el) {
    // Any clean-up would go here
    // in this example there is nothing to do
};
