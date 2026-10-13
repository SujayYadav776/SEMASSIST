import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RoadmapLibrary } from "./roadmap-library";
import "./styles.css";

function RoadmapApp() {
  useEffect(() => {
    if (new URLSearchParams(location.search).get("embedded") !== "1") return;
    document.documentElement.classList.add("embedded");
    const root = document.getElementById("root")!;
    const resize = () => parent.postMessage({ type: "semassist-roadmaps-height", height: Math.ceil(root.getBoundingClientRect().height) }, location.origin);
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();
    return () => { observer.disconnect(); document.documentElement.classList.remove("embedded"); };
  }, []);
  return <RoadmapLibrary />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RoadmapApp />
  </React.StrictMode>,
);
