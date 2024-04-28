import picodash from "./picodash";


class SpanDashWidget extends picodash.BaseDashWidget {
    async onData(data) {
        this.innerText = data
    }

    async onDataReady() {
        var x = await this.refresh()
        await this.onData(x)
    }
}
customElements.define("ds-span", SpanDashWidget);



class MeterDashWidget extends picodash.BaseDashWidget {
    async onDataReady() {
        var m = document.createElement("meter")
        this.meter = m
        var cfg = this.getActiveConfig()

        this.meter.min = cfg.min || this.getAttribute("min") || -1
        this.meter.max = cfg.max || this.getAttribute("max") || 1
        this.meter.high = cfg.high || this.getAttribute("high") || 1000000000
        this.meter.low = cfg.low || this.getAttribute("low") || -1000000000
        this.meter.style.width = "100%"
        this.innerHTML = ''
        this.appendChild(m)

        var x = await this.refresh()
        await this.onData(x)
    }

    async onData(data) {
        this.meter.value = data
    }

}

customElements.define("ds-meter", MeterDashWidget);


class InputDashWidget extends picodash.BaseDashWidget {
    async onData(data) {
        this.input.value = data
    }

    async onDataReady() {
        var cfg = this.getActiveConfig()

        this.input = document.createElement("input")
        if (cfg.readonly) {
            this.input.disabled = true
        }

        for (var i of ['min', 'max', 'high', 'low', 'step']) {
            var x = cfg[i] || this.getAttribute("min")

            if (typeof x != 'undefined') {
                this.input[i] = x
            }
        }

        this.input.type = this.getAttribute("type") || 'text'
        this.innerHTML = ''
        this.appendChild(this.input)
        this.style.display = 'contents'

        function f(e) {
            this.pushData(this.input.value)
        }
        this.input.onchange = f.bind(this)
        var x = await this.refresh()
        await this.onData(x)
    }
}
customElements.define("ds-input", InputDashWidget);


class LogWindowDashWidget extends picodash.BaseDashWidget {
    onData(data, timestamp) {
        var v = document.createElement("article")
        var p = document.createElement("p")
        var h = document.createElement("header")

        var d = new Date()
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
        var history = await this.source.getHistory()

        for (var i in history) {
            var v = document.createElement("article")
            var p = document.createElement("p")
            var h = document.createElement("header")

            var d = history[i][0]
            h.innerText = d.toLocaleString()

            var txt = history[i][1]
            txt = await this.runFilterStack(txt)
            p.innerText = txt
            v.appendChild(h)

            v.appendChild(p)
            this.insertAdjacentElement('afterbegin', v)

        }
    }
}
customElements.define("ds-logwindow", LogWindowDashWidget);
