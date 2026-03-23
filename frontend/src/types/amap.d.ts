declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions)
    destroy(): void
    setCenter(position: [number, number]): void
    setZoom(zoom: number): void
    add(overlay: Marker | InfoWindow | ControlBar): void
    remove(overlay: Marker | InfoWindow): void
    addControl(control: Scale | ToolBar | Geolocation | ControlBar): void
    setFitView(): void
    on(event: string, handler: (...args: unknown[]) => void): void
    off(event: string, handler: (...args: unknown[]) => void): void
  }
  interface MapOptions {
    zoom?: number
    center?: [number, number]
    mapStyle?: string
    resizeEnable?: boolean
    rotateEnable?: boolean
    pitchEnable?: boolean
    viewMode?: string
    showLabel?: boolean
    features?: string[]
  }
  class Marker {
    constructor(options?: MarkerOptions)
    setMap(map: Map | null): void
    on(event: string, handler: () => void): void
    getPosition(): { lng: number; lat: number } | null
    getExtData(): unknown
  }
  interface MarkerOptions {
    position?: [number, number]
    title?: string
    content?: string | HTMLElement
    icon?: string | Icon
    offset?: Pixel
    extData?: unknown
    animation?: string
    cursor?: string
  }
  class InfoWindow {
    constructor(options?: InfoWindowOptions)
    open(map: Map, position: [number, number]): void
    close(): void
  }
  interface InfoWindowOptions {
    content?: string | HTMLElement
    offset?: Pixel
    closeWhenClickMap?: boolean
    isCustom?: boolean
  }
  class Icon { constructor(options?: { size?: Size; image?: string; imageOffset?: Pixel; imageSize?: Size }) }
  class Size { constructor(width: number, height: number) }
  class Pixel { constructor(x: number, y: number) }
  class ControlBar { constructor(options?: { position?: { right?: string; top?: string } }) }
  class Scale { constructor(options?: Record<string, unknown>) }
  class ToolBar { constructor(options?: { position?: { top?: string; right?: string; bottom?: string; left?: string } }) }
  class Geolocation {
    constructor(options?: GeolocationOptions)
    getCurrentPosition(callback?: (status: string, result: unknown) => void): void
  }
  interface GeolocationOptions {
    enableHighAccuracy?: boolean
    timeout?: number
    buttonPosition?: string
    buttonOffset?: Pixel
    zoomToAccuracy?: boolean
  }
}

interface Window {
  AMap: typeof AMap
}

declare module '@amap/amap-jsapi-loader' {
  interface LoadConfig {
    key: string
    version?: string
    plugins?: string[]
    securityJsCode?: string
  }
  export default function load(config: LoadConfig): Promise<typeof AMap>
}
