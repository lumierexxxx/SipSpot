import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ShowPageMap({ cafe }) {
  // 如果没有咖啡馆数据或坐标，不渲染地图
  if (!cafe || !cafe.geometry || !cafe.geometry.coordinates) {
    return <div className="w-full h-72 rounded shadow-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">No map data available</p>
    </div>;
  }

  const [lng, lat] = cafe.geometry.coordinates;

  // 确保坐标有效
  if (!lng || !lat || lng === 0 && lat === 0) {
    return <div className="w-full h-72 rounded shadow-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Invalid coordinates</p>
    </div>;
  }

  return (
    <div className="w-full h-72 rounded shadow-lg border border-gray-200 overflow-hidden">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">{cafe.title}</h3>
              <p className="text-sm text-gray-600">{cafe.location}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}