import picodash from "./picodash";

class BaseDashWidget extends HTMLElement {
    onData(data) {

    }

    onExtraData(src, data) {

    }

    _subscribeToExtraSource(srcname) {
        var s = this.extraSources[srcname]
        function f(data) {
            this.onExtraData(srcname, data)
        }
        this.extraSourceSubscribers[srcname] = f
        s.subscribe(f.bind(this))
    }

    connectedCallback() {
        this.innerHTML = "Awating Data Source"
        async function f() {
            this.source = picodash.getDataSource(this.getAttribute("source"))

            this.extraSources = {}
            this.extraSourceSubscribers = {}


            for (i of this.getAttributeNames()) {
                if (i.startsWith("source-")) {
                    var srcname = i.replace("source-", "")
                    this.extraSources[srcname] = picodash.getDataSource(this.getAttribute(i))
                    this._subscribeToExtraSource(srcname)
                }
            }

            this.filterStack = []
            var prev_filter = this.source

            if (this.getAttribute("filter")) {
                var fs = this.getAttribute("filter").split("|")
                for (var i in fs) {
                    prev_filter = picodash.getFilter(fs[i], prev_filter)
                    this.filterStack.push(prev_filter)
                }
            }

            async function f(data) {
                data = await this.runFilterStack(data)
                await this.onData(data)
            }

            this.setterFunc = f.bind(this)


            async function push(newValue) {
                var d = await this.runFilterStackReverse(newValue)
                await this.source.pushData(d)
            }

            this.pushData = push.bind(this)
            this.source.subscribe(this.setterFunc)
            this.onDataReady()
        }
        f = f.bind(this)

        var wait_for = []

        // Get all the sources including the main one,
        // And wait for them to be ready

        for (var i of this.getAttributeNames()) {
            if (i.startsWith("source-")) {
                wait_for.push(this.getAttribute(i))
            }

        }
        wait_for.push(this.getAttribute("source"))
        picodash.whenSourceAvailable(wait_for, f)

    }


    async runFilterStackReverse(data) {
        for (var i in this.filterStack) {
            data = await this.filterStack[this.filterStack.length - 1 - i].set(data)
        }
        return data
    }

    async runFilterStack(data) {
        for (var i in this.filterStack) {
            data = await this.filterStack[i].get(data)
        }
        return data
    }

    getActiveConfig() {
        /*Return the config of either the top filter in the stack,
        or the source, if there are no filters.
        */
        if (this.filterStack.length > 0) {
            return this.filterStack[this.filterStack.length - 1].config
        }
        else {
            return this.source.config
        }

    }

    disconnectedCallback() {
        this.source.unsubscribe(this.setterFunc)
        for (i in this.filterStack) {
            this.filterStack[i].close()
        }
        for (i in this.extraSources) {
            this.extraSources[i].unsubscribe(this.extraSourceSubscribers[i])
        }
    }

    async refresh() {
        var data = await this.source.getData();
        data = await this.runFilterStack(data)
        return data
    }
}

picodash.BaseDashWidget = BaseDashWidget
export default BaseDashWidget