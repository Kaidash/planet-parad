import React from 'react';
import ReactDOM from 'react-dom'
import * as THREE from 'three';

//import './OrbitControls'
/*
 import './EffectComposer'
 import './ShaderPass'
 import './CopyShader'
 import './FilmShader'
 import './FilmPass'
 */
import React3 from 'react-three-renderer'

const planets = [
    "red",
    "yellow",
    "mars",
    "yurikus",
    "magic"
];

class Planet extends React.Component {
    // c -> p = 500
    // p -> p = 10000
    // cd = 12000

    _renderDistance = 100000;
    _planetToPlanetDistance = 10000;
    _cameraToPlanetDistance = 500;

    _planetsCount = 5;

    _distance = 10000;
    _currentPlanet = 0;

    _currentPosX = -75;

    _nextPosZ = 40500;
    _currentPosZ = 40500;
    _frame = 100;

    _moving = false;

    _arg = 0;
    _direction = 1;

    /*
    * props = {
    *   planets: [
    *       { x: 0, y: 0, z: 0 },
    *       { x: 0, y: 0, z: 0 },
    *       { x: 0, y: 0, z: 0 },
    *       { x: 0, y: 0, z: 0 }
    *   ]
    * }
    * */

    constructor(props, context) {
        super(props, context);

        this._planetsCount = planets.length;
        this._renderDistance = this._planetsCount * this._planetToPlanetDistance + this._cameraToPlanetDistance;

        let _planets = planets.map( (planet, index) => {
            return {
                cords: new THREE.Vector3(75 * index, -50 * index, index * this._planetToPlanetDistance),
                texture: planet + '.png'
            }
        });

        this.handleMouseWheel = this.handleMouseWheel.bind(this);
        this._onAnimate = this._onAnimate.bind(this);
        this._canMove = this._canMove.bind(this);
        this._getSpeedCofficient = this._getSpeedCofficient.bind(this);
        this._getZCords = this._getZCords.bind(this);
        this._getXCords = this._getXCords.bind(this);

        this.state = {
            light: {
                direction: new THREE.Vector3(0, 0, 0),
                position: new THREE.Vector3(0, 0, 450)
            },
            position: {
                camera: new THREE.Vector3(0, 0, 40500),
            },

            planets: _planets,

            glowOffset: new THREE.Vector2(0, 0.074),
            rtParameters: {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat,
                stencilBuffer: true
            }
        };
    }

    componentDidMount(){
        let { orbit, composer, effectFilm, state, refs: { camera, glow, light, backGlow, rendererNode } } = this;

        const mainNode = ReactDOM.findDOMNode(rendererNode);
        mainNode.addEventListener( 'wheel', this.handleMouseWheel, false );

        /*orbit = new THREE.OrbitControls( camera, ReactDOM.findDOMNode(rendererNode) );
        // effectFilm = new THREE.FilmPass( 0.35, 0.025, 648, false );

        orbit.enableZoom = true;
        orbit.enablePan=false;
        orbit.enableRotate=false;*/

        camera.add(glow, backGlow);

        camera.add(light);
        light.position.copy(this.state.position.camera);
    }

    // handlers

    handleMouseWheel( event ) {
        if( !this._moving ) {
            this._moving = true;

            const e = window.event || event;
            const direction = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

            if( !this._canMove( direction ) ) return;

            this._direction = direction;
            this._currentPlanet -= direction;
            this._nextPosZ += direction * this._distance;
            this._frame = direction * 100;
        }
    }

    _canMove( direction ) {
        return this._currentPlanet > 0 && direction > 0 || this._currentPlanet < this._planetsCount - 1 && direction < 0;
    }

    _onAnimate() {
        let camera = this.refs.camera;

        if( camera.position.z != this._nextPosZ && this._arg < 40 ) {

            camera.position.x = this._getXCords();
            camera.position.z = this._getZCords();
        }
        else {
            this._arg = 0;

            camera.position.x = -75 * this._currentPlanet;
            camera.position.z = this._nextPosZ;

            this._currentPosZ = this._nextPosZ;
            this._moving = false;
        }
    }

    _getSpeedCofficient( ) {
        return ( Math.atan( this._arg - 20 ) + 1.5208 ) / 3.0416
    }

    _getZCords() {
        this._arg += 0.4;

        return this._currentPosZ + this._distance * this._getSpeedCofficient() * this._direction
    }

    _getXCords( ) {
        return -75 * (this._currentPlanet + this._direction) + 75 * this._getSpeedCofficient() * this._direction
    }

    render() {
        const width = window.innerWidth; // canvas width
        const height = window.innerHeight; // canvas height

        return (
            <React3
                mainCamera="camera" // this points to the perspectiveCamera which has the name set to "camera" below
                width={width}
                height={height}
                gammaInput={true}
                gammaOutput={true}
                alpha={true}
                pixelRatio={window.devicePixelRatio}
                onRendererUpdated={this._onRendererUpdated}
                onAnimate={ this._onAnimate }
                ref="rendererNode"
            >
                <scene ref="screne">
                    <perspectiveCamera
                        ref="camera"
                        name="camera"
                        aspect={width / height}
                        near={1}
                        fov={45}
                        far={ this._renderDistance }
                        position={this.state.position.camera}
                    />
                    <ambientLight ref="light" color={0x333333} intensity={1}/>

                    { this.state.planets.map((planet, index) => {
                        return(
                            <mesh
                                key={ index }
                                position={ planet.cords }
                            >
                                <circleGeometry
                                    radius={251}
                                    segments={101}
                                />

                                <meshPhongMaterial
                                    bumpScale={0}
                                    shininess={3}
                                >
                                    <texture url={ planet.texture }/>
                                </meshPhongMaterial>
                            </mesh>
                        )
                    }) }

                    {/*<mesh
                        position={this.state.planets.red}
                    >
                        <circleGeometry
                            radius={251}
                            segments={101}
                        />

                        <meshPhongMaterial
                            bumpScale={0}
                            shininess={3}
                        >
                            <texture url={'red.png'}/>
                        </meshPhongMaterial>
                    </mesh>

                    <mesh
                        position={this.state.planets.yellow}
                    >
                        <circleGeometry
                            radius={251}
                            segments={101}
                        />

                        <meshPhongMaterial
                            bumpScale={0}
                            shininess={3}
                        >
                            <texture url={'yellow.png'}/>
                        </meshPhongMaterial>
                    </mesh>

                    <mesh
                        position={this.state.planets.mars}
                    >
                        <circleGeometry
                            radius={250}
                            segments={100}
                        />

                        <meshPhongMaterial
                            bumpScale={0}
                            shininess={3}
                        >
                            <texture url={'mars.png'}/>
                        </meshPhongMaterial>
                    </mesh>
                    <mesh
                        position={this.state.planets.yurikus}
                    >
                        <circleGeometry
                            radius={251}
                            segments={101}
                        />

                        <meshPhongMaterial
                            bumpScale={0}
                            shininess={3}
                        >
                            <texture url={'yurikus.png'}/>
                        </meshPhongMaterial>
                    </mesh>

                    <mesh
                        position={this.state.planets.magic}
                    >
                        <circleGeometry
                            radius={251}
                            segments={101}
                        />

                        <meshPhongMaterial
                            bumpScale={0}
                            shininess={3}
                        >
                            <texture url={'magic.png'}/>
                        </meshPhongMaterial>
                    </mesh>*/}

                </scene>
            </React3>
        );
    }
}

export default Planet;
