import picodash from './picodash'
import BaseDashWidget from './widgetclass'

class ButtonDashWidget extends BaseDashWidget {
    async onData(data) {
        try {
            this.data = parseFloat(data)
        } catch (e) {
            console.log(e)
        }
    }

    async onDataReady() {
        this.innerHTML = ''
        this.appendChild(this.buttonEl)

        this.dummy = () => { }

        const x = await this.refresh()
        await this.onData(x)
    }

    connectedCallback() {
        const x = []
        const b = document.createElement('button')
        this.buttonEl = b

        // Move elements *before* the superclass adds the placeholder.
        for (var i of this.childNodes) {
            x.push(i)
        }
        for (var i of x) {
            this.removeChild(i)
            this.buttonEl.appendChild(i)
        }

        super.connectedCallback()

        b.onclick = async () => {
            if (this.extraSources.pressed) {
                v = await this.extraSources.pressed.getData()
            } else {
                var v = this.data + 1
            }

            await this.pushData(v)
        }
        this.appendChild(b)

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes.length) {
                    for (const n of mutation.addedNodes) {
                        if (n.nodeName != 'BUTTON') {
                            this.removeChild(n)
                            this.buttonEl.appendChild(n)
                        }
                    }
                }
            })
        })

        observer.observe(this, { childList: true })
    }
}
customElements.define('ds-button', ButtonDashWidget)

class SpanDashWidget extends BaseDashWidget {
    async onData(data) {
        let unit = this.getActiveConfig().unit || ''
        this.innerText = data + unit
    }

    async onDataReady() {
        const x = await this.refresh()
        await this.onData(x)
    }
}
customElements.define('ds-span', SpanDashWidget)

class MeterDashWidget extends BaseDashWidget {
    async onDataReady() {
        const m = document.createElement('meter')
        this.meter = m
        const cfg = this.getActiveConfig()

        this.meter.min = cfg.min || this.getAttribute('min') || -1
        this.meter.max = cfg.max || this.getAttribute('max') || 1
        this.meter.high = cfg.high || this.getAttribute('high') || 1000000000
        this.meter.low = cfg.low || this.getAttribute('low') || -1000000000
        this.meter.style.width = '100%'
        this.innerHTML = ''
        this.appendChild(m)

        const x = await this.refresh()
        await this.onData(x)
    }

    async onData(data) {
        this.meter.value = data
    }
}

customElements.define('ds-meter', MeterDashWidget)

class InputDashWidget extends picodash.BaseDashWidget {
    async onData(data) {
        if (this.input.type == 'checkbox') {
            if (data == true) {
                data = true
            }
            else if (data == false) {
                data = false
            }
            else {
                data = parseFloat(data) > 0
            }
            this.input.checked = data
        }
        else {
            if (data == true) {
                data = 1
            }
            if (data == false) {
                data = 0
            }
            this.input.value = data
        }
        this.lastVal = data
    }

    async onDataReady() {
        const cfg = this.getActiveConfig()

        this.input = document.createElement('input')
        if (cfg.readonly) {
            this.input.disabled = true
        }

        for (const i of ['min', 'max', 'high', 'low', 'step']) {
            var x = cfg[i] || this.getAttribute('min')

            if (typeof x !== 'undefined') {
                this.input[i] = x
            }
        }

        this.input.className = this.className || ''
        this.className = ''

        this.input.type = this.getAttribute('type') || 'text'
        this.input.disabled = this.getAttribute('disabled') || false
        this.input.placeholder = this.getAttribute('placeholder') || ''

        if (this.getAttribute('list')) {
            this.input.list = this.getAttribute('list') || ''
        }

        this.innerHTML = ''
        this.appendChild(this.input)
        this.style.display = 'contents'

        async function f(e) {
            let v = null

            if (this.input.type == 'checkbox') {
                v = this.input.checked
            }
            else {
                v = this.input.value
            }

            if (this.input.type == 'number') {
                v = parseFloat(v)
            }

            if (this.input.type == 'checkbox') {
                if (v == true) {
                    v = true
                }
                else if (v == false) {
                    v = false
                }
                else {
                    v = parseFloat(v) > 0
                }
            }

            // Get before set, some filters need to know the latest value
            await this.refresh()
            let rc = await this.pushData(v)

            // Setting failed, return to the last good value
            if (rc == null) {
                if (this.input.type == 'checkbox') {
                    this.input.checked = this.lastVal
                }
                else {
                    this.input.value = this.lastVal
                }
            }
        }
        this.input.onchange = f.bind(this)
        var x = await this.refresh()
        await this.onData(x)
    }
}
customElements.define('ds-input', InputDashWidget)

class LogWindowDashWidget extends BaseDashWidget {
    onData(data, timestamp) {
        const v = document.createElement('article')
        const p = document.createElement('p')
        const h = document.createElement('header')

        const d = new Date()
        h.innerText = d.toLocaleString()
        p.innerText = data
        v.appendChild(h)

        v.appendChild(p)

        this.insertBefore(v, this.children[0])

        if (this.childElementCount > 100) {
            this.removeChild(this.children[this.childElementCount - 1])
        }
    }

    async onDataReady() {
        this.innerHTML = ''
        const history = await this.source.getHistory()

        for (const i in history) {
            const v = document.createElement('article')
            const p = document.createElement('p')
            const h = document.createElement('header')

            const d = history[i][0]
            h.innerText = d.toLocaleString()

            let txt = history[i][1]
            txt = await this.runFilterStack(txt)
            if (txt == null || txt === undefined) {
                continue
            }

            p.innerText = txt
            v.appendChild(h)

            v.appendChild(p)
            this.insertAdjacentElement('afterbegin', v)
        }
    }
}
customElements.define('ds-logwindow', LogWindowDashWidget)
