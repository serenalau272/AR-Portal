import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import verandaUrl from "../assets/veranda_new.gltf";
import "../styles/home.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpDownLeftRight,
  faRotate,
  faMaximize,
} from "@fortawesome/free-solid-svg-icons";

function Home() {
  const scene = new THREE.Scene();
  var placedVeranda: boolean = false;
  const loader = new GLTFLoader();
  let reticle: THREE.Object3D;
  let veranda: THREE.Object3D;

  useEffect(() => {
    checkXR();
  }, []);

  function checkXR() {
    if (!window.isSecureContext) {
      document.getElementById("warning")!.innerText =
        "WebXR unavailable. Please use secure context";
      document.getElementById("warning")!.style.color = "#ff0033";
    }
    if (navigator.xr) {
      // check to see if WebXR is supported
      navigator.xr.addEventListener("devicechange", checkSupportedState);
      checkSupportedState();
    } else {
      document.getElementById("warning")!.innerText =
        "WebXR unavailable for this browser";
      document.getElementById("warning")!.style.color = "#ff0033";
    }
  }

  function checkSupportedState() {
    window.navigator
      .xr!.isSessionSupported("immersive-ar")
      .then((supported) => {
        let xrButton = document.getElementById(
          "xr-button"
        )! as HTMLButtonElement;

        if (supported) {
          xrButton.innerHTML = "Enter AR";
          xrButton.addEventListener("click", start);
          document.getElementById("warning")!.innerText = "WebXR available";
          document.getElementById("warning")!.style.color = "#4BB543";
        } else {
          xrButton.innerHTML = "AR not found";
          xrButton.removeEventListener("click", start);
          document.getElementById("warning")!.innerText = "AR unsupported";
          document.getElementById("warning")!.style.color = "#ff0033";
        }

        xrButton.disabled = !supported;
      });
  }

  const moveX = (left: boolean) => {
    if (veranda && placedVeranda) {
      const pos = new THREE.Vector3();
      pos.copy(veranda.position);
      pos.x += 1 * (left ? -1 : 1);
      veranda.position.copy(pos);
    }
  };

  async function start() {
    const entryContainer = document.getElementsByClassName(
      "entry"
    )[0] as HTMLElement;
    entryContainer!.style.display = "none";

    const canvas = document.getElementById("scene") as HTMLCanvasElement;
    const gl = canvas!.getContext("webgl", { xrCompatible: true });
    const light = new THREE.DirectionalLight(0xffffff, 100);
    light.position.set(10, 1000, 10);
    scene.add(light);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: canvas,
      context: gl!,
    });

    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;

    const camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;

    const spotlight = new THREE.SpotLight(0xffffff, 10);
    spotlight.position.set(10, 1000, 10);
    spotlight.castShadow = true;
    spotlight.shadow.bias = -0.001;
    spotlight.shadow.mapSize.width = 1024 * 4;
    spotlight.shadow.mapSize.height = 1024 * 4;
    scene.add(spotlight);

    const session = await window.navigator.xr!.requestSession("immersive-ar", {
      optionalFeatures: ["dom-overlay"],
      requiredFeatures: ["hit-test"],
      domOverlay: { root: document.getElementById("overlay") as Element },
    });

    session.updateRenderState({
      baseLayer: new XRWebGLLayer(session, gl!),
    });

    loader.load(verandaUrl, function (gltf) {
      reticle = gltf.scene;
      veranda = gltf.scene;

      reticle.traverse((n) => {
        if (n.isObject3D) {
          n.castShadow = true;
          n.receiveShadow = true;
        }
      });
      veranda.traverse((n) => {
        if (n.isObject3D) {
          n.castShadow = true;
          n.receiveShadow = true;
        }
      });

      reticle.visible = false;
      scene.add(reticle);
    });

    session.addEventListener("select", (_) => {
      if (veranda && !placedVeranda) {
        veranda.position.copy(reticle.position);
        scene.add(veranda);
        placedVeranda = true;
      }
    });

    const referenceSpace = await session.requestReferenceSpace("local");
    const viewerSpace = await session.requestReferenceSpace("viewer");
    const hitTestSource = await session.requestHitTestSource?.({
      space: viewerSpace,
    });

    // Create a render loop that allows us to draw on the AR view.
    const onXRFrame = (_time: any, frame: any) => {
      // Queue up the next draw request.
      session.requestAnimationFrame(onXRFrame);

      // Bind the graphics framebuffer to the baseLayer's framebuffer
      gl!.bindFramebuffer(
        gl!.FRAMEBUFFER,
        session!.renderState!.baseLayer!.framebuffer
      );

      // Retrieve the pose of the device.
      // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
      const pose = frame.getViewerPose(referenceSpace);

      if (pose) {
        // In mobile AR, we only have one view.
        const view = pose.views[0];

        const viewport = session!.renderState!.baseLayer!.getViewport(view);

        renderer.setSize(viewport!.width, viewport!.height);

        // Use the view's transform matrix and projection matrix to configure the THREE.camera.
        camera.matrix.fromArray(view.transform.matrix);
        camera.projectionMatrix.fromArray(view.projectionMatrix);
        // camera.position.set(10, 10, 10);
        camera.updateMatrixWorld(true);

        // Render the scene with THREE.WebGLRenderer.
        const res = frame.getHitTestResults(hitTestSource);
        if (res.length > 0 && reticle && !placedVeranda) {
          const hitPose = res[0].getPose(referenceSpace);
          reticle.visible = true;
          reticle.position.set(
            hitPose.transform.position.x,
            hitPose.transform.position.y,
            hitPose.transform.position.z
          );
          reticle.updateMatrixWorld(true);
        }
        renderer.render(scene, camera);
      }
    };
    session.requestAnimationFrame(onXRFrame);
  }

  return (
    <div className="home">
      <div id="overlay">
        <div className="footer">
          <button onClick={() => moveX(true)}>
            <FontAwesomeIcon icon={faUpDownLeftRight} />
          </button>
          <button onClick={() => moveX(false)}>
            <FontAwesomeIcon icon={faRotate} />
          </button>
          <button>
            <FontAwesomeIcon icon={faMaximize} />
          </button>
        </div>
      </div>
      <div className="entry">
        <div id="title">Sandfield AR Portal</div>
        <div id="warning">Warning</div>
        <button id="xr-button" disabled>
          XR not found
        </button>
      </div>

      <canvas id="scene" />
    </div>
  );
}

export default Home;
