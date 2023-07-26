import { PlanarCamera, Vec2 } from "../types";

export function vectorScreenToWorld(camera: PlanarCamera, v: Vec2): Vec2 {
    if (camera.zoom === 0) {
        console.error(`div/0`);
        return v;
    }
    return {
        x: v.x / camera.zoom,
        y: v.y / camera.zoom,
    }
}

export function pointScreenToWorld(camera: PlanarCamera, p: Vec2): Vec2 {
    const scaled = vectorScreenToWorld(camera, p);
    return {
        x: camera.position.x + scaled.x,
        y: camera.position.y + scaled.y,
    };
}