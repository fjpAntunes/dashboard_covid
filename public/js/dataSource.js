class DataSource {
  constructor(newOptions) {
    this.options = {
      dataLocationId: null,
    };
    this.heatData = null;
    this.setOptions(newOptions);
  }

  setDataTimeInterval(timeInterval) {
    this.options.dataTimeInterval = [
      new Date(timeInterval[0]).getTime(),
      new Date(timeInterval[1]).getTime(),
    ];
  }

  getDataTimeInterval() {
    return [
      new Date(this.options.dataTimeInterval[0]).getTime(),
      new Date(this.options.dataTimeInterval[1]).getTime(),
    ];
  }

  loadAllData(cb) {
    this.getStateThemeData("circles", (data) => {
      this.setStateCircleData(data);
    });
    this.getStateThemeData("choropleth", (data) => {
      this.setStateChoroplethData(data);
    });
    this.getCitiesThemeData("circles", (data) => {
      this.setCityCircleData(data);
    });
    this.getCitiesThemeData("choropleth", (data) => {
      this.setCityChoroplethData(data);
    });
    this.getCitiesThemeData("heat", (data) => {
      this.setHeatData(data);

      this.getCountryDataset((data) => {
        this.setCountryData(data);
        this.setDataTimeInterval([
          new Date("2020/02/24").getTime(),
          this.getMax(
            data.map((el) => new Date(el.date.replace(/\-/g, "/")).getTime())
          ),
        ]);
        cb();
      });
    });
  }

  getMax(items) {
    return items.reduce((acc, val) => {
      acc = acc === undefined || val > acc ? val : acc;
      return acc;
    });
  }

  setOptions(options) {
    for (var key in options) {
      this.options[key] = options[key];
    }
  }

  setCountryData(data) {
    this.countryData = data;
  }

  getCountryData() {
    var timeInterval = this.getDataTimeInterval();
    var startDate = new Date(+timeInterval[0]);
    var endDate = new Date(+timeInterval[1]);
    return this.countryData.slice().filter((data) => {
      var elementDate = new Date(data.date.replace(/\-/g, "/"));
      return elementDate >= startDate && elementDate <= endDate;
    });
  }

  setHeatData(data) {
    this.heatData = data;
  }

  getHeatData(data) {
    var timeInterval = this.getDataTimeInterval();
    var startDate = new Date(+timeInterval[0]);
    var endDate = new Date(+timeInterval[1]);
    return this.heatData.slice().filter((data) => {
      var elementDate = new Date(data.date.replace(/\-/g, "/"));
      return elementDate >= startDate && elementDate <= endDate;
    });
  }

  setStateCircleData(data) {
    this.stateCircleData = data;
  }

  getStateCircleData() {
    var timeInterval = this.getDataTimeInterval();
    var startDate = new Date(+timeInterval[0]);
    var endDate = new Date(+timeInterval[1]);
    var geojson = JSON.parse(JSON.stringify(this.stateCircleData));
    geojson.features = geojson.features.filter((data) => {
      var elementDate = new Date(data.properties.date.replace(/\-/g, "/"));
      return elementDate >= startDate && elementDate <= endDate;
    });
    return geojson;
  }

  setCityCircleData(data) {
    this.cityCircleData = data;
  }

  getCityCircleData() {
    var timeInterval = this.getDataTimeInterval();
    var startDate = new Date(+timeInterval[0]);
    var endDate = new Date(+timeInterval[1]);
    var geojson = JSON.parse(JSON.stringify(this.cityCircleData));
    geojson.features = geojson.features.filter((data) => {
      var elementDate = new Date(data.properties.date.replace(/\-/g, "/"));
      return elementDate >= startDate && elementDate <= endDate;
    });
    return geojson;
  }

  setStateChoroplethData(data) {
    this.stateChoroplethData = data;
  }

  getStateChoroplethData() {
    var timeInterval = this.getDataTimeInterval();
    var startDate = new Date(+timeInterval[0]);
    var endDate = new Date(+timeInterval[1]);
    return this.stateChoroplethData.slice().filter((data) => {
      var elementDate = new Date(data.date.replace(/\-/g, "/"));
      return elementDate >= startDate && elementDate <= endDate;
    });
  }

  setCityChoroplethData(data) {
    this.cityChoroplethData = data;
  }

  getCityChoroplethData() {
    var timeInterval = this.getDataTimeInterval();
    var startDate = new Date(+timeInterval[0]);
    var endDate = new Date(+timeInterval[1]);
    return this.cityChoroplethData.slice().filter((data) => {
      var elementDate = new Date(data.date.replace(/\-/g, "/"));
      return elementDate >= startDate && elementDate <= endDate;
    });
  }

  setCurrentLayer(layer) {
    if (!layer) {
      this.setLayerProperties(null);
      return;
    }
    this.setLayerProperties(layer.properties);
  }

  setLayerProperties(properties) {
    this.options.layerProperties = properties;
  }

  getLayerProperties() {
    return this.options.layerProperties;
  }

  getLocationName() {
    var layerProperties = this.getLayerProperties();
    if (!layerProperties) {
      return "Brasil";
    } else if (layerProperties["CD_GEOCMU"]) {
      return layerProperties.NM_MUNICIP;
    }
    return layerProperties.NM_ESTADO;
  }

  getFeatureId() {
    var layerProperties = this.getLayerProperties();
    return layerProperties["CD_GEOCMU"]
      ? layerProperties["CD_GEOCMU"]
      : layerProperties["CD_GEOCUF"];
  }

  getStatisticsData() {
    var jsonData = [];
    var layerProperties = this.getLayerProperties();
    if (!layerProperties) {
      return this.getCountryData();
    } else if (layerProperties.CD_GEOCMU) {
      jsonData = this.getCityChoroplethData();
    } else {
      jsonData = this.getStateChoroplethData();
    }
    var featureId = (featureId = this.getFeatureId());
    return jsonData.filter((data) => {
      var id = data.CD_GEOCMU ? data.CD_GEOCMU : data.CD_GEOCUF;
      return featureId === id;
    });
  }

  getStateThemeData(themeType, cb) {
    var url;
    var options = {};
    if (themeType == "heat") {
      url = `${window.location.origin}/api/maptheme/heat?location=city`;
    } else if (themeType == "choropleth") {
      url = `${window.location.origin}/api/maptheme/choropleth?location=state`;
    } else if (themeType == "circles") {
      url = `${window.location.origin}/api/maptheme/circle?location=state`;
    }
    if (!url) return;
    httpGetAsync(url, function (data) {
      cb(JSON.parse(data));
    });
  }

  getCountryDataset(cb) {
    httpGetAsync(`${window.location.origin}/api/information/country`, function (
      data
    ) {
      cb(JSON.parse(data));
    });
  }

  getCitiesThemeData(themeType, cb) {
    var url;
    var options = {};
    if (themeType == "heat") {
      url = `${window.location.origin}/api/maptheme/heat?location=city`;
    } else if (themeType == "choropleth") {
      url = `${window.location.origin}/api/maptheme/choropleth?location=city`;
    } else if (themeType == "circles") {
      url = `${window.location.origin}/api/maptheme/circle?location=city`;
    }
    if (!url) return;
    httpGetAsync(url, function (data) {
      cb(JSON.parse(data));
    });
  }

  getThemeData(layerId, themeType, cb) {
    if (layerId === 0) {
      this.getStateThemeData(themeType, cb);
    } else if (layerId == 1) {
      this.getCitiesThemeData(themeType, cb);
    }
  }

  getMapLayer(layerId) {
    var layers = this.getAllLayers();
    for (var i = layers.length; i--; ) {
      if (layers[i].id !== layerId) continue;
      return layers[i];
    }
  }

  getThemeLayers(layerId) {
    var layers = this.getAllLayers();
    for (var i = layers.length; i--; ) {
      if (layers[i].id == layerId) {
        return layers[i].themeLayers;
      }
    }
  }

  getThemeLayer(layerId) {
    var layers = this.getAllLayers();
    for (var i = layers.length; i--; ) {
      if (layers[i].id !== layerId) continue;
      return layers[i].themeLayers;
    }
  }

  getMapLayerNames() {
    return this.getAllLayers().map((data) => {
      return {
        name: data.name,
        id: data.id,
      };
    });
  }

  getAllLayers() {
    return [
      {
        name: "Estados",
        id: 0,
        mapLayers: [
          {
            url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
            style: {
              weight: 1,
              opacity: 0.7,
              color: "white",
              fill: true,
              fillOpacity: 0.7,
              fillColor: "#cfcfcf",
            },
            idField: "CD_GEOCUF",
            main: true,
          },
        ],
        themeLayers: [
          {
            name: "Mapa de calor de casos",
            attributeName: "totalCases",
            type: "heat",
            id: 0,
          },
          {
            name: "Mapa de calor de óbitos",
            attributeName: "deaths",
            type: "heat",
            id: 1,
          },
          {
            name: "Taxa de crescimento de casos",
            attributeName: "nrDiasDobraCasos",
            attributeNameSecondary: "totalCases",
            type: "choropleth",
            id: 2,
          },
          {
            name: "Taxa de crescimento de óbitos",
            attributeName: "nrDiasDobraMortes",
            attributeNameSecondary: "deaths",
            type: "choropleth",
            id: 3,
          },
          {
            name: "Número de casos",
            attributeName: "newCases",
            type: "circles",
            id: 4,
            attributeLabel: "NM_ESTADO",
            scaleFactor: 0.003,
            scaleLenged: [10000, 50000, 100000],
          },
          {
            name: "Número de óbitos",
            attributeName: "newDeaths",
            attributeLabel: "NM_ESTADO",
            type: "circles",
            id: 5,
            attributeLabel: "state",
            scaleFactor: 0.03,
            scaleLenged: [500, 5000, 10000],
          },
        ],
      },
      {
        name: "Municípios",
        id: 1,
        mapLayers: [
          {
            url: `${window.location.origin}/api/layer/tile/state/{z}/{x}/{y}.pbf`,
            style: {
              weight: 1,
              opacity: 0.7,
              color: "black",
            },
            idField: "CD_GEOCUF",
          },
          {
            url: `${window.location.origin}/api/layer/tile/city/{z}/{x}/{y}.pbf`,
            style: {
              weight: 1,
              opacity: 0.7,
              color: "white",
              fill: true,
              fillOpacity: 0.7,
              fillColor: "#cfcfcf",
            },
            idField: "CD_GEOCMU",
            main: true,
          },
        ],
        themeLayers: [
          {
            name: "Mapa de calor de casos",
            attributeName: "totalCases",
            type: "heat",
            id: 0,
          },
          {
            name: "Mapa de calor de óbitos",
            attributeName: "deaths",

            type: "heat",
            id: 1,
          },
          {
            name: "Taxa de crescimento de casos",
            attributeName: "nrDiasDobraCasos",
            attributeNameSecondary: "totalCases",
            type: "choropleth",
            id: 2,
          },
          {
            name: "Taxa de crescimento de óbitos",
            attributeName: "nrDiasDobraMortes",
            attributeNameSecondary: "deaths",
            type: "choropleth",
            id: 3,
          },
          {
            name: "Número de casos",
            attributeName: "newCases",
            type: "circles",
            id: 4,
            attributeLabel: "city",
            scaleFactor: 0.02,
            scaleLenged: [10000, 50000, 100000],
          },
          {
            name: "Número de óbitos",
            attributeName: "newDeaths",
            type: "circles",
            attributeLabel: "city",
            id: 5,
            scaleFactor: 0.2,
            scaleLenged: [500, 5000, 10000],
          },
        ],
      },
    ];
  }
}
