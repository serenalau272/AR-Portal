import React from "react";
import { useEffect, useRef, useState } from "react";
import "../styles/screens/home.scss";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Globe from "./Globe";
import Portal from "./Portal";

function Home() {
  return (
    <div className="home">
      <Allotment vertical={true}>
        <Globe />
        <Portal />
      </Allotment>
    </div>
  );
}

export default Home;
