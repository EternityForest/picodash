# Picodash: A very minimal dashboard framework


See the [Demo!](https://eternityforest.github.io/picodash/)

Picodash is a library for making dashboards.  It connects widgets to data sources,
letting you build your dashboard in simple HTML.  

Currently under 3k min+zip!

It comes with some simple widgets and data sources, and makes it very easy to build more.

Consider this a pre-alpha experiment.  Breaking changes are very likely.


The demo page uses [Barrel.css](https://eternityforest.github.io/barrel.css/)
for visual styling, but the base element set is independent of any particular CSS
framework.


```html
<script src="./dist/picodash-base.esm.js"></script>

<label>Random:
    <ds-span source="random:"></ds-span>
</label>

```

## Data Sources

A Data Source is an object that lets you subscribe to changes in data.
It has a type string indicating what other features it supports.

Names are globally unique, and can be made implicitly on-demand.

Names for on-demand sources always take the form of \<provider\>:\<name\>

A data source provider is simply a class that inherits from DataSource.

Data sources are made on-demand, and destroyed when the last subscribed
listener is unsubscribed.

Data sources are writable, so you can have control widgets, not just displays.

### Manually Creating them

A data souce can also be made manually:

```js
var ds1 = new picodash.SimpleVariableDataSource("myDataSource", {})
await ds1.register()
await ds1.pushData(90)
```

Note that registering a data source is async.  This is because data sources can
be made *after* the widgets linked to them, and it may take a while to set up all
the pending widgets.

A subclass might also decide to do some heavier setup like creating websocket connections
here.

### Defining a new data source

Defining new sources is easy. Here's the included SimpleVariableDataSource,
which just holds a variable.

The config may be user-supplied, but data sources can also set their
own config props with backend data.


This is already a builtin data source provider, but let's see how it works:

```js
class FixedDataSource extends picodash.DataSource {

    constructor(name, config) {
        super(name, config);
        this.config.readonly = true
        this.data = JSON.parse(name.split(":")[1] || '')
    }

    async getData() {
        return this.data
    }

    async pushData(data) {
        // Don't allow changes.
        data = this.data
        super.pushData(data)
    }

    async register() {
        super.register()
        // We call ready() right away, since we don't have any
        // delayed setup to do.
        super.ready()
    }
}

addDataSourceProvider("fixed", FixedDataSource)
```

Now you can use it as an on-demand datasource type!  This will have
a fixed value of 42.

```html
<label>Random:
    <ds-span source="fixed: 42"></ds-span>
</label>
```


### Manually Subscribing to them

```js

async function f(){
    var ds = picodash.getDataSource(name)
    ds.subscribe(console.log)
}

// We have no idea when or if a source will
// Be available
picodash.whenSourceAvailable(name, f)

// Later, to unsubscribe.
// The data source will be marked for deletion
// When it goes from 0 to 1
ds.unsubscribe(console.log)
```

## Widgets

A widget is just an HTML custom element.  Use any framework or no framework.

```js
class SpanDashWidget extends picodash.BaseDashWidget {
    async onData(data) {
        // Called by the framework with new data
        this.innerText = data
    }

    async onDataReady() {
        // Called when this.source is ready
        var x = await this.source.getData()
        await this.onData(x)
    }
}
customElements.define("ds-span", SpanDashWidget);
```

The widdget has a source attribute that points to a data source.

The widget must have a onData() function, which data sources will use
to notify it abouut updates.

A widget may check the type of it's source and enable ay number of optional
features beyond this.

### Builtin Widgets

#### ds-input

Use like you would use a regular input tag.  Has 2-way binding to it's source.

#### ds-meter

Use like a meter tag.

#### ds-span

Just a span that shows the data.

#### ds-logwindow

## Filters

Filters convert between filtered and unfiltered versions of a value.
They are usually two-way, but you can build one-way filters if needed.

They take a space-separated set of arguments.

Lets make a filter that multiplies a value for display,
and divides user-set vals again.

```js

class Mult extends picodash.Filter {
    constructor(s, conf, prev) {
        // Prev can be undefined, the data source object,
        // Or the previous filter
        super(s, conf, prev)
        this.m = parseFloat(this.args[0])
    }
    
    async get(unfiltered) {
        // Convert from unfiltered to filtered
        return unfiltered * this.m
    }

    async set(val) {
        // Convert from filtered to unfiltered
        return val / this.m
    }
}

filterProviders["mult"] = Mult
```

Use your filter

```html
<label>Same data source, but with multiplier filter
    <ds-input type="number" source="myDataSource" filter="mult: 5"></ds-input>
</label>
```

## Building

```bash
npm install --include=dev
npm run build

# Check out the demo page
npm run serve
# http://127.0.0.1:8080
```
