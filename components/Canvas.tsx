"use client";
import * as React from "react";
import Card from "./Card";
import useZoomEvents from "@/hooks/useZoomEvents";
import { useDrag } from "@use-gesture/react";
import vec from "@/utils/vec";
interface Point {
  x: number;
  y: number;
}

export interface Camera {
  point: number[];
  z: number;
}

export interface Shape {
  id: string;
  point: number[];
  size: number[];
}

const add = (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1]];
const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1]];

export function screenToWorld(point: number[], camera: Camera): number[] {
  return vec.sub(vec.div(point, camera.z), camera.point);
}
export function getCameraZoom(zoom: number): number {
  return vec.clamp(zoom, 1, 5);
}
// interface Box {
//   minX: number;
//   minY: number;
//   maxX: number;
//   maxY: number;
//   width: number;
//   height: number;
// }
// function screenToCanvas(point: Point, camera: Camera): Point {
//   return {
//     x: point.x / camera.z - camera.x,
//     y: point.y / camera.z - camera.y,
//   }
// }

// function panCamera(camera: Camera, dx: number, dy: number): Camera {
//   return {
//     x: camera.x - dx / camera.z,
//     y: camera.y - dy / camera.z,
//     z: camera.z,
//   }
// }

export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return {
    point: vec.sub(camera.point, vec.div([dx, dy], camera.z)),
    z: camera.z,
  };
}

// export function zoomCamera(camera: Camera, point: Point, dz: number): Camera {
//   const zoom = camera.z - dz * camera.z;

//   const p1 = screenToCanvas(point, camera);
//   const p2 = screenToCanvas(point, { ...camera, z: zoom });

//   return {
//     x: camera.x + (p2.x - p1.x),
//     y: camera.y + (p2.y - p1.y),
//     z: zoom,
//   };
// }

export function zoomCamera(
  camera: Camera,
  point: number[],
  dz: number
): Camera {
  const next = camera.z - (dz / 50) * camera.z;
  console.log(next);
  const p0 = screenToWorld(point, camera);
  camera.z = getCameraZoom(next);
  const p1 = screenToWorld(point, camera);
  camera.point = vec.add(camera.point, vec.sub(p1, p0));

  return { ...camera };
}
// function zoomIn(camera: Camera): Camera {
//   const i = Math.round(camera.z * 100) / 25;
//   const nextZoom = (i + 1) * 0.25;
//   const center = [window.innerWidth / 2, window.innerHeight];
//   return zoomCamera(camera, center, camera.z - nextZoom);
// }

// function zoomOut(camera: Camera): Camera {
//   const i = Math.round(camera.z * 100) / 25;
//   const nextZoom = (i - 1) * 0.25;
//   const center = [window.innerWidth / 2, window.innerHeight];
//   return zoomCamera(camera, center, camera.z - nextZoom);
// }

const CARD_HEIGHT = 200;
const CARD_WIDTH = 200;

export default function Canvas() {
  const ref = React.useRef<SVGSVGElement>(null);
  const rDragging = React.useRef<{
    shape: Shape;
    origin: number[];
  } | null>(null);
  const [shapes, setShapes] = React.useState<Record<string, Shape>>({
    a: {
      id: "a",
      point: [200, 200],
      size: [CARD_HEIGHT, CARD_WIDTH],
    },
    b: {
      id: "b",
      point: [320, 200],
      size: [CARD_HEIGHT, CARD_WIDTH],
    },
    c: {
      id: "c",
      point: [50, 70],
      size: [CARD_HEIGHT, CARD_WIDTH],
    },
  });
  const [camera, setCamera] = React.useState({
    point: [0, 0],
    z: 5,
  });

  function onPointerDown(e: React.PointerEvent<SVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);

    const id = e.currentTarget.id;
    const point = screenToWorld([e.clientX, e.clientY], camera);

    rDragging.current = {
      shape: { ...shapes[id] },
      origin: point,
    };
  }

  function onPointerMove(e: React.PointerEvent<SVGElement>) {
    e.stopPropagation();
    const dragging = rDragging.current;

    if (!dragging) return;

    const shape = shapes[dragging.shape.id];
    const point = screenToWorld([e.clientX, e.clientY], camera);
    const delta = sub(point, dragging.origin);

    setShapes({
      ...shapes,
      [shape.id]: {
        ...shape,
        point: add(dragging.shape.point, delta),
      },
    });
  }

  const onPointerUp = (e: React.PointerEvent<SVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    rDragging.current = null;
  };

  const bind = useDrag(({ delta: [deltaX, deltaY] }) => {
    setCamera((camera) => panCamera(camera, -deltaX, -deltaY));
  });

  useZoomEvents(setCamera);

  // useZoom(camera, setCamera);

  const transform = `scale(${camera.z}) translate(${camera.point[0]}px, ${camera.point[1]}px)`;

  return (
    <div>
      <svg ref={ref} className="canvas" {...bind()}>
        <g style={{ transform }}>
          {Object.values(shapes).map((shape) => (
            <Card
              key={shape.id}
              shape={shape}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          ))}
        </g>
      </svg>
      {/* <div>
        <button
          style={{ position: "relative", zIndex: 9999 }}
          onClick={() => setCamera(zoomIn)}
        >
          Zoom In
        </button>
        <button
          style={{ position: "relative", zIndex: 9999 }}
          onClick={() => setCamera(zoomOut)}
        >
          Zoom Out
        </button> */}
      {/* <div>{Math.floor(camera.z * 100)}%</div>
        <div>x: {Math.floor(viewport.minX)}</div>
        <div>y: {Math.floor(viewport.minY)}</div>
        <div>width: {Math.floor(viewport.width)}</div>
        <div>height: {Math.floor(viewport.height)}</div> */}
      {/* </div> */}
    </div>
  );
}
