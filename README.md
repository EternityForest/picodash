# Picodash: A very minimal dashboard framework


See the [Demo!](https://eternityforest.github.io/picodash/)

Picodash is a library for making dashboards.  It connects widgets to data sources,
letting you build your dashboard in simple HTML.  

Currently under 15k min+zip.

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


By data sources currently record the last 100 values as [Date, val] pairs.

getHistory() will return these as a list, from oldest to newest.  You can override
this to fetch server-side history.

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
        // Called by the framework with new data.
        // The data here will always be filtered.
        this.innerText = data
    }

    async onDataReady() {
        // Called when this.source is ready
        // Refresh returns filtered data.
        var x = await this.refresh()
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


### widget.getActiveConfig()

Gets either the top filter in the stack's config, or the data sources config
if there are none.  This lets you figure out things like the min/max range
and whether the val is readonly.


### widget.pushData(data)

Called by your code in the widget to push new data to the source.
Data must be unfiltered, all the filters in the filter stack are automatically
applied in reverse order.

Returns the filtered data that was pushed.  If it's null, then
you know the push failed because a filter blocked it, probably because the user
cancelled a confirm: filter.

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

Filter argumemts may not contain any string that looks like "--foo" as that is reserved.

Filters can also block a value completely, by returning null.  In this case,
the value will not be set, and a notification will pop up.

They take a space-separated set of arguments.

Lets make a filter that multiplies a value for display,
and divides user-set vals again.

Filters have a config property to pass info like the readonly status to
the widgets.

By default, the contructor takes the config parameter as it's config and adds the readonly property from the source or previous filter.

Your filter should update config to apply to the filtered value.  For example,
this filter looks as the range constraints and multiplies them by the same factor
it multiplies the value.

```js

class Mult extends picodash.Filter {
    constructor(s, conf, prev) {
        // Prev can be undefined, the data source object,
        // Or the previous filter
        super(s, conf, prev)

        this.m = parseFloat(this.args[0])


        // Multiply config vals, so that widgets know
        // the range.
        for (var i of ['min', 'max', 'high', 'low', 'step']) {
            if (typeof prev.config[i] !== 'undefined') {
                this.config[i] = prev.config[i] * this.m
            }
        }
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

### Builtin filters

#### mult: val

#### offset: val

#### confirm: text
Requires the user to confirm before setting value

#### notify: text
Snackbar every time val changes

#### vibrate:

Vibrate 200ms when val changes



## Builtin Datasources

### prompt: promptText

Whenever anything tries to get the value, asks the user.
Use this as the source-pressed of a button, to make a button that prompts the
user for a new value for another element.



## Config Keys

Usable in datasource.config or filter.config. All keys optional.


### min, max, step, hi, lo

Set the range, min increment to snap to,  and optimal range of a numeric value.


## Snackbars

Snackbar code was adapted from: https://snackbar.egoist.dev/


Manually launch a snackbar.  The "accent" setting just applies that CSS class to
the div containing the text.  Barrel.css styles warning, danger, highlight, and success,
if not using barrel you'll need your own classes and rules.

```js
 picodash.snackbar.createSnackbar("Value not set!", { accent: 'warning',
             timeout: 5000 })
```

### Theming snackbars

Picodash understands these CSS variables, which means it will respond to
barrel.css themes and a few other frameworks, but you can also just set them manually.

Only the snackbars use them, most everything else in the base set renders as raw semantic HTML.

Every snackbar will be a .snackbar class, in a global .snackbars element, if you want
to do any further CSS targeting.

:scope{
    --box-bg: var(--grey-2);
    --fg: var(--black-1);
    --border-radius: 20px;
    --control-border-radius: 20px;
}


## Building

```bash
npm install --include=dev
npm run build

# Check out the demo page
npm run serve
# http://127.0.0.1:8080
```
