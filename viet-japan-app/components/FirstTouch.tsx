"use client";

import { useEffect } from "react";
import { captureFirstTouch, track } from "@/lib/tracking";

// Nằm trong layout — bắt pipeline_id từ link SNS ngay lần chạm đầu tiên.
export default function FirstTouch() {
  useEffect(() => {
    captureFirstTouch();
    track("page_view", { path: window.location.pathname });
  }, []);
  return null;
}
