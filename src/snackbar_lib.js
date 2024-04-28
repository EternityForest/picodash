/*@copyright
Modified from https://snackbar.egoist.dev/

The MIT License (MIT)

Copyright (c) EGOIST <0x142857@gmail.com> (https://egoist.sh)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.snackbar = {}));
}(this, function (exports) {
    'use strict';

    function _call(body, then, direct) {
        if (direct) {
            return then ? then(body()) : body();
        }

        try {
            var result = Promise.resolve(body());
            return then ? result.then(then) : result;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    function _invokeIgnored(body) {
        var result = body();

        if (result && result.then) {
            return result.then(_empty);
        }
    }

    function _empty() { }

    function _await(value, then, direct) {
        if (direct) {
            return then ? then(value) : value;
        }

        if (!value || !value.then) {
            value = Promise.resolve(value);
        }

        return then ? value.then(then) : value;
    }
    var instances = {
        left: [],
        center: [],
        right: []
    };
    var instanceStackStatus = {
        left: true,
        center: true,
        right: true
    };
    var themes = {
        light: {
            backgroundColor: '#fff',
            textColor: '#000',
            actionColor: '#008000'
        },
        dark: {}
    };
    var Snackbar = function Snackbar(message, options) {
        var this$1 = this;
        if (options === void 0) options = {};

        var timeout = options.timeout; if (timeout === void 0) timeout = 0;
        var actions = options.actions; if (actions === void 0) actions = [{
            text: 'dismiss',
            callback: function () { return this$1.destroy(); }
        }];
        var position = options.position; if (position === void 0) position = 'center';
        var theme = options.theme; if (theme === void 0) theme = 'dark';
        var maxStack = options.maxStack; if (maxStack === void 0) maxStack = 3;
        this.message = message;
        this.options = {
            timeout: timeout,
            actions: actions,
            position: position,
            maxStack: maxStack,
            theme: typeof theme === 'string' ? themes[theme] : theme
        };
        this.wrapper = this.getWrapper(this.options.position);
        this.insert();
        instances[this.options.position].push(this);
        this.stack();
    };

    var prototypeAccessors = { theme: { configurable: true } };

    prototypeAccessors.theme.get = function () {
        return this.options.theme;
    };

    Snackbar.prototype.getWrapper = function getWrapper(position) {
        var wrapper = document.querySelector((".snackbars-" + position));

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = "snackbars snackbars-" + position;
            document.body.appendChild(wrapper);
        }

        return wrapper;
    };

    Snackbar.prototype.insert = function insert() {
        var this$1 = this;

        var el = document.createElement('div');
        el.className = 'snackbar';
        el.setAttribute('aria-live', 'assertive');
        el.setAttribute('aria-atomic', 'true');
        el.setAttribute('aria-hidden', 'false');
        var ref = this.theme;
        var backgroundColor = ref.backgroundColor;
        var textColor = ref.textColor;
        var boxShadow = ref.boxShadow;
        var actionColor = ref.actionColor;
        var container = document.createElement('div');
        container.className = 'snackbar--container';

        if (backgroundColor) {
            container.style.backgroundColor = backgroundColor;
        }

        if (textColor) {
            container.style.color = textColor;
        }

        if (boxShadow) {
            container.style.boxShadow = boxShadow;
        }

        el.appendChild(container); // Append message

        var text = document.createElement('div');
        text.className = 'snackbar--text';

        if (typeof this.message === 'string') {
            text.textContent = this.message;
        } else {
            text.appendChild(this.message);
        }

        container.appendChild(text); // Add action buttons

        if (this.options.actions) {
            var loop = function () {
                var action = list[i];

                var style = action.style;
                var text$1 = action.text;
                var callback = action.callback;
                var button = document.createElement('button');
                button.className = 'snackbar--button';
                button.innerHTML = text$1;

                if (actionColor) {
                    button.style.color = actionColor;
                }

                if (style) {
                    Object.keys(style).forEach(function (key) {
                        button.style[key] = style[key];
                    });
                }

                button.addEventListener('click', function () {
                    this$1.stopTimer();

                    if (callback) {
                        callback(button, this$1);
                    } else {
                        this$1.destroy();
                    }
                });
                container.appendChild(button);
            };

            for (var i = 0, list = this$1.options.actions; i < list.length; i += 1) loop();
        }

        this.startTimer();
        el.addEventListener('mouseenter', function () {
            this$1.expand();
        });
        el.addEventListener('mouseleave', function () {
            this$1.stack();
        });
        this.el = el;
        this.wrapper.appendChild(el);
    };

    Snackbar.prototype.stack = function stack() {
        var this$1 = this;

        instanceStackStatus[this.options.position] = true;
        var positionInstances = instances[this.options.position];
        var l = positionInstances.length - 1;
        positionInstances.forEach(function (instance, i) {
            // Resume all instances' timers if applicable
            instance.startTimer();
            var el = instance.el;

            if (el) {
                el.style.transform = "translate3d(0, -" + ((l - i) * 15) + "px, -" + (l - i) + "px) scale(" + (1 - 0.05 * (l - i)) + ")";
                var hidden = l - i >= this$1.options.maxStack;
                this$1.toggleVisibility(el, hidden);
            }
        });
    };

    Snackbar.prototype.expand = function expand() {
        var this$1 = this;

        instanceStackStatus[this.options.position] = false;
        var positionInstances = instances[this.options.position];
        var l = positionInstances.length - 1;
        positionInstances.forEach(function (instance, i) {
            // Stop all instances' timers to prevent destroy
            instance.stopTimer();
            var el = instance.el;

            if (el) {
                el.style.transform = "translate3d(0, -" + ((l - i) * el.clientHeight) + "px, 0) scale(1)";
                var hidden = l - i >= this$1.options.maxStack;
                this$1.toggleVisibility(el, hidden);
            }
        });
    };

    Snackbar.prototype.toggleVisibility = function toggleVisibility(el, hidden) {
        if (hidden) {
            this.visibilityTimeoutId = window.setTimeout(function () {
                el.style.visibility = 'hidden';
            }, 300);
            el.style.opacity = '0';
        } else {
            if (this.visibilityTimeoutId) {
                clearTimeout(this.visibilityTimeoutId);
                this.visibilityTimeoutId = undefined;
            }

            el.style.opacity = '1';
            el.style.visibility = 'visible';
        }
    };
    /**
     * Destory the snackbar
     */


    Snackbar.prototype.destroy = function destroy() {
        var _this = this;

        return _call(function () {
            var el = _this.el;
            var wrapper = _this.wrapper;
            return _invokeIgnored(function () {
                if (el) {
                    // Animate the snack away.
                    el.setAttribute('aria-hidden', 'true');
                    return _await(new Promise(function (resolve) {
                        var eventName = getAnimationEvent(el);

                        if (eventName) {
                            el.addEventListener(eventName, function () { return resolve(); });
                        } else {
                            resolve();
                        }
                    }), function () {
                        wrapper.removeChild(el); // Remove instance from the instances array

                        var positionInstances = instances[_this.options.position];
                        var index = undefined;

                        for (var i = 0; i < positionInstances.length; i++) {
                            if (positionInstances[i].el === el) {
                                index = i;
                                break;
                            }
                        }

                        if (index !== undefined) {
                            positionInstances.splice(index, 1);
                        } // Based on current status, refresh stack or expand style


                        if (instanceStackStatus[_this.options.position]) {
                            _this.stack();
                        } else {
                            _this.expand();
                        }
                    });
                }
            });
        });
    };

    Snackbar.prototype.startTimer = function startTimer() {
        var this$1 = this;

        if (this.options.timeout && !this.timeoutId) {
            this.timeoutId = self.setTimeout(function () { return this$1.destroy(); }, this.options.timeout);
        }
    };

    Snackbar.prototype.stopTimer = function stopTimer() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    };

    Object.defineProperties(Snackbar.prototype, prototypeAccessors);

    function getAnimationEvent(el) {
        var animations = {
            animation: 'animationend',
            OAnimation: 'oAnimationEnd',
            MozAnimation: 'Animationend',
            WebkitAnimation: 'webkitAnimationEnd'
        };

        for (var i = 0, list = Object.keys(animations); i < list.length; i += 1) {
            var key = list[i];

            if (el.style[key] !== undefined) {
                return animations[key];
            }
        }

        return;
    }

    function createSnackbar(message, options) {
        return new Snackbar(message, options);
    }
    function destroyAllSnackbars() {
        var instancesArray = [];
        Object.keys(instances).map(function (position) { return instances[position]; }).forEach(function (positionInstances) { return instancesArray.push.apply(instancesArray, positionInstances); });
        return Promise.all(instancesArray.map(function (instance) { return instance.destroy(); }));
    }

    exports.Snackbar = Snackbar;
    exports.createSnackbar = createSnackbar;
    exports.destroyAllSnackbars = destroyAllSnackbars;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

export default snackbar