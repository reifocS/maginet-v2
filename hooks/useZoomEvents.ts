import { panCamera, zoomCamera } from "@/components/Canvas";
import React from "react";

export default function useZoomEvents(
  setCamera: React.Dispatch<
    React.SetStateAction<{ x: number; y: number; z: number }>
  >,
  ref: React.RefObject<SVGSVGElement>
) {
  React.useEffect(() => {
    function handleWheel(event: WheelEvent) {
      event.preventDefault();

      const { clientX, clientY, deltaX, deltaY, ctrlKey } = event;

      if (ctrlKey) {
        setCamera((camera) =>
          zoomCamera(camera, { x: clientX, y: clientY }, deltaY / 100)
        );
      } else {
        setCamera((camera) => panCamera(camera, deltaX, deltaY));
      }
    }

    const elm = ref.current;
    if (!elm) return;

    elm.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      elm.removeEventListener("wheel", handleWheel);
    };
  }, [ref, setCamera]);
}
