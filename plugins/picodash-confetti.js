/* MIT License by Daniel Dunn

This file needs canvas-confetti to be added globally
in a script tag: https://www.kirilv.com/canvas-confetti/

*/
import picodash from "picodash"

class Confetti extends picodash.Filter {
    constructor(s, cfg, prev) {
        super(s, cfg, prev)
        if (prev) {
            this.config = prev.config
        }
        this.lastData = null

        this.str = s.split(":")[1].trim()
    }

    stars() {
        var defaults = {
            spread: 360,
            ticks: 50,
            gravity: 0,
            decay: 0.94,
            startVelocity: 30,
            colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
        };

        function shoot() {
            confetti({
                ...defaults,
                particleCount: 40,
                scalar: 1.2,
                shapes: ['star'],
                origin: { y: 0.3 }

            });

            confetti({
                ...defaults,
                particleCount: 10,
                scalar: 0.75,
                shapes: ['circle'],
                origin: { y: 0.3 }

            });
        }

        setTimeout(shoot, 0);
        setTimeout(shoot, 100);
        setTimeout(shoot, 200);
    }
    fireConfetti() {
        var count = 200;
        var defaults = {
            origin: { y: 0.3 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    async notify() {
        picodash.snackbar.createSnackbar(this.str, { timeout: 5000 })
    }

    async get(unfiltered) {
        // Convert from unfiltered to filtered

        if (this.lastData != null) {
            if (this.lastData != unfiltered) {
                if (this.str == 'stars') {
                    this.stars()
                }
                else {
                    this.fireConfetti()
                }
            }
        }

        this.lastData = unfiltered
        return this.lastData
    }

    async set(val) {
        return (await this.get(val))
    }
}


picodash.addFilterProvider('confetti', Confetti)