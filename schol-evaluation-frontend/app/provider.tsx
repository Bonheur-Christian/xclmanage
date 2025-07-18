"use client";

import dynamic  from "next/dynamic";
import { Fragment } from "react";

const Next13ProgressBar = dynamic(
  () => import("next13-progressbar").then((mod) => mod.Next13ProgressBar),
  { ssr: false }
);

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Fragment>
      {children}
      <Next13ProgressBar
        height="5px"
        color="#4842f7"
        options={{ showSpinner: true }}
        showOnShallow
      />
    </Fragment>
  );
};

export default Provider;
