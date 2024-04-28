import picodash from './picodash'

class BaseDashWidget extends HTMLElement {
  onData(data) {

  }

  onExtraData(src, data) {

  }

  _subscribeToExtraSource(srcname) {
    const s = this.extraSources[srcname]
    function f(data) {
      this.onExtraData(srcname, data)
    }
    this.extraSourceSubscribers[srcname] = f
    s.subscribe(f.bind(this))
  }

  connectedCallback() {
    this.innerHTML = 'Awating Data Source'
    async function f() {
      this.source = picodash.getDataSource(this.getAttribute('source'))

      this.extraSources = {}
      this.extraSourceSubscribers = {}

      for (const i of this.getAttributeNames()) {
        if (i.startsWith('source-')) {
          const srcname = i.replace('source-', '')
          this.extraSources[srcname] = picodash.getDataSource(this.getAttribute(i))
          this._subscribeToExtraSource(srcname)
        }
      }

      this.filterStack = []
      let prevFilter = this.source

      if (this.getAttribute('filter')) {
        const fs = this.getAttribute('filter').split('|')
        for (const i in fs) {
          prevFilter = picodash.getFilter(fs[i], prevFilter)
          this.filterStack.push(prevFilter)
        }
      }

      async function f(data) {
        data = await this.runFilterStack(data)
        await this.onData(data)
      }

      this.setterFunc = f.bind(this)

      async function push(newValue) {
        const d = await this.runFilterStackReverse(newValue)

        if (d == null || d === undefined) {
          picodash.snackbar.createSnackbar("Value not set!", { accent: 'warning', timeout: 5000 })
          return null
        }

        await this.source.pushData(d)
        return d
      }

      this.pushData = push.bind(this)
      this.source.subscribe(this.setterFunc)
      this.onDataReady()
    }

    const waitFor = []

    // Get all the sources including the main one,
    // And wait for them to be ready

    for (const i of this.getAttributeNames()) {
      if (i.startsWith('source-')) {
        waitFor.push(this.getAttribute(i))
      }
    }
    waitFor.push(this.getAttribute('source'))
    picodash.whenSourceAvailable(waitFor, f.bind(this))
  }

  async runFilterStackReverse(data) {
    for (const i in this.filterStack) {
      data = await this.filterStack[this.filterStack.length - 1 - i].set(data)
    }
    return data
  }

  async runFilterStack(data) {
    for (const i in this.filterStack) {
      data = await this.filterStack[i].get(data)
    }
    return data
  }

  getActiveConfig() {
    /* Return the config of either the top filter in the stack,
        or the source, if there are no filters.
        */
    if (this.filterStack.length > 0) {
      return this.filterStack[this.filterStack.length - 1].config
    } else {
      return this.source.config
    }
  }

  disconnectedCallback() {
    this.source.unsubscribe(this.setterFunc)
    for (const i in this.filterStack) {
      this.filterStack[i].close()
    }
    for (const j in this.extraSources) {
      this.extraSources[j].unsubscribe(this.extraSourceSubscribers[j])
    }
  }

  async refresh() {
    let data = await this.source.getData()
    data = await this.runFilterStack(data)
    return data
  }
}

picodash.BaseDashWidget = BaseDashWidget
export default BaseDashWidget
