/**
 * Character controller with Mars gravity
 */

const MARS_GRAVITY = -3.72; // m/s² (Earth = -9.8, Mars = 38%)
const WALK_SPEED = 4;
const RUN_SPEED = 8;
const JUMP_VELOCITY = 5;
const INERTIA_FACTOR = 0.88;

export class CharacterController {
    constructor(astronaut, chunkManager, scene) {
        this.astronaut = astronaut;
        this.chunkManager = chunkManager;
        this.scene = scene;

        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.moveDir = new BABYLON.Vector3(0, 0, 0);
        this.isGrounded = true;
        this.cameraYaw = 0; // Set by camera system

        // Input state
        this.keys = { w: false, a: false, s: false, d: false, shift: false, space: false };

        // Footprint system
        this.lastFootprintPos = new BABYLON.Vector3(0, 0, 0);
        this.footprints = [];
        this.maxFootprints = 100;

        this.setupInput();
    }

    setupInput() {
        const keys = this.keys;
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': keys.w = true; break;
                case 'KeyA': keys.a = true; break;
                case 'KeyS': keys.s = true; break;
                case 'KeyD': keys.d = true; break;
                case 'ShiftLeft': case 'ShiftRight': keys.shift = true; break;
                case 'Space':
                    if (this.isGrounded) {
                        this.velocity.y = JUMP_VELOCITY;
                        this.isGrounded = false;
                        this.astronaut.isJumping = true;
                    }
                    e.preventDefault();
                    break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': keys.w = false; break;
                case 'KeyA': keys.a = false; break;
                case 'KeyS': keys.s = false; break;
                case 'KeyD': keys.d = false; break;
                case 'ShiftLeft': case 'ShiftRight': keys.shift = false; break;
            }
        });
    }

    update(deltaTime) {
        const { keys, astronaut } = this;
        const isRunning = keys.shift;
        const speed = isRunning ? RUN_SPEED : WALK_SPEED;

        // Movement direction relative to camera
        let inputX = 0, inputZ = 0;
        if (keys.w) inputZ += 1;
        if (keys.s) inputZ -= 1;
        if (keys.a) inputX -= 1;
        if (keys.d) inputX += 1;

        const hasInput = inputX !== 0 || inputZ !== 0;

        if (hasInput) {
            // Normalize
            const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
            inputX /= len;
            inputZ /= len;

            // Rotate by camera yaw
            const cos = Math.cos(this.cameraYaw);
            const sin = Math.sin(this.cameraYaw);
            const worldX = inputX * cos + inputZ * sin;
            const worldZ = -inputX * sin + inputZ * cos;

            this.moveDir.set(worldX * speed, 0, worldZ * speed);

            // Rotate character to face movement direction
            const targetAngle = Math.atan2(worldX, worldZ);
            let currentAngle = astronaut.getRotationY();
            let diff = targetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            astronaut.setRotationY(currentAngle + diff * 0.15);
        } else {
            this.moveDir.set(0, 0, 0);
        }

        // Apply inertia
        this.velocity.x = this.velocity.x * INERTIA_FACTOR + this.moveDir.x * (1 - INERTIA_FACTOR);
        this.velocity.z = this.velocity.z * INERTIA_FACTOR + this.moveDir.z * (1 - INERTIA_FACTOR);

        // Gravity
        if (!this.isGrounded) {
            this.velocity.y += MARS_GRAVITY * deltaTime;
        }

        // Apply velocity
        const pos = astronaut.getPosition();
        pos.x += this.velocity.x * deltaTime;
        pos.y += this.velocity.y * deltaTime;
        pos.z += this.velocity.z * deltaTime;

        // Ground collision
        const groundHeight = this.chunkManager.getHeightAt(pos.x, pos.z);
        if (pos.y <= groundHeight) {
            pos.y = groundHeight;
            this.velocity.y = 0;
            this.isGrounded = true;
            astronaut.isJumping = false;
        }

        astronaut.setPosition(pos.x, pos.y, pos.z);

        // Update animation state
        const hSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        astronaut.isWalking = hSpeed > 0.5;
        astronaut.isRunning = isRunning && astronaut.isWalking;

        // Footprints
        if (this.isGrounded && astronaut.isWalking) {
            const dist = BABYLON.Vector3.Distance(pos, this.lastFootprintPos);
            if (dist > 1.5) {
                this.addFootprint(pos.x, groundHeight + 0.01, pos.z, astronaut.getRotationY());
                this.lastFootprintPos.copyFrom(pos);
            }
        }

        // Fade footprints
        this.updateFootprints(deltaTime);
    }

    addFootprint(x, y, z, rotation) {
        const fp = BABYLON.MeshBuilder.CreateGround('footprint', { width: 0.3, height: 0.5 }, this.scene);
        fp.position.set(x, y, z);
        fp.rotation.y = rotation;
        const mat = new BABYLON.StandardMaterial('fpMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.45, 0.28, 0.18);
        mat.specularColor = BABYLON.Color3.Black();
        mat.alpha = 0.6;
        fp.material = mat;
        fp.isPickable = false;

        this.footprints.push({ mesh: fp, life: 15 }); // 15 seconds fade

        // Remove oldest if over limit
        if (this.footprints.length > this.maxFootprints) {
            const old = this.footprints.shift();
            old.mesh.material.dispose();
            old.mesh.dispose();
        }
    }

    updateFootprints(deltaTime) {
        for (let i = this.footprints.length - 1; i >= 0; i--) {
            const fp = this.footprints[i];
            fp.life -= deltaTime;
            fp.mesh.material.alpha = Math.max(0, fp.life / 15) * 0.6;
            if (fp.life <= 0) {
                fp.mesh.material.dispose();
                fp.mesh.dispose();
                this.footprints.splice(i, 1);
            }
        }
    }
}
