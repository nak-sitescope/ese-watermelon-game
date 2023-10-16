const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.6;
const FRICTION = 0.99;
const BOUNCE = 0.7;
const PARTICLE_COUNT = 100;
const PARTICLE_LIFETIME = 100;

let SCORE = 0;
let isFruitFalling = false;

// const FRUITS = {
//     GRAPE: { color: 'purple', next: 'CHERRY', size: 10 },
//     CHERRY: { color: 'red', next: 'ORANGE', size: 15 },
//     ORANGE: { color: 'orange', next: 'LEMON', size: 20 },
//     LEMON: { color: 'yellow', next: 'KIWI', size: 25 },
//     KIWI: { color: 'green', next: 'TOMATO', size: 30 },
//     TOMATO: { color: 'tomato', next: 'PEACH', size: 35 },
//     PEACH: { color: 'pink', next: 'PINEAPPLE', size: 40 },
//     PINEAPPLE: { color: 'gold', next: 'COCONUT', size: 45 },
//     COCONUT: { color: 'saddlebrown', next: 'WATERMELON', size: 50 },
//     WATERMELON: { color: 'darkred', next: 'BIG_WATERMELON', size: 55 },
//     BIG_WATERMELON: { color: 'red', next: null, size: 60 }
// };

// 省略版
const FRUITS = {
    GRAPE: { color: 'purple', next: 'ORANGE', size: 10 },
    ORANGE: { color: 'orange', next: 'KIWI', size: 20 },
    KIWI: { color: 'green', next: 'PEACH', size: 30 },
    PEACH: { color: 'pink', next: 'COCONUT', size: 40 },
    COCONUT: { color: 'saddlebrown', next: 'WATERMELON', size: 50 },
    WATERMELON: { color: 'darkred', next: 'BIG_WATERMELON', size: 55 },
    BIG_WATERMELON: { color: 'red', next: null, size: 60 }
};

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 1;
        this.speedX = (Math.random() * 3 - 1.5);
        this.speedY = Math.random() * -3;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.lifetime = PARTICLE_LIFETIME;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.lifetime--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.lifetime / PARTICLE_LIFETIME;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createFireworkEffect(x, y) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        particle.draw();

        if (particle.lifetime <= 0) {
            particles.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1; // 透明度を元に戻す
}

canvas.addEventListener('click', (e) => {
    if (isFruitFalling) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = 0;
    const randomFruitType = getRandomFruitType();
    const fruit = new Fruit(randomFruitType, x, y);
    fruits.push(fruit);
});

function getRandomFruitType() {
    const fruitTypes = Object.keys(FRUITS);
    const index = Math.floor(Math.random() * (fruitTypes.length - 1)); 
    return fruitTypes[index];
}

class Fruit {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = FRUITS[this.type].size;
        this.dy = 0;
        this.dx = (x > canvas.width / 2) ? -2 : 2;
        this.framesSinceCreation = 0;
        this.consecutiveSmallDy = 0;
    }

    draw() {
        ctx.fillStyle = FRUITS[this.type].color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, this.x, this.y);
    }

    move() {
        this.framesSinceCreation++;

        const previousY = this.y;
        this.dy += GRAVITY;
        this.dy *= FRICTION;
        this.dx *= FRICTION;
        this.y += this.dy;
        this.x += this.dx;

        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            const sizeFactor = 1 - (this.radius / 60); // 60はBIG_WATERMELONのサイズ
            this.dy = -Math.abs(this.dy * BOUNCE * sizeFactor);
        }    

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.dx = -this.dx;
        }

        if (this.framesSinceCreation > 5) {
            this.detectCollision();
        }

        this.draw();

        if (Math.abs(this.y - previousY) < 0.1) {
            this.consecutiveSmallDy++;
        } else {
            this.consecutiveSmallDy = 0;
        }

        if (this.framesSinceCreation > 30 && this.consecutiveSmallDy > 5 && Math.abs(this.dx) < 0.1) {
            isFruitFalling = false;
        }
    }

    detectCollision() {
        for (let i = 0; i < fruits.length; i++) {
            const other = fruits[i];

            if (this === other) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.radius + other.radius) {
                if (other.type === this.type) {
                    if (this.type === 'BIG_WATERMELON') {
                        fruits.splice(fruits.indexOf(this), 1);
                        fruits.splice(i, 1);
                        SCORE++;
                        createFireworkEffect(this.x, this.y)
                        return;
                    }
                    this.type = FRUITS[this.type].next;
                    this.radius = FRUITS[this.type].size;
                    fruits.splice(i, 1);
                }

                const angle = Math.atan2(dy, dx);
                this.dx = -Math.cos(angle) * 5;
                this.dy = -Math.sin(angle) * 5;
            }
        }
    }
}

let fruits = [];
let particles = [];

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let fruit of fruits) {
        fruit.move();
    }

    updateAndDrawParticles();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Fruits: ${fruits.length}`, canvas.width / 2, canvas.height - 20);
    ctx.fillText(`Score: ${SCORE}`, canvas.width / 2, canvas.height - 40);

    requestAnimationFrame(gameLoop);
}

gameLoop();

var params = (new URL(window.location.href)).searchParams;
if(params.has('demo')) {
    // デモ用
    setInterval(() => {
        const randomX = Math.random() * canvas.width;
        const randomFruitType = getRandomFruitType();
        const fruit = new Fruit(randomFruitType, randomX, 0);
        fruits.push(fruit);
    }, 1000);
}