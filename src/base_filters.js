import picodash from './picodash'

class Mult extends picodash.Filter {
  constructor (s, cfg, prev) {
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

  async get (unfiltered) {
    // Convert from unfiltered to filtered
    return unfiltered * this.m
  }

  async set (val) {
    // Convert from filtered to unfiltered
    return val / this.m
  }
}

class FixedPoint extends picodash.Filter {
  constructor (s, cfg, prev) {
    super(s, cfg, prev)
    if (prev) {
      this.config = prev.config
    }

    this.m = parseInt(this.args[0])
  }

  async get (unfiltered) {
    // Convert from unfiltered to filtered
    try {
      return unfiltered.toFixed(parseFloat(this.m))
    } catch (e) {
      console.log(e)
      return 'NaN'
    }
  }

  async set (val) {
    // Convert from filtered to unfiltered
    return parseFloat(val)
  }
}

class Offset extends picodash.Filter {
  constructor (s, cfg, prev) {
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

  async get (unfiltered) {
    // Convert from unfiltered to filtered
    return unfiltered + this.m
  }

  async set (val) {
    // Convert from filtered to unfiltered
    return val - this.m
  }
}

picodash.addFilterProvider('fixedpoint', FixedPoint)
picodash.addFilterProvider('offset', Offset)
picodash.addFilterProvider('mult', Mult)
