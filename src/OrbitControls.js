/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finger swipe

/* eslint-disable */

import * as THREE from 'three';

THREE.OrbitControls = function ( object, domElement ) {

    this.object = object;

    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the object orbits around
    this.target = new THREE.Vector3();

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = 0;
    this.maxZoom = Infinity;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    this.minAzimuthAngle = - Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false;
    this.dampingFactor = 0.25;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    // Set to false to disable rotating
    this.enableRotate = false;

    // Set to false to disable panning
    this.enablePan = true;

    this.autoRotate = false;

    // Set to false to disable use of the keys
    this.enableKeys = false;

    // The four arrow keys
    // this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

    // Mouse buttons
    // this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    //
    // public methods
    //

    this.getPolarAngle = function () {
        return spherical.phi;
    };

    this.getAzimuthalAngle = function () {
        return spherical.theta;
    };

    this.reset = function () {
        scope.target.copy( scope.target0 );
        scope.object.position.copy( scope.position0 );
        scope.object.zoom = scope.zoom0;

        scope.object.updateProjectionMatrix();
        scope.dispatchEvent( changeEvent );

        scope.update();
        state = STATE.NONE;
    };

    // this method is exposed, but perhaps it would be better if we can make it private...
    this.update = function () {
        let offset = new THREE.Vector3();

        // so camera.up is the orbit axis
        let quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
        let quatInverse = quat.clone().inverse();

        let lastPosition = new THREE.Vector3();
        let lastQuaternion = new THREE.Quaternion();

        return function update() {

            let position = scope.object.position;

            offset.copy( position ).sub( scope.target );

            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion( quat );

            // angle from z-axis around y-axis
            spherical.setFromVector3( offset );

            if ( scope.autoRotate && state === STATE.NONE ) {

                rotateLeft( getAutoRotationAngle() );

            }

            spherical.theta += sphericalDelta.theta;
            spherical.phi += sphericalDelta.phi;

            // restrict theta to be between desired limits
            spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

            // restrict phi to be between desired limits
            spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

            spherical.makeSafe();


            spherical.radius *= scale;

            // restrict radius to be between desired limits
            spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

            // move target to panned location
            scope.target.add( panOffset );

            offset.setFromSpherical( spherical );

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion( quatInverse );

            position.copy( scope.target ).add( offset );

            scope.object.lookAt( scope.target );

            if ( scope.enableDamping === true ) {

                sphericalDelta.theta *= ( 1 - scope.dampingFactor );
                sphericalDelta.phi *= ( 1 - scope.dampingFactor );

            } else {

                sphericalDelta.set( 0, 0, 0 );

            }

            scale = 1;
            panOffset.set( 0, 0, 0 );

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8

            if ( zoomChanged ||
                lastPosition.distanceToSquared( scope.object.position ) > EPS ||
                8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

                scope.dispatchEvent( changeEvent );

                lastPosition.copy( scope.object.position );
                lastQuaternion.copy( scope.object.quaternion );
                zoomChanged = false;

                return true;
            }

            return false;
        };
    }();

    this.dispose = function () {

        scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
        scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
        scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

        scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
        scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
        scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );

        window.removeEventListener( 'keydown', onKeyDown, false );

        //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

    };

    //
    // internals
    //

    let scope = this;

    let changeEvent = { type: 'change' };
    let startEvent = { type: 'start' };
    let endEvent = { type: 'end' };

    let STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };

    let state = STATE.NONE;

    let EPS = 0.000001;

    // current position in spherical coordinates
    let spherical = new THREE.Spherical();
    let sphericalDelta = new THREE.Spherical();

    let scale = 1;
    let panOffset = new THREE.Vector3();
    let zoomChanged = false;

    // mb we need this
    function getZoomScale() {
        return Math.pow( 0.95, scope.zoomSpeed );
    }

    function dollyIn( dollyScale ) {
        if ( scope.object instanceof THREE.PerspectiveCamera ) {
            scale /= dollyScale;
        } else if ( scope.object instanceof THREE.OrthographicCamera ) {
            scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
            scope.object.updateProjectionMatrix();
            zoomChanged = true;
        } else {
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
            scope.enableZoom = false;
        }
    }

    function dollyOut( dollyScale ) {
        if ( scope.object instanceof THREE.PerspectiveCamera ) {
            scale *= dollyScale;
        } else if ( scope.object instanceof THREE.OrthographicCamera ) {
            scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
            scope.object.updateProjectionMatrix();
            zoomChanged = true;
        } else {
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
            scope.enableZoom = false;
        }
    }

    //
    // event callbacks - update the object state
    //

    function handleMouseWheel( event ) {
        if ( event.deltaY < 0 ) {
            dollyOut( getZoomScale() );
        } else if ( event.deltaY > 0 ) {
            dollyIn( getZoomScale() );
        }
        scope.update();
    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    function onMouseWheel( event ) {
        console.log('asdasdasd');
        if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

        event.preventDefault();
        event.stopPropagation();

        handleMouseWheel( event );

        scope.dispatchEvent( startEvent );
        scope.dispatchEvent( endEvent );

    }

    function onKeyDown( event ) {
        if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;
        handleKeyDown( event );
    }

    function onContextMenu( event ) {
        event.preventDefault();
    }

    scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
    scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

    this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties( THREE.OrbitControls.prototype, {
    center: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
            return this.target;
        }
    },

    // backward compatibility

    noZoom: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
            return ! this.enableZoom;
        },
        set: function ( value ) {
            console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
            this.enableZoom = ! value;
        }
    },

    noRotate: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
            return ! this.enableRotate;
        },
        set: function ( value ) {
            console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
            this.enableRotate = ! value;
        }
    },

    noPan: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
            return ! this.enablePan;
        },
        set: function ( value ) {
            console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
            this.enablePan = ! value;
        }
    },

    noKeys: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
            return ! this.enableKeys;
        },
        set: function ( value ) {
            console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
            this.enableKeys = ! value;
        }
    },

    staticMoving: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
            return ! this.enableDamping;
        },
        set: function ( value ) {
            console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
            this.enableDamping = ! value;
        }
    },

    dynamicDampingFactor: {
        get: function () {
            console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
            return this.dampingFactor;
        },
        set: function ( value ) {
            console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
            this.dampingFactor = value;
        }
    }

} );