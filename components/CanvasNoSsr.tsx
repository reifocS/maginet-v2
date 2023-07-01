import dynamic from "next/dynamic";

const CanvasWithNoSsr = dynamic(() => import("./Canvas"), { ssr: false });

export default CanvasWithNoSsr;
