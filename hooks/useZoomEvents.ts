import {
  Camera,
  panCamera,
  screenToWorld,
  zoomCamera,
} from "@/components/Canvas";
import inputs from "@/inputs";
import vec from "@/utils/vec";
import { Handler, WebKitGestureEvent, useGesture } from "@use-gesture/react";
import React from "react";

export function getCameraZoom(zoom: number): number {
  return vec.clamp(zoom, 0.1, 5);
}
const onPinch = (
  info: { delta: number[]; point: number[] },
  camera: Camera
) => {
  if (isNaN(info.delta[0]) || isNaN(info.delta[1])) return;
  return pinchZoom(camera, info.point, info.delta, info.delta[2]);
};

const pinchZoom = (
  camera: Camera,
  point: number[],
  delta: number[],
  zoom: number
): Camera => {
  const nextPoint = vec.sub(camera.point, vec.div(delta, camera.z));
  const nextZoom = zoom;
  const p0 = vec.sub(vec.div(point, camera.z), nextPoint);
  const p1 = vec.sub(vec.div(point, nextZoom), nextPoint);
  return {
    point: vec.toPrecision(vec.add(nextPoint, vec.sub(p1, p0))),
    z: nextZoom,
  };
};
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
  const rOriginPoint = React.useRef<number[] | undefined>(undefined);
  const rPinchPoint = React.useRef<number[] | undefined>(undefined);
  const rDelta = React.useRef<number[]>([0, 0]);
  React.useEffect(() => {
    const preventGesture = (event: TouchEvent) => event.preventDefault();
    // @ts-ignore
    document.addEventListener("gesturestart", preventGesture);
    // @ts-ignore
    document.addEventListener("gesturechange", preventGesture);
    return () => {
      // @ts-ignore
      document.removeEventListener("gesturestart", preventGesture);
      // @ts-ignore
      document.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  const handlePinchStart = React.useCallback<
    Handler<
      "pinch",
      WheelEvent | PointerEvent | TouchEvent | WebKitGestureEvent
    >
  >(({ origin, event }) => {
    if (event instanceof WheelEvent) return;
    const info = inputs.pinch(event, origin, origin);
    rPinchPoint.current = info.point;
    rOriginPoint.current = info.origin;
    rDelta.current = [0, 0];
  }, []);

  const handlePinch = React.useCallback<
    Handler<
      "pinch",
      WheelEvent | PointerEvent | TouchEvent | WebKitGestureEvent
    >
  >(
    ({ origin, offset, event }) => {
      if (event instanceof WheelEvent) return;

      if (!rOriginPoint.current) return;
      const info = inputs.pinch(event, origin, rOriginPoint.current);
      const trueDelta = vec.sub(info.delta, rDelta.current);
      rDelta.current = info.delta;

      setCamera(
        (prev) =>
          onPinch(
            {
              point: info.point,
              delta: [...trueDelta, offset[0]],
            },
            prev!
          ) ?? prev
      );

      rPinchPoint.current = origin;
    },
    [setCamera]
  );

  const handlePinchEnd = React.useCallback<
    Handler<
      "pinch",
      WheelEvent | PointerEvent | TouchEvent | WebKitGestureEvent
    >
  >(({ origin, event }) => {
    rPinchPoint.current = undefined;
    rOriginPoint.current = undefined;
    rDelta.current = [0, 0];
  }, []);
  useGesture(
    {
      onWheel: ({ event, delta, ctrlKey }) => {
        event.preventDefault();
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
      // onPinch: ({ pinching, origin, da, event }) => {
      //   if (event instanceof WheelEvent) return;

      //   if (!pinching) {
      //     rPinchDa.current = undefined;
      //     rPinchPoint.current = undefined;
      //     return;
      //   }

      //   if (rPinchPoint.current === undefined) {
      //     rPinchDa.current = da;
      //     rPinchPoint.current = origin;
      //   }
      //   if (!rPinchDa.current) return;
      //   if (!rPinchPoint.current) return;
      //   console.log(rPinchDa.current, rPinchPoint.current)
      //   const [distanceDelta] = vec.sub(rPinchDa.current, da);
      //   setCamera((prev) =>
      //     pinchCamera(
      //       prev,
      //       origin,
      //       vec.sub(rPinchPoint.current!, origin),
      //       distanceDelta
      //     )
      //   );

      //   rPinchDa.current = da;
      //   rPinchPoint.current = origin;
      // },
      onPinchStart: handlePinchStart,
      onPinch: handlePinch,
      onPinchEnd: handlePinchEnd,
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
