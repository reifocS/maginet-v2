import {
  Camera,
  panCamera,
  screenToWorld,
  zoomCamera,
} from "@/components/Canvas";
import inputs from "@/inputs";
import vec from "@/utils/vec";
import { Vector2, useGesture } from "@use-gesture/react";
import React, { useRef } from "react";

export function getCameraZoom(zoom: number): number {
  return vec.clamp(zoom, 0.1, 5);
}

export function pinchCamera(
  camera: Camera,
  point: number[],
  delta: number[],
  distanceDelta: number
): Camera {
  camera.point = vec.sub(camera.point, vec.div(delta, camera.z));

  const next = camera.z - (distanceDelta / 350) * camera.z;

  const p0 = screenToWorld(point, camera);
  camera.z = getCameraZoom(next);
  const p1 = screenToWorld(point, camera);
  camera.point = vec.add(camera.point, vec.sub(p1, p0));

  return { ...camera };
}
export default function useZoomEvents(
  setCamera: React.Dispatch<React.SetStateAction<Camera>>
) {
  const rPinchDa = useRef<number[] | undefined>(undefined);
  const rPinchPoint = useRef<number[] | undefined>(undefined);
  useGesture(
    {
      onWheel: ({ event, delta, ctrlKey }) => {
        if (ctrlKey) {
          const { point } = inputs.wheel(event as WheelEvent);
          const z = normalizeWheel(event)[2];
          setCamera((prev) => zoomCamera(prev, point, z * 0.618));
          return;
        } else {
          setCamera((prev) => panCamera(prev, delta[0], delta[1]));
          return;
        }
      },
      onPinch: ({ pinching, origin, da, event }) => {
        if (event instanceof WheelEvent) return

        if (!pinching) {
          rPinchDa.current = undefined;
          rPinchPoint.current = undefined;
          return;
        }

        if (rPinchPoint.current === undefined) {
          rPinchDa.current = da;
          rPinchPoint.current = origin;
        }
        if(!rPinchPoint.current) return;

        const [distanceDelta] = vec.sub(rPinchDa.current!, da);
        setCamera((prev) =>
          pinchCamera(
            prev,
            origin,
            vec.sub(rPinchPoint.current, origin),
            distanceDelta
          )
        );

        rPinchDa.current = da;
        rPinchPoint.current = origin;
      },
    },
    {
      target: document.body,
      eventOptions: { passive: false },
    }
  );
}
// Reasonable defaults
const MAX_ZOOM_STEP = 10;

// Adapted from https://stackoverflow.com/a/13650579
function normalizeWheel(event: WheelEvent) {
  const { deltaY, deltaX } = event;

  let deltaZ = 0;

  if (event.ctrlKey || event.metaKey) {
    const signY = Math.sign(event.deltaY);
    const absDeltaY = Math.abs(event.deltaY);

    let dy = deltaY;

    if (absDeltaY > MAX_ZOOM_STEP) {
      dy = MAX_ZOOM_STEP * signY;
    }

    deltaZ = dy;
  }

  return [deltaX, deltaY, deltaZ];
}
