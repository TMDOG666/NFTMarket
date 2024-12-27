import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

type NFTFrameProps = {
  fileUrl?: string;
  frameColor?: string; // 只接收定义的颜色
};

// 颜色映射
const colorMapping: Record<string, string> = {
  red: "rgba(252, 92, 101,1.0)",
  gold: "rgba(255, 215, 0, 0.7)", // 金色光芒
  purple: "rgba(165, 94, 234,1.0)",
  blue: "rgba(69, 170, 242,1.0)",
  green: "rgba(38, 222, 129,1.0)",
  white: "white",
};

// 星星数量映射
const starCountMapping: Record<string, number> = {
  red: 200,    // 红色最多星星
  gold: 150,
  purple: 100,
  blue: 60,
  green: 30,
  white: 10,   // 白色最少星星
};

// 网络请求重试的最大次数
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 延迟2秒

async function fetchWithRetry(url: string, retries: number = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Request failed. Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw new Error(`Request failed after ${MAX_RETRIES} retries: ${error}`);
  }
}

export const NFTFrame = ({ fileUrl, frameColor }: NFTFrameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileUrl || !frameColor) return;
    if (!containerRef.current) return;

    const frameColorValue = colorMapping[frameColor] || "white";
    const starCount = starCountMapping[frameColor] || 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0.2);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: frameColorValue,
      size: 0.1,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 5); // 提高强度
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 10, 10); // 增加亮度范围
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 动态加载资源
    const loadResource = async () => {
      try {
        const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(fileUrl)}`;
        const response = await fetchWithRetry(proxyUrl);

        const contentType = response.headers.get("Content-Type");
        if (contentType?.includes("model/gltf-binary")) {
          console.log("Loading GLB model...");
          const gltfLoader = new GLTFLoader();
          gltfLoader.load(proxyUrl, (gltf) => {
            const model = gltf.scene;
            const boundingBox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxSize = Math.max(size.x, size.y, size.z);
            const scaleFactor = 3 / maxSize;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);
            model.position.set(0, 0, 0);
            scene.add(model);
          });
        } else if (contentType?.startsWith("image/")) {
          const textureLoader = new THREE.TextureLoader();
          const imageTexture = textureLoader.load(proxyUrl);

          const imageGeometry = new THREE.PlaneGeometry(3, 4.5);
          const imageMaterial = new THREE.MeshBasicMaterial({ map: imageTexture });
          const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
          imagePlane.position.z = 0.06; 
          scene.add(imagePlane);

          const frameGeometry = new THREE.BoxGeometry(3.5, 5, 0.1);
          const frameMaterial = new THREE.MeshStandardMaterial({
            color: frameColorValue,
            emissive: frameColorValue,
            emissiveIntensity: 0.5,
          });
          const frame = new THREE.Mesh(frameGeometry, frameMaterial);
          scene.add(frame);

          const pointLight = new THREE.PointLight(frameColorValue, 1, 10);
          pointLight.position.set(0, 0, 3);
          scene.add(pointLight);
        }
        setLoading(false); 
      } catch (error) {
        console.error("Failed to load resource:", error);
        setLoading(false); // 在资源加载失败时停止加载状态
      }
    };

    loadResource();

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.y += 0.002;
      const time = Date.now() * 0.005;
      particlesMaterial.opacity = 0.5 + 0.5 * Math.sin(time); 

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [fileUrl, frameColor]);

  return (
    <div ref={containerRef} style={{
      border: `5px solid ${colorMapping[frameColor || 'white']}`,
      borderRadius: "10px",
      width: "100%",
      height: "100%",
    }}>
      {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>Loading...</div>}
    </div>
  );
};

export default NFTFrame;
