import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

// This component uses Leaflet for mapping
const KmlMapViewer = () => {
  const [kmlData, setKmlData] = useState<Document | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<Array<{ name: string; type: string; length: string }>>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Initialize the map
    if (mapRef.current && !mapInstance.current) {
      // We need to dynamically import leaflet since it requires window object
      const initializeMap = async () => {
        try {
          // This would normally be imported at the top, but for this demo we're including it inline
          const L = await import("leaflet");

          if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current!).setView([0, 0], 2);
          }

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapInstance.current);

          layerGroup.current = L.layerGroup().addTo(mapInstance.current);
        } catch (error) {
          console.error("Failed to load map:", error);
        }
      };

      initializeMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // When KML data changes, update the map
    if (kmlData && mapInstance.current && layerGroup.current) {
      displayKmlOnMap();
    }
  }, [kmlData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(e.target?.result as string, "text/xml");
          setKmlData(kmlDoc);
          generateSummary(kmlDoc);
          generateDetails(kmlDoc);
        } catch (error) {
          console.error("Error parsing KML:", error);
          alert("Failed to parse KML file");
        }
      };
      reader.readAsText(file);
    }
  };

  const generateSummary = (kmlDoc: Document) => {
    const placemarks = kmlDoc.getElementsByTagName("Placemark");
    const summary = {
      Point: 0,
      LineString: 0,
      Polygon: 0,
      MultiGeometry: 0,
      Other: 0,
    };

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];

      if (placemark.getElementsByTagName("Point").length > 0) {
        summary.Point++;
      } else if (placemark.getElementsByTagName("LineString").length > 0) {
        summary.LineString++;
      } else if (placemark.getElementsByTagName("Polygon").length > 0) {
        summary.Polygon++;
      } else if (placemark.getElementsByTagName("MultiGeometry").length > 0) {
        summary.MultiGeometry++;
      } else {
        summary.Other++;
      }
    }

    setSummary(summary);
  };

  const generateDetails = (kmlDoc: Document) => {
    const placemarks = kmlDoc.getElementsByTagName("Placemark");
    const details = [];

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const name =
        placemark.getElementsByTagName("name")[0]?.textContent ||
        `Element ${i + 1}`;

      let type = "Unknown";
      let length = "N/A";

      if (placemark.getElementsByTagName("Point").length > 0) {
        type = "Point";
      } else if (placemark.getElementsByTagName("LineString").length > 0) {
        type = "LineString";
        length = calculateLength(
          placemark.getElementsByTagName("LineString")[0]
        ).toString();
      } else if (placemark.getElementsByTagName("Polygon").length > 0) {
        type = "Polygon";
        length = calculateLength(placemark.getElementsByTagName("Polygon")[0]).toFixed(2) + " km";
      } else if (placemark.getElementsByTagName("MultiGeometry").length > 0) {
        type = "MultiGeometry";
        const multiGeom = placemark.getElementsByTagName("MultiGeometry")[0];

        if (multiGeom.getElementsByTagName("LineString").length > 0) {
          let totalLength = 0;
          const lineStrings = multiGeom.getElementsByTagName("LineString");

          for (let j = 0; j < lineStrings.length; j++) {
            totalLength += calculateLength(lineStrings[j]);
          }

          length = totalLength.toFixed(2) + " km";
        }
      }

      details.push({ name, type, length });
    }

    setDetails(details);
  };

  const calculateLength = (element: Element) => {
    if (!element) return 0;

    const coordinates =
      element.getElementsByTagName("coordinates")[0]?.textContent;
    if (!coordinates) return 0;

    const points = coordinates
      .trim()
      .split(/\s+/)
      .map((coord) => {
        const [lng, lat] = coord.split(",").map(parseFloat);
        return { lat, lng };
      });

    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += calculateDistance(points[i - 1], points[i]);
    }

    return totalLength;
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    // Haversine formula for calculating distance between two points on Earth
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const displayKmlOnMap = async () => {
    if (!kmlData || !mapInstance.current || !layerGroup.current) return;

    try {
      const L = await import("leaflet");

      // Clear existing layers
      layerGroup.current.clearLayers();

      const placemarks = kmlData.getElementsByTagName("Placemark");
      const bounds: [number, number][] = [];

      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const name =
          placemark.getElementsByTagName("name")[0]?.textContent ||
          `Element ${i + 1}`;

        // Handle Point
        const points = placemark.getElementsByTagName("Point");
        if (points.length > 0) {
          const coordinates =
            points[0].getElementsByTagName("coordinates")[0]?.textContent;
          if (coordinates) {
            const [lng, lat] = coordinates.trim().split(",").map(parseFloat);

            L.marker([lat, lng]).bindPopup(name).addTo(layerGroup.current);

            bounds.push([lat, lng]);
          }
        }

        // Handle LineString
        const lineStrings = placemark.getElementsByTagName("LineString");
        if (lineStrings.length > 0) {
          for (let j = 0; j < lineStrings.length; j++) {
            const coordinates =
              lineStrings[j].getElementsByTagName("coordinates")[0]?.textContent;
            if (coordinates) {
              const latLngs: [number, number][] = coordinates
                  .trim()
                  .split(/\s+/)
                  .map((coord) => {
                    const [lng, lat] = coord.split(",").map(parseFloat);
                    bounds.push([lat, lng]);
                    return [lat, lng] as [number, number];
                  });

              L.polyline(latLngs, { color: "blue" })
                .bindPopup(name)
                .addTo(layerGroup.current);
            }
          }
        }

        // Handle Polygon
        const polygons = placemark.getElementsByTagName("Polygon");
        if (polygons.length > 0) {
          for (let j = 0; j < polygons.length; j++) {
            const outerBoundary =
              polygons[j].getElementsByTagName("outerBoundaryIs")[0];
            if (outerBoundary) {
              const linearRing =
                outerBoundary.getElementsByTagName("LinearRing")[0];
              if (linearRing) {
                const coordinates =
                  linearRing.getElementsByTagName("coordinates")[0]?.textContent;
                if (coordinates) {
                  const latLngs: [number, number][] = coordinates
                    .trim()
                    .split(/\s+/)
                    .map((coord) => {
                      const [lng, lat] = coord.split(",").map(parseFloat);
                      bounds.push([lat, lng]);
                      return [lat, lng] as [number, number];
                    });

                  L.polygon(latLngs, { color: "red" })
                    .bindPopup(name)
                    .addTo(layerGroup.current);
                }
              }
            }
          }
        }

        // Handle MultiGeometry
        const multiGeometries = placemark.getElementsByTagName("MultiGeometry");
        if (multiGeometries.length > 0) {
          for (let j = 0; j < multiGeometries.length; j++) {
            const multiGeom = multiGeometries[j];

            // Handle Points in MultiGeometry
            const multiPoints = multiGeom.getElementsByTagName("Point");
            for (let k = 0; k < multiPoints.length; k++) {
              const coordinates =
                multiPoints[k].getElementsByTagName("coordinates")[0]
                  ?.textContent;
              if (coordinates) {
                const [lng, lat] = coordinates.trim().split(",").map(parseFloat);

                L.marker([lat, lng]).bindPopup(name).addTo(layerGroup.current);

                bounds.push([lat, lng]);
              }
            }

            // Handle LineStrings in MultiGeometry
            const multiLineStrings =
              multiGeom.getElementsByTagName("LineString");
            for (let k = 0; k < multiLineStrings.length; k++) {
              const coordinates =
                multiLineStrings[k].getElementsByTagName("coordinates")[0]
                  ?.textContent;
              if (coordinates) {
                const latLngs: [number, number][] = coordinates
                  .trim()
                  .split(/\s+/)
                  .map((coord) => {
                    const [lng, lat] = coord.split(",").map(parseFloat);
                    bounds.push([lat, lng]);
                    return [lat, lng] as [number, number];
                  });

                L.polyline(latLngs, { color: "green" })
                  .bindPopup(name)
                  .addTo(layerGroup.current);
              }
            }

            // Handle Polygons in MultiGeometry
            const multiPolygons = multiGeom.getElementsByTagName("Polygon");
            for (let k = 0; k < multiPolygons.length; k++) {
              const outerBoundary =
                multiPolygons[k].getElementsByTagName("outerBoundaryIs")[0];
              if (outerBoundary) {
                const linearRing =
                  outerBoundary.getElementsByTagName("LinearRing")[0];
                if (linearRing) {
                  const coordinates =
                    linearRing.getElementsByTagName("coordinates")[0]
                      ?.textContent;
                  if (coordinates) {
                    const latLngs: [number, number][] = coordinates
                      .trim()
                      .split(/\s+/)
                      .map((coord) => {
                        const [lng, lat] = coord.split(",").map(parseFloat);
                        bounds.push([lat, lng]);
                        return [lat, lng] as [number, number];
                      });

                    L.polygon(latLngs, { color: "purple" })
                      .bindPopup(name)
                      .addTo(layerGroup.current);
                  }
                }
              }
            }
          }
        }
      }

      // Fit map to bounds if we have any markers
      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds);
      }
    } catch (error) {
      console.error("Error displaying KML on map:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>KML Map Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <input
              type="file"
              accept=".kml"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="mb-4">
            <Tabs defaultValue="map">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">
                  Map
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                >
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="map">
                <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
              </TabsContent>
              <TabsContent value="summary">
                {kmlData ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Element Type</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary).map(([type, count]) => (
                        <TableRow key={type}>
                          <TableCell>{type}</TableCell>
                          <TableCell>{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>Please upload a KML file to see summary</p>
                )}
              </TabsContent>
              <TabsContent value="details">
                {kmlData ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Length</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.name}</TableCell>
                          <TableCell>{detail.type}</TableCell>
                          <TableCell>{detail.length}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>Please upload a KML file to see details</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KmlMapViewer;