import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 创建自定义聚类图标
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let color = '#00BCD4';
  
  if (count >= 30) {
    size = 'large';
    color = '#3F51B5';
  } else if (count >= 10) {
    size = 'medium';
    color = '#2196F3';
  }

  const sizeMap = {
    small: 40,
    medium: 50,
    large: 60
  };

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: ${sizeMap[size]}px; height: ${sizeMap[size]}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(sizeMap[size], sizeMap[size], true),
  });
};

// 自动调整地图视图以适应所有标记
function FitBounds({ cafes }) {
  const map = useMap();

  useEffect(() => {
    if (cafes && cafes.length > 0) {
      const validCafes = cafes.filter(
        c => c.geometry?.coordinates && 
        c.geometry.coordinates[0] !== 0 && 
        c.geometry.coordinates[1] !== 0
      );

      if (validCafes.length > 0) {
        const bounds = validCafes.map(c => [
          c.geometry.coordinates[1],
          c.geometry.coordinates[0]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [cafes, map]);

  return null;
}

export default function ClusterMap({ cafes }) {
  // 过滤掉无效坐标的咖啡馆
  const validCafes = cafes?.filter(
    c => c.geometry?.coordinates && 
    c.geometry.coordinates[0] !== 0 && 
    c.geometry.coordinates[1] !== 0
  ) || [];

  if (!cafes || cafes.length === 0) {
    return (
      <div className="w-full h-96 rounded shadow-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">No cafes to display</p>
      </div>
    );
  }

  // 默认中心点（美国中部）
  const defaultCenter = [39.8283, -98.5795];

  return (
    <div className="w-full h-96 rounded shadow-lg border border-gray-200 overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={4}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
        >
          {validCafes.map((cafe) => {
            const [lng, lat] = cafe.geometry.coordinates;
            return (
              <Marker key={cafe._id} position={[lat, lng]}>
                <Popup>
                  <div className="text-center">
                    <strong className="font-bold text-base">
                      <a 
                        href={`/cafes/${cafe._id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {cafe.title}
                      </a>
                    </strong>
                    <p className="text-sm text-gray-600 mt-1">{cafe.location}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        <FitBounds cafes={validCafes} />
      </MapContainer>
    </div>
  );
}