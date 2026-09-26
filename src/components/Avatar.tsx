"use client";

import dynamic from "next/dynamic";
import { FallbackAvatar } from "./FallbackAvatar";

/** three.js is loaded on demand, only in the browser. */
const Avatar = dynamic(() => import("./VrmAvatar"), {
  ssr: false,
  loading: () => <FallbackAvatar />,
});

export default Avatar;
