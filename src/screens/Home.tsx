import React from "react";
import { useEffect, useRef, useState } from "react";
import "../styles/screens/home.scss";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Globe from "./Globe";
import Portal from "./Portal";
import svg from "../assets/ic_round-drag-handle.svg";

function Home() {
  return (
    <div className="home">
      <Allotment vertical={true}>
        <div className="component-container top">{/* <Globe /> */}</div>
        <div className="component-container bottom">{/* <Portal /> */}</div>
      </Allotment>
    </div>
  );
}

export default Home;
