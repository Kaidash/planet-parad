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
import React3 from 'react-three-renderer';
import { findTHREEObject } from 'react-three-renderer/lib/React3Renderer';

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

    // Distance
    _renderDistance = 100000;
    _planetToPlanetDistance = 5000;
    _cameraToPlanetDistance = 750;

    _planetRadius = 251;

    // Offset
    _xOffset = 400;
    _yOffset = -300;

    _planetsCount = 5;

    _currentPlanet = 0;

    // Need for moving
    _currentPosX;
    _currentPosY;
    _currentPosZ;

    _nextPosX;
    _nextPosY;
    _nextPosZ;

    _direction;

    _moving = false;
    _arg = 0;

    constructor(props, context) {
        super(props, context);

        this._planetsCount = planets.length;
        this._renderDistance = this._planetsCount * this._planetToPlanetDistance / 2;
        this._currentPosZ = this._planetsCount * this._planetToPlanetDistance + this._cameraToPlanetDistance - this._planetToPlanetDistance;
        this._currentPlanet = this._planetsCount - 1;

        // Planet Cords
        this._calculatePlanetXCord = this._calculatePlanetXCord.bind(this);
        this._calculatePlanetYCord = this._calculatePlanetYCord.bind(this);
        this._calculatePlanetZCord = this._calculatePlanetZCord.bind(this);

        let _planets = planets.map( (planet, index) => {
            return {
                cords: new THREE.Vector3(
                    this._calculatePlanetXCord( index ),
                    this._calculatePlanetYCord( index ),
                    this._calculatePlanetZCord( index )
                ),
                radius: index < this._planetsCount - 2 ? 1 : this._planetRadius,
                texture: planet + '.png'
            }
        });

        this._nextPosX = this._calculatePlanetXCord( this._planetsCount - 1 ) - this._xOffset;
        this._nextPosY = this._calculatePlanetYCord( this._planetsCount - 1 ) - this._yOffset;
        this._nextPosZ = this._calculatePlanetZCord( this._planetsCount - 1 ) + this._cameraToPlanetDistance;

        this.handleMouseWheel = this.handleMouseWheel.bind(this);
        this._onAnimate = this._onAnimate.bind(this);
        this._canMove = this._canMove.bind(this);
        this._getSpeedCofficient = this._getSpeedCofficient.bind(this);
        this._getCurrentCord = this._getCurrentCord.bind(this);
        this._setNextCords = this._setNextCords.bind(this);
        this._getScale = this._getScale.bind(this);

        this.state = {
            light: {
                direction: new THREE.Vector3(0, 0, 0),
                position: new THREE.Vector3(0, 0, 450)
            },
            position: {
                camera: new THREE.Vector3(0, 0, this._currentPosZ),
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

        camera.add(glow, backGlow);

        camera.add(light);
        light.position.copy(this.state.position.camera);
    }

    /*
     * Cords Calculators
     * */

    _calculatePlanetXCord( index ) {
        return this._xOffset - 300 * Math.pow(this._planetsCount - index - 1, 1.5)
    }

    _calculatePlanetYCord( index ) {
        return this._yOffset + 500 * Math.pow(this._planetsCount - index - 1, 1.5)
    }

    _calculatePlanetZCord( index ) {
        return index * this._planetToPlanetDistance
    }

    // handlers

    handleMouseWheel( event ) {
        if( !this._moving ) {
            this._moving = true;

            const e = window.event || event;
            const direction = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

            if( !this._canMove( direction ) ) return;

            this._direction = direction;

            this._currentPosX = this._calculatePlanetXCord( this._currentPlanet ) - this._xOffset;
            this._currentPosY = this._calculatePlanetYCord( this._currentPlanet ) - this._yOffset;
            this._currentPosZ = this._calculatePlanetZCord( this._currentPlanet ) + this._cameraToPlanetDistance;

            this._currentPlanet -= direction;

            this._nextPosX = this._calculatePlanetXCord( this._currentPlanet ) - this._xOffset;
            this._nextPosY = this._calculatePlanetYCord( this._currentPlanet ) - this._yOffset;
            this._nextPosZ = this._calculatePlanetZCord( this._currentPlanet ) + this._cameraToPlanetDistance;
        }
    }

    _canMove( direction ) {
        return this._currentPlanet > 0 && direction > 0 || this._currentPlanet < this._planetsCount - 1 && direction < 0;
    }

    _onAnimate() {
        let camera = this.refs.camera;

        if( camera.position.z != this._nextPosZ && this._arg < 40 ) {
            this._setNextCords( camera );
        }
        else {
            this._arg = 0;

            camera.position.x = this._nextPosX;
            camera.position.y = this._nextPosY;
            camera.position.z = this._nextPosZ;

            if ( this._currentPlanet > 0 && this._direction == 1 || this._direction == -1 && this._currentPlanet > 1 ) {
                let newRad = this._direction == 1 ? this._planetRadius : 1;
                React3.findTHREEObject(this.refs[ `planet${ this._currentPlanet - (this._direction == 1 ? 1 : 2)}` ]).scale.set( newRad, newRad, newRad );
            }

            this._moving = false;
        }
    }

    _getSpeedCofficient( ) {
        return ( Math.atan( this._arg - 20 ) + 1.5208 ) / 3.0416
    }

    _setNextCords( camera ) {
        this._arg += 0.25;

        camera.position.x = this._getCurrentCord( this._currentPosX, this._nextPosX );
        camera.position.y = this._getCurrentCord( this._currentPosY, this._nextPosY );
        camera.position.z = this._getCurrentCord( this._currentPosZ, this._nextPosZ );

        if ( this._currentPlanet > 0 && this._direction == 1 || this._direction == -1 && this._currentPlanet > 1 ) {
            console.log(this._direction);
            console.log(this._currentPlanet);
            console.log(this._currentPlanet - (this._direction == 1 ? 1 : 2));
            let newRad = this._getScale();
            React3.findTHREEObject(this.refs[ `planet${ this._currentPlanet - (this._direction == 1 ? 1 : 2)}` ]).scale.set( newRad, newRad, newRad );
        }

        camera.updateProjectionMatrix();
    }

    _getCurrentCord(current, next) {
        return current + ( next - current ) * this._getSpeedCofficient()
    }

    _getScale() {
        return this._direction == 1 ?
               this._getSpeedCofficient() * this._planetRadius :
               this._planetRadius - this._getSpeedCofficient() * this._planetRadius
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
                                ref={ `planet${ index }` }
                                key={ index }
                                position={ planet.cords }
                            >
                                <circleGeometry
                                    radius={ planet.radius }
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
