"use client";

import { Shape } from "./Canvas";

type Props = {
  shape: Shape;
  onPointerDown: (e: React.PointerEvent<SVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGElement>) => void;
};

export default function Card({
  shape,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props): React.JSX.Element {
  return (
    <image
      key={shape.id}
      id={shape.id}
      x={shape.point[0]}
      y={shape.point[1]}
      width={shape.size[0]}
      height={shape.size[1]}
      href="https://cards.scryfall.io/normal/front/f/a/fab2d8a9-ab4c-4225-a570-22636293c17d.jpg?1654566563"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
