
function createBarChart(options) {
  var obj = new BarChart()
  obj.initialize(options)
  return obj
}

function BarChart() {

  this.options = {
    parentId: "statistic-container"
  }
  this.currentData = undefined
  this.months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  this.shortMonthsLabel = ["Jan.", "Fev.", "Mar.", "Abr.", "Maio", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."]

  this.initialize = function (options) {
    this.setOptions(options)
    this.setLocale()
    this.createAxis()
    this.parent = document.getElementById(this.options.parentId)
    this.svg = this.loadSvg()
    this.g = this.loadGroup()
    this.createTitle()
    
    this.createTooltip()
    this.createLineChart()
    this.createAreaChart()
    var $this = this
    httpGetAsync(this.options.urlData, function (data) {
      $this.currentData = $this.formatInputData(JSON.parse(data))
      window.addEventListener("resize", () => {
        $this.draw()
      })
      $this.loadData()
      $this.draw()
    })
  }

  this.loadSvg = function () {
    return d3.select(`#${this.options.elementId}`)
      //.append('svg')
      .attr('width', this.parent.offsetWidth)
      .attr('height', 200)
    //.attr('height', 600)
  }

  this.loadGroup = function () {
    var g = this.svg.append("g")
      .attr("transform", "translate(" + this.getMargin().left + "," + this.getMargin().top + ")")
    g.append("g")
      .attr("class", "axis axis--x");
    g.append("g")
      .attr("class", "axis axis--y")
    return g
  }

  this.createTitle = function () {
    this.g.append('text').attr("class", "chartTitle").text(this.options.title)
  }

  this.createAxis = function () {
    this.x = d3.scaleBand().padding(0.3)
    this.y = d3.scaleLinear()
  }

  this.setLocale = function () {
    d3.timeFormatDefaultLocale({
      "decimal": ".",
      "thousands": ",",
      "grouping": [3],
      "currency": ["$", ""],
      "dateTime": "%a %b %e %X %Y",
      "date": "%m/%d/%Y",
      "time": "%H:%M:%S",
      "periods": ["AM", "PM"],
      "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      "months": this.months,
      "shortMonths": this.shortMonthsLabel
    })
  }

  this.getMax = function (items) {
    return items.reduce((acc, val) => {
      acc = (acc === undefined || val > acc) ? val : acc
      return acc;
    })
  }

  this.formatInputData = function (jsonData) {
    var attributeX = this.options.attributeX
    var attributeY = this.options.attributeY
    this.maxValue = this.getMax(jsonData.map(elem => +elem[attributeY]))
    return jsonData.map((elem) => {
      var d = {}
      d[attributeX] = new Date(
        elem[attributeX].split('-')[0],
        elem[attributeX].split('-')[1] - 1,
        elem[attributeX].split('-')[2]
      ).getTime()
      d[attributeY] = (+elem[attributeY] / this.maxValue)
      return d
    })
  }

  this.getFormatedValue = function (value) {
    return Number((+value * +this.maxValue).toFixed(1))
  }

  this.setOptions = function (options) {
    for (var key in options) {
      this.options[key] = options[key]
    }
  }

  this.loadData = function () {
    var $this = this
    this.x.domain(this.currentData.map(function (d) { return d[$this.options.attributeX]; }));
    this.y.domain([0, d3.max(this.currentData, function (d) { return d[$this.options.attributeY]; })])
  }

  this.getMargin = function () {
    return { top: 10, right: 0, bottom: 20, left: 20 }
  }

  this.createTooltip = function () {
    var $this = this
    this.tooltip = d3.select("body").append("div").attr("class", "toolTip")
    this.tootipMouseover = function (d) { }
    this.tooltipMousemove = function (d) {
      $this.tooltip
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 110 + "px")
        .style("display", "inline-block")
        .html(`
        <b>${new Date(d[$this.options.attributeX]).getDate()} de ${$this.months[new Date(d[$this.options.attributeX]).getMonth()]}</b>
        <br>
        ${$this.getFormatedValue(d[$this.options.attributeY])} casos`)
    }
    this.tooltipMouseleave = function (d) { $this.tooltip.style("display", "none") }
  }

  this.createLineChart = function () {
    var $this = this
    this.line = d3.line()
      .x(function (d) { return $this.x(d[$this.options.attributeX]) + $this.x.bandwidth() / 2 })
      .y(function (d) { return $this.y(d[$this.options.attributeY]) })
      .curve(d3.curveMonotoneX)
  }

  this.createAreaChart = function () {
    var $this = this
    this.area = d3.area()
      .x(function (d) { return $this.x(d[$this.options.attributeX]) + $this.x.bandwidth() / 2; })
      .y1(function (d) { return $this.y(d[$this.options.attributeY]); })
      .curve(d3.curveMonotoneX)
  }


  this.drawArea = function (height) {
    this.area.y0(height)
    if (this.g.select(".area").size() < 1) {
      this.g.append("path")
        .data([this.currentData])
        .attr("class", "area")
        .attr("d", this.area)
    } else {
      this.g.select(".area")
        .data([this.currentData])
        .attr("d", this.area)
    }
  }

  this.drawAxisX = function (width, height) {
    this.x.rangeRound([0, width]);
    this.g.select(".axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(this.x).tickFormat(d3.timeFormat('%b')))
    var xTicks = this.g.select(".axis--x").selectAll(".tick text").nodes()
    var xTickNames = xTicks.map((n) => n.textContent)
    xTicks.forEach((n, idx) => {
      if (xTickNames.indexOf(n.textContent) !== idx) n.textContent = ''
    })
    this.g.select(".axis--x").selectAll(".tick").nodes().forEach((n) => {
      if (!n.children[1].textContent) n.remove()
    })
  }

  this.drawAxisY = function (height) {
    this.y.rangeRound([height, 0]);
    this.g.select(".axis--y")
      .call(d3.axisLeft(this.y).ticks(0).tickSize(0))
    this.g.select(".axis--y").select('.domain').remove()
    /* var xTicks = this.g.select(".axis--y").selectAll(".tick text").nodes()
    xTicks.forEach((n, idx) => {
      if (!n.textContent) return
      n.textContent = this.getFormatedValue(+n.textContent)
    }) */
  }

  this.drawLine = function () {
    this.g.select(".line-chart").remove()
    this.g.append("path")
      .attr("class", "line-chart")
      .attr("d", this.line(this.currentData))
  }

  this.drawBars = function (height) {
    var bars = this.g.selectAll(".bar").data(this.currentData)
    var $this = this
    bars
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return $this.x(d[$this.options.attributeX]); })
      .attr("y", function (d) { return $this.y(d[$this.options.attributeY]); })
      .attr("width", this.x.bandwidth())
      .attr("height", function (d) { return height - $this.y(d[$this.options.attributeY]); })

    this.g.selectAll(".bar")
      .on("mouseover", $this.tootipMouseover)
      .on("mousemove", $this.tooltipMousemove)
      .on("mouseleave", $this.tooltipMouseleave)

    bars.attr("x", function (d) { return $this.x(d[$this.options.attributeX]); })
      .attr("y", function (d) { return $this.y(d[$this.options.attributeY]); })
      .attr("width", this.x.bandwidth())
      .attr("height", function (d) { return height - $this.y(d[$this.options.attributeY]); })

    bars.exit().remove()
  }

  this.getCurrentHeigth = function () {
    var bounds = this.svg.node().getBoundingClientRect()
    return bounds.height - this.getMargin().top - this.getMargin().bottom
  }

  this.getCurrentWidth = function () {
    var bounds = this.svg.node().getBoundingClientRect()
    return width = bounds.width - this.getMargin().left - this.getMargin().right
  }

  this.draw = function (newData) {
    if (newData) {
      this.currentData = newData
      this.loadData()
    }
    this.svg.attr('width', this.parent.offsetWidth)
    var width = this.getCurrentWidth()
    var height = this.getCurrentHeigth()
    this.drawAxisX(width, height)
    this.drawAxisY(height)
    this.drawArea(height)
    this.drawBars(height)
    this.drawLine()
  }

}