import React from 'react';
import ReactDOM from 'react-dom'
import * as THREE from 'three';

import './OrbitControls'
/*
 import './EffectComposer'
 import './ShaderPass'
 import './CopyShader'
 import './FilmShader'
 import './FilmPass'
 */
import React3 from 'react-three-renderer'


class Planet extends React.Component {
    constructor(props, context) {
        super(props, context);

        // construct the position vector here, because if we use 'new' within render,
        // React will think that things have changed when they have not.

        this.state = {
            marsRotation: new THREE.Euler(0, 0),
            redRotation: new THREE.Euler(0, 0),
            yurikusRotation: new THREE.Euler(0, 0),
            yellowRotation: new THREE.Euler(0, 0),
            magicRotation: new THREE.Euler(0, 0),
            light: {
                direction: new THREE.Vector3(0, 0, 0),
                position: new THREE.Vector3(0, 0, 450)
            },
            position: {
                camera: new THREE.Vector3(0, 0, 6000),
                mars: new THREE.Vector3(300, -150, 0),
                red: new THREE.Vector3(0, 0, -10000),
                yellow: new THREE.Vector3(200, 0, -5000),
                yurikus: new THREE.Vector3(400, 15, 2100),
                magic: new THREE.Vector3(400, 15, 5100)
            },
            glowOffset: new THREE.Vector2(0, 0.074),
            rtParameters: {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat,
                stencilBuffer: true
            }
        };
//         this._onAnimate = () => {
//             // we will get this callback every frame
//
//             // pretend cubeRotation is immutable.
//             // this helps with updates and pure rendering.
//             // React will be sure that the rotation has now updated.
//
//             this.setState({
//                 cubeRotation: new THREE.Euler(
//                     this.state.cubeRotation.x,
//                     this.state.cubeRotation.y + 0.0025,
//                     0
//                 ),
//             });
// //            this.composer.render(0.1);
//         };
        //       this._onRendererUpdated = (renderer)=>{
        // //          this.composer = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, this.state.rtParameters ) );
        //       };

    }
    componentDidMount(){
        let { orbit, composer, effectFilm, state, refs: { camera, glow, light, backGlow, rendererNode } } = this;

        orbit = new THREE.OrbitControls( camera, ReactDOM.findDOMNode(rendererNode) );
        // effectFilm = new THREE.FilmPass( 0.35, 0.025, 648, false );

        orbit.enableZoom = true;
        orbit.enablePan=false;
        orbit.enableRotate=true;

        camera.add(glow, backGlow);

        glow.position.copy(state.position.glow);
        backGlow.position.copy(state.position.backGlow);

        //composer.addPass(effectFilm);
        //composer.render(0.1);
        camera.add(light);
        light.position.copy(state.position.camera);
    }

    render() {
        const width = window.innerWidth; // canvas width
        const height = window.innerHeight; // canvas height

        return (<React3
        mainCamera="camera" // this points to the perspectiveCamera which has the name set to "camera" below
        width={width}
        height={height}
        gammaInput={true}
        gammaOutput={true}
        alpha={true}
        pixelRatio={window.devicePixelRatio}
        onAnimate={this._onAnimate}
        onRendererUpdated={this._onRendererUpdated}
        ref="rendererNode"
            >
            <scene ref="screne">
            <perspectiveCamera
        ref="camera"
        name="camera"
        aspect={width / height}
        near={1}
        fov={45}
        far={100000}
        position={this.state.position.camera}
    />
    <ambientLight ref="light" color={0x333333} intensity={1} />


            <mesh
        rotation={this.state.redRotation}
        position={this.state.position.red}
    >
    <circleGeometry
        radius={251}
        segments={101}
            />

            <meshPhongMaterial
        bumpScale={0}
        shininess={3}
            >
            <texture url={'red.png'} />
            </meshPhongMaterial>
            </mesh>

            <mesh
        rotation={this.state.yellowRotation}
        position={this.state.position.yellow}
    >
    <circleGeometry
        radius={251}
        segments={101}
            />

            <meshPhongMaterial
        bumpScale={0}
        shininess={3}
            >
            <texture url={'yellow.png'} />
            </meshPhongMaterial>
            </mesh>

            <mesh
        rotation={this.state.marsRotation}
        position={this.state.position.mars}
    >
    <circleGeometry
        radius={250}
        segments={100}
            />

            <meshPhongMaterial
        bumpScale={0}
        shininess={3}
            >
            <texture url={'mars.png'} />
            </meshPhongMaterial>
            </mesh>
            <mesh
        rotation={this.state.yurikusRotation}
        position={this.state.position.yurikus}
    >
    <circleGeometry
        radius={251}
        segments={101}
            />

            <meshPhongMaterial
        bumpScale={0}
        shininess={3}
            >
            <texture url={'yurikus.png'} />
            </meshPhongMaterial>
            </mesh>

            <mesh
        rotation={this.state.magicRotation}
        position={this.state.position.magic}
    >
    <circleGeometry
        radius={251}
        segments={101}
            />

            <meshPhongMaterial
        bumpScale={0}
        shininess={3}
            >
            <texture url={'magic.png'} />
            </meshPhongMaterial>
            </mesh>

            </scene>
            </React3>);
    }
}

export default Planet;
