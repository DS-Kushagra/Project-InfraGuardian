import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";

// 🔹 Dynamic Marker Color based on Status
const getMarkerIcon = (status) => {
  const colors = {
    reported: "red",
    in_progress: "orange",
    resolved: "green",
  };

  const color = colors[status] || "gray";

  return L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>`,
  });
};

function Heatmap({ points, show }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !show || points.length === 0) return;

    const timeout = setTimeout(() => {
      if (!map.getSize || map.getSize().y === 0) return;

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

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

  // ✅ New status filters
  const [statusFilters, setStatusFilters] = useState({
    reported: true,
    in_progress: true,
    resolved: true,
  });

  // 🔄 Fetch Hazards
  const fetchHazards = () => {
    axios
      .get(
        `http://127.0.0.1:8000/hazards/?min_severity=${minSeverity}&max_severity=5`
      )
      .then((res) => {
        setHazards(res.data);
        setLastUpdated(new Date());
      })
      .catch((err) => console.error("API fetch error", err));
  };

  useEffect(() => {
    fetchHazards();
    const interval = setInterval(fetchHazards, 5000);
    return () => clearInterval(interval);
  }, [minSeverity]);

  // 🔁 Update status
  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/hazards/${id}?status=${newStatus}`
      );
      fetchHazards();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  // ✅ Apply status filter
  const visibleHazards = hazards.filter((h) => statusFilters[h.status]);

  // ✅ Heatmap points
  const heatPoints = visibleHazards.map((h) => [
    h.latitude,
    h.longitude,
    Math.max(h.severity / 5, 0.3),
  ]);

  // ✅ Summary stats
  const statusCounts = {
    reported: 0,
    in_progress: 0,
    resolved: 0,
  };

  let severitySum = 0;

  visibleHazards.forEach((h) => {
    statusCounts[h.status] += 1;
    severitySum += h.severity;
  });

  const avgSeverity = visibleHazards.length
    ? (severitySum / visibleHazards.length).toFixed(1)
    : "-";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4 shadow-md z-10">
        <h2 className="text-lg font-semibold mb-2">Filters</h2>

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

        {/* ✅ Status Checkboxes */}
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Status Filter</h3>
          {["reported", "in_progress", "resolved"].map((status) => (
            <label key={status} className="block text-sm">
              <input
                type="checkbox"
                checked={statusFilters[status]}
                onChange={() =>
                  setStatusFilters((prev) => ({
                    ...prev,
                    [status]: !prev[status],
                  }))
                }
                className="mr-2"
              />
              {status
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </label>
          ))}
        </div>

        {/* ✅ Stats block */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Hazard Summary</h3>
          <ul className="text-sm space-y-1">
            <li>Total Hazards: {visibleHazards.length}</li>
            <li>Reported: {statusCounts.reported}</li>
            <li>In Progress: {statusCounts.in_progress}</li>
            <li>Resolved: {statusCounts.resolved}</li>
            <li>Avg Severity: {avgSeverity}</li>
          </ul>
        </div>

        <label className="block mb-4 mt-4">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={() => setShowHeatmap(!showHeatmap)}
            className="mr-2"
          />
          Show Heatmap
        </label>

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

        <Heatmap points={heatPoints} show={showHeatmap} />

        {/* ✅ Filtered Hazard Markers */}
        {visibleHazards.map((h) => (
          <Marker
            key={h.id}
            position={[h.latitude, h.longitude]}
            icon={getMarkerIcon(h.status)}
          >
            <Popup>
              <strong>{h.type}</strong>
              <br />
              Severity: {h.severity}
              <br />
              Status: {h.status.replace("_", " ")}
              <br />
              {new Date(h.timestamp).toLocaleString()}
              <br />
              <label className="block mt-2">
                Update Status:
                <select
                  value={h.status}
                  onChange={(e) => updateStatus(h.id, e.target.value)}
                  className="w-full mt-1 border p-1 rounded"
                >
                  <option value="reported">Reported</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </label>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
