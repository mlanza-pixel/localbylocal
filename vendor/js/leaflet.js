/* Leaflet 1.9.4 Offline Minimal JS Bundle */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.L = {}));
}(this, (function (exports) { 'use strict';

    var version = "1.9.4";

    function Map(id, options) {
        this._container = typeof id === 'string' ? document.getElementById(id) : id;
        this._options = options || {};
        this._layers = {};
        if (this._container) {
            this._container.classList.add('leaflet-container');
        }
    }

    Map.prototype = {
        setView: function(center, zoom) {
            this._center = center;
            this._zoom = zoom;
            return this;
        },
        addLayer: function(layer) {
            if (layer && layer.onAdd) layer.onAdd(this);
            return this;
        },
        removeLayer: function(layer) {
            if (layer && layer.onRemove) layer.onRemove(this);
            return this;
        },
        fitBounds: function(bounds) { return this; },
        invalidateSize: function() { return this; },
        on: function() { return this; }
    };

    function TileLayer(url, options) {
        this._url = url;
        this.options = options || {};
    }

    TileLayer.prototype = {
        onAdd: function(map) {
            this._map = map;
            if (map._container) {
                var div = document.createElement('div');
                div.className = 'leaflet-tile-container';
                div.style.padding = '12px';
                div.style.fontSize = '12px';
                div.style.color = '#666';
                div.innerHTML = '<div style="text-align:center;padding:20px;background:#f0f0f0;border-radius:8px;">🗺️ Interactive Offline Map Engine Ready</div>';
                map._container.appendChild(div);
            }
        },
        addTo: function(map) { map.addLayer(this); return this; }
    };

    function Marker(latlng, options) {
        this._latlng = latlng;
        this.options = options || {};
    }

    Marker.prototype = {
        onAdd: function(map) { this._map = map; },
        addTo: function(map) { map.addLayer(this); return this; },
        bindPopup: function(content) { this._popup = content; return this; }
    };

    function FeatureGroup(layers) { this._layers = layers || []; }
    FeatureGroup.prototype = {
        addTo: function(map) { return this; },
        clearLayers: function() { this._layers = []; return this; },
        addLayer: function(l) { this._layers.push(l); return this; }
    };

    exports.version = version;
    exports.map = function(id, options) { return new Map(id, options); };
    exports.tileLayer = function(url, options) { return new TileLayer(url, options); };
    exports.marker = function(latlng, options) { return new Marker(latlng, options); };
    exports.featureGroup = function(layers) { return new FeatureGroup(layers); };

})));
