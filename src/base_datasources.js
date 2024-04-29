import picodash from './picodash.js'

class RandomDataSource extends picodash.DataSource {
  constructor(name, config) {
    super(name, config)

    this.config.min = 0
    this.config.max = 1
    this.config.high = 0.9
    this.config.low = 0.1

    function upd() {
      this.pushData(Math.random() * 2 - 1)
    }
    this.interval = setInterval(upd.bind(this), 1000)
  }

  async getData() {
    return Math.random() * 2 - 1
  }

  async close() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  async register() {
    super.register()
    super.ready()
  }
}

class FixedDataSource extends picodash.DataSource {
  constructor(name, config) {
    super(name, config)
    this.config.readonly = true
    this.data = JSON.parse(name.split(':')[1] || '')
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
    super.ready()
  }
}

class SimpleVariableDataSource extends picodash.DataSource {
  constructor(name, config) {
    super(name, config)
    this.data = config.default || ''
  }

  async getData() {
    return this.data
  }

  async pushData(data) {
    this.data = data
    super.pushData(data)
  }

  async register() {
    super.register()
    super.ready()
  }
}

class PromptDataSource extends picodash.DataSource {
  constructor(name, config) {
    super(name, config)
    this.prompt = name.split(":")[1]
    this.config.readonly = true
  }

  async getData() {
    // Get rid of the old one if any
    if (this.cancel) {
      this.cancel()
      this.cancel = null
    }

    let _this = this
    const promise1 = new Promise((resolve, reject) => {


      let sb = picodash.snackbar.createSnackbar(_this.prompt, {
        input: true,
        actions: [
          {
            text: 'Confirm',
            callback(button, snackbar) {
              snackbar.destroy()
              resolve(snackbar.inputElement.value)
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

  async pushData(data) {
    throw new Error("Not pushable")
  }

  async register() {
    super.register()
    super.ready()
  }
}

picodash.addDataSourceProvider('random', RandomDataSource)
picodash.addDataSourceProvider('fixed', FixedDataSource)
picodash.addDataSourceProvider('prompt', PromptDataSource)

picodash.SimpleVariableDataSource = SimpleVariableDataSource
