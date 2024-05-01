/* 
@copyright

MIT License by Daniel Dunn

Uses Convert.js https://www.npmjs.com/package/convert

MIT License

Copyright (c) 2020 Jonah Snider

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
import picodash from "picodash"
import convert from "convert"


function normalizeUnit(u) {
    u = u || ''
    u = u.toString()
    return u.replace('degC', 'C').replace('degF', 'F').replace("degK", 'K')
}
class UnitConvert extends picodash.Filter {
    constructor(s, cfg, prev) {
        super(s, cfg, prev)
        this.unit = this.args[0]

        if (prev && prev.config.unit) {
            this.prevUnit = normalizeUnit(prev.config.unit)
            this.config.unit = normalizeUnit(this.unit)
        }


        // If the previous data has a unit, convert all the range params.
        // If not, keep range params.

        for (const i of ['min', 'max', 'high', 'low', 'step']) {
            if (typeof prev.config[i] !== 'undefined') {
                if (prev && prev.config.unit) {
                    convert(prev.config[i], normalizeUnit(prev.config.unit)).to(this.unit)
                }
                else {
                    this.config[i] = prev.config[i]
                }
            }
        }
    }

    async get(unfiltered) {
        if (this.prevUnit) {
            return convert(parseFloat(unfiltered), this.prevUnit).to(this.unit)
        }
        else {
            return unfiltered
        }
    }

    async set(val) {
        if (this.prevUnit) {
            return convert(parseFloat(val), this.unit).to(this.prevUnit)
        }
        else {
            return val
        }
    }
}

picodash.addFilterProvider('unit', UnitConvert)
