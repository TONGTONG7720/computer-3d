"use client";

import { OrbitControls } from "@react-three/drei";
import { MOUSE, TOUCH } from "three";

type DragControllerProps = {
  readonly mobile: boolean;
};

export function DragController({ mobile }: DragControllerProps) {
  return (
    <OrbitControls
      dampingFactor={0.065}
      enableDamping
      enablePan
      makeDefault
      maxDistance={mobile ? 46 : 18}
      maxPolarAngle={Math.PI * 0.73}
      minDistance={mobile ? 6.8 : 5.4}
      minPolarAngle={Math.PI * 0.18}
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
      }}
      panSpeed={0.62}
      rotateSpeed={mobile ? 0.48 : 0.58}
      target={[0, 2.45, 0]}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN,
      }}
      zoomSpeed={0.72}
    />
  );
}
