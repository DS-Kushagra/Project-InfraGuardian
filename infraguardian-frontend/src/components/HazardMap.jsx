import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";

function Heatmap({ points, show }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !show || points.length === 0) {
      console.log(
        "Skipping heatmap render: map?",
        !!map,
        "show?",
        show,
        "points:",
        points.length
      );
      return;
    }

    // Delay to ensure map layout is stable
    const timeout = setTimeout(() => {
      if (!map.getSize || map.getSize().y === 0) {
        console.log("Map not fully rendered yet");
        return;
      }

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      console.log("Rendering heatmap with", points.length, "points");

      const heat = L.heatLayer(points, {
        radius: 30,
        blur: 15,
        maxZoom: 17,
      });

      heat.addTo(map);
      heatLayerRef.current = heat;
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [points, show, map]);

  return null;
}

export default function HazardMap() {
  const [hazards, setHazards] = useState([]);
  const [minSeverity, setMinSeverity] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const fetchHazards = () => {
      axios
        .get(`http://127.0.0.1:8000/hazards/?min_severity=${minSeverity}`)
        .then((res) => {
          setHazards(res.data);
          setLastUpdated(new Date());
          console.log("Fetched hazards:", res.data.length);
        })
        .catch((err) => console.error("API fetch error", err));
    };

    fetchHazards();
    const interval = setInterval(fetchHazards, 5000);
    return () => clearInterval(interval);
  }, [minSeverity]);

  // Map severity to normalized heat value (0–1)
  const heatPoints = hazards.map((h) => [
    h.latitude,
    h.longitude,
    Math.max(h.severity / 5, 0.3), // prevent very low intensity from being invisible
  ]);

  console.log("Heat points:", heatPoints);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4 shadow-md z-10">
        <h2 className="text-lg font-semibold mb-2">Filters</h2>

        {/* Severity Filter */}
        <label className="block mb-4">
          Severity Filter:
          <select
            value={minSeverity}
            onChange={(e) => setMinSeverity(Number(e.target.value))}
            className="w-full mt-2 p-1 border rounded"
          >
            <option value="5">Sev 5+</option>
            <option value="4">Sev 4+</option>
            <option value="3">Sev 3+</option>
            <option value="2">Sev 2+</option>
            <option value="1">All</option>
          </select>
        </label>

        {/* Toggle Heatmap */}
        <label className="block mb-4">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={() => setShowHeatmap(!showHeatmap)}
            className="mr-2"
          />
          Show Heatmap
        </label>

        <p>Total hazards shown: {hazards.length}</p>

        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        className="flex-1 z-0"
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Heatmap Layer */}
        <Heatmap points={heatPoints} show={showHeatmap} />

        {/* Markers */}
        {hazards.map((h) => (
          <Marker key={h.id} position={[h.latitude, h.longitude]}>
            <Popup>
              <strong>{h.type}</strong>
              <br />
              Severity: {h.severity}
              <br />
              {new Date(h.timestamp).toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
