import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

import LocationSelector from "../components/LocationSelector";
import CropSelector from "../components/CropSelector";
import LoadingAnimation from "../components/LoadingAnimation";
import RegionImagery from "../components/RegionImagery";
import { analyzeSowing } from "../services/api";
import { getMapLocation } from "../utils/mapLocations";

const STORAGE_KEY = "agrisentinal_analysis";

function RegionDrawingMap({ onRegionSelect }) {
  const map = useMap();
  const drawnItemsRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();

    drawnItemsRef.current = drawnItems;

    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topright",

      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,

          shapeOptions: {
            color: "#34d399",
            weight: 3,
            fillColor: "#34d399",
            fillOpacity: 0.18,
          },
        },

        rectangle: {
          shapeOptions: {
            color: "#34d399",
            weight: 3,
            fillColor: "#34d399",
            fillOpacity: 0.18,
          },
        },

        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },

      edit: {
        featureGroup: drawnItems,
      },
    });

    map.addControl(drawControl);

    const handleCreated = (event) => {
      const layer = event.layer;

      // Sirf ek region allow karna
      drawnItems.clearLayers();

      drawnItems.addLayer(layer);

      const latLngs = layer.getLatLngs();

      if (!latLngs?.[0]) {
        return;
      }

      const polygonPoints = latLngs[0].map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
      }));

      console.log("Selected Region:", polygonPoints);

      // Auto-zoom map to the drawn polygon
      const bounds = L.latLngBounds(latLngs[0]);
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });

      onRegionSelect(polygonPoints);
    };

    const handleEdited = (event) => {
      let updatedPolygon = null;

      event.layers.eachLayer((layer) => {
        const latLngs = layer.getLatLngs();

        if (latLngs?.[0]) {
          updatedPolygon = latLngs[0].map((point) => ({
            lat: Number(point.lat),
            lng: Number(point.lng),
          }));
          
          // Auto-zoom map to the edited polygon
          const bounds = L.latLngBounds(latLngs[0]);
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
        }
      });

      if (updatedPolygon) {
        console.log("Updated Region:", updatedPolygon);

        onRegionSelect(updatedPolygon);
      }
    };

    const handleDeleted = () => {
      onRegionSelect([]);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);

      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onRegionSelect]);

  return null;
}

function MapLocationUpdater({ state, district }) {
  const map = useMap();

  useEffect(() => {
    const location = getMapLocation(state, district);

    if (location) {
      map.setView(location.center, location.zoom);
    }
  }, [district, map, state]);

  return null;
}

function SowingAnalysis() {
  const navigate = useNavigate();

  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const [selectedCrop, setSelectedCrop] = useState("");

  const [selectedRegion, setSelectedRegion] =
    useState([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setError("");

    if (!state || !district) {
      setError(
        "Please select your state and district."
      );
      return;
    }

    if (!selectedRegion || selectedRegion.length < 3) {
      setError(
        "Please draw a polygon around the region you want to analyse."
      );
      return;
    }

    if (!selectedCrop) {
      setError("Please select a crop.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await analyzeSowing({
        crop: selectedCrop,

        location: `${district}, ${state}`,

        region: selectedRegion,
      });

      console.log(
        "Sowing Analysis Response:",
        response
      );

      if (
        !response?.success ||
        !response?.data
      ) {
        throw new Error(
          "Backend returned an invalid analysis response."
        );
      }

      const backendData = response.data;

      const probability = Number(
        backendData.probability ?? 0
      );

      let risk = "Moderate";

      if (probability >= 80) {
        risk = "Low";
      } else if (probability < 60) {
        risk = "High";
      }

      const savedAnalysis = {
        ...backendData,

        probability,

        risk,

        crop:
          backendData.crop ||
          selectedCrop,

        location:
          backendData.location ||
          `${district}, ${state}`,

        state,

        district,

        soilType:
          backendData.soil?.soilType ||
          backendData.soilType ||
          "Unavailable",

        region: selectedRegion,

        onset:
          backendData.monsoon?.monsoonStart ||
          "June",

        window:
          probability >= 75
            ? "Recommended now"
            : probability >= 50
            ? "Monitor conditions"
            : "Wait for better conditions",

        soilMoisture:
          backendData.weather?.soilMoisture ?? null,

        recommendation:
          backendData.recommendation
            ?.recommendation ||
          "Monitor weather and soil conditions before sowing.",

        savedAt:
          new Date().toISOString(),
      };

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedAnalysis)
      );

      setResult(savedAnalysis);
    } catch (error) {
      console.error(
        "Sowing Analysis Error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to complete sowing analysis. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04100c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            AgriSentinal
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Sowing Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Analyse your farming region using
            weather, soil and monsoon conditions
            before sowing your crop.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

          {/* LEFT SIDE */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Step 01
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Select Location
              </h2>
            </div>

            <LocationSelector
              state={state}
              setState={setState}
              district={district}
              setDistrict={setDistrict}
            />

            {/* MAP */}
            <div className="mt-8">

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Step 02
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  Select Farming Region
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Draw a polygon around the exact
                  agricultural region you want
                  AgriSentinal to analyse.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10">

                <MapContainer
                  center={[26.9124, 75.7873]}
                  zoom={6}
                  scrollWheelZoom={true}
                  style={{
                    height: "420px",
                    width: "100%",
                  }}
                >

                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapLocationUpdater
                    state={state}
                    district={district}
                  />

                  <RegionDrawingMap
                    onRegionSelect={
                      setSelectedRegion
                    }
                  />

                </MapContainer>

              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                Soil type, modelled topsoil moisture and rainfall outlook
                are estimated automatically for the selected region.
              </p>

              <div className="mt-3 flex items-center justify-between">

                <p className="text-xs text-gray-500">
                  {selectedRegion.length > 0
                    ? `Region selected: ${selectedRegion.length} points`
                    : "Use the polygon tool on the map to select an area."}
                </p>

                {selectedRegion.length > 0 && (
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    Region Ready
                  </span>
                )}

              </div>

              {selectedRegion.length >= 3 && (
                <RegionImagery
                  key={selectedRegion
                    .map((point) => `${point.lat},${point.lng}`)
                    .join(";")}
                  region={selectedRegion}
                />
              )}
            </div>

            {/* CROP */}
            <div className="mt-10">

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Step 03
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Crop Details
                </h2>
              </div>

              <CropSelector
                selectedCrop={selectedCrop}
                setSelectedCrop={
                  setSelectedCrop
                }
              />

            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-8 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Analysing Region..."
                : "Analyse Selected Region"}
            </button>

          </div>

          {/* RIGHT SIDE */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            {!loading && !result && (
              <div className="flex min-h-[500px] items-center justify-center">

                <div className="max-w-sm text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl">
                    🌱
                  </div>

                  <h2 className="mt-6 text-2xl font-semibold">
                    Ready for Analysis
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    Select your location, draw
                    your farming region and choose
                    your crop to generate an
                    area-level sowing analysis.
                  </p>

                </div>

              </div>
            )}

            {loading && (
              <div className="flex min-h-[500px] items-center justify-center">
                <LoadingAnimation />
              </div>
            )}

            {result && !loading && (
              <div>

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                      Analysis Complete
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">
                      Sowing Outlook
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      {result.location}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">

                    <p className="text-xs text-gray-500">
                      Probability
                    </p>

                    <p className="text-2xl font-bold text-emerald-300">
                      {result.probability}%
                    </p>

                  </div>

                </div>

                {/* STATUS */}
                <div className="mt-8 rounded-3xl border border-white/10 bg-black/10 p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-gray-400">
                      Suitability
                    </span>

                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      {result.recommendation
                        ?.status ||
                        "Analysed"}
                    </span>

                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">

                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          result.probability,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                {/* REGION */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Selected Region
                  </p>

                  <p className="mt-3 text-sm text-gray-300">
                    {result.region?.length || 0} polygon points
                  </p>

                  {result.weather?.center && (
                    <p className="mt-2 text-xs text-gray-500">
                      Centre:{" "}
                      {Number(
                        result.weather.center.latitude
                      ).toFixed(4)}
                      {" , "}
                      {Number(
                        result.weather.center.longitude
                      ).toFixed(4)}
                    </p>
                  )}

                </div>

                {/* CONDITIONS */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                    <p className="text-xs text-gray-500">
                      Temperature
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {result.weather?.temperature ??
                        "--"}
                      °C
                    </p>

                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                    <p className="text-xs text-gray-500">
                      Humidity
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {result.weather?.humidity ??
                        "--"}
                      %
                    </p>

                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                    <p className="text-xs text-gray-500">
                      Rainfall
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {result.weather?.rainfall ??
                        "--"}{" "}
                      mm
                    </p>

                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                    <p className="text-xs text-gray-500">
                      Wind Speed
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {result.weather?.windSpeed ??
                        "--"}{" "}
                      km/h
                    </p>

                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                    <p className="text-xs text-gray-500">
                      Modelled Topsoil Moisture
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {result.weather?.soilMoisture ?? "--"}%
                    </p>

                  </div>

                </div>

                {/* SOIL */}
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-5">

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Soil Conditions
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">

                    <div>
                      <p className="text-xs text-gray-500">
                        Soil
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {result.soil?.soilType ||
                          result.soilType ||
                          "--"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        pH
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {result.soil?.phRange ||
                          result.soil?.ph ||
                          "--"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Clay content
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {result.soil?.clayRange ||
                          (result.soil?.clay != null
                            ? `${result.soil.clay}%`
                            : "--")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Sand content
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {result.soil?.sandRange ||
                          (result.soil?.sand != null
                            ? `${result.soil.sand}%`
                            : "--")}
                      </p>
                    </div>

                  </div>

                  <p className="mt-4 text-xs text-gray-600">
                    {result.soil?.dataAvailable
                      ? `Mapped soil texture from SoilGrids, averaged across ${
                          result.soil.samplePointCount
                        } available region sample${
                          result.soil.samplePointCount === 1 ? "" : "s"
                        }.`
                      : result.soil?.regionalEstimate
                        ? `${result.soil.soilType}. pH and texture values are typical ranges for this soil class, not measurements from your exact field.`
                        : "Mapped soil texture is temporarily unavailable for this region; no soil value was assumed."}{" "}
                    Surface moisture is modelled, not a field sensor reading.
                  </p>

                </div>

                {/* RECOMMENDATION */}
                <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Recommendation
                  </p>

                  <p className="mt-3 text-sm leading-7 text-gray-300">
                    {result.recommendation}
                  </p>

                </div>

                {/* DASHBOARD */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                  className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
                >
                  View Full Dashboard
                </button>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default SowingAnalysis;