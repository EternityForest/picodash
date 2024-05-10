import picodash from './picodash'

class Snackbar extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
    if (prev) {
      this.config = prev.config
    }
    this.lastData = null

    this.str = s.split(":")[1]
  }

  async notify() {
    picodash.snackbar.createSnackbar(this.str, { timeout: 5000 })
  }

  async get(unfiltered) {
    // Convert from unfiltered to filtered

    if (this.lastData != null) {
      if (this.lastData != unfiltered) {
        this.notify()
      }
    }

    this.lastData = unfiltered
    return this.lastData
  }

  async set(val) {
    return (await this.get(val))
  }
}


picodash.addFilterProvider('notify', Snackbar)


class Vibrate extends Snackbar {
  async notify() {
    navigator.vibrate(200)
  }
}

picodash.addFilterProvider('vibrate', Vibrate)



class Confirm extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
    if (prev) {
      this.config = prev.config
    }
    this.str = s.split(":")[1]

    this.cancel = null
  }


  async get(unfiltered) {
    return unfiltered
  }

  async set(val) {

    // Get rid of the old one if any
    if (this.cancel) {
      this.cancel()
      this.cancel = null
    }

    let _this = this
    const promise1 = new Promise((resolve, reject) => {


      let sb = picodash.snackbar.createSnackbar(_this.str, {
        actions: [
          {
            text: 'Confirm',
            callback(button, snackbar) {
              snackbar.destroy()
              resolve(val)
            }
          },
          {
            text: 'Cancel',
            callback(button, snackbar) {
              snackbar.destroy()
              resolve(null)
            }
          }
        ]
      })

      function cancel() {
        sb.destroy()
        resolve(null)
      }

      this.cancel = cancel

    });

    return promise1
  }
}

picodash.addFilterProvider('confirm', Confirm)


class Mult extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
    this.m = parseFloat(this.args[0])

    // Multiply config vals, so that widgets know
    // the range.
    for (const i of ['min', 'max', 'high', 'low', 'step']) {
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

class FixedPoint extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
    if (prev) {
      this.config = prev.config
    }

    this.m = parseInt(this.args[0])
  }

  async get(unfiltered) {
    // Convert from unfiltered to filtered
    try {
      return unfiltered.toFixed(parseFloat(this.m))
    } catch (e) {
      console.log(e)
      return 'NaN'
    }
  }

  async set(val) {
    // Convert from filtered to unfiltered
    return parseFloat(val)
  }
}

class Offset extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
    this.m = parseFloat(this.args[0])
    // Multiply config vals, so that widgets know
    // the range.

    for (const i of ['min', 'max', 'high', 'low']) {
      if (typeof prev.config[i] !== 'undefined') {
        this.config[i] = prev.config[i] + this.m
      }
    }

    if (typeof prev.config.step !== 'undefined') {
      this.config.step = prev.config.step
    }
  }

  async get(unfiltered) {
    // Convert from unfiltered to filtered
    return unfiltered + this.m
  }

  async set(val) {
    // Convert from filtered to unfiltered
    return val - this.m
  }
}


class Nav extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
    this.k = parseFloat(this.args[0]) || this.args[0]
    this.lastFullData = null
  }

  async get(unfiltered) {
    // Convert from unfiltered to filtered
    this.lastFullData = unfiltered
    return unfiltered[this.k]
  }

  async set(val) {
    // Convert from filtered to unfiltered
    if (this.lastFullData == null) {
      throw new Error("Filter does not have a cached value to set.")
    }
    let v = structuredClone(this.lastFullData)
    v[this.k] = val
    return v
  }
}

class JsonStringify extends picodash.Filter {
  constructor(s, cfg, prev) {
    super(s, cfg, prev)
  }

  async get(unfiltered) {
    // Convert from unfiltered to filtered
    return JSON.stringify(unfiltered, null, 2)
  }

  async set(val) {
    // Convert from filtered to unfiltered
    return JSON.parse(val)
  }
}

picodash.addFilterProvider('fixedpoint', FixedPoint)
picodash.addFilterProvider('offset', Offset)
picodash.addFilterProvider('mult', Mult)
picodash.addFilterProvider('nav', Nav)
picodash.addFilterProvider('json', JsonStringify)
