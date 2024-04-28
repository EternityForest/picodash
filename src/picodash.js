// SPDX-License-Identifier: MIT

/* Picodash: A Minimalist dashboard framework
*/

var dataSources = {}
var dataSourceProviders = {}
var filterProviders = {}
var awaitingDataSource = {}


var fully_loaded = [0]


function addFilterProvider(name, cls) {
    filterProviders[name] = cls
}

function whenFullyLoaded(f) {

    if (fully_loaded[0] == 1) {
        f()
        return
    }
    else {
        document.addEventListener("DOMContentLoaded", function (event) {
            f()
        });
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    fully_loaded[0] = 1;
});

function wrapDeferWhenSourceAvailable(name, f) {

    /*Given f, return another function that will call f
     when the data source is available
     */

    // Wrap the function to delay until
    // The page is fully loaded,
    // Even if the data source is available.

    // This is mostly because the filters might not exist.
    // For simplicity, assume filters have no async funny buisiness and
    // Are just hardcoded.

    function deferredWrapper() {


        function runWhenPageLoaded() {
            whenFullyLoaded(function () {
                f();
            })
        }


        var already = [false]

        function make_ds_bg() {
            getDataSource(name);
        }


        function only_once_wrapper() {
            // Make sure we only do this once
            // Since we listen to multiple sources
            if (already[0]) {
                return
            }
            already[0] = true
            runWhenPageLoaded()
        }

        //If data source already exists, just execute
        if (dataSources[name]) {
            only_once_wrapper()
            return
        }


        if (!awaitingDataSource[name]) {
            awaitingDataSource[name] = []
        }
        awaitingDataSource[name].push(only_once_wrapper)


        // If provider that can handle the source exists
        // Make it, it will do the rest when ready
        if (name.includes(":")) {
            if (dataSourceProviders[name.split(':')[0]]) {
                make_ds_bg()
            }

        }

        // Provider not found, we'll listen for it later
        if (name.includes(":")) {
            var pname = name.split(':')[0]
            if (!awaitingDataSource[pname + ":*"]) {
                awaitingDataSource[pname + ":*"] = []
            }
            awaitingDataSource[pname + ":*"].push(make_ds_bg)
        }
    }
    return deferredWrapper
}


function whenSourceAvailable(name, f) {
    /*Runs f when the source is available. Source may be a list of names.
      Empty names are ignored.
    
    */

    if (typeof name == "string") {
        {
            name = [name]
        }
    }

    for (var i of name) {
        i = i || ''
        if (i.length > 0) {
            f = wrapDeferWhenSourceAvailable(i, f)
        }
    }

    f()

}

async function addDataSourceProvider(name, cls) {
    dataSourceProviders[name] = cls
    if (awaitingDataSource[name + ":*"]) {
        while (awaitingDataSource[name + ":*"].length > 0) {
            await awaitingDataSource[name + ":*"].pop()()
        }
    }
}

function getDataSource(ds_name) {
    if (!dataSources[ds_name]) {
        var cls = dataSourceProviders[ds_name.split(':')[0]]
        if (!cls) {
            throw new Error("Unknown data source: " + ds_name)
        }
        var ds = new cls(ds_name, {})
        ds.register()
        ds.autoCreated = true
    }
    return dataSources[ds_name]
}

function getFilter(filter_name, prev_in_chain) {
    // Previous in chain is optional, and may
    // Either be a data source or a filter
    filter_name = filter_name.trim()
    return new filterProviders[filter_name.split(':')[0]](filter_name, {}, prev_in_chain)
}

class DataSource {
    constructor(name, config) {
        if (dataSources[name]) {
            throw new Error("Duplicate data source name: " + name)
        }

        this.name = name
        this.type = "DataSource"
        this.users = []
        this.lastPush = 0

        this.config = config || {}

        this.history = []
    }

    async getData() {
    }

    async getHistory() {
        return this.history
    }
    async register() {

    }

    async ready() {
        dataSources[this.name] = this
        if (awaitingDataSource[this.name]) {
            while (awaitingDataSource[this.name].length > 0) {
                await awaitingDataSource[this.name].pop()()
            }
        }
    }
    subscribe(fn) {
        this.users.push(fn)
    }

    unsubscribe(fn) {
        this.users = this.users.filter(user => user !== fn);

        //If there are still no users after 15s, then we remove the data source
        function f() {
            if (this.users.length == 0) {
                if (this.autoCreated) {
                    this.close()
                    delete picodash.dataSources[this.name]
                }
            }
        }

        if (this._gc_timer) {
            clearInterval(this._gc_timer)
        }
        this._gc_timer = setTimeout(bind(this), 15000)

    }

    async pushData(data) {
        /*
        Used to push data to all interested widgets
        */

        // Fix out of order data
        var n = new Date()

        this.history.push([n, data])
        this.history = this.history.slice(-100)

        if (n < this.lastPush) {
            return
        }

        this.lastPush = n
        for (var i in this.users) {
            await this.users[i](data)
        }
    }

    close() {
    }

}

class Filter {
    constructor(s, cfg, prev) {
        this.config = cfg

        // One read only carries forward
        if (prev) {
            if (prev.config.readonly) {
                this.config.readonly = true
            }
        }

        this.prev = prev
        s = s.split(":")[1]

        while (s.includes("  ")) {
            s = s.replace("  ", " ")
        }
        s = s.trim()
        this.args = s.split(" ")
    }

    async get(unfiltered) {
        // Takes a val in unfiltered format and returns a new one in filtered
        return unfiltered
    }

    async set(val) {
        // Takes a val in filter format and returns a new one in unfiltered
        return val
    }

    async close() {

    }
}







var picodash = {
    dataSources: dataSources,
    whenSourceAvailable: whenSourceAvailable,
    dataSourceProviders: dataSourceProviders,
    getDataSource: getDataSource,
    DataSource: DataSource,
    Filter: Filter,
    getFilter: getFilter,
    addFilterProvider: addFilterProvider,
    addDataSourceProvider: addDataSourceProvider
}



export default picodash