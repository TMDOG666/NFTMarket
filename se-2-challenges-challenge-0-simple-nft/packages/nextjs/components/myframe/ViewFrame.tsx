import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

type NFTFrameProps = {
    fileInput: string; // Base64 字符串作为输入
};

export const ViweNFTFrame = ({ fileInput }: NFTFrameProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!fileInput || !containerRef.current) return;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 4;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
        );
        renderer.setClearColor(0x000000, 0.2); // 背景为白色
        containerRef.current.appendChild(renderer.domElement);

        // Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);

        // 增加环境光并提高亮度
        const ambientLight = new THREE.AmbientLight(0xffffff, 5); // 提高强度
        scene.add(ambientLight);

        // 添加点光源并调整位置
        const pointLight = new THREE.PointLight(0xffffff, 1, 10); // 增加亮度范围
        pointLight.position.set(5, 5, 5); // 放置点光源
        scene.add(pointLight);

        // 加载资源
        const loadResource = async () => {
            try {
                // 通过 Base64 字符串加载资源
                if (fileInput.includes("data:application/octet-stream")) {
                    // 加载 GLB 模型
                    console.log("Loading GLB model...");
                    const gltfLoader = new GLTFLoader();
                    gltfLoader.load(fileInput, (gltf) => {
                        const model = gltf.scene;

                        // 计算模型的边界框
                        const boundingBox = new THREE.Box3().setFromObject(model);
                        const size = new THREE.Vector3();
                        boundingBox.getSize(size);

                        // 计算适合场景的缩放比例
                        const maxSize = Math.max(size.x, size.y, size.z);
                        const scaleFactor = 3 / maxSize;

                        // 设置模型缩放
                        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

                        // 调整模型位置，使其居中
                        model.position.set(0, -0.5, 0);

                        scene.add(model);
                    });
                    console.log("Loaded GLB model...");
                } else if (fileInput.startsWith("data:image/png;")) {
                    // 加载图片
                    console.log("Loading image...");
                    const textureLoader = new THREE.TextureLoader();
                    const imageTexture = textureLoader.load(fileInput);

                    const imageGeometry = new THREE.PlaneGeometry(3, 4.5);
                    const imageMaterial = new THREE.MeshBasicMaterial({ map: imageTexture });
                    const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
                    imagePlane.position.z = 0.06; // 图片稍微放置在框的前面
                    scene.add(imagePlane);

                    // Frame Geometry (白色框)
                    const frameGeometry = new THREE.BoxGeometry(3.5, 5, 0.1);
                    const frameMaterial = new THREE.MeshStandardMaterial({
                        color: "white", // 相框统一白色
                    });
                    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                    scene.add(frame);
                }
            } catch (error) {
                console.error("Failed to load resource:", error);
            }
        };

        loadResource();

        // 动画循环
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // 清理
        return () => {
            renderer.dispose();
            containerRef.current?.removeChild(renderer.domElement);
        };
    }, [fileInput]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default ViweNFTFrame;
