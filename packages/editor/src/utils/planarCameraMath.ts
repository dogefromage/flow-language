import { PlanarCamera, Vec2 } from "../types";

export function vectorScreenToWorld(zoom: number, v: Vec2): Vec2 {
    if (zoom === 0) {
        console.error(`div/0`);
        return v;
    }
    return {
        x: v.x / zoom,
        y: v.y / zoom,
    }
}

export function pointScreenToWorld(camera: PlanarCamera, p: Vec2): Vec2 {
    const scaled = vectorScreenToWorld(camera.zoom, p);
    return {
        x: camera.position.x + scaled.x,
        y: camera.position.y + scaled.y,
    };
}